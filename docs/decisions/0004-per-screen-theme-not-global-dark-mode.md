---
title: Theme Is a Property of the Screen, Not a User Preference
type: adr
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-08-16
audience: internal
---

# 0004 — Theme Is a Property of the Screen, Not a User Preference

> PINDOM has fixed dark screens and fixed light screens. That is not the same thing as dark mode, and building it as dark mode would break the design.

## Status

Accepted. The dark surface palette is **not yet built** — this ADR records the decision and
the gap.

## Context

Rendering all 18 designed screens and measuring their mean luminance produces a clean
bimodal split, with no screen in between. Seven are dark; eleven are light.

The split is not positional — it does not follow a section of the app. It follows what the
user is *doing*: dark marks the ceremonial and immersive moments (first launch, proving
presence, shooting, editing, and the two reward reveals), light marks everything
transactional (browsing, forms, lists, feeds, and error recovery). The reasoning is set out
in [../explanation/design-language.md](../explanation/design-language.md).

The vendored design system models theme as a **user preference**: an adaptive colour
function takes `'light' | 'dark'`, and the root provider takes a `colorPreference` intended
to follow the OS setting.

Applying that model here produces wrong results in both directions. If a user turns on
system dark mode, the home, map and collection screens would go dark — screens the design
specifies as light. If a user turns system dark mode *off*, the camera screen would go
white, destroying the effect the design exists to create.

There is also a gap in the palette itself: the adaptive function's dark branch returns
generic greys inherited from the design system's origin, not the purple-tinted near-blacks
the PINDOM dark screens actually use.

## Decision

Treat theme as a **fixed attribute of each route**, and do not implement a global
light/dark toggle.

Dark routes declare themselves dark and receive dark surfaces regardless of the system
preference. The per-screen assignment is recorded in the theme column of
[../reference/screens.md](../reference/screens.md), which is the SSOT for which screen is
which.

Build the dark surface palette from values sampled from the dark frames, rather than
reusing the inherited dark branch.

The brand accent stays constant across both modes. This is why the derived `accent` group
carries both a full-strength fill and a lighter `soft` variant — the latter exists for
brand-coloured content on a dark surface, where the full-strength brand lacks contrast.

## Consequences

- **No dark mode setting**, and no honouring of `useColorScheme()` for app chrome. If a
  system-preference feature is ever wanted, it is a separate decision, on top of this one.
- The dark surface set must be built before any of the seven dark screens can be
  implemented faithfully. Until then those screens cannot be considered done.
- The adaptive dark branch in the design system is currently misleading — it will return
  values that no PINDOM screen uses. Either populate it with the sampled dark palette or
  remove it, but do not leave it as a plausible-looking trap.
- Screen implementation order should put at least one dark screen early, so the dark surface
  set is exercised before six more screens depend on it.
- Classifying a new frame's theme needs care where a photograph dominates it: the mean
  luminance reads light while the chrome is dark. Classify by chrome.

## Related

- [../explanation/design-language.md](../explanation/design-language.md) — the full reasoning
- [../reference/screens.md](../reference/screens.md) — the per-screen theme column
- [0003-single-seed-theming.md](0003-single-seed-theming.md)
