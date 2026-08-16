---
title: Screen Implementation Plan
type: plan
status: draft
owner: zoyoong124@gmail.com
last-updated: 2026-08-16
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

## Phase 1 — navigation shell and typed fixtures

The route skeletons exist; the data shapes do not.

Add `mocks/` with typed fixtures for the four entities the flowchart implies: `Place`,
`Ticket`, `Post`, `User`. Derive fields from what the designs actually show — 홈 displays a
ticket count and a distance, 컬렉션 displays issued tickets, 커뮤니티 2 displays posts with
author, location, like and comment counts.

The point is that every screen after this has a data shape to bind to, so a screen author
stops inventing one per screen. Three screens inventing three shapes of `Place` is the same
class of failure as three shapes of card.

Do this **before** the golden screen, so the golden screen binds to fixtures too.

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
- **Backend binding.** Screens bind to fixtures until Firebase exists. Swapping fixtures for
  real queries is a separate pass, made easy by having one data shape per entity rather than
  one per screen.

## Related

- [../reference/screens.md](../reference/screens.md) — node ids, themes, slices
- [../reference/figma-workflow.md](../reference/figma-workflow.md) — the prompt and its traps
- [../reference/design-system.md](../reference/design-system.md) — what to build with
