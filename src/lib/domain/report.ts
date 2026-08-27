/**
 * What a 신고 points at.
 *
 * The five values are the server's `targetType` enum verbatim — the deployed
 * `reports` create rule rejects anything else, so widening this list on the
 * client only moves the failure from compile time to a permission error the
 * user sees as "신고하지 못했어요". `comment` has no screen yet and is kept
 * because the rule already accepts it.
 */
export type ReportTargetType = 'post' | 'comment' | 'review' | 'photo' | 'user';

/** Server-side cap on `targetId`. Every id the app mints is far below it. */
export const REPORT_TARGET_ID_MAX = 128;

/**
 * Server-side cap on `reason`.
 *
 * Enforced here as well as there because a 500-character rule failure arrives
 * as a bare permission error with nothing pointing at the field — the composer
 * has to stop the write before it is made.
 */
export const REPORT_REASON_MAX = 500;

/**
 * What 신고 submits.
 *
 * `reporterId` and `createdAt` are not on it: both are filled in at the
 * repository boundary from the signed-in uid and the server clock, and the
 * rule requires exactly those five fields — `hasOnly` — so a client that sent
 * its own `createdAt` would be refused.
 */
export interface NewReport {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
}
