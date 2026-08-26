---
title: Connect the App to Firebase
type: how-to
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-08-26
audience: internal
---

# Connect the App to Firebase

> How the PINDOM app joins a Firebase project it does not own, how to keep building before that project exists, and where every related document lives. Open this page first for anything Firebase-shaped.

## Overview

PINDOM's backend is Firebase, and **the backend developer owns all of it** — the project, the
Firestore schema, the security rules, the Cloud Functions, the billing. Nothing on this page
asks you to create a Firebase project or write a rule.

```text
  BACKEND DEV                          YOU
  ───────────                          ───
  owns the Firebase project            own the Expo app
  Firestore · Auth · Functions         connect it as a client
  rules · seed data · deploys          build screens

           ── hands you two config files and IAM access ──▶
           ◀── hands back schema gaps found while building ──
```

The analogy: they have already put up the building. You are collecting a keycard, not laying
bricks. The division of labour, and why it is drawn here, is in
[ADR 0005](../decisions/0005-keep-firebase-behind-a-repository-boundary.md).

## Prerequisites

- The backend developer has created the Firebase project and enabled Email/Password sign-in.
- You know the app's bundle identifiers — see the table in [step 1](#1-ask-the-backend-dev-for-access).
- Node and Yarn per the root [README](../../README.md); the versions are pinned in `.nvmrc`
  and `package.json`.

> [!NOTE]
> **Already done on this checkout.** The project exists (`pindom-1234`), Email/Password
> sign-in is enabled, the Cloud Functions region is agreed as `asia-northeast3`, both config
> files are in place, and the packages are installed. The steps below remain the procedure —
> for a fresh clone, a second developer, or a new Firebase project — but you do not need to
> repeat them.

> [!IMPORTANT]
> **The backend is live as of 2026-08-22.** Firestore and Storage rules are deployed, all three
> Cloud Functions are deployed to `asia-northeast3`, five composite indexes and the session TTL
> policy are active, and 최애·촬영지·코스·응모 are seeded. There is no backend work in flight.
>
> So `EXPO_PUBLIC_USE_MOCKS=false` now returns real data rather than blank screens — but the
> seeded database is emptier than the fixtures in one way that will look like a bug: **every
> counter is `0`**, on purpose. 홈's recommendation strip orders by `ticketCount`, so before the
> first ticket is minted its order is arbitrary rather than wrong. `posts` is not seeded at all,
> so 커뮤니티 is empty until someone writes.
>
> What the deployed backend does differently from what the contract said is in the
> [handoff reconciliation](../plans/2026-08-22-backend-handoff-reconciliation.md). Read it before
> you flip the switch.

## How Firebase recognises your app

Firebase does not use a base URL or an API key you paste into code. Instead, every platform
build carries a **config file** that says which project the app belongs to:

| Platform | File | Where it comes from |
| --- | --- | --- |
| Android | `google-services.json` | Firebase console → Project settings → Your apps → Android |
| iOS | `GoogleService-Info.plist` | Firebase console → Project settings → Your apps → iOS |

Each contains the project id, the app id, and a public API key. At startup the SDK reads the
file and knows where to connect. This is why `.env` gains no `EXPO_PUBLIC_FIREBASE_*` keys —
the files already carry the project's identity.

