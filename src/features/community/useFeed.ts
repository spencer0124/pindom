import { useCallback, useEffect, useRef, useState } from 'react';
import { failureMessage } from '@/lib/api/failure-message';
import type { Artist, Post } from '@/lib/domain';
import { artistRepository, postRepository } from '@/lib/repositories';
import { boardsWithFree } from './boards';

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

  return { state, reload, refresh, loadMore };
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

  const load = useCallback(async () => {
    const mine = await artistRepository.listMine();
    setArtists(mine.ok ? mine.data : []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const boards = artists == null ? null : boardsWithFree(artists);

  return { boards, artists, reload: load };
}
