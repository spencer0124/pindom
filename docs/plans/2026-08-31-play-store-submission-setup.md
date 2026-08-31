---
title: 2026-08-31 Play Store Submission Setup
type: plan
status: draft
owner: zoyoong124@gmail.com
last-updated: 2026-08-31
audience: internal
---

# 2026-08-31 — Play Store Submission Setup

> What PINDOM 1.0.0 needed in order to go to Google Play, given that the App Store record was
> already filled in. Almost none of it was writing: the listing copy, the URLs, the demo account
> and the review notes all port across unchanged. The work was the Android build, which had never
> been made, and the three assets Play asks for that Apple does not.

Read [the App Store submission setup](2026-08-26-app-store-submission-setup.md) first. This
document only records what is *different*, and it assumes that one.

## Where things stand

The Android build is configured and an EAS project exists. The store listing text and every
image are prepared under `store/play/`. What has not happened yet is the Play Console side —
the app record, the declarations, and the upload.

## What ported unchanged

The App Store version record is the source, not this repo — the copy was written through the App
Store Connect API and lives there. It was read back out rather than retyped, which is the only
way to be sure the Korean is byte-identical:

| Play field | Source |
| --- | --- |
| 앱 이름 | the App Store `name` |
| 자세한 설명 | the version localization `description`, verbatim |
| 개인정보처리방침 · 웹사이트 | the same published Notion pages the app links from `src/lib/links.ts` |
| 로그인 세부정보 | the App Store review notes — but rewritten, see below |

The saved copies are in `store/play/listing/`. They are plain `.txt` rather than Markdown on
purpose: a store listing is bytes to be pasted, and a Markdown wrapper invites a linter to
reflow copy that must not be reflowed.

**로그인 세부정보 could not be reused as-is.** Play states the information must be provided in
**English** and caps the free-text box at **500 characters**; Apple imposed neither. The Korean
심사 메모 is about twice that and would have been the wrong language, so it was rewritten to 482
characters in `store/play/listing/app-access-instructions-en.txt`, keeping what a reviewer cannot
proceed without: the exact 주문진 coordinate, the 50 m radius, and the four steps. The
guideline-location list that Apple needed did not survive the cut, which is the right trade —
Play's reviewer needs to reach the flow, not a map of guideline references.

Two fields had to be written new. Play's 짧은 설명 caps at 80 characters, which is too long for
Apple's subtitle to fill and too short for its promotional text; the opening sentence of the
promotional text was reused instead, so the voice matches. And Play asks for a data-deletion URL,
which Apple does not — the 지원 및 문의 page already describes 회원 탈퇴, so it answers that too.

## The trap: gitignored config plus a cloud builder

**This is the item worth remembering.** `app.config.ts` decided whether Firebase was wired by
probing the filesystem for the two config files. That is right locally — a fresh clone without
the backend developer's files still builds, which is the whole point of the gate. But EAS Build
clones from git, and both files are gitignored. On the build server neither exists, so the gate
opened the wrong way: the Firebase block dropped out, `useMocks` flipped true, and the artifact
would have been **a fixtures build with a blank grey map, published to production**. Nothing
fails; the build goes green.

The fix has three parts, and all three are needed:

- The files reach the builder as EAS **file-type environment variables**, and the two path
  constants read those first, falling back to the repo-root copies when the variables are unset.
- The gate is now **per platform**. It required *both* files, so an Android cloud build — which
  only ever carries `google-services.json` — would still have failed it.
- `EXPO_PUBLIC_USE_MOCKS`, `EXPO_PUBLIC_ENV`, `EXPO_PUBLIC_NAVER_MAP_CLIENT_ID` and
  `EXPO_PUBLIC_FUNCTIONS_REGION` are set as EAS environment variables too, for the same reason:
  `.env` is gitignored and never reaches the builder.

This is the same class of mistake as the iOS icon, and it has the same remedy — **look inside
the artifact before paying attention to the build log**:

```bash
unzip -p <build>.aab base/assets/app.config | python3 -m json.tool
```

