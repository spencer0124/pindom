/**
 * Typed failure hierarchy for API errors.
 *
 * Mirrors Flutter's sealed AppFailure class with a discriminated union on `type`.
 * Controllers narrow with `if (result.ok)` — TypeScript auto-narrows the union.
 */

// ── Failure types ──

export interface NetworkFailure {
  type: 'network';
  message: string;
}

export interface ServerFailure {
  type: 'server';
  statusCode: number;
  message: string;
  errorCode?: string;
}

export interface ParseFailure {
  type: 'parse';
  message: string;
}

export interface CancelledFailure {
  type: 'cancelled';
}

/**
 * A Firebase SDK error, surfaced through the same `Result` envelope as the rest.
 *
 * `code` is Firebase's own code — `permission-denied`, `not-found`,
 * `unauthenticated`, `failed-precondition`. `errorCode` is the application-level
 * code a Cloud Function puts in `HttpsError.details`, which is what the UI
 * branches on: `insufficient_tickets` drives the No edge of 잔여 티켓 충족 on
 * 응모, and a message string would not be safe to match against.
 */
export interface FirebaseFailure {
  type: 'firebase';
  code: string;
  message: string;
  errorCode?: string;
  /**
   * The one failure that carries data as well as a code.
   *
   * `issueTicket` rejects a re-issue inside the per-place cooldown with
   * `errorCode: 'cooldown_active'` and the date it lifts. 장소/상세 renders that date, so it
   * has to survive the trip through this envelope rather than being buried in the message.
   */
  nextAvailableAt?: Date;
}

export type AppFailure =
  | NetworkFailure
  | ServerFailure
  | ParseFailure
  | CancelledFailure
  | FirebaseFailure;

/** Factory namespace for creating typed failures */
export const Failure = {
  network: (message: string): NetworkFailure => ({
    type: 'network',
    message,
  }),

  server: (
    statusCode: number,
    message: string,
    errorCode?: string,
  ): ServerFailure => ({
    type: 'server',
    statusCode,
    message,
    ...(errorCode !== undefined && { errorCode }),
  }),

  parse: (message: string): ParseFailure => ({
    type: 'parse',
    message,
  }),

  cancelled: (): CancelledFailure => ({
    type: 'cancelled',
  }),

  firebase: (
    code: string,
    message: string,
    errorCode?: string,
    nextAvailableAt?: Date,
  ): FirebaseFailure => ({
    type: 'firebase',
    code,
    message,
    ...(errorCode !== undefined && { errorCode }),
    ...(nextAvailableAt !== undefined && { nextAvailableAt }),
  }),
} as const;

// ── Result<T> ──

interface Ok<T> {
  ok: true;
  data: T;
}

interface Err {
  ok: false;
  failure: AppFailure;
}

export type Result<T> = Ok<T> | Err;

/** Companion namespace for creating Result values */
export const ResultHelper = {
  ok: <T>(data: T): Result<T> => ({ ok: true, data }),
  error: <T>(failure: AppFailure): Result<T> => ({ ok: false, failure }),
} as const;

// ── API Envelope ──

/** v2 API response envelope: `{ meta, data }` */
export interface ApiEnvelope<T> {
  meta: {
    code: number;
    message?: string;
  };
  data: T;
}

// ── Conditional GET result ──

/** Result of ETag-based conditional GET (RFC 7232) */
export interface ConditionalResult<T> {
  data: T | null;
  etag: string | null;
  /** true when server returned 304 — cached data is still fresh */
  notModified: boolean;
}
