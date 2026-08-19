/**
 * The signed-in user. Document id is the Firebase Auth uid.
 *
 * Mirrors the `users` collection in docs/reference/backend-contract.md.
 * The three counters are written only by Cloud Functions — the client may
 * update `nickname` and `avatarUrl` and nothing else.
 */
export interface User {
  id: string;
  email: string;
  nickname: string;
  avatarUrl?: string;
  /** Read by 홈, and by the 잔여 티켓 충족 branch on 응모 */
  ticketBalance: number;
  ticketsIssued: number;
  placesVisited: number;
  createdAt: Date;
}

/** What the app knows about the session before the user document is loaded. */
export interface Session {
  userId: string;
  email: string;
}
