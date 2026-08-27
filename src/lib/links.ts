/**
 * The public pages PINDOM points at from inside the app.
 *
 * These are the **same URLs registered on the App Store Connect version
 * record** — see docs/plans/2026-08-26-app-store-submission-setup.md. Apple's
 * reviewer opens the store-side links; the user opens these; they must not
 * drift apart, so they are written down once here rather than typed into a
 * screen.
 *
 * Not in `AppConfig`: that reads `app.config.ts` → `extra`, which exists for
 * values that change per build. These do not — a support page that differed
 * between the fixture build and the release build would be a support page
 * nobody could verify.
 *
 * They are published Notion pages, reachable without a login, which is the
 * whole requirement. If one is ever moved, the App Store Connect record has to
 * move with it.
 */
export const ExternalLinks = {
  /** 지원 및 문의. Guideline 5.1.1(v) expects this to describe account deletion. */
  support: 'https://skkucoding.notion.site/3c8e97125623800bbb3fe55d0a4dc441',
  /** 개인정보처리방침. Written against the backend contract, not boilerplate. */
  privacy: 'https://skkucoding.notion.site/3c8e9712562380d2bd60d0faef90764b',
} as const;
