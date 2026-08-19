---
title: Design Tokens
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-08-19
audience: internal
---

# Design Tokens

> The token contract: what exists, how to read it, and the two places where the tokens currently disagree with the design. Read before styling anything.

> [!WARNING]
> **The palette below is superseded.** [ADR 0006](../decisions/0006-adopt-the-prototype-as-the-design-source-of-truth.md)
> adopted direction `2b` from the prototype, and not one colour survives — neither the brand
> ramp nor the grey ladder appears anywhere in it. The replacement is recorded in
> [The `2b` surface](#the-2b-surface). Everything after that section describes what is
> currently *in the code*, which is now a description of what has to change.

## Summary

Tokens live in `src/design-system/tokens/` and are re-exported from `@/design-system`.
That directory is the SSOT; this document explains how to use it and records where the
values came from, but does not restate every constant.

```tsx
import { SdsColors, SdsSpacing, SdsRadius, useTheme } from '@/design-system';
```

**A raw hex or magic number in a screen file is a bug.**

## Reading colour: the one rule that matters

There are two ways to get a colour, and choosing wrong is what breaks re-theming.

| Need | Read from | Why |
| --- | --- | --- |
| The brand/accent colour | `useTheme().token.accent` | Derived from one seed, so the whole app re-themes together |
| A fixed semantic colour (grey, red, green) | `SdsColors.*` | Not brand-dependent; no seed to derive from |

```tsx
// Right — follows the seed
const { token } = useTheme();
<View style={{ backgroundColor: token.accent.fillColor }} />

// Wrong — pins the value, survives a re-theme, and silently goes off-brand
<View style={{ backgroundColor: SdsColors.brand500 }} />
```

The `accent` group is derived in `src/design-system/core/ThemeProvider.tsx`:

| Field | Meaning |
| --- | --- |
| `fillColor` | The brand colour — fills, active states, accent text |
| `fillPressedColor` | Pressed variant |
| `weakColor` | Near-white brand tint — chip and badge backgrounds |
| `softColor` | Light brand — legible **on dark surfaces** |
| `onFillColor` | Content sitting on top of `fillColor` |
| `dimColor` | Translucent brand — ripples and dims |

The seed itself is `colorSeeds.primary` in `src/design-system/foundation/colors.ts`.
Changing that one value re-themes every accent-bearing component. See
[ADR 0003](../decisions/0003-single-seed-theming.md).

## The 2b surface

Sampled from block `2b` of [`design/2026-08-19-prototype.html`](../../design/2026-08-19-prototype.html)
— 인쇄물, 블랙 & 애시드. Its own description: 실물 티켓·스탬프 대장 느낌. 각진 모서리와
모노스페이스 수치가 "수집 기록"을 강조합니다.

These are **evidence, not constants**. Nothing in the code emits them yet.

### Surfaces and ink

| Role | Value | Where it appears in `2b` |
| --- | --- | --- |
| Deepest ground | `#0B0B0B` | Text colour *on* the acid chip — the inverse pair |
| Screen ground | `#131313` | The device canvas |
| Chrome / ink on light | `#171719` | The block frame, and body text where the surrounding page is light |
| Accent — acid | `#58CF04` | `TICKETS OWNED`, `NEARBY LOCATIONS`, the nearest distance `84m` |
| Alert | `#FF5E00` | `CLOSING TODAY` |
| Primary text | `#FFFFFF` | Headlines and the big numerals |

There is no ramp. The accent appears at one value, used sparingly — section labels and the
single most important number on screen. That restraint is the direction; a five-stop acid ramp
would undo it.

### Text is an alpha ladder, not a grey ladder

Every secondary tone in `2b` is white at an opacity, over the ground. This is why the inherited
grey scale has nothing to contribute.

| Alpha | Used for |
| --- | --- |
| `1.0` | Headlines, primary numerals |
| `.7` | Secondary values — a distance that is not the nearest |
| `.5` | Supporting sentences |
| `.45` | Metadata — `11H LEFT / 6 TICKETS` |
| `.42` | Roman captions — `MV / GANGNEUNG` |
| `.4` | Sub-labels — `BY DISTANCE` |
| `.35` | Row numerals — `01`, `02`, `03` |

### Rules, not cards

| Token | Value | Use |
| --- | --- | --- |
| Section rule | `2px solid rgba(255,255,255,.14)` | Between blocks, and vertically between grid cells |
| Row rule | `1px solid rgba(255,255,255,.14)` | Between list rows |
| Radius | `4–5px` | Chips only. Everything else is square |

The direction has almost no rounding and almost no fills. Structure comes from rules and
spacing. A component that reaches for a card with a radius and a shadow is working against it.

### Typographic signature

| Tracking | Applied to |
| --- | --- |
| `.28em` | The wordmark — `PINDOM / 002` |
| `.2em` | Uppercase section labels — `TICKETS OWNED`, `NEARBY LOCATIONS` |
| `-.05em` | Large numerals — the ticket count |

Numerals are monospaced and roman captions are uppercase Latin beside the Korean. That pairing
is what makes it read as a ledger rather than a feed, and it is doing more work than the
colours are.

## The brand ramp

Hue 252.2°. Three stops were **sampled from the design**; the rest are interpolated along
the same lightness ladder the ramp originally used, so the contrast relationships the
components were built around still hold.

| Stop | Provenance |
| --- | --- |
| `brand50` | Sampled — location icon chip tint on 홈 (`33:2617`) |
| `brand200` | Interpolated |
| `brand400` | Sampled — ticket progress-bar gradient on 홈 |
| `brand500` | Sampled — primary CTA, active tab, distance text. **The brand colour** |
| `brand600` | Interpolated — pressed |
| `brand700` | Interpolated — deep |

Contrast, measured against WCAG:

| Pair | Ratio | Verdict |
| --- | --- | --- |
| White on `brand500` | 5.85:1 | AA for normal text |
| White on `brand600` | 7.18:1 | AAA for normal text |
| White on `brand400` | 3.66:1 | **Large text / decorative only** |
| `brand500` on `brand50` | 5.03:1 | AA for normal text |

> [!NOTE]
> `brand400` fails AA at normal text size. It is the gradient shade, not a text colour.

## The other scales

Named keys only — the values are in `src/design-system/tokens/`.

| Token | Keys |
| --- | --- |
| `SdsSpacing` | `xxs`, `xs`, `sm`, `md`, `base`, `lg`, `xl`, `xxl` |
| `SdsRadius` | `xs`, `sm`, `md`, `lg`, `xl`, `full` |
| `SdsShadows` | `card`, `elevated`, `bottomSheet`, `segmentedIndicator` |
| `SdsDuration` | `instant`, `fast`, `normal`, `slow`, `slower`, `toast`, plus `SdsCurves` |
| `SdsTypo` | `t1`–`t7` and `sub5`, `sub8`, `sub10`, `sub12`, `sub13` |

`Txt` takes a wider key set (`t1`–`t7`, `st1`–`st13`) which
`src/design-system/foundation/typography.ts` maps onto the `SdsTypo` entries above. Pass a
typography key to `Txt`; do not read `SdsTypo` directly in a screen.

Each `SdsShadows` entry carries both a `boxShadow` string and a `legacy` block of iOS
shadow props plus Android `elevation`, for use where `boxShadow` is not supported.

## The font family, and why it is platform-split

> [!WARNING]
> **Superseded.** The prototype sets everything in **Pretendard Variable** and contains no
> Wanted Sans at all. Pretendard is a single variable family, so the whole platform-split
> problem described below disappears with it — there is no separate Medium family to map
> around. The section is kept because the swap has not been made yet, and because the failure
> mode it describes is the one to watch for during the swap.

Type is currently set in **Wanted Sans**, bundled under `assets/fonts/` and embedded natively
by the `expo-font` config plugin in `app.config.ts`. See
[assets/fonts/NOTICE.md](../../assets/fonts/NOTICE.md) for licensing.

`FONT_FAMILY` is not one string, and the reason is worth knowing before anyone "simplifies"
it:

| Platform | Family string | Why |
| --- | --- | --- |
| Android | `WantedSans` | The plugin emits `ReactFontManager.addCustomFont(this, "WantedSans", …)` plus a `<font-family>` resource carrying weights 400/500/700, so this name exists by construction |
| iOS | `Wanted Sans` | There is no registration step; resolution goes through the name embedded in the file, which has a space |

> [!WARNING]
> A single shared string would be correct on exactly one platform and fall back to the
> system font on the other — silently, with no error. If type looks subtly wrong on one
> platform only, this is the first thing to check.

`Wanted Sans Medium` ships as its **own family** rather than a 500 weight inside
`Wanted Sans`. On iOS, asking for `Wanted Sans` at weight 500 therefore finds no Medium face
and renders Regular. `fontFamilyByWeight` in
`src/design-system/foundation/typography.ts` handles this by mapping the `medium` key to the
Medium family on iOS only. Android needs no such special case.

Only weights **400, 500 and 700** ship. Anything else (`thin`, `light`, `extraBold`,
`black`) is synthesised or snapped to the nearest face.

## What has to change

The gap is no longer a tint on one scale. It is the whole palette.

| # | Change | Status |
| --- | --- | --- |
| 1 | Re-point `colorSeeds.primary` at the acid accent | **Done.** `foundation/colors.ts` |
| 2 | Replace the grey ladder with the white-alpha ladder over a dark ground | **Done.** The dark branch of `getAdaptiveColors` maps `grey900…grey300` onto the sampled opacities |
| 3 | Build the dark surface set, and run the app on it | **Done.** `app/_layout.tsx` sets `colorPreference="dark"` |
| 4 | Flatten radius and remove card fills | **Not started.** Not a token change — see below |
| 5 | Swap Wanted Sans for Pretendard Variable | **Not started.** Needs font files |

### What landed, and what it measures

The accent forced one change beyond re-pointing the seed. `deriveAccentTheme` hardcoded white
as the label colour on a filled accent, which held only while the accent was a dark violet:

| Foreground on `#58CF04` | Ratio | |
| --- | --- | --- |
| `#FFFFFF` — the old hardcoded value | `2.03:1` | unreadable |
| `#0B0B0B` — the ground | `9.69:1` | AA everywhere |

So the derivation now measures the fill's luminance and picks, via `readableOn` in
`utils/color.ts`. That keeps the seed genuinely swappable, which is the whole promise of
[ADR 0003](../decisions/0003-single-seed-theming.md) — a future accent of any lightness gets a
readable label without editing the theme.

Measured against the canvas `#131313`:

| Token | Resolves to | Ratio | |
| --- | --- | --- | --- |
| `grey900` primary text | `#FFFFFF` | `18.58:1` | AA |
| `grey800` | white `.70` | `9.37:1` | AA |
| `grey700` | white `.50` | `5.31:1` | AA |
| `grey600` metadata | white `.45` | `4.51:1` | AA — just |
| `grey500` captions | white `.42` | `4.09:1` | AA large / UI |
| `grey400` sub-labels | white `.40` | `3.81:1` | AA large / UI |
| `grey300` row numerals | white `.35` | `3.24:1` | AA large / UI |
| accent | `#58CF04` | `9.15:1` | AA |
| warning | `#FF5E00` | `6.06:1` | AA |
| `grey200` rule | white `.14` | `1.49:1` | decorative, as intended |

Worth noticing: the sampled ladder stops passing AA for body text at exactly the step where
`2b` stops using it for sentences. The design's opacity choices and the contrast thresholds
agree, which is a good sign the values were picked by eye against a real ground.

### The remaining gap is in the components, not the tokens

`getAdaptiveColors('dark')` only reaches a component that reads it. Measured across
`src/design-system/components/`:

| | Count |
| --- | --- |
| Components reading `SdsColors.grey*` or the surface tokens **directly** | 20 |
| Direct call sites | ~62 |
| Of those, components that already call `useAdaptive()` too | 8 |

Those 20 will render light-mode greys on the dark ground until they are converted. It is not a
find-and-replace, which is why it is not done here:

- Some greys sit in **module-level constant maps and helper functions**, outside any render, so
  they cannot read a hook without restructuring the file.
- Some are **deliberately fixed** — `Button.tsx` has `dark: SdsColors.grey700` as a *variant*
  entry, where swapping to adaptive would be circular.
- `SdsColors.background` is ambiguous: sometimes a card fill (should adapt), sometimes the
  label on a filled accent (must not).

Do this with `/sds-preview` open, one component at a time. The same applies to change 4 —
`SdsRadius` exists but is referenced **zero times**; every component hardcodes its radius, so
flattening corners is also per-component and also wants eyes on it.

## Related

- [`design/README.md`](../../design/README.md) — the prototype these values are sampled from
- [ADR 0006](../decisions/0006-adopt-the-prototype-as-the-design-source-of-truth.md) — why the palette was replaced
- [design-system.md](design-system.md) — the components that consume these tokens
- [../explanation/design-language.md](../explanation/design-language.md) — why the palette is shaped this way
- [../decisions/0003-single-seed-theming.md](../decisions/0003-single-seed-theming.md)
