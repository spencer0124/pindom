export type RaffleStatus = 'open' | 'closed' | 'drawn';

/**
 * Something tickets are spent on: concert tickets, signed albums, fansign entry.
 *
 * Mirrors the `raffles` collection in docs/reference/backend-contract.md.
 */
export interface Raffle {
  id: string;
  title: string;
  prizeDescription: string;
  imageUrl: string;
  /** What the 잔여 티켓 충족 branch on 응모 compares the balance against */
  ticketCost: number;
  /** Drives 마감 임박 on 홈 */
  closesAt: Date;
  entryCount: number;
  /** Denominator for the progress bar on 홈. Absent means uncapped */
  capacity?: number;
  status: RaffleStatus;
}

/**
 * Whether a raffle can still be entered.
 *
 * `status` alone is not enough, and every screen that offered a raffle on it was
 * wrong: nothing moves a raffle to `closed` when its deadline passes — the seed
 * writes `status` and no scheduled function watches `closesAt` — so a raffle
 * stays `open` in the document long after `enterRaffle` starts refusing it with
 * `deadline-exceeded`. The server checks both, so the screens have to as well,
 * or the user picks a raffle, watches 티켓 절취 through to the end, and only then
 * learns it closed.
 */
export function isEnterable(raffle: Raffle, now: Date = new Date()): boolean {
  return raffle.status === 'open' && raffle.closesAt.getTime() > now.getTime();
}

/**
 * One entry into a raffle.
 *
 * Written only by the `enterRaffle` Cloud Function, which must debit the
 * balance and create the entry in a single transaction.
 */
export interface RaffleEntry {
  id: string;
  userId: string;
  raffleId: string;
  ticketIds: string[];
  ticketsSpent: number;
  createdAt: Date;
}
