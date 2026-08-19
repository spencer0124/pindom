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
  photoUrl: string;
  /** Rendered as the barcode on 티켓 발행 */
  serial: string;
  visibility: TicketVisibility;
  issuedAt: Date;
  spent: boolean;
  spentOnEntryId?: string;
}
