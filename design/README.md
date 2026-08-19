---
title: Design Source
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-08-19
audience: internal
---

# Design Source

> What the interactive prototype in this folder contains, which parts are decided, and which are still open. This is the design authority for PINDOM — it outranks Figma.

## Summary

`2026-08-19-prototype.html` is a self-contained, offline interactive prototype. Open it in a
browser; it needs no server and no network. Everything is bundled — fonts, tiles, images —
which is why it is large.

It outranks the Figma file wherever the two disagree. See
[ADR 0006](../docs/decisions/0006-adopt-the-prototype-as-the-design-source-of-truth.md) for
why, and what that broke.

> [!WARNING]
> This is an exploration document, not a single finished design. It contains **applied**
> choices and **unapplied options** side by side. Read the section map below before copying
> anything out of it, or you will build a variant nobody picked.

## What is in it

### Section 1 — the prototype

| Block | What it is | Status |
| --- | --- | --- |
| `1a` | The full flow. 21 screens, 5 bottom tabs, every flowchart branch clickable. Map on real OSM tiles with real coordinates — visited pins one colour, unvisited another | **Applied. This is the build target** |
| `1b` | GPS verification, three options: A 레이더 · B 근접 게이지 + 속도 검증 · C 방향 나침반 + 홀드 | **A applied** to `1a` |
| `1c` | Ticket card, three options: A 홀로그램 무지개 · B 다크 + 옐로우 포일 · C 레트로 반권 | **A applied** — but see [Open](#open) |
| `1d` | Raffle confirmation motion, three options, playable | Applied variant not marked |

People are silhouette placeholders throughout. Photographs are stand-ins.

### Section 2 — visual direction

Three home-screen directions, of which **`2b` — 인쇄물, 블랙 & 애시드 is chosen**
([ADR 0006](../docs/decisions/0006-adopt-the-prototype-as-the-design-source-of-truth.md)).

| Block | Direction | |
| --- | --- | --- |
| `2a` | 다크 홀로 — 티켓 부스 | not chosen |
| `2b` | 인쇄물 — 블랙 & 애시드 | **chosen** |
| `2c` | 컬러 필드 | not chosen |

The document states that the chosen direction applies to every screen, so `2b` is not a home
screen treatment — it is the app's surface. Sampled values are recorded in
[design-tokens.md](../docs/reference/design-tokens.md).

> [!NOTE]
> `1a` was built before `2b` was chosen, so its screens still carry the pre-decision look.
> Where `1a` and `2b` disagree on **colour, corner radius, type hierarchy or divider
> treatment**, `2b` wins. Where they disagree on **layout, copy, flow or interaction**, `1a`
> wins. Those are the two axes; they do not overlap.

## Open

Decide before the affected screen is built.

| # | Question | Why it matters |
| --- | --- | --- |
| 1 | Ticket card: keep `1c`-A 홀로그램 무지개, or switch to `1c`-C 레트로 반권? | A was applied before `2b` was chosen. A rainbow hologram and a black-and-acid print ledger are not obviously one product, and the prototype's own next-steps note proposes the swap |
| 2 | Which `1d` raffle motion? | None is marked applied |
| 3 | Are all four languages in scope for the 공모전? | Copy is written in `ko`, `en`, `ja`, `zh`; the app registers two locales |

## How to use it

- **Read layout, copy and flow from `1a`.** It is the only place the interaction states exist.
- **Read colour, type and corners from `2b`.**
- **Do not copy its markup.** It is a browser prototype using inline styles and template
  bindings; PINDOM builds with flexbox and the design system. The rule that applied to Figma
  output applies here unchanged — this is intent, never final code.
- Korean copy in it is final, per `CLAUDE.md`.

## Related

- [ADR 0006](../docs/decisions/0006-adopt-the-prototype-as-the-design-source-of-truth.md) — why this replaced Figma, and what it changed
- [screens.md](../docs/reference/screens.md) — the 21 screens mapped to routes
- [design-tokens.md](../docs/reference/design-tokens.md) — the sampled `2b` values
- [backend-contract.md](../docs/reference/backend-contract.md) — the domain the prototype implies
- [figma-workflow.md](../docs/reference/figma-workflow.md) — Figma is still where the older frame node ids live
