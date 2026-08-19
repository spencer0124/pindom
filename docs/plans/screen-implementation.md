---
title: Screen Implementation Plan
type: plan
status: draft
owner: zoyoong124@gmail.com
last-updated: 2026-08-19
audience: internal
---

# Screen Implementation Plan

> The order to build the designed screens in, and why it is not first-to-last.

## Why not page by page

Building screens in file order is the common failure. Screens 1 to 5 come out well, then
screen 12 invents a second card component, a third spacing rhythm and a new nav pattern —
and the fix is refactoring everything already built.

Two things prevent that: a **reference implementation** to point every later prompt at, and
**flow-based grouping** so screens that share state get built together.

## Phase 0 — make the system legible (done)

[../reference/design-system.md](../reference/design-system.md) indexes every component with
its props and a "when to use what" table, and
[../reference/design-tokens.md](../reference/design-tokens.md) fixes the rules for reading
colour. `CLAUDE.md` points at both.

This is what prevents duplicate primitives. Without an index, nobody can know that the thing
they are about to build already exists.

## Phase 1 — data shapes, fixtures, and the repository layer (done)

Three pieces, all landed. Screens bind to these, never below them.

| Path | What it is |
| --- | --- |
| `src/lib/domain/` | One type per entity in [../reference/backend-contract.md](../reference/backend-contract.md). That document is the source; these mirror it. Dates are `Date` — no screen ever sees a Firestore `Timestamp` |
| `src/mocks/` | Typed fixtures against those types, in Korean. Real 촬영지 with real coordinates, so 지도 sorting and distance are meaningful |
| `src/lib/repositories/` | One module per entity, each returning `Result<T>` and branching on `EXPO_PUBLIC_USE_MOCKS`. The **only** place that imports Firebase, per [ADR 0005](../decisions/0005-keep-firebase-behind-a-repository-boundary.md) |

Three properties worth knowing before binding a screen:

- **The mock path is deliberately slow** — a few hundred milliseconds per call. Fixtures that
  resolve instantly mean nobody builds the loading state, and the design system ships both
  `Skeleton` and `Loader`.
- **Fixture state is mutable.** Minting raises the ticket balance and 컬렉션 grows; entering a
  raffle debits it and fails with `errorCode: 'insufficient_tickets'` when short. So the
  `잔여 티켓 충족?` branch on 응모 is exercisable without a server. State resets on reload.
- **Verification is scripted**: 84m → 66m → 32m → verified across successive calls. The whole
  capture chain is walkable in a simulator without travelling to 주문진 방파제:

  ```text
  지도 → 장소/상세 → GPS인증 → 인증 실패 → GPS인증 → 카메라 → 편집 → 공개설정 → 티켓 발행 → 컬렉션
  ```

  That path covers six of the seven dark screens, which is also why it is worth building the
  dark surface set early.

Every screen after this has a data shape to bind to, so a screen author stops inventing one per
screen. Three screens inventing three shapes of `Place` is the same class of failure as three
shapes of card.

## Phase 2 — run the app

**Nothing in this repo has ever been seen on a device.** Every screen is a placeholder, the
design system has only been verified statically, and Firebase's native modules went in without
a prebuild since.

```bash
npx expo prebuild --clean    # Firebase plugins are new; this has not run with them
yarn ios
```

Then open `/sds-preview`, which renders every component the design system exports on one page.

This is first because it is the cheapest step with the highest blocking risk. If the pod
install fails on the new Firebase plugins, or Wanted Sans silently falls back to the system
font, everything after this phase is built on a guess. Two things to look at specifically:

- **Is the type actually Wanted Sans?** Its failure mode is a silent fallback that looks fine
  until you hold it next to the design. It is about to be replaced by Pretendard anyway — but
  knowing whether font embedding works *at all* is what you need before swapping families.
- **Does anything still render blue or violet?** That is the ramp Phase 3 replaces.

## Phase 3 — re-skin the design system to `2b`

**Do this before the first screen, not after the twelfth.**

[ADR 0006](../decisions/0006-adopt-the-prototype-as-the-design-source-of-truth.md) replaced the
palette outright, and [../reference/design-tokens.md](../reference/design-tokens.md) lists the
five changes in order. The reason it comes before any screen is specific to what changed:

Under the old split there were light screens to build while the dark set was missing. Under
`2b` there is no light screen to hide behind. A screen built on today's violet-on-white tokens
is not "a screen that needs restyling later" — it is a screen whose spacing, contrast and
component choices were all made against the wrong ground. Twelve of those is the expensive
version of this work; the plan exists to avoid exactly that.

Two of the five are cheap and unblock the rest:

