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

## Phase 2 — one golden screen

Build 홈 (`33:2617`), then review it line by line and fix everything that is not right.

홈 is the right choice: it is the most component-dense light screen, exercises the largest
number of primitives, and is the screen users see most.

Every later prompt then ends with *"match the patterns in `app/(tabs)/index.tsx`"*. This
single step does more for consistency than any amount of prompt wording, because it replaces
an abstract instruction with a concrete example.

> [!NOTE]
> Build one dark screen early too — 시작화면 (`33:2801`) is the simplest. Seven screens are
> dark and the dark surface palette does not exist yet
> ([ADR 0004](../decisions/0004-per-screen-theme-not-global-dark-mode.md)). Discovering what
> it needs on screen 2 is much cheaper than on screen 12.

## Phase 3 — flow slices

One slice per session, in the order below. Slice membership and node ids are in
[../reference/screens.md](../reference/screens.md).

| Order | Slice | Why here |
| --- | --- | --- |
| 1 | Auth & entry | Smallest; exercises the dark surfaces first |
| 2 | Discovery | Contains the golden screen; establishes list and card patterns |
| 3 | Capture | The core loop, and the largest slice. Needs discovery's place shape |
| 4 | Tickets & raffle | Consumes what capture produces |
| 5 | Community | Mostly independent; can move earlier if needed |
| 6 | Profile | Smallest surface, least shared state |

Screens inside a slice share state and navigation params. Building 응모 → 응모완료 together
means the route params match; building them a week apart means they do not.

## Per-screen loop

1. Prompt with the template in
   [../reference/figma-workflow.md](../reference/figma-workflow.md).
2. Read the deviation list the prompt asks for. Ambiguity in the design surfaces here.
3. Visual diff: render the frame, screenshot the build, compare as a list rather than by
   eye.
4. Update the status column in [../reference/screens.md](../reference/screens.md).
5. Commit — one screen per commit.

## Deferred

- **Code Connect.** Mapping design-system components to Figma nodes would let the MCP name
  a component instead of describing a rectangle. The largest available quality gain, but it
  needs stable components, so it belongs after the first few slices.
- **Firebase integration.** Screens bind to fixtures until the backend developer has a project
  and functions to point at. Because the switch lives in `src/lib/repositories/`, flipping
  `EXPO_PUBLIC_USE_MOCKS` is the whole migration — nothing under `app/` changes. The runbook is
  [../how-to/connect-the-app-to-firebase.md](../how-to/connect-the-app-to-firebase.md).

## Related

- [../reference/screens.md](../reference/screens.md) — node ids, themes, slices
- [../reference/figma-workflow.md](../reference/figma-workflow.md) — the prompt and its traps
- [../reference/design-system.md](../reference/design-system.md) — what to build with
- [../reference/backend-contract.md](../reference/backend-contract.md) — the data shapes Phase 1 mirrors
- [../how-to/connect-the-app-to-firebase.md](../how-to/connect-the-app-to-firebase.md) — the fixture switch, and how to leave it behind
