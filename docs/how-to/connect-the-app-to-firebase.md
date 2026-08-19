---
title: Connect the App to Firebase
type: how-to
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-08-19
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
3. The **region** their Cloud Functions deploy to. This matters; see
   [troubleshooting](#troubleshooting).

### 2. Put the files in place

Both go at the repo root, beside `app.config.ts`:

```text
pindom/
├── google-services.json        ← from the backend dev
├── GoogleService-Info.plist    ← from the backend dev
├── app.config.ts
└── package.json
```

### 3. Install the packages

```bash
npx expo install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore @react-native-firebase/functions @react-native-firebase/storage
```

| Package | Used for |
| --- | --- |
| `app` | The connection itself. Required by all the others |
| `auth` | Email/password sign-in on 시작화면 |
| `firestore` | Reading places, tickets, raffles, posts |
| `functions` | Calling `verifyLocation`, `issueTicket`, `enterRaffle` |
| `storage` | Uploading the ticket photo |

Use `npx expo install`, not `yarn add` — it resolves versions compatible with the Expo SDK
pinned in `package.json`.

### 4. Point `app.config.ts` at the files

Add `googleServicesFile` to both platform blocks, and the config plugin:

```ts
ios: {
  bundleIdentifier: 'com.zoyoong.pindom',
  googleServicesFile: './GoogleService-Info.plist',
  // ...existing iOS config
},

android: {
  package: 'com.zoyoong.pindom',
  googleServicesFile: './google-services.json',
  // ...existing Android config
},

plugins: [
  '@react-native-firebase/app',
  // ...existing plugins
],
```

> [!NOTE]
> Most guides also tell you to add `expo-build-properties` with `ios.useFrameworks: 'static'`.
> **That is already configured** in `app.config.ts` — Naver Map's iOS SDK required it first.
> Firebase needs the same setting, so there is nothing to change and no conflict.

### 5. Rebuild the native projects

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

### 6. Use it in code

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

// Call a Cloud Function
const verify = httpsCallable(getFunctions(app), 'verifyLocation');
const result = await verify({ placeId, lat, lng, accuracy });
```

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

- Developing offline, or before the backend dev has seeded a collection.
- Building a screen whose Cloud Function is not deployed yet.
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
| `permission-denied` on a read that should work | Firestore rules, not your code | Send the collection path to the backend dev |
| Callable throws `not-found` | The function is not deployed, **or** it is deployed to a different region. `getFunctions(app)` defaults to `us-central1`, and a Korean deployment is likely `asia-northeast3` | Pass the region: `getFunctions(app, 'asia-northeast3')` |
| A date renders as `[object Object]` | Firestore returns a `Timestamp`, not a `Date` or an ISO string | Convert once, in the repository, never in a screen |
| An optional field typed `\| null` never matches | Firestore omits absent fields entirely — they read `undefined`, never `null` | Type them `field?: T` |
| Everything fails silently after a clean install | Bundle identifier mismatch, or the config files are missing after `prebuild --clean` | Confirm both files are at the repo root and the identifiers match step 1 |

## Related

Everything Firebase-adjacent, reachable from here.

| Document | What you will find |
| --- | --- |
| [backend-contract.md](../reference/backend-contract.md) | The Firestore collections, field names, and the three Cloud Function signatures. **The document the backend dev implements against** |
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