| | Change | Why now |
| --- | --- | --- |
| 1 | Re-point `colorSeeds.primary` at the acid accent | One line. [ADR 0003](../decisions/0003-single-seed-theming.md) means every accent component follows |
| 3 | Build the dark surface set | `getAdaptiveColors('dark')` still returns inherited greys. **Every** screen waits on it now, not seven |

`/sds-preview` is the whole verification loop: change a token, reload, scan every component at
once. Finding a broken `Switch` there costs a minute. Finding it on screen nine costs the nine
screens that copied it.

Radius, card fills and the Pretendard swap can follow once those two land.

## Phase 4 — one golden screen

Build 홈 (`33:2617`, and block `1a` of the prototype), then review it line by line and fix
everything that is not right.

홈 is the right choice: it is the most component-dense screen, exercises the largest number of
primitives, and is the screen users see most. It also now carries the artist header and the
tier gauge, so it is where those patterns get settled.

Every later prompt then ends with *"match the patterns in `app/(tabs)/index.tsx`"*. This single
step does more for consistency than any amount of prompt wording, because it replaces an
abstract instruction with a concrete example.

> [!NOTE]
> Bind it to `placeRepository`, `userRepository` and `raffleRepository` from
> `@/lib/repositories`. Never to `src/mocks/` directly — that is the boundary
> [ADR 0005](../decisions/0005-keep-firebase-behind-a-repository-boundary.md) exists to keep.

## Phase 5 — flow slices

One slice per session, in the order below. Slice membership and screens are in
[../reference/screens.md](../reference/screens.md).

| Order | Slice | Why here |
| --- | --- | --- |
| 1 | Auth & entry | 최애 찾기 is structural — every other screen is keyed to the selected artist, so settling that shape first stops five screens inventing five versions of it |
| 2 | Discovery | Contains the golden screen; establishes list, row and rule patterns |
| 3 | Capture | The core loop, and the largest slice. Needs discovery's place shape |
| 4 | Tickets & raffle | Consumes what capture produces. Includes the 절취 step |
| 5 | Community | Per-artist boards, so it needs Auth's artist shape but nothing else |
| 6 | Profile | Includes 프로필 편집, 언어 and 보관함 — three small screens, least shared state |

Screens inside a slice share state and navigation params. Building 응모 → 티켓 절취 → 응모완료
together means the route params match; building them a week apart means they do not.

## Per-screen loop

1. Open the screen in the prototype — `design/2026-08-19-prototype.html`, block `1a`. Its
   identifiers are the `Screen` column of [../reference/screens.md](../reference/screens.md),
   so `screen === 'place'` finds 장소/상세 immediately.
2. Read layout, copy, flow and interaction states from `1a`; read colour, type, corners and
   dividers from `2b`. Those two axes do not overlap — see
   [`design/README.md`](../../design/README.md).
3. Write down the deviations before building. Ambiguity in the design surfaces here, and the
   prototype has interaction states a static frame never had.
4. Visual diff: screenshot the build beside the prototype and compare as a list, not by eye.
5. Update the status column in [../reference/screens.md](../reference/screens.md).
6. Commit — one screen per commit.

> [!WARNING]
> Do not copy the prototype's markup. It is a browser page using inline styles and template
> bindings; PINDOM builds with flexbox and the design system. Same rule Figma output had.

## Deferred

- **Code Connect.** Lower value now that the prototype, not Figma, is the design authority.
  Revisit only if screens go back through the Figma MCP.
- **Pretendard.** The font swap is item 5 of the token work and needs files this repo does not
  have. It changes metrics, so do it before the layouts are finely tuned — but after the
  palette, which is what makes screens buildable at all.
- **The three open design questions** in [`design/README.md`](../../design/README.md): the
  ticket card variant, the raffle motion, and whether all four locales ship. Only the first
  blocks a screen (티켓 발행), and not until Phase 5 slice 4.
- **Firebase integration.** Screens bind to fixtures until the backend developer has a project
  and functions to point at. Because the switch lives in `src/lib/repositories/`, flipping
  `EXPO_PUBLIC_USE_MOCKS` is the whole migration — nothing under `app/` changes. The runbook is
  [../how-to/connect-the-app-to-firebase.md](../how-to/connect-the-app-to-firebase.md).

## Related

- [`design/README.md`](../../design/README.md) — the prototype, and what it leaves open
- [../reference/screens.md](../reference/screens.md) — the 21 screens, their routes and slices
- [../reference/design-tokens.md](../reference/design-tokens.md) — the five changes Phase 3 works through
- [../reference/design-system.md](../reference/design-system.md) — what to build with
- [../reference/backend-contract.md](../reference/backend-contract.md) — the data shapes Phase 1 mirrors
- [../how-to/connect-the-app-to-firebase.md](../how-to/connect-the-app-to-firebase.md) — the fixture switch, and how to leave it behind