`extra.useMocks` must be `false` and `extra.naverMapConfigured` must be `true`. If either is
wrong the environment variables did not apply, and the AAB must not be uploaded. Note the path:
an AAB keeps it at `base/assets/app.config`, not under the `EXConstants.bundle/` directory the
iOS habit suggests.

For the first build this was checked further, because the whole point was proving the file
environment variable arrived. `extra.firebaseConfigured` came back `true`, and on the builder
only `google-services.json` can exist — so that flag alone proves it. The values are in the
native artifact too: `com.naver.maps.map.CLIENT_ID` carries the real key in
`base/manifest/AndroidManifest.xml`, and the Firebase project id resolves in
`base/resources.pb`. Both files must be **extracted first** — an AAB is a zip, so grepping the
`.aab` itself finds nothing.

`android.versionCode` moved into `app.config.ts` for the reason `ios.buildNumber` is already
there: `android/` is gitignored, so a number kept only in `build.gradle` is reset to 1 by the
next prebuild, and the next uploader learns this from a rejected upload.

## Screenshots: Play measures the ratio, not the size

The App Store set is 1320×2868. Play caps a screenshot's long side at **twice** its short side,
and 2868/1320 is about 2.17, so the images are rejected as they are. This is not an iOS quirk —
a native Android capture at 1080×2400 fails the same rule.

They are padded rather than cropped, to 1080×1920: scaled to 1920 tall, then centred on a 1080
wide canvas. Two details make the result look deliberate rather than letterboxed:

- The fill is `#131313`, sampled from the screenshots themselves and confirmed as the canvas
  token in `src/design-system/foundation/colors.ts`. **It is not `#0B0B0B`** — that token is the
  ink used *on* an acid chip, not a surface.
- 1080×1920 is exactly 9:16 at ≥1080px, which is also Play's threshold for promotion
  eligibility, so complying with the ratio rule buys that as well.

The order on the product page is the App Store's and is deliberate: 홈 → GPS 인증 → 지도 →
장소 상세 → 티켓 → 커뮤니티. The GPS radar is second because it is the one image that explains
what the app is for.

The images still show iOS chrome — the notch and the 9:41 status bar. Google does not police
this the way Apple would, and the alternative was blocking the listing on an Android capture
session. Worth swapping if the screenshots are ever redone.

## What Play asks that Apple did not

- **그래픽 이미지**, 1024×500, no alpha. There is no App Store equivalent, so it was made:
  the app icon's own motif — the pin inside radar rings — beside the wordmark and the subtitle,
  on the canvas colour. Source in `store/play/`.
- **데이터 보안**, answered from the Notion privacy policy, which was written against
  [the backend contract](../reference/backend-contract.md) rather than as boilerplate. Two of its
  claims constrain the form: location is read only at the moment of verification, and nothing is
  collected in the background.
- **콘텐츠 등급**, an IARC questionnaire rather than Apple's own. The answers that matter are the
  same ones that drove the App Store rating — user-to-user interaction, location sharing, and the
  응모 prize draw. Under-declaring the draw is the worse mistake; that judgment is settled in the
  App Store record and does not get revisited here.

## Why there is no closed test

A personal Play account created after 2023-11-13 cannot publish to production until it has run a
closed test with twelve testers for fourteen consecutive days. That gate is granted **per
account, not per app**, and this account already has an app in production — so PINDOM inherits
the access and goes straight to 프로덕션.

This was the single largest schedule risk and it is worth checking first on any future account,
because it is the one requirement that cannot be worked around by being organised.

## Two things that were expected to be blockers and were not

- **Target API level.** New submissions must target API 36 as of 2026-08-31. Expo SDK 54 already
  defaults `compileSdkVersion` and `targetSdkVersion` to 36, so nothing had to be pinned.
- **Firebase SHA-1 fingerprints.** These are needed for Google Sign-In and phone auth. PINDOM
  authenticates with email and password only, so `google-services.json` needs no `oauth_client`
  entry and the upload key's fingerprint never has to be registered.
