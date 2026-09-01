import type { Artist, Board } from '@/lib/domain';

/**
 * What one board chip needs. `Artist` satisfies this structurally, so a 최애
 * board and 자유게시판 sit in the same array without an adapter or a union.
 */
export type { Board } from '@/lib/domain';

/**
 * Legacy client id for 자유게시판. The canonical board document is `free`; the
 * repository maps it here so old posts and the current admin data coexist.
 */
export const FREE_BOARD: Board = { id: 'board-free', name: '자유게시판' };

/** The chip row: 자유게시판 first, then the user's 최애 in follow order. */
export function boardsWithFree(artists: Artist[]): Board[] {
  return [FREE_BOARD, ...artists];
}
