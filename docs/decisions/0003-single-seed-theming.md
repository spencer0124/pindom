---
title: Drive Every Accent Colour From One Theme Seed
type: adr
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-08-16
audience: internal
---

# 0003 — Drive Every Accent Colour From One Theme Seed

> Extending the derived-token system and threading every accent component through it, rather than recolouring the palette in place.

## Status

Accepted.

## Context

The vendored design system arrived themed in its origin brand. PINDOM's brand is a
saturated violet, sampled from the design's primary CTA, so the whole system needed
re-colouring.

The system already had the right idea: `ThemeProvider` derives tokens from a seed colour,
so in principle changing the seed re-themes the app.

In practice the wiring was almost absent. Only **one** component read the derived theme.
Eleven others reached straight past it to the hardcoded accent token. Setting the seed
would therefore have re-themed a single button and left everything else on the old palette
— with nothing to indicate the difference.

One of the eleven was worse than the rest: it stored the accent as a literal `rgba()`
string inside a reanimated worklet, annotated only with a comment naming the token. No
search for the token name would have found it, and no mechanical replacement would have
touched it.

Two options were on the table:

1. **Recolour in place** — change the accent ramp's values to violet, leave the token names
   and all twelve call sites alone. Zero component edits, instantly on-brand.
2. **Rename and thread** — rename the ramp to a brand-neutral name, and route all twelve
   components through the derived theme.

## Decision

Rename and thread.

The ramp was renamed to `brand*`, the seed set to the sampled brand colour, the derived
token set extended with an `accent` group (fill, pressed, weak, soft, on-fill, dim), and all
eleven stragglers rewritten to read `useTheme().token.accent`.

The worklet case was fixed by hand: the accent is parsed into numeric RGB channels on the JS
side and captured into the worklet with an explicit dependency array, because a worklet
cannot read React context.

Renaming was decisive, and not merely cosmetic. Under option 1 the token would have kept a
name describing a colour it no longer was — a permanent trap for every future reader. Under
option 2 the old name **stops compiling**, which converts every missed call site from a
silent visual bug into a type error. That happened during the migration: a mechanical
replacement silently skipped several call sites, and the type checker was the only thing
that caught it.

## Consequences

- Changing `colorSeeds.primary` now genuinely re-themes the app.
- **A new rule applies to all component code:** read accent colour from
  `useTheme().token.accent`, never from the colour token directly. A component that reaches
  past the theme reintroduces exactly the problem this ADR removed.
- The derived-token set is now a maintained surface. A component needing a brand-derived
  colour that does not exist should extend the `accent` group rather than hardcode.
- The design system diverges further from its origin, making a future port harder — accepted
  under [ADR 0002](0002-vendor-sds-instead-of-dependency.md).
- Colour maths at module scope had to move to render time in a few components, because
  `StyleSheet.create` runs before any theme exists.

## Related

- [../reference/design-tokens.md](../reference/design-tokens.md) — the reading rules
- [../explanation/design-language.md](../explanation/design-language.md)
