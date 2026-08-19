/**
 * Why a verification was rejected. The server sends the code; 인증 실패 decides
 * the copy. A rejection is a *successful* call — see
 * docs/reference/backend-contract.md.
 */
export type VerificationFailureReason =
  | 'out_of_radius'
  | 'implausible_speed'
  | 'poor_accuracy';

/**
 * One GPS sample, submitted while /verify/gps is open.
 *
 * The client sends readings repeatedly rather than once, because location
 * permission is foreground-only: the server has no continuous track, so a
 * plausible-speed check needs a series inside one session.
 */
export interface LocationReading {
  placeId: string;
  lat: number;
  lng: number;
  /** Metres of uncertainty, as reported by the device */
  accuracy: number;
  capturedAt: Date;
  /** Omitted on the first reading of a session; echoed back on later ones */
  sessionId?: string;
}

/**
 * Short-lived permission to mint one ticket. Required by `issueTicket`.
 *
 * This is what actually unlocks the camera. Gating the shutter in the UI is an
 * affordance a patched build skips, so the grant — not the navigation history —
 * is what proves the user passed verification.
 */
export interface VerificationGrant {
  token: string;
  expiresAt: Date;
}

/**
 * The verdict on one reading.
 *
 * `verified: false` is a normal outcome, not an error. 인증 실패 renders
 * `distanceMeters`, `requiredRadiusMeters` and `accuracyMeters` as a table, so
 * a bare boolean would not be enough.
 */
export interface VerificationResult {
  sessionId: string;
  verified: boolean;
  distanceMeters: number;
  requiredRadiusMeters: number;
  accuracyMeters: number;
  reason?: VerificationFailureReason;
  /** Present only when `verified` is true */
  grant?: VerificationGrant;
}
