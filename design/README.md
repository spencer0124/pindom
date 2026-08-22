---
title: Design Source
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-08-22
audience: internal
---

# Design Source

> What the interactive prototype in this folder contains, which parts are decided, and which are still open. This is the design authority for PINDOM — it outranks Figma.

## Summary

`2026-08-20-prototype.html` is a self-contained, offline interactive prototype. Open it in a
browser; it needs no server and no network. Everything is bundled — fonts, tiles, images —
which is why it is large.

It outranks the Figma file wherever the two disagree. See
[ADR 0006](../docs/decisions/0006-adopt-the-prototype-as-the-design-source-of-truth.md) for
why, and what that broke.

The `2026-08-20` drop replaces `2026-08-19` and is additive against it: block `1a` gains an
assistant screen (`chat`) and a route screen (`course`), a floating assistant button on the
five tabbed screens, and one entry in the assistant's own menu that opens the existing
language screen. Section 2 is byte-identical, so no colour, type or corner decision moved.
The API surface those two screens imply is
[external-apis.md](../docs/reference/external-apis.md), which arrived with them.

> [!WARNING]
> This is an exploration document, not a single finished design. It contains **applied**
> choices and **unapplied options** side by side. Read the section map below before copying
> anything out of it, or you will build a variant nobody picked.

## What is in it

### Section 1 — the prototype

| Block | What it is | Status |
| --- | --- | --- |
| `1a` | The full flow — every screen listed in the prototype's own screen index, 5 bottom tabs, every flowchart branch clickable. Map on real OSM tiles with real coordinates — visited pins one colour, unvisited another | **Applied. This is the build target** |
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
| 1 | Ticket card: keep `1c`-A 홀로그램 무지개, or switch to `1c`-C 레트로 반권? | A was applied before `2b` was chosen. A rainbow hologram and a black-and-acid print ledger are not obviously one product, and the prototype's own next-steps note proposes the swap. **Narrowed 2026-08-22:** 티켓 발행 is built as `1c`-A's layout on `2b`'s surface — the hologram is colour, which is `2b`'s axis. What remains open is only whether C's stub layout should replace A's; see the [Capture checklist](../docs/plans/2026-08-22-capture-slice-checklist.md) |
| 2 | Which `1d` raffle motion? | None is marked applied |
| 3 | ~~Are all four languages in scope for the 공모전?~~ **Closed 2026-08-21.** | Shipped locales are `ko` (default) and `en`. The prototype still writes copy in all four and that stays as it is — it is simply wider than what ships, not a contradiction. See the [review resolutions](../docs/plans/2026-08-21-backend-contract-review-resolutions.md) |
| 4 | 편집: was narrowing the cutout scale to 88–112% and dropping 좌우반전 deliberate? | It reads as an anti-fake measure — a cutout you cannot shrink, enlarge or mirror is harder to composite dishonestly. If so it belongs with the other verification constraints rather than buried in a slider range. Blocks 편집 |
| 5 | Should 추천 코스 be reachable from anywhere but the assistant? | Today the assistant's 지도에서 코스 보기 card is the only entry, and 지도 has none. The drop also ships 추천 코스 지도에 담기 copy in all four locales with no control wired to it, which suggests a second path was intended. **As built 2026-08-22:** 홈's 지역 코스 cards open the same screen; 지도 still has no entry. See the [Assistant checklist](../docs/plans/2026-08-22-assistant-slice-checklist.md) |

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
