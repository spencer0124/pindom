/** Ticket costs in the current contributor prize catalog. */
export const TIER_NOTE_FIRST = 1;
export const TIER_NOTE_TOP = 10;

export function tierNote(balance: number): string {
  if (balance >= TIER_NOTE_TOP) return '모든 상품에 응모할 수 있어요';
  if (balance >= TIER_NOTE_FIRST) return '보유 티켓으로 응모할 상품을 골라보세요';
  return '1장이면 포토카드에 응모할 수 있어요';
}
