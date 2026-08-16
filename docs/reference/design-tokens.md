---
title: Design Tokens
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-08-16
audience: internal
---

# Design Tokens

> The token contract: what exists, how to read it, and the two places where the tokens currently disagree with the design. Read before styling anything.

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

Type is set in **Wanted Sans**, bundled under `assets/fonts/` and embedded natively by the
`expo-font` config plugin in `app.config.ts`. See
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

## Known gap: the grey ladder is blue-tinted, the design is neutral

The grey scale is inherited from the design system's origin and is subtly blue
(`grey900` is a navy-leaning near-black). The PINDOM design uses **neutral** greys —
`#171719` for primary text and `#2F2F30` for raised dark surfaces, both sampled from 홈
(`33:2617`).

Only the surface tokens were corrected. Realigning the full ladder is deferred until
enough real screens exist to check it against.

## Related

- [design-system.md](design-system.md) — the components that consume these tokens
- [../explanation/design-language.md](../explanation/design-language.md) — why the palette is shaped this way
- [../decisions/0003-single-seed-theming.md](../decisions/0003-single-seed-theming.md)
