# CLAUDE.md

PINDOM — Expo / React Native. Location-verified photo tickets.

Read [docs/explanation/architecture.md](docs/explanation/architecture.md) first if you do
not know what this app does. The docs index is [docs/README.md](docs/README.md).

## Build rules

- **Check [docs/reference/design-system.md](docs/reference/design-system.md) before creating
  any component.** Reuse beats create. If nothing fits, ask before adding a primitive.
- **Figma output is layout intent and copy, never final code.** This file has no auto layout
  and no components — always rebuild with flexbox, never absolute positioning. See
  [docs/reference/figma-workflow.md](docs/reference/figma-workflow.md).
- **Tokens only.** A raw hex or magic number in a screen file is a bug.
- **Read accent colour from `useTheme().token.accent`**, never `SdsColors.brand*` directly.
  See [docs/reference/design-tokens.md](docs/reference/design-tokens.md).
- **Korean UI copy is final.** Do not translate, paraphrase, or "normalise" it. Figma frame
  names stay Korean too — they are how you find the frame.
- **The product is PINDOM.** Two Figma frames render the wordmark as `FINDOM`. That is a
  typo in the design; never copy it into code.
- **Match the golden screen**, `app/(tabs)/index.tsx`, for structure and conventions.
- **Screens get data from `src/lib/repositories/` only** — never from `@react-native-firebase/*`
  or `src/mocks/` directly. Field names come from
  [docs/reference/backend-contract.md](docs/reference/backend-contract.md), not from invention.
- **One screen per commit.** Update the status column in
  [docs/reference/screens.md](docs/reference/screens.md) when a screen lands.

## Hard constraints

- **The client never decides whether a GPS verification passed.** The 50m radius and speed
  checks are anti-spoofing and must be adjudicated server-side. The client submits a
  reading. On-screen distance is feedback, not the check.
- **No global dark mode.** Theme is a fixed property of each route, not a user preference.
  See [ADR 0004](docs/decisions/0004-per-screen-theme-not-global-dark-mode.md).
- **The design system must not import from a screen.** Dependencies run one way:
  `app/` → `src/features/` → `src/components/` → `src/design-system/`.
- **The backend is Firebase and the backend developer owns all of it** — project, schema,
  rules, functions, billing. Never write Firestore rules or Cloud Functions in this repo.
  [ADR 0005](docs/decisions/0005-keep-firebase-behind-a-repository-boundary.md); the runbook is
  [docs/how-to/connect-the-app-to-firebase.md](docs/how-to/connect-the-app-to-firebase.md).

## Commands

| Command | Does |
| --- | --- |
| `yarn typecheck` | `tsc --noEmit` |
| `yarn lint` | ESLint + markdownlint |
| `yarn lint:md` | markdownlint only |
| `yarn ios` / `yarn android` | native dev build (Expo Go will not work) |

Run `yarn typecheck` and `yarn lint` before declaring work done.

## Writing docs

Follow [docs/README.md](docs/README.md). Frontmatter is required, one need per document,
and **never hardcode a version or count** — point at the source instead.
