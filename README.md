# PINDOM

Location-verified photo tickets. Visit a filming location, pass a GPS check,
shoot on the spot, and mint a ticket you can spend on raffles.

React Native / Expo SDK 54.

## Setup

```bash
nvm use            # Node 22
yarn install
cp .env.example .env   # then fill in the values
```

### Environment

`.env` is gitignored; `.env.example` is the committed contract for which keys
exist. `EXPO_PUBLIC_*` keys are **inlined into the JS bundle** and are therefore
public — never put a secret behind that prefix.

| Key | Required | Notes |
| --- | --- | --- |
| `EXPO_PUBLIC_USE_MOCKS` | yes | `true` serves typed fixtures from `src/mocks/`; `false` calls Firebase |
| `EXPO_PUBLIC_ENV` | no | `dev` \| `staging` \| `prod`, defaults to `prod` |
| `EXPO_PUBLIC_NAVER_MAP_CLIENT_ID` | for the map | Must be registered to `com.zoyoong.pindom`; a wrong ID fails **silently** with a blank map |

Firebase needs no key here — it carries its project identity in
`google-services.json` and `GoogleService-Info.plist`, which are gitignored and
come from the backend developer. See
[connect-the-app-to-firebase.md](docs/how-to/connect-the-app-to-firebase.md).

Flow: `.env` → `app.config.ts` `extra` → `Constants.expoConfig.extra` →
`src/lib/api/config.ts`. Read through `ApiConfig`, not `extra` directly.

### Running

This project uses native modules (Naver Map, MMKV/Nitro), so **Expo Go will not
work** — you need a development build:

```bash
yarn ios       # or: yarn android
```

## Documentation

Full docs are in [docs/](docs/README.md), filed by reader need
([Diátaxis](https://diataxis.fr/)). Start here:

| Document | For |
| --- | --- |
| [design/README.md](design/README.md) | The interactive prototype. **The design authority — read before building any screen** |
| [connect-the-app-to-firebase.md](docs/how-to/connect-the-app-to-firebase.md) | Joining the backend developer's Firebase project — and building before you can. **Start here for anything backend-shaped** |
| [architecture.md](docs/explanation/architecture.md) | What PINDOM is and how the app is assembled |
| [design-language.md](docs/explanation/design-language.md) | Why some screens are dark and most are light |
| [design-system.md](docs/reference/design-system.md) | Every component and when to use it — **read before building anything** |
| [design-tokens.md](docs/reference/design-tokens.md) | Colour, type, spacing, and the rules for reading them |
| [screens.md](docs/reference/screens.md) | Every Figma frame → node id, theme, route, status |
| [figma-workflow.md](docs/reference/figma-workflow.md) | Driving Figma MCP against this file without getting burned |
| [backend-contract.md](docs/reference/backend-contract.md) | Firestore collections and Cloud Function signatures both codebases implement against |
| [screen-implementation.md](docs/plans/screen-implementation.md) | The order to build screens in |

[CLAUDE.md](CLAUDE.md) carries the build rules those docs back.

## Design system

`src/design-system/` is vendored from `@skkuverse/sds` and is now owned by this
repo — a copy, not a dependency, so it does not track skkuverse.

Every accent-coloured component derives from **one seed**, `colorSeeds.primary`
in `src/design-system/foundation/colors.ts`. Changing that single value re-themes
the app. Do not reach past the theme to a raw `SdsColors.brand*` inside a
component; read `useTheme().token.accent` instead.

`/sds-preview` renders every component on one screen; it is the fastest way to
check a theme change.

## Commands

| Command | Does |
| --- | --- |
| `yarn start` | Metro |
| `yarn ios` / `yarn android` | native dev build |
| `yarn typecheck` | `tsc --noEmit` |
| `yarn lint` | ESLint + markdownlint |
| `yarn lint:md` | markdownlint only |

## Status

Screens are route skeletons. Each placeholder shows its Figma node id and the
flowchart's outgoing transitions, so the navigation graph is walkable before any
screen is built.

The backend is **Firebase, owned by the backend developer**. This repo is a
client of it and reaches it only through `src/lib/repositories/`, which serves
typed fixtures from `src/mocks/` until the Firebase project is reachable. The
switch is `EXPO_PUBLIC_USE_MOCKS`; see
[ADR 0005](docs/decisions/0005-keep-firebase-behind-a-repository-boundary.md)
and [connect-the-app-to-firebase.md](docs/how-to/connect-the-app-to-firebase.md).

The GPS check (50m radius + speed) is an anti-spoofing measure and **must be
adjudicated server-side** — the client submits a reading, it does not decide.
