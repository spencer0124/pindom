import type { Tier } from './user';

/**
 * One of the person's tickets, as much of it as a stranger may see.
 *
 * A projection of `Ticket`, not the ticket: no serial, no visibility, no spent
 * state — `getPublicProfile` only ever projects public tickets, so a private
 * cut cannot reach another viewer's screen through this shape. It carries the
 * place so 프로필 can build 인증 촬영지 without a second read.
 */
export interface PublicProfileTicket {
  ticketId: string;
  placeId: string;
  placeName: string;
  photoUrl: string;
  issuedAt: Date;
  artistId?: string;
  /** Preserved by the public projection; test photos do not prove a visit. */
  testMode?: boolean;
}

export interface PublicProfile {
  userId: string;
  nickname: string;
  bio: string;
  avatarUrl?: string;
  ticketsIssued: number;
  placesVisited: number;
  tier: Tier;
  /** Public tickets, newest first, capped at 30 by the callable. */
  tickets: PublicProfileTicket[];
}
