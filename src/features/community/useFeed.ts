import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { failureMessage } from '@/lib/api/failure-message';
import { hideBlocked, type Artist, type Post } from '@/lib/domain';
import { useBlocklist } from '@/features/moderation';
import { artistRepository, boardRepository, postRepository } from '@/lib/repositories';
import type { Board } from '@/lib/domain';
import { FREE_BOARD } from './boards';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; posts: Post[]; cursor: string | null; loadingMore: boolean; loadedAt: Date };

/**
 * One board's feed, a page at a time.
 *
 * The contract is explicit that the feed is per artist board, never global —
 * `boardId` is required, and the wrong one silently shows another fandom's
 * posts. So there is no 전체 here; the board is the 최애 the chips name, and
 * switching boards starts the list over from its first page.
 *
 * Blocked authors are removed **on the way out, not on the way in**. The raw
 * pages stay in state and the filter is applied where the screen reads them, so
 * blocking someone whose post is on screen removes it on the next render rather
 * than on the next fetch — and unblocking brings it back without one either.
 * Firestore has no `not-in` that would let the query do this, and rules judge a
 * query rather than narrowing its result, so client-side is the only place it
 * can happen at all. See the 차단 warning in the backend contract.
 */
export function useFeed(boardId: string | null) {
  const [state, setState] = useState<State>({ status: 'loading' });
  // The board a page belongs to — a page that arrives after the chip moved
  // on is dropped rather than appended to the wrong list.
  const active = useRef(boardId);

  const load = useCallback(
    async (silent = false) => {
      active.current = boardId;
      if (boardId == null) {
        return setState({ status: 'ready', posts: [], cursor: null, loadingMore: false, loadedAt: new Date() });
      }
      if (!silent) setState({ status: 'loading' });
      const page = await postRepository.feed(boardId);
      if (active.current !== boardId) return;
      if (!page.ok) return setState({ status: 'error', message: failureMessage(page.failure) });
      // `loadedAt` is the instant every post on the list is aged against.
      setState({
        status: 'ready',
        posts: page.data.posts,
        cursor: page.data.cursor,
        loadingMore: false,
        loadedAt: new Date(),
      });
    },
    [boardId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const loadMore = useCallback(async () => {
    if (state.status !== 'ready' || state.cursor == null || state.loadingMore || boardId == null) return;
    setState({ ...state, loadingMore: true });
    const page = await postRepository.feed(boardId, state.cursor);
    if (active.current !== boardId) return;
    setState((current) => {
      if (current.status !== 'ready') return current;
      if (!page.ok) return { ...current, loadingMore: false };
      return {
        status: 'ready',
        posts: [...current.posts, ...page.data.posts],
        cursor: page.data.cursor,
        loadingMore: false,
        loadedAt: new Date(),
      };
    });
  }, [state, boardId]);

  const reload = useCallback(() => load(), [load]);
  const refresh = useCallback(() => load(true), [load]);

  const blockedUserIds = useBlocklist();
  /**
   * The list the screen renders.
   *
   * `loadMore` deliberately keeps reading the unfiltered `state`: the cursor is
   * the last **fetched** post's id, and paginating from the last *visible* one
   * would skip every post between it and the blocked ones. The cost is that a
   * page mostly written by blocked authors arrives short, and a short page may
   * not reach `onEndReached` — acceptable while a blocklist holds a handful of
   * people, and the reason the cap is 1000 rather than unbounded.
   */
  const visible = useMemo(() => {
    if (state.status !== 'ready') return state;
    return { ...state, posts: hideBlocked(state.posts, blockedUserIds) };
  }, [state, blockedUserIds]);

  return { state: visible, reload, refresh, loadMore };
}

/**
 * The boards the user can post to — 자유게시판, then their followed 최애 in
 * follow order.
 *
 * `artists` comes back alongside `boards` because the two are not the same
 * list: the chip row wants both, and the `{최애} 게시판` header wants only a
 * 최애. 자유게시판 has no `artists` document, so looking the selected board up
 * in `artists` is what makes the header disappear on it — the same thing 1a
 * does on its 전체 chip.
 */
export function useBoards() {
  const [artists, setArtists] = useState<Artist[] | null>(null);
  const [boardList, setBoardList] = useState<Board[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [mine, active] = await Promise.all([
      artistRepository.listMine(),
      boardRepository.listActive(),
    ]);
    setError(!mine.ok ? failureMessage(mine.failure) : !active.ok ? failureMessage(active.failure) : null);
    const followed = mine.ok ? mine.data : [];
    if (!active.ok) {
      setArtists([]);
      setBoardList([FREE_BOARD]);
      return;
    }
    const available = new Map(active.data.map((board) => [board.id, board]));
    setArtists(followed.filter((artist) => available.has(artist.id)));
    const free = available.get('board-free');
    // Keep the user's follow order, but never expose an archived/missing board.
    setBoardList([...(free ? [free] : []), ...followed.map((artist) => available.get(artist.id)).filter((board): board is Board => Boolean(board))]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const boards = artists == null ? null : boardList;

  return { boards, artists, error, reload: load };
}