> [!WARNING]
> **These files are not secrets.** They ship inside the app bundle and can be extracted from
> any downloaded APK or IPA. `.gitignore` excludes them by convention, not for protection.
> Your app's security comes entirely from the backend dev's Firestore rules and the Cloud
> Functions — which is why that work is load-bearing rather than optional, and why the
> [trust boundary](../explanation/architecture.md#trust-boundary) forbids the client deciding
> whether a GPS verification passed.

## Steps

### 1. Ask the backend dev for access

They add the app twice in the Firebase console — once per platform — using these exact
identifiers, which live in `app.config.ts` as `android.package` and `ios.bundleIdentifier`:

| Field | Value |
| --- | --- |
| Android package name | `com.zoyoong.pindom` |
| iOS bundle ID | `com.zoyoong.pindom` |

> [!WARNING]
> A mismatched identifier fails **silently**. The app builds, runs, and every Firebase call
> just does not work. This is the same failure mode as a wrong Naver Map client id producing a
> blank map with no error, so verify the string rather than assuming.

Ask for three things:

1. `google-services.json` and `GoogleService-Info.plist`, sent directly — not committed. Both
   are already listed in `.gitignore`.
2. **Editor** access to the Firebase project, so you can read the console when debugging. See
   [Firebase IAM](https://firebase.google.com/docs/projects/iam/overview).
3. The **region** their Cloud Functions deploy to — for PINDOM this is
   `asia-northeast3` (Seoul). It matters; see [troubleshooting](#troubleshooting).

### 2. Drop the files in — that is the whole integration

Both go at the repo root, beside `app.config.ts`:

```text
pindom/
├── google-services.json        ← from the backend dev
├── GoogleService-Info.plist    ← from the backend dev
├── app.config.ts
└── package.json
```

Nothing else to edit. The packages are installed and `app.config.ts` is already
wired — it checks for these two files and only then adds the
`@react-native-firebase/*` plugins and the `googleServicesFile` entries:

```ts
const firebaseConfigured =
  existsSync(ANDROID_FIREBASE_CONFIG) && existsSync(IOS_FIREBASE_CONFIG);
```

> [!NOTE]
> The gate exists because the `@react-native-firebase/app` config plugin **aborts
> `expo prebuild`** when `googleServicesFile` points at a file that is not there. Since both
> files are gitignored, an ungated config would mean a fresh clone could not build at all. When
> the files are absent, `expo config` prints a warning naming what it expected — a build that
> quietly ran without Firebase would be worse than one that says so.

Already installed, so there is nothing to run:
`@react-native-firebase/app`, `/auth`, `/firestore`, `/functions`, `/storage`.

| Package | Used for |
| --- | --- |
| `app` | The connection itself. Required by all the others |
| `auth` | Email/password sign-in on 시작화면 |
| `firestore` | Reading places, tickets, raffles, posts |
| `functions` | Calling `verifyLocation`, `issueTicket`, `enterRaffle` |
| `storage` | Uploading the ticket photo |

### 3. Rebuild the native projects

```bash
npx expo prebuild --clean
yarn ios          # or: yarn android
```

Firebase is a **native** module, not a pure JavaScript library. `prebuild` regenerates the
`ios/` and `android/` directories and links the config files into them.

This is also why **Expo Go cannot work**. Expo Go is a pre-built app containing a fixed set of
native modules; it has no way to load one you added. PINDOM already required a development
build for Naver Map and MMKV, so this changes nothing about your workflow — `yarn ios` runs
`expo run:ios`, which prebuilds for you. The explicit `--clean` above is only needed when
native config changes, as it just did.

### 4. Flip the switch

Set `EXPO_PUBLIC_USE_MOCKS=false` in `.env`, and tell `AppConfig` where the functions live:

```bash
EXPO_PUBLIC_USE_MOCKS=false
EXPO_PUBLIC_FUNCTIONS_REGION=asia-northeast3   # confirmed with the backend dev
```

Dropping the config files in does **not** silently switch you to live data — an explicit
`EXPO_PUBLIC_USE_MOCKS` always wins, so you choose when to cross over. With the variable unset,
fixtures turn off automatically once Firebase becomes reachable.

> [!IMPORTANT]
> **Editing `.env` is not enough — rebuild.** `AppConfig` reads
> `Constants.expoConfig.extra`, and in a dev build that object is baked into the app bundle at
> build time as `EXConstants.bundle/app.config`; Metro's manifest serves `extra: null`. So
> restarting Metro updates the inlined `process.env.EXPO_PUBLIC_*` strings in the JS bundle but
> **not** the `extra` block the switch is actually read from, and the app keeps serving fixtures
> while every file on disk says otherwise.
>
> ```bash
> yarn ios          # or: yarn android
> ```
>
> Confirm which side is live from Metro's own log rather than from `.env` — on first use it
> prints one of these, and it is the only unambiguous signal:
>
> ```text
> iOS Bundled … src/lib/repositories/mock.ts        ← fixtures
> iOS Bundled … src/lib/repositories/firebase.ts    ← live
> ```

#### Checking the contract before you cross over

The switch is cheap to flip and expensive to debug, because the failure mode is silence: a
renamed field renders `undefined`, and a query the rules refuse looks exactly like a query
that found nothing. Both are cheaper to find against the emulator, where the same rules,
indexes, functions and seed run locally.

What is worth running is not the backend's own test suite — that asks the backend about
itself — but **the app's mappers against the emulator**, so a field name that moved shows up
as a mapping warning rather than as a blank screen weeks later. `firebase-mapping.ts` already
warns on every field it cannot find in development; treat those warnings as failures and the
check writes itself.

```bash
# in the backend checkout — the project id must match the one the client connects with,
# or every callable answers `not-found` for the same reason a wrong region does
firebase emulators:exec --project <id> --only auth,firestore,storage,functions "<your script>"
```

Two traps sit in that command. The emulator needs a JDK at or above the version
`firebase-tools` currently demands, and the storage bucket the client names must be the one in
`google-services.json` — `pindom-1234.firebasestorage.app`, not the older `.appspot.com` form,
or `issueTicket` reports `not-found 사진이 없다` for a photo that uploaded successfully.

#### What is actually in there

The seed came from `src/mocks/`, so the ids are the ones you already know. Hard-code them freely
while developing:

| Collection | Ids |
| --- | --- |
| `artists` | `artist-lumina` · `artist-echoline` · `artist-nightpost` |
| `places` | `place-jumunjin` · `place-gamcheon` · `place-namsan` · `place-cheonggye` · `place-eurwangni` |
| `courses` | `course-gangneung` · `course-seoul-night` |
| `raffles` | `raffle-fansign` · `raffle-album` · `raffle-concert` · `raffle-closed` |

**To exercise GPS인증 for real, send a coordinate within 50 m of `place-jumunjin`** —
`37.8796220881, 128.8335906768`, which is the `location` on the seeded document. The simulator's location override reaches it; you do not need to be in 강릉.
Two things it will not do for you:

- The reading's `accuracy` still has to come back at **65 m or better**, or the call is rejected
  for `poor_accuracy` before position is even considered.
- On Android, an override sets the system's mock-provider flag. Once the app populates `isMock`
  honestly, the same override starts returning `mock_location`. Test the happy path on iOS, or on
  a device.

The fixtures' scripted 84m → 66m → 32m countdown does not exist against the live backend —
`verifyLocation` judges whatever coordinate you actually send.

> [!NOTE]
> **The seeded English copy is placeholder text.** The backend translated `src/mocks/` into
> `{ ko, en }` maps, but the Korean originals were themselves stand-ins written before rights
> clearance. Anything odd you see under `locale: 'en'` is a copy task, not a bug.

### 5. Use it in code

> [!WARNING]
> Most tutorials still show the **namespaced** API: `firestore().collection('places').doc(id)`.
> React Native Firebase removed that API in v22 and is fully modular from v23, and
> `npx expo install` will give you a current major. Copying the old syntax produces a wall of
> deprecation warnings and then code that stops working. Use the modular form below, and check
> [Migrating to v22](https://rnfirebase.io/migrating-to-v22) if you find an old snippet.

```ts
import { getApp } from '@react-native-firebase/app';
import { getAuth, signInWithEmailAndPassword } from '@react-native-firebase/auth';
import { doc, getDoc, getFirestore } from '@react-native-firebase/firestore';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';

const app = getApp();

// Sign in
await signInWithEmailAndPassword(getAuth(app), email, password);

// Read a document
const snapshot = await getDoc(doc(getFirestore(app), 'places', placeId));

// Call a Cloud Function — the region is not optional, see step 1
const verify = httpsCallable(getFunctions(app, 'asia-northeast3'), 'verifyLocation');
const result = await verify({
  placeId,
  lat,
  lng,
  accuracy,
  capturedAt: new Date().toISOString(),  // must be within ±5 min of server time
  isMock,                                // Android reports it; iOS sends false
});
```

Every field above is required. `getFunctions(app)` without the region resolves to `us-central1`
and fails `not-found`; a stale `capturedAt` fails `invalid-argument`. The full request and
response shapes are in [backend-contract.md](../reference/backend-contract.md).

No URL, no API key, no `EXPO_PUBLIC_` variable — the config files from step 2 carry all of it.

> [!WARNING]
> In PINDOM these imports belong **only** in `src/lib/repositories/`. A screen that imports
> `@react-native-firebase/*` directly breaks the boundary described in
> [ADR 0005](../decisions/0005-keep-firebase-behind-a-repository-boundary.md) and disables the
> fixture switch below. The field names to read are fixed by
> [backend-contract.md](../reference/backend-contract.md), not invented here.

## Building before any of this exists

You do not have to wait. None of the steps above are needed to build screens.

Set `EXPO_PUBLIC_USE_MOCKS=true` in `.env` and the repository layer serves typed fixtures from
`src/mocks/` instead of calling Firebase. No packages installed, no prebuild, no config files,
no project access. Every designed screen in [screens.md](../reference/screens.md) can be built
this way.

The fixtures include a **scripted verification sequence** — the distance counts down 84m → 66m
→ 32m → verified across successive calls. That makes the whole capture chain walkable in the
simulator without travelling to 주문진 방파제:

```text
지도 → 장소/상세 → GPS인증 → 인증 실패 → GPS인증 → 카메라 → 편집 → 공개설정 → 티켓 발행 → 컬렉션
```

The build order that assumes this is [screen-implementation.md](../plans/screen-implementation.md).

## How the fixture switch and the real connection coexist

They never meet. The repository layer is the only code that knows which is running:

```text
  screens (app/)
        │  import repositories only
        ▼
  src/lib/repositories/
        ├── EXPO_PUBLIC_USE_MOCKS=true   ──▶  src/mocks/         typed fixtures
        └── EXPO_PUBLIC_USE_MOCKS=false  ──▶  Firebase           real data

              both branches return the same Result<T>
```

One `if` per repository function. Screens are identical either way, because they only ever see
`Result<T>` from `src/lib/api/types.ts`.

Keep the switch after integration. It is worth more than it costs:

- Developing offline, or on a flight, or against a collection that is seeded but empty.
- Walking a flow end to end without travelling — the fixtures script a 84m → 66m → 32m
  verification countdown that the live backend, judging real coordinates, will not reproduce.
- **Demoing at the 공모전 if the venue network fails.** For an app built on GPS and photo
  upload, that is a real risk, and a boolean is cheap insurance against it.

The variable is documented in `.env.example`; the reading path is
`.env` → `app.config.ts` `extra` → `Constants.expoConfig.extra` → `src/lib/api/config.ts`.

## Troubleshooting

Firebase's failure modes are unusually quiet. These are the ones that will cost you an
afternoon if you do not recognise them.

| Symptom | Cause | Fix |
| --- | --- | --- |
| A field renders `undefined` | Field-name mismatch. Firestore has no schema and never errors on a wrong key | Check [backend-contract.md](../reference/backend-contract.md). It is the referee, not either codebase |
| `permission-denied` on a **ticket list** | The query is missing `where('userId', '==', uid)`. Rules judge the query, not the results, so an unconstrained list is refused whole rather than narrowed | Add the condition. 보관함 is that same query plus `visibility == 'private'` |
| `permission-denied` on **saving a profile** | The write carried a field outside the permitted six. Adding something innocuous like `updatedAt` is enough | Send only `nickname`, `avatarUrl`, `bio`, `followedArtistIds`, `profileVisibility`, `locale` |
| `permission-denied` on **writing a post or review** | `authorNickname` or `authorTier` does not match the author's own `users` document; `createdAt` is not `serverTimestamp()`; or `likeCount` / `commentCount` is missing or nonzero — they must be present and literal `0` | Read the user document first and copy both author values from it, send the counters as `0`, and never stamp `createdAt` on the client |
| `permission-denied` **right after sign-up** | The `users` create had a nonzero counter, or carried `tier` | The three counters are literal `0` and `tier` is omitted — it is function-only |
| `permission-denied` on a **photo upload** | The path's uid is not the caller's, the file is not an image, or it is 10 MB or larger | Upload to `tickets/{uid}/…` or `posts/{uid}/…` and re-encode before uploading — that also strips EXIF, which is the app's job |
| `permission-denied` on any other read | Firestore rules, not your code | Send the collection path to the backend dev |
| Callable throws `not-found` | Almost always the region. All three functions are deployed to `asia-northeast3`, but `getFunctions(app)` defaults to `us-central1` | Pass the region explicitly. Check `EXPO_PUBLIC_FUNCTIONS_REGION`, and check the call site actually reads it |
| `auth/operation-not-allowed` on sign-in | Email/Password is disabled in the console. Enabled for `pindom-1234`, so this only bites on a new project | Authentication → Sign-in method → Email/Password |
| The first callable of a session takes seconds | Cold start. The functions run at `minInstances: 0`, so the first invocation pays 2–4 s of container startup | Not a fault — design the loading state to survive it. `verifyLocation` gets a warm instance before launch |
| A verification throws `invalid-argument` | `capturedAt` is outside server time ±5 minutes — usually a simulator with a drifting clock | Fix the device clock. Do not build a flow that holds a reading and re-sends it later |
| A callable does nothing at all — no request, no verdict, the screen returns to idle | The payload held a value JSON cannot encode. `Infinity` and `NaN` make the SDK throw **before the request leaves the device**, so there is no network call to find in a log and no server error to read. The trap is a nullable device value defaulted to `Infinity` — a callable is JSON, not JavaScript | Send a finite sentinel and let the server judge it. `useVerification` sends `ACCURACY_UNKNOWN_M` when the device declines to estimate an error radius, and gets `poor_accuracy` back, which 인증 실패 already renders |
| A date renders as `[object Object]` | Firestore returns a `Timestamp`, not a `Date` or an ISO string | Convert once, in the repository, never in a screen |
| An optional field typed `\| null` never matches | Firestore omits absent fields entirely — they read `undefined`, never `null` | Type them `field?: T` |
| Everything fails silently after a clean install | Bundle identifier mismatch, or the config files are missing after `prebuild --clean` | Confirm both files are at the repo root and the identifiers match step 1 |

## Related

Everything Firebase-adjacent, reachable from here.

| Document | What you will find |
| --- | --- |
| [backend-contract.md](../reference/backend-contract.md) | The Firestore collections, field names, and the three Cloud Function signatures. **The document the backend dev implements against** |
| [2026-08-22 handoff reconciliation](../plans/2026-08-22-backend-handoff-reconciliation.md) | What the deployed backend does differently from the contract, and the app changes still owed. **Read this before switching off fixtures** |
| [2026-08-26 integration open items](../plans/2026-08-26-integration-open-items.md) | What the pre-switch verification run left open once every fixable defect had landed, and how it closed: six app-side decisions taken the same day, and the nine items still handed to the backend. **Read this with the reconciliation** |
| [2026-08-21 review resolutions](../plans/2026-08-21-backend-contract-review-resolutions.md) | Every finding from the backend developer's review of that contract, and the decision taken on it. Read it when you want to know *why* a field is shaped the way it is |
| [ADR 0005](../decisions/0005-keep-firebase-behind-a-repository-boundary.md) | Why Firebase sits behind `src/lib/repositories/`, and why `src/lib/api/` is superseded |
| [architecture.md](../explanation/architecture.md) | The product loop, the repo layout, and the trust boundary that makes GPS adjudication server-side |
| [screen-implementation.md](../plans/screen-implementation.md) | The order to build screens in, and the fixture layer this page's switch depends on |
| [screens.md](../reference/screens.md) | Every screen, its Figma node, theme, route, and which flow slice it belongs to |
| [design-system.md](../reference/design-system.md) | What to build screens out of — read before creating any component |
| [../../README.md](../../README.md) | Repo setup, the environment table, and commands |
| [../README.md](../README.md) | Docs index and the writing rules this page follows |

External references, for when the above is not enough:

- [Expo — Using Firebase](https://docs.expo.dev/guides/using-firebase/)
- [React Native Firebase](https://rnfirebase.io/) and [Migrating to v22](https://rnfirebase.io/migrating-to-v22)
- [Firebase IAM overview](https://firebase.google.com/docs/projects/iam/overview)
