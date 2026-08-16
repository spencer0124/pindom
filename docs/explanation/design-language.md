---
title: Design Language
type: explanation
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-08-16
audience: internal
---

# Design Language

> Why some PINDOM screens are dark and most are light, what that split means, and the consequences for how theming has to be built.

## Context

PINDOM's screens are not uniformly light or dark. Rendering all 18 and measuring mean
luminance shows a clean bimodal split with nothing in the middle — no screen sits in a grey
zone by accident.

| Mode | Screens |
| --- | --- |
| **Dark** | 시작화면, GPS인증, GPS인증2, 카메라, 편집, 티켓 발행, 응모완료 |
| **Light** | 홈, 지도, 장소/상세, 인증 실패, 공개설정, 컬렉션, 응모, 커뮤니티, 커뮤니티 2, 글쓰기, 마이페이지 |

The obvious reading — "the capture flow is dark" — is wrong, and the exceptions are what
make the real rule visible.

## The rule: dark marks the ritual

Dark is not a section of the app. It marks the moments where the user is **doing the thing
the product is about**, rather than reading about it.

- **시작화면** — first contact. A purple field with a constellation of pins and the line
  「최애가 머문 그 자리 / 우리만의 프레임」. This is the promise, not a form.
- **GPS인증 / GPS인증2** — proving presence. A single glowing distance ring counting down
  「반경까지 84m」 → 「32m」. Everything else is stripped away because everything else is
  irrelevant while you walk.
- **카메라 / 편집** — the act itself. The photograph is the content; the chrome recedes.
- **티켓 발행 / 응모완료** — the reveal. A gradient ticket with a barcode, 「티켓이
  발행됐어요」. A reward presented, not a record displayed.

Light is everything transactional: browsing places, managing a collection, filling a form,
posting to a feed, reading an error.

Two screens prove the rule rather than break it:

- **인증 실패 is light**, even though it sits inside the capture flow. Failure *ejects* you
  from the ritual. It shows a plain warm icon, 「아직 반경 밖입니다」, and a small table of
  numbers: current distance, required radius, GPS error. That is diagnostic information,
  and diagnostics belong in the light mode.
- **공개설정 is light**, sitting between two dark screens (편집 → 공개설정 → 티켓 발행). It
  is a settings form with a toggle and a policy notice. A form is admin, not ceremony, even
  mid-flow.

So the axis is not *where you are in the flow*. It is **ceremony versus administration**.

## Consequence: theme is a property of the route

This is the part with teeth.

The design system models theme the way most systems do — as a **user preference**:
`getAdaptiveColors(preference)` takes `'light' | 'dark'` and `SDSProvider` takes a
`colorPreference`, intended to follow the OS setting.

PINDOM needs something categorically different. 카메라 is dark **because it is 카메라**. If
a user disables dark mode system-wide, the camera screen must not turn white — that would
destroy the exact effect the design is buying. Equally, 홈 must not go dark because the
phone did.

> [!WARNING]
> Do not implement a global light/dark toggle. Theme here is a fixed attribute of each
> screen, not a preference to be honoured.

The mechanism should be a per-route surface set: dark routes declare themselves dark and
get the dark surfaces regardless of system preference. The dark palette itself does not
exist yet — `getAdaptiveColors('dark')` currently returns generic inherited greys, not the
purple-tinted near-blacks the PINDOM dark screens actually use. Building it is real work,
recorded as [ADR 0004](../decisions/0004-per-screen-theme-not-global-dark-mode.md).

The brand colour is the constant across both modes: it is the primary CTA on light screens
and the primary CTA on dark ones. That is why `token.accent` carries both a `fillColor` and
a `softColor` — the latter exists precisely for brand-coloured text on a dark surface,
where the full-strength brand would not have enough contrast.

## The single-seed rule

Every accent-bearing component derives its colour from one value, `colorSeeds.primary`,
through `token.accent`. Nothing reads `SdsColors.brand500` directly.

This is not tidiness. In the system as inherited, only one component honoured the seed and
eleven others hardcoded the accent — so changing the brand colour re-themed a single button
and left everything else on the old palette, with nothing to flag it. One of those eleven
stored the colour as a raw `rgba()` string inside an animation worklet, where no search for
the token name would ever have found it.

A design system where the accent lives in twelve places is a design system that cannot be
re-themed. See [ADR 0003](../decisions/0003-single-seed-theming.md) and the reading rules in
[../reference/design-tokens.md](../reference/design-tokens.md).

## Palette provenance

The brand ramp is hue 252.2° — a saturated violet. Three stops were sampled directly from
the design and the rest interpolated along the original ramp's lightness ladder, so the
contrast steps the components were built around still hold. The specific stops, and their
measured contrast ratios, are in
[../reference/design-tokens.md](../reference/design-tokens.md).

One open discrepancy is recorded there rather than here: the grey ladder is still subtly
blue where the design is neutral. That document also explains why the font family is
platform-split, which is the kind of thing that looks like an accident and gets
"simplified" into a bug.

> [!NOTE]
> The wordmark is inconsistent in the design file: 시작화면 renders `PINDOM`, while 홈 and
> 편집 render `FINDOM`. **PINDOM is correct.** Do not copy the typo into code, even when a
> frame shows it.

## Related

- [../reference/design-tokens.md](../reference/design-tokens.md) — the values and how to read them
- [../reference/screens.md](../reference/screens.md) — the per-screen theme column
- [architecture.md](architecture.md) — what the product is, and why presence matters
- [../decisions/0004-per-screen-theme-not-global-dark-mode.md](../decisions/0004-per-screen-theme-not-global-dark-mode.md)
