---
title: Vendor the Design System Instead of Depending on It
type: adr
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-08-16
audience: internal
---

# 0002 — Vendor the Design System Instead of Depending on It

> Copying skkuverse's design system into this repo, rather than consuming it as a package.

## Status

Accepted.

## Context

The PINDOM Figma file contains no Variables, no components and no auto layout — its frames
are raw rectangles and loose text with absolute coordinates. There was therefore no design
system to generate code from, and building one from scratch across the whole designed screen
set was not realistic.

skkuverse-app has a mature React Native design system (`@skkuverse/sds`): a large component
set with a theme provider, derived tokens and adaptive colours, already proven in a shipped
app by the same author.

Investigation showed it was far more portable than expected. Although it imports from its
sibling `@skkuverse/shared` in many places, **every one of those imports resolves to a
single symbol** — the colour token object. The apparent coupling to a hundred-file domain
package was really coupling to one small file.

Three options existed: depend on the published package, consume it as a git submodule, or
copy it in.

## Decision

Copy the design system into `src/design-system/`, owned by this repo.

`@skkuverse/sds` is private to a Yarn workspace and not published, so depending on it would
have meant either publishing it or making pindom a monorepo participant — both large moves
to acquire a component set that PINDOM intends to diverge from anyway.

Divergence was certain from the start: the brand is a different colour, and PINDOM has
per-screen dark surfaces that skkuverse has no concept of.

At the same time, take only the thin reusable slice of `@skkuverse/shared` — the colour and
type tokens, the axios client and interceptor chain, and the MMKV persistence adapters —
and leave the rest, which is skkuverse domain logic (campus buses, notices, buildings) with
no meaning here.

## Consequences

- **pindom owns this code.** Bugs are fixed here; upstream fixes do not arrive.
- The two systems diverge freely, which is the point, but a fix made in one is invisible to
  the other. A genuinely shared improvement must be ported by hand, in both directions.
- Vendoring surfaced defects the package boundary had hidden: two declared dependencies
  that nothing imported, and one imported dependency that was never declared. Both were
  corrected on the way in.
- The design system's provenance must stay documented, or a future reader will assume it was
  written for PINDOM and be confused by conventions that came from elsewhere — the inherited
  blue-tinted grey ladder being the clearest example.
- No version pinning or upgrade story for the design system. It is source code now.

## Related

- [0003-single-seed-theming.md](0003-single-seed-theming.md) — the first large change made to the copy
- [../reference/design-system.md](../reference/design-system.md)
