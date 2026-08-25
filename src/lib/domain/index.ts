/**
 * Domain types for PINDOM.
 *
 * These mirror docs/reference/backend-contract.md, which is the referee when
 * this repo and the backend repo disagree. Firestore enforces no schema, so a
 * field-name mismatch throws nothing on either side — it renders `undefined`.
 * Change the contract document first, then these.
 *
 * Two conversions happen at the repository boundary, so no screen ever sees a storage type:
 * Firestore `Timestamp` becomes `Date`, and a localized string map becomes the plain `string`
 * for the active locale. See `locale.ts`.
 */
export type { Artist } from './artist';
export type { Course } from './course';
export { DEFAULT_LOCALE, LOCALES } from './locale';
export type { Locale } from './locale';
export type { Place, PlaceWithDistance, PlaceWorkKind } from './place';
export type { Post, NewPost, FeedPage } from './post';
export { isEnterable } from './raffle';
export type { Raffle, RaffleEntry, RaffleStatus } from './raffle';
export type { Ticket, TicketVisibility } from './ticket';
export type { GalleryPhoto, NewReview, Review } from './review';
export type { AssistantAsk, AssistantMessage, AssistantReply } from './assistant';
export { tierFor } from './user';
export type { ProfileVisibility, Session, Tier, User } from './user';
export type {
  LocationReading,
  VerificationFailureReason,
  VerificationGrant,
  VerificationResult,
} from './verification';
