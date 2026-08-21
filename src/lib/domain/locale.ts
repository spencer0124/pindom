/**
 * The locales the app ships. Korean is the default.
 *
 * The prototype's copy helper is `L(ko, en, ja, zh)` and still emits four, but only these
 * two ship — see the 2026-08-21 contract review resolutions. Each locale is a content cost
 * rather than a config flag: every seeded 촬영지, 최애 and 코스 needs copy in each one, so
 * the shipped set is deliberately smaller than the prototype's. Adding one back later takes
 * no migration, because the stored map simply gains a key.
 *
 * Firestore stores any user-visible string that varies by language as a map keyed by these
 * codes — see `LocalizedString` in docs/reference/backend-contract.md.
 *
 * **Domain objects never carry that map.** The repository resolves it to a plain `string` at
 * the boundary, exactly as it resolves a Firestore `Timestamp` to a `Date`. A screen that had
 * to pick a language out of a map would be doing the repository's job, and every screen would
 * have to do it identically.
 */
export const LOCALES = ['ko', 'en'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'ko';
