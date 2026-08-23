/**
 * The line under 보유 티켓 on 홈 and 티켓 발행, as 1a prints it (`tierNote0/1/2`
 * in the prototype's `STRINGS.ko`). Three-way on the balance the screen shows:
 * under the first mark it names the first mark, between the marks it names the
 * top one, at the top it says so.
 *
 * The marks are 1a's gauge marks (10 and 20), which is what the copy names —
 * not the contract's tier thresholds. The Tickets checklist records that gap.
 */
export const TIER_NOTE_FIRST = 10;
export const TIER_NOTE_TOP = 20;

export function tierNote(balance: number): string {
  if (balance >= TIER_NOTE_TOP) return '팬사인회·굿즈까지 모두 열렸어요';
  if (balance >= TIER_NOTE_FIRST) return '20장이면 팬사인회·굿즈가 열려요';
  return '10장이면 첫 응모가 열려요';
}
