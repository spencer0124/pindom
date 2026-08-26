import type { Locale } from './locale';

/**
 * Collection tier, derived server-side from `ticketsIssued`.
 *
 * Rendered as a badge beside the nickname, on every post, and on every review — so it is
 * denormalised onto those documents rather than joined at read time.
 */
export type Tier = 'club10' | 'club20' | 'clubGo';

/**
 * The tier a given issued-ticket count earns.
 *
 * Mirrors `tierFor` in the Cloud Functions, which is the authority — the server
 * recomputes `tier` inside `issueTicket` and the client never writes it. This copy
 * exists so the fixture repository moves the badge the same way the real one does;
 * without it the 20-ticket boundary could only be reached against the live backend.
 *
 * Bands are 10 wide, read off the prototype's `TIER 10—19`. The `clubGo` boundary at
 * 30 keeps that width. It was extrapolated rather than observed, and was decided on
 * 2026-08-26 rather than left open: no account has crossed it yet, so confirming it
 * costs nothing, while changing it after someone has 30 tickets demotes them.
 */
export function tierFor(ticketsIssued: number): Tier {
  if (ticketsIssued >= 30) return 'clubGo';
  if (ticketsIssued >= 20) return 'club20';
  return 'club10';
}

/** Whether a profile and its public tickets are visible to others. */
export type ProfileVisibility = 'public' | 'private';

/**
 * The signed-in user. Document id is the Firebase Auth uid.
 *
 * Mirrors the `users` collection in docs/reference/backend-contract.md. The counters and
 * `tier` are written only by Cloud Functions — the client may edit the profile fields and
 * nothing else.
 */
export interface User {
  id: string;
  email: string;
  nickname: string;
  avatarUrl?: string;
  bio?: string;
  /** The 최애 set chosen at 최애 찾기. Keys 홈, the map filter, and the community boards */
  followedArtistIds: string[];
  /** Read by 홈, and by the 잔여 티켓 충족 branch on 응모 */
  ticketBalance: number;
  ticketsIssued: number;
  placesVisited: number;
  tier: Tier;
  profileVisibility: ProfileVisibility;
  locale: Locale;
  createdAt: Date;
}

/** What the app knows about the session before the user document is loaded. */
export interface Session {
  userId: string;
  email: string;
}
