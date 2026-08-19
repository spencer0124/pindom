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
