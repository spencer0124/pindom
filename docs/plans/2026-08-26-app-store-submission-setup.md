---
title: 2026-08-26 App Store Submission Setup
type: plan
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-08-26
audience: internal
---

# 2026-08-26 — App Store Submission Setup

> Everything App Store Connect requires before PINDOM 1.0.0 can be submitted for review was
> filled in on this date. The record exists because most of it was written through the
> **App Store Connect API**, not the web form, and the next person needs to know where the
> values came from and which two are judgment calls rather than facts.

## Where things stand

The version sits at `PREPARE_FOR_SUBMISSION` with **no missing required field**. The
"심사에 추가" button is enabled. Nothing here submits the app — that press is deliberately
left to a human.

## What was filled

| Area | Value | Written via |
| --- | --- | --- |
| Version string | `1.0.0` (was `1.0`) | API |
| Copyright / release | `© 2026 pindom` / `AFTER_APPROVAL` | API |
| Build | build 3 — the first with a real app icon | API |
| Subtitle | 촬영지에 도착해야 열리는 티켓 | API |
| Description, keywords, promo text | see the version localization | API |
| Privacy policy / support / marketing URL | Notion published pages, below | API |
| Categories | 여행 (primary), 소셜 네트워킹 (secondary) | API |
| Content rights | `DOES_NOT_USE_THIRD_PARTY_CONTENT` | API |
| Age rating | see the two judgment calls below | API |
| App review contact + demo account | 조승용, `pindomtest0826@gmail.com` | API |
| Screenshots | 6 images, 6.9" (1320×2868) | API |
| App privacy (data collection) | 5 data types, published | Browser |
| Pricing and availability | free, all territories | Browser |

## The URLs are Notion pages, published to web

The privacy policy and support pages live under one published Notion parent. They are public —
Apple's reviewer opens them without a login, which is the whole requirement.

- Parent (marketing URL): <https://skkucoding.notion.site/PINDOM-3c8e9712562380bdbc36fef93e663bbf>
- 개인정보처리방침: <https://skkucoding.notion.site/3c8e9712562380d2bd60d0faef90764b>
- 지원 및 문의: <https://skkucoding.notion.site/3c8e97125623800bbb3fe55d0a4dc441>

The privacy policy is not boilerplate — it was written against
[the backend contract](../reference/backend-contract.md), so the data it lists (email, nickname
and profile fields, GPS readings capped at the most recent five and expiring in 24 hours, photos,
ticket and community records) matches what the app actually stores. **When the contract changes
what is collected, that page is what goes stale.**

## Two judgment calls to review before submitting

Both are honest readings of the app rather than facts, so they deserve a second opinion.

1. **`contests` is declared `INFREQUENT_OR_MILD`.** The 응모/추첨 flow is a prize draw, and
   under-declaring it is the worse mistake. It is part of why the rating landed at 13+ (15+ in
   Korea). Be aware that guideline 5.3.4 expects the developer to be the sponsor of any real
   sweepstakes — if the draw is demonstration-only, say so in the review notes.
2. **`socialMedia` is declared `true`.** The per-artist community boards are the reason. This
   pulled in Apple's new social-media age question, which is answered
   `socialMediaAgeRestricted: false` — the API rejects `true` unless `ageAssurance` is also true,
   and PINDOM has no age assurance. New apps do **not** get the 2026-09-07 grace period on this
   question, so it had to be answered now.

## The screenshots came from a fixture build

The six screenshots were captured on an iPhone 17 Pro Max simulator (iOS 26.5) whose installed
build has **`extra.useMocks: true`** — the DerivedData debug build, not the live-Firebase
archive. The UI is identical either way and the seeded content mirrors what the live project
holds, so the images represent the app accurately. Worth knowing only if a screenshot ever needs
to show live-only data.

Order on the product page is deliberate and is not filename order:
홈 → GPS 인증 → 지도 → 장소 상세 → 티켓 → 커뮤니티. The GPS radar screen is second because it
is the one image that explains what the app is for.

Two things had to be true before the app would render anything worth capturing:

- **Grant location before launching.** The home screen sorts 촬영지 by distance, so it awaits a
  fix. A pending permission alert never rejects that promise — the screen sits on
  "촬영지를 불러오는 중" forever with no error. `xcrun simctl privacy <sim> grant location
  com.zoyoong.pindom` plus `xcrun simctl location <sim> set <lat>,<lon>` avoids it.
- **Clean the status bar.** `xcrun simctl status_bar <sim> override --time "9:41"` with full
  battery and bars, which is what Apple's own screenshots show.

## The icon needed a whole new build

Builds 1 and 2 carried the Expo template placeholder. **There is no way to fix that from the
web form** — since iOS 11 Apple reads the 1024×1024 marketing icon out of the uploaded
binary's asset catalog, so App Store Connect has no icon field at all. Changing it means a new
archive and a new upload; build 3 (2026-08-27) is that.

The version string did not move. Nothing had been submitted yet, so swapping the attached build
from 2 to 3 on the same `1.0.0` record was enough — only `ios.buildNumber` had to change, because
App Store Connect refuses a build number it has already seen for a version.

**Verify the asset catalog after `expo prebuild`, before paying for the archive.** Prebuild
reports `reusing /ios` and does not guarantee it overwrites native files; an unchanged icon is
otherwise discovered only after a long build and an upload. Do not compare checksums against the
source PNG — Expo re-encodes it (and strips the alpha iOS forbids), so the hash differs by
design. Look at `ios/PINDOM/Images.xcassets/AppIcon.appiconset/` and at the built
`PINDOM.app/AppIcon60x60@2x.png`. That second file is an Apple-only **CgBI** PNG variant, which
ordinary decoders misread as enormous; `sips` converts it to something viewable.

## What the API could not do

The App Store Connect API has no App Privacy or availability endpoints at this version —
`appDataUsages`, `appDataUsageCategories` and `appAvailabilityV2` all return `PATH_ERROR` or
`NOT_FOUND`. Those two areas were done in the browser. Everything else is scriptable.

Two API behaviours worth remembering:

- **The version string must match the build's marketing version.** App Store Connect had created
  the version record as `1.0`, while the build carries `CFBundleShortVersionString = 1.0.0`. That
  mismatch is not reported until submission.
- **The age rating declaration answers its own schema.** Its fields are a mix of enums and
  booleans and the mix changes as Apple adds questions. `PATCH` with a guess and read the errors:
  they name the offending field, the expected type, and the required-but-missing ones. Two rules
  it enforced here: `ageRatingOverride` cannot be sent alongside `ageRatingOverrideV2`, and
  `socialMediaAgeRestricted` may only be `true` when `ageAssurance` and `socialMedia` both are.

Related: [the live Firebase verification](2026-08-26-live-firebase-verification.md) is what
established that build 2 — the build attached here — actually talks to `pindom-1234`, and
[the open integration items](2026-08-26-integration-open-items.md) lists what is still
unexercised on it.
