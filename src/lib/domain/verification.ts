/**
 * Why a verification was rejected. The server sends the code; 인증 실패 decides
 * the copy. A rejection is a *successful* call — see
 * docs/reference/backend-contract.md.
 */
export type VerificationFailureReason =
  | 'out_of_radius'
  /**
   * Rejected on implied speed. Only pairs of readings that moved 200m or more are
   * evaluated, because GPS jitter alone reads as 100km/h over a short interval. Above
   * 150km/h within a session, or 300km/h against the last issued ticket, is a rejection.
   */
  | 'implausible_speed'
  /** The device reported an error radius wider than the gate, so "within 50m" cannot mean anything. */
  | 'poor_accuracy'
  /**
   * The device reported that its location came from a mock provider.
   *
   * Android only — iOS exposes no equivalent, so the client sends `false` there. The flag
   * is self-reported and App Check is **not** in the initial release, so a patched build
   * can suppress it; it catches the common case of a Fake GPS app driven from developer
   * options, not a modified binary.
   */
  | 'mock_location';

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
  /**
   * Metres of uncertainty, as reported by the device.
   *
   * The server rejects readings above its accuracy gate with `poor_accuracy`, and does not
   * append them to the session — a wildly uncertain sample would poison the speed check.
   */
  accuracy: number;
  capturedAt: Date;
  /**
   * Whether the device reported the position as coming from a mock provider.
   *
   * Android reports this; iOS has no equivalent API, so send `false` there. See
   * `mock_location` on `VerificationFailureReason` for what it does and does not catch.
   */
  isMock: boolean;
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
  /**
   * Opaque to the client — pass it back to `issueTicket` unchanged.
   *
   * Server-side it is the verification session's own id, so ownership, expiry and
   * single-use are all read off the session document rather than a separate token record.
   * That is an implementation detail of the server and must not be relied on here.
   */
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
