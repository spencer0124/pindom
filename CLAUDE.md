# CLAUDE.md

PINDOM — Expo / React Native. Location-verified photo tickets.

Read [docs/explanation/architecture.md](docs/explanation/architecture.md) first if you do
not know what this app does. The docs index is [docs/README.md](docs/README.md).

**The design source is [design/README.md](design/README.md)** — an interactive prototype that
outranks Figma ([ADR 0006](docs/decisions/0006-adopt-the-prototype-as-the-design-source-of-truth.md)).

## Build rules

- **Check [docs/reference/design-system.md](docs/reference/design-system.md) before creating
  any component.** Reuse beats create. If nothing fits, ask before adding a primitive.
- **The prototype beats Figma.** Read layout, copy and flow from block `1a`; read colour, type
  and corners from `2b`. Where an old Figma frame disagrees, it is wrong. See
  [design/README.md](design/README.md).
- **Prototype output is layout intent and copy, never final code.** Same rule Figma had —
  always rebuild with flexbox, never absolute positioning, never copy its inline styles. For
  older frames see [docs/reference/figma-workflow.md](docs/reference/figma-workflow.md).
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

- **The client never decides whether a GPS verification passed.** The radius, speed, accuracy
  and mock-provider checks are anti-spoofing and must be adjudicated server-side. The client
  submits a reading. On-screen distance is feedback, not the check. The exact gates are in
  [docs/reference/backend-contract.md](docs/reference/backend-contract.md).
- **No theme toggle.** Every screen is dark under direction `2b`, and that is a property of
  the build, not a user preference. The prototype's 마이페이지 has a toggle; it is **not**
  adopted. See [ADR 0004](docs/decisions/0004-per-screen-theme-not-global-dark-mode.md) and
  [ADR 0006](docs/decisions/0006-adopt-the-prototype-as-the-design-source-of-truth.md).
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
| `./scripts/ship-testflight.sh` | ship an iOS build to TestFlight, end to end |

Run `yarn typecheck` and `yarn lint` before declaring work done.

## Shipping to TestFlight

**Do not archive or upload by hand.** `./scripts/ship-testflight.sh` does the whole thing —
it merges `origin/main` into `dev`, bumps the build number, runs the gates, archives,
verifies what got baked into the archive, uploads, waits for processing, and submits for
external Beta App Review. Run it with no arguments.

- **Resume, do not restart.** The archive phase costs minutes and everything after it costs
  seconds. `--from verify` re-uses the archive already on disk. `--list` names the phases;
  `--only <phase>` runs one.
- **The script is the reference.** Its header explains why each guard exists, and every
  constant — team, bundle id, TestFlight group ids, key paths — is declared at the top of
  it. Do not re-derive them from App Store Connect.
- **You still write two things**: a sentence in the `ios.buildNumber` comment in
  `app.config.ts` saying what this build carries, and the commit. The script prints the
  commit subject to use.

The runbook, including the four traps the script designs out, is
[docs/how-to/ship-a-testflight-build.md](docs/how-to/ship-a-testflight-build.md).
The `ship-testflight` skill is a pointer to the same script.

## Writing docs

Follow [docs/README.md](docs/README.md). Frontmatter is required, one need per document,
and **never hardcode a version or count** — point at the source instead.
