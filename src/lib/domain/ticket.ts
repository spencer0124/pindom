/** Set on 공개설정, before 티켓 발행 mints the ticket. */
export type TicketVisibility = 'public' | 'private';

/**
 * A proof-of-presence artifact: the photo, tied to a place and a moment.
 *
 * Mirrors the `tickets` collection in docs/reference/backend-contract.md.
 * Written only by the `issueTicket` Cloud Function, and only as the outcome of
 * an accepted verification — see the trust boundary in
 * docs/explanation/architecture.md.
 */
export interface Ticket {
  id: string;
  userId: string;
  placeId: string;
  /** Denormalised so 티켓 발행 and 컬렉션 render without a second read */
  placeName: string;
  /** Inherited from the place, so 컬렉션 can group by 최애 */
  artistId?: string;
  photoUrl: string;
  /** Rendered as the barcode on 티켓 발행 */
  serial: string;
  /** `private` puts the ticket in 보관함 rather than the public collection */
  visibility: TicketVisibility;
  issuedAt: Date;
  /** Rendered as the `USED` stub state on 티켓 절취 */
  spent: boolean;
  spentOnEntryId?: string;
}
