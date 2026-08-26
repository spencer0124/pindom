import type { Artist } from '@/lib/domain';

/**
 * What one board chip needs. `Artist` satisfies this structurally, so a 최애
 * board and 자유게시판 sit in the same array without an adapter or a union.
 */
export interface Board {
  id: string;
  name: string;
}

/**
 * 자유게시판 — the one board that is not a 최애.
 *
 * A reserved `posts.boardId` that has no `artists` document. It works with no
 * backend change: the deployed rules never look at `boardId` on create, reads
 * are open to any signed-in user, and the deployed `posts` composite index is
 * `boardId + createdAt`, which is exactly the query the feed makes. A separate
 * collection would have needed a rules deploy — the ruleset ends in a
 * catch-all deny.
 *
 * The `artist-` prefix every seeded 최애 carries is why this id can never
 * collide with one. backend-contract.md records the reservation, and the
 * warning that comes with it: a rule tightened to
 * `exists(/artists/$(boardId))` would kill this board silently.
 */
export const FREE_BOARD: Board = { id: 'board-free', name: '자유게시판' };

/** The chip row: 자유게시판 first, then the user's 최애 in follow order. */
export function boardsWithFree(artists: Artist[]): Board[] {
  return [FREE_BOARD, ...artists];
}
