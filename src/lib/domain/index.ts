/**
 * Domain types for PINDOM.
 *
 * These mirror docs/reference/backend-contract.md, which is the referee when
 * this repo and the backend repo disagree. Firestore enforces no schema, so a
 * field-name mismatch throws nothing on either side — it renders `undefined`.
 * Change the contract document first, then these.
 *
 * Dates are `Date`, never Firestore `Timestamp`. The conversion happens in
 * src/lib/repositories/, so no screen ever sees a Firestore type.
 */
export type { Place, PlaceWithDistance } from './place';
export type { Post, NewPost, FeedPage } from './post';
export type { Raffle, RaffleEntry, RaffleStatus } from './raffle';
export type { Ticket, TicketVisibility } from './ticket';
export type { Session, User } from './user';
export type {
  LocationReading,
  VerificationFailureReason,
  VerificationGrant,
  VerificationResult,
} from './verification';
