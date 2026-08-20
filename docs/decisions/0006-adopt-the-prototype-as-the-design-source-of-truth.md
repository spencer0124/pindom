---
title: Adopt the Interactive Prototype as the Design Source of Truth
type: adr
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-08-21
audience: internal
---

# 0006 — Adopt the Interactive Prototype as the Design Source of Truth

> A working clickable prototype replaces Figma as the authority for layout, copy, flow and colour. It changes the palette, the font, the screen list and the domain model, and it makes the whole app dark.

## Status

Accepted. The prototype is committed at
[`design/2026-08-20-prototype.html`](../../design/2026-08-20-prototype.html); see
[`design/README.md`](../../design/README.md) for how to read it and what it leaves open.

Nothing has been rebuilt against it yet. The design system still ships the purple ramp and
Wanted Sans, and no screen has been implemented.

## Context

[ADR 0001](0001-adopt-diataxis-docs-structure.md) and the build rules in `CLAUDE.md` treat the
Figma file as the design reference, with the standing caveat that it has no auto layout and no
components — so its output is "layout intent and copy, never final code."

The prototype supersedes it on every axis that matters. It is a running artifact rather than a
static frame: 21 screens wired to each other, a map on real OSM tiles with real coordinates,
four-language copy, and interaction states that a frame cannot express.

It is not, however, a single finished design. It contains two sections:

- **Section 1** — the applied prototype (`1a`), plus three-option variant studies beside it for
  the GPS interaction (`1b`), the ticket card (`1c`) and the raffle confirmation motion (`1d`).
  Option **A is already applied** to `1a` in each.
- **Section 2** — three home-screen visual directions (`2a` dark holo, `2b` print, `2c` colour
  field), none marked chosen, with the note 고르면 프로토타입 전 화면에 적용합니다 — the choice
  applies to every screen.

So the document asks one question it cannot answer itself.

## Decision

**The prototype outranks Figma.** Where they disagree, the prototype is right. Figma keeps one
job: frame node ids remain the addressable names for the older frames, and
[../reference/screens.md](../reference/screens.md) keeps them for traceability.

**Direction `2b` — 인쇄물, 블랙 & 애시드.** Chosen from the three. Its own description is
실물 티켓·스탬프 대장 느낌 — a physical ticket and stamp ledger — carried by square corners,
monospace numerals and rules instead of cards.

**No theme toggle.** The prototype's 마이페이지 has a global light/dark switch
(앱 전체 테마가 전환됩니다). It is not adopted; it belongs to the prototype as a preview
device. [ADR 0004](0004-per-screen-theme-not-global-dark-mode.md) stands.

**Every feature in the prototype enters the backend contract**, including the entities the
previous contract had no notion of.

## Consequences

### The palette is replaced outright, not adjusted

Not one colour survives. The current brand ramp and the current grey ladder both appear zero
times in the prototype. Values sampled from the `2b` block are recorded in
[../reference/design-tokens.md](../reference/design-tokens.md) with their source, per the
docs rule on sampled values.

Because accent flows from one seed ([ADR 0003](0003-single-seed-theming.md)), re-pointing that
seed does most of the work. The grey ladder and the dark surface set do not follow from the
seed and have to be built.

### The app is now uniformly dark

`2b` is a dark direction and the chosen direction applies to every screen. This does **not**
overturn [ADR 0004](0004-per-screen-theme-not-global-dark-mode.md) — theme is still a property
of the build, not a user preference, and there is still no toggle. What it overturns is that
ADR's *factual premise*: the bimodal light/dark split across the designed frames. There is no
split left to model. One surface set, applied everywhere.

This is cheaper than the split, not more expensive. The 인증 실패 and 공개설정 screens stop
being light islands inside a dark flow.

### The font changes

Pretendard Variable throughout, with no Wanted Sans anywhere in the prototype. Pretendard is a
single variable family, so the platform-split family mapping that Wanted Sans forced
(`Wanted Sans Medium` being its own family on iOS) goes away with it.

### Five screens gained, one lost

`artistSearch`, `tear`, `profile`, `language` and `vault` have no route today. `login` no
longer exists as its own screen — email sign-in is folded into 온보딩. Full mapping in
[../reference/screens.md](../reference/screens.md).

### The domain model roughly doubles

**Artist is structural, not additive.** Onboarding, home, and the community boards are all
keyed to 최애. Posts carry `board`, users carry a set of followed artists, and progress is
counted per artist. Retrofitting it later would mean reshaping posts, users and the feed query
at once.

Also new: Review and Gallery on place detail, Course (grouped itineraries), Tier
(`club10` / `club20` / `clubGo`), Vault (private tickets), and the ticket tear/stub mechanic.
All are in [../reference/backend-contract.md](../reference/backend-contract.md).

### Four languages, not two

The prototype's copy helper is `L(ko, en, ja, zh)`. `app.config.ts` registers two locales.

### Still open

The ticket card variant (`1c`) has option **A — 홀로그램 무지개** applied, which was chosen
before `2b`. A rainbow hologram and a black-and-acid print ledger are not obviously the same
product, and the prototype's own next-steps note suggests
「1c-C 레트로 반권을 티켓 기본으로 바꿔줘」. Left as applied until someone decides; flagged in
[`design/README.md`](../../design/README.md).

## Related

- [`design/README.md`](../../design/README.md) — what the prototype contains and how to open it
- [../reference/design-tokens.md](../reference/design-tokens.md) — the sampled `2b` values
- [../reference/screens.md](../reference/screens.md) — the 21 screens and their routes
- [../reference/backend-contract.md](../reference/backend-contract.md) — the expanded domain
- [ADR 0004](0004-per-screen-theme-not-global-dark-mode.md) — the theme rule this refines
