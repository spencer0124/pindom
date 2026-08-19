---
title: Design Language
type: explanation
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-08-19
audience: internal
---

# Design Language

> Why PINDOM looks the way it does: the ceremony-versus-administration axis the screens are organised around, how the prototype expresses it now that every screen is dark, and why theme still is not a user preference.

## Context

> [!WARNING]
> **The light/dark split this document was written to explain no longer exists.**
> [ADR 0006](../decisions/0006-adopt-the-prototype-as-the-design-source-of-truth.md) adopted
> direction `2b`, a single dark surface applied to every screen. The observation below is kept
> because the *reason* behind it survives the change and still governs how screens are built —
> but do not build a light screen from it.

The earlier designed frames were not uniformly light or dark. Rendering them and measuring
mean luminance showed a clean bimodal split with nothing in the middle — no screen sat in a
grey zone by accident.

| Mode | Screens |
| --- | --- |
| **Dark** | 시작화면, GPS인증, GPS인증2, 카메라, 편집, 티켓 발행, 응모완료 |
| **Light** | 홈, 지도, 장소/상세, 인증 실패, 공개설정, 컬렉션, 응모, 커뮤니티, 커뮤니티 2, 글쓰기, 마이페이지 |

The obvious reading — "the capture flow is dark" — was wrong, and the exceptions are what made
the real rule visible.

## The rule: dark marked the ritual

Dark was never a section of the app. It marked the moments where the user is **doing the thing
the product is about**, rather than reading about it.

- **시작화면** — first contact. A field of pins and the line 「최애가 머문 그 자리 /
  우리만의 프레임」. This is the promise, not a form.
- **GPS인증** — proving presence. A single distance readout counting down 「반경까지 84m」 →
  「32m」. Everything else is stripped away because everything else is irrelevant while you
  walk.
- **카메라 / 편집** — the act itself. The photograph is the content; the chrome recedes.
- **티켓 발행 / 응모완료** — the reveal. A reward presented, not a record displayed.

Light was everything transactional: browsing places, managing a collection, filling a form,
posting to a feed, reading an error.

Two screens proved the rule rather than breaking it:

- **인증 실패 was light**, even though it sits inside the capture flow. Failure *ejects* you
  from the ritual. It shows a plain warm icon, 「아직 반경 밖입니다」, and a small table of
  numbers: current distance, required radius, GPS error. Diagnostics belong in the light mode.
- **공개설정 was light**, sitting between two dark screens (편집 → 공개설정 → 티켓 발행). It
  is a settings form with a toggle and a policy notice. A form is admin, not ceremony, even
  mid-flow.

So the axis was never *where you are in the flow*. It is **ceremony versus administration**.

## The axis survives; the surface no longer carries it

`2b` takes surface off the table — one dark ground everywhere. The distinction still has to be
legible, so it moves onto the tools the direction does give you. Its own summary names them:
각진 모서리와 모노스페이스 수치 — square corners and monospace numerals, in service of
"수집 기록", a collection ledger.

| | Ceremony | Administration |
| --- | --- | --- |
| Density | One thing on screen. Generous space around it | Rows, rules, tight leading |
| Type | Large numerals, tight tracking (`-.05em`) | Uppercase Latin labels at `.2em`, monospace values |
| Accent | The acid green carries the single most important number | Absent. Text runs down the white-alpha ladder |
| Structure | Nothing to divide | Rules at `1px` and `2px`, and a visible grid |

Read that as: **ceremony spends the screen on one thing; administration spends it on many.**
GPS인증 shows a distance and nothing else. 컬렉션 shows a numbered list with rules between the
rows. Both are the same near-black.

This is a cheaper rule to hold than the split was. There is no second surface set to keep in
sync, and 인증 실패 stops being a light island inside a dark flow — it stays dark and becomes
administrative by being a table of numbers, which is what it always was.

## Consequence: theme is not a user preference

This is the part with teeth, and `2b` makes it sharper rather than softer.

The design system models theme the way most systems do — as a **user preference**:
`getAdaptiveColors(preference)` takes `'light' | 'dark'` and `SDSProvider` takes a
`colorPreference`, intended to follow the OS setting.

PINDOM needs something categorically different. The near-black is not "dark mode"; it is the
product's surface, the way a cinema is dark. A user who disables dark mode system-wide must
not get a white 카메라 — that would destroy the exact effect the design is buying — and there
is no light 홈 to fall back to, because one was never designed.

> [!WARNING]
> Do not implement a light/dark toggle. The prototype's 마이페이지 has one
> (앱 전체 테마가 전환됩니다); it is a preview device for comparing directions in a browser
> and is **not adopted**. See
> [ADR 0006](../decisions/0006-adopt-the-prototype-as-the-design-source-of-truth.md).

The mechanism is now simpler than when the screens were split. There is one surface set, it is
dark, and the OS preference is ignored rather than mapped. What has not changed is that
`getAdaptiveColors('dark')` still returns generic inherited greys rather than PINDOM's ground —
so the set still has to be built, and now **every** screen waits on it rather than seven. That
work is recorded in [ADR 0004](../decisions/0004-per-screen-theme-not-global-dark-mode.md) and
scoped in [../reference/design-tokens.md](../reference/design-tokens.md).

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

The palette in the code is hue 252.2° — a saturated violet, sampled from the Figma frames. It
is **superseded**. Direction `2b` is black and acid green, and shares no colour with it at all,
not even in the grey ladder. The sampled `2b` values, and the list of what has to change, are
in [../reference/design-tokens.md](../reference/design-tokens.md).

That document also explains why the font family is currently platform-split, which is the kind
of thing that looks like an accident and gets "simplified" into a bug — and why Pretendard
Variable makes the whole problem go away.

> [!NOTE]
> The wordmark was inconsistent in the Figma file: 시작화면 renders `PINDOM`, while 홈 and
> 편집 render `FINDOM`. **PINDOM is correct.** The prototype gets this right throughout, but
> do not copy the typo out of an old frame.

## Related

- [`design/README.md`](../../design/README.md) — the prototype this language now comes from
- [ADR 0006](../decisions/0006-adopt-the-prototype-as-the-design-source-of-truth.md) — the direction decision
- [../reference/design-tokens.md](../reference/design-tokens.md) — the sampled values and what has to change
- [../reference/screens.md](../reference/screens.md) — the screen inventory
- [architecture.md](architecture.md) — what the product is, and why presence matters
- [../decisions/0004-per-screen-theme-not-global-dark-mode.md](../decisions/0004-per-screen-theme-not-global-dark-mode.md)
