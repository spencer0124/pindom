import { useCallback, useEffect, useState } from 'react';
import { failureMessage } from '@/lib/api/failure-message';
import type { Ticket } from '@/lib/domain';
import { postRepository, ticketRepository } from '@/lib/repositories';

type State = { status: 'idle' } | { status: 'busy' } | { status: 'error'; message: string };

/**
 * 글쓰기's two pieces: the ticket a pin can attach, and the post.
 *
 * 1a's pin attaches "the 촬영지 most recently verified" — here, the newest
 * **public** ticket, and the post carries its `placeId` and `ticketId` so
 * 커뮤니티's 지도에서 보기 has somewhere to go. With no ticket yet there is
 * nothing to attach, and the toggle says so.
 *
 * 보관함 tickets are deliberately not considered. `listVault` would make "most
 * recent" literal, but 보관함 exists so a photo can be kept out of public view,
 * and putting the place it was taken at on a public post gives away the part
 * the user chose to withhold. Decided 2026-08-26; the toggle's copy names the
 * public list rather than implying every verification.
 */
export function useWritePost(boardId: string | null) {
  const [latest, setLatest] = useState<Ticket | null | undefined>(undefined);
  const [state, setState] = useState<State>({ status: 'idle' });

  useEffect(() => {
    let live = true;
    void ticketRepository.listMine().then((mine) => {
      if (!live) return;
      setLatest(mine.ok ? (mine.data[0] ?? null) : null);
    });
    return () => {
      live = false;
    };
  }, []);

  const submit = useCallback(
    async (body: string, attachPin: boolean): Promise<boolean> => {
      if (boardId == null) {
        setState({ status: 'error', message: '게시판을 찾을 수 없어요.' });
        return false;
      }
      setState({ status: 'busy' });
      const result = await postRepository.create({
        boardId,
        body: body.trim(),
        imageUrls: [],
        ...(attachPin && latest != null && { placeId: latest.placeId, ticketId: latest.id }),
      });
      if (!result.ok) {
        setState({ status: 'error', message: failureMessage(result.failure) });
        return false;
      }
      setState({ status: 'idle' });
      return true;
    },
    [boardId, latest],
  );

  return { latest, state, submit };
}
