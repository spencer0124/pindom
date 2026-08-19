/**
 * The locales the prototype writes copy in. Its helper is `L(ko, en, ja, zh)`.
 *
 * Firestore stores any user-visible string that varies by language as a map keyed by these
 * codes — see `LocalizedString` in docs/reference/backend-contract.md.
 *
 * **Domain objects never carry that map.** The repository resolves it to a plain `string` at
 * the boundary, exactly as it resolves a Firestore `Timestamp` to a `Date`. A screen that had
 * to pick a language out of a map would be doing the repository's job, and every screen would
 * have to do it identically.
 */
export const LOCALES = ['ko', 'en', 'ja', 'zh'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'ko';
