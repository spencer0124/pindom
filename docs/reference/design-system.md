---
title: Design System Component Index
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-08-16
audience: internal
---

# Design System Component Index

> Every component the design system exports, the props that matter, and which one to reach for. Read this before building any screen, and before creating any primitive.

## Summary

The design system lives in `src/design-system/` and is **vendored, not depended on** — it
was copied from skkuverse's `@skkuverse/sds` and is now owned by this repo. See
[ADR 0002](../decisions/0002-vendor-sds-instead-of-dependency.md).

Import everything from the barrel:

```tsx
import { Button, ListRow, Txt, useTheme, SdsColors } from '@/design-system';
```

The authoritative export list is `src/design-system/components/index.ts`. This document
mirrors it; if the two disagree, the code wins and this file is stale.

> [!WARNING]
> **Never create a new primitive without checking this index first.** Duplicate components
> are how a design system dies: screen 3 gets `Card`, screen 12 gets `ItemCard`, and no
> screen after that knows which to use.

## The rules

1. **Reuse beats create.** If something here is 80% right, use it and pass a `style`
   override. If nothing is close, ask before adding a primitive.
2. **Accent colour comes from the theme, never a token directly.** Inside a component write
   `useTheme().token.accent.fillColor` — not `SdsColors.brand500`. See
   [design-tokens.md](design-tokens.md).
3. **No raw hex, no magic numbers.** Spacing, radius, colour and type all have tokens.

## Compound components

Several exports are `Object.assign` roots: the sub-components hang off the parent and are
**not discoverable from the export name**. This is the single most common reason someone
rebuilds something that already exists.

| Root | Sub-components |
| --- | --- |
| `AccordionList` | `.Tile` |
| `BottomSheet` | `.Header` |
| `Dropdown` | `.Item` |
| `ListFooter` | `.Title`, `.Right` |
| `ListHeader` | `.TitleParagraph`, `.RightText`, `.RightArrow`, `.DescriptionParagraph` |
| `ListRow` | `.Texts`, `.LeftText` |
| `Loader` | `.Delay`, `.Centered`, `.FullScreen` |
| `Navbar` | `.BackButton`, `.CloseButton`, `.Title`, `.TextButton` |
| `Radio` | `.Option` |
| `Result` | `.Button` |
| `SegmentedControl` | `.Item` |
| `Skeleton` | `.Animate` |
| `StepperRow` | `.NumberIcon`, `.Texts`, `.RightArrow`, `.RightButton` |
| `Tab` | `.Item` |
| `Toast` | `.Icon`, `.Button` |

Each also exports a long alias (`ListFooter.FooterTitle` alongside `ListFooter.Title`).
**Use the short form.**

## Components

### Text and layout

| Component | Key props | Use for |
| --- | --- | --- |
| `Txt` | `typography`, `fontWeight`, `color`, `numberOfLines`, `textAlign` | All text. Never use bare `<Text>` |
| `Border` | `type: 'full' \| 'padding24' \| 'height16'` | Section separators |
| `Shadow` | `shadow`, `children` | Elevation; also exports `useShadow` |
| `Gradient` | `colors`, `degree`, `positions`, `easing` | Linear and radial fills |
| `Skeleton` | `width`, `height`, `borderRadius` | Loading placeholders |

### Actions

| Component | Key props | Use for |
| --- | --- | --- |
| `Button` | `type`, `size`, `display`, `loading`, `disabled`, `onPress` | The primary action of a screen or block |
| `TextButton` | `typography`, `variant`, `fontWeight`, `color` | A text-only action inline in content |
| `IconButton` | `icon`, `iconSize`, `variant`, `color`, `bgColor`, `label` | An icon-only tap target |
| `BottomCTA` | `children` | A CTA pinned to the bottom of scrollable content |
| `FixedBottomCTA` | `children`, `enableKeyboardAvoiding`, `flushOnKeyboard` | A CTA fixed above the keyboard |

### Input

| Component | Key props | Use for |
| --- | --- | --- |
| `TextField` | `variant`, `label`, `labelOption`, `help`, `hasError`, `prefix`, `suffix` | Text entry with a floating label |
| `SearchField` | `value`, `onChangeText`, `hasClearButton` | Search entry |
| `Checkbox` | `checked`, `defaultChecked`, `onCheckedChange`, `size` | Independent on/off choices |
| `Radio` | `value`, `onChange`, `disabled` + `Radio.Option` | One choice from a set |
| `Switch` | `checked`, `onCheckedChange`, `defaultChecked` | An immediately-applied setting |
| `SegmentedControl` | `value`, `onValueChange` + `.Item` | Switching a view between 2–4 modes |
| `Tab` | `value`, `onChange`, `fluid`, `size` + `.Item` | Navigating between content sections |
| `Dropdown` | `trigger`, `open`, `onToggle` + `.Item` | A menu anchored to a trigger |
| `NumericSpinner` | `number`, `minNumber`, `maxNumber`, `onNumberChange` | Quantity stepping |
| `Rating` | `readOnly`, `size`, `onValueChange`, `gap` | Star ratings |

### Lists

| Component | Key props | Use for |
| --- | --- | --- |
| `ListRow` | `left`, `contents`, `right`, `withArrow`, alignment and padding props | The standard row. Most list content is this |
| `ListHeader` | `title`, `upper`, `lower`, `right` | The header above a list section |
| `ListFooter` | `title`, `right`, `borderType`, `onPress` | "See all" style footers |
| `BadgeNavRow` | `badge`, `title`, `subtitle`, `right`, `showChevron`, `tossface` | A row led by a badge and navigating onward |
| `AccordionList` | `sections`, `expandedIndex`, `onToggle`, `renderItem`, `maxVisible` | Collapsible grouped lists with a "show more" |
| `StepperRow` | `left`, `center`, `right`, `hideLine` | Numbered step sequences with a connector line |

### Feedback and status

| Component | Key props | Use for |
| --- | --- | --- |
| `Badge` | `size`, `color`, `backgroundColor`, `fontWeight` | An inline status pill |
| `ProgressBar` | `progress`, `size`, `color`, `withAnimation` | Determinate progress |
| `Loader` | `size`, `type`, `label`, `delay` + `.Delay/.Centered/.FullScreen` | Indeterminate loading |
| `Toast` | `open`, `text`, `position`, `icon`, `duration`, `button` | A transient message that does not block |
| `Dialog` | `open`, `title`, `description`, `buttonText`, `onClose` | A blocking decision |
| `BottomSheet` | `title`, `onClose` + `.Header` | A sheet of options or a secondary task |
| `Result` | `figure`, `title`, `description`, `button` | A full-screen outcome (success, empty) |
| `ErrorPage` | `statusCode`, `title`, `subtitle`, button handlers | A full-screen failure |
| `Navbar` | `left`, `title`, `right` + sub-components | The screen's top bar |

## When to use what

The pairs that actually get confused in this system.

| Situation | Use | Not |
| --- | --- | --- |
| The main action of a screen | `Button` | `TextButton` — it reads as a link, not a commitment |
| An action inside a sentence or list row | `TextButton` | `Button` — it overweights the row |
| An icon with no label | `IconButton` (pass `label` for a11y) | `Button` with an icon child |
| CTA at the bottom of scrolling content | `BottomCTA` | `FixedBottomCTA` — it will float over content that should scroll |
| CTA that must clear the keyboard | `FixedBottomCTA` | `BottomCTA` — the keyboard covers it |
| User must decide before continuing | `Dialog` | `Toast` — it disappears and the decision is lost |
| Telling the user something succeeded | `Toast` | `Dialog` — it demands a dismiss for no reason |
| Offering several actions on an item | `BottomSheet` | `Dialog` — dialogs are for one decision |
| A plain tappable row | `ListRow` | a hand-rolled `Pressable` + `View` |
| A row whose subject is a status | `BadgeNavRow` | `ListRow` with a `Badge` jammed into `left` |
| An ordered process with a connector | `StepperRow` | `ListRow` — you will rebuild the connector line |
| Switching what a list shows | `SegmentedControl` | `Tab` — tabs imply separate content sections |
| Navigating between sections | `Tab` | `SegmentedControl` |
| Whole screen failed | `ErrorPage` | `Result` |
| Whole screen succeeded, or is empty | `Result` | `ErrorPage` |

## Known gaps

These do **not** exist yet and will have to be built. Ask before inventing them, so they
land as design-system components rather than screen-local ones.

| Missing | Needed by |
| --- | --- |
| A dark-surface variant set | 시작화면, GPS인증, 카메라, 편집, 티켓 발행, 응모완료 — see [ADR 0004](../decisions/0004-per-screen-theme-not-global-dark-mode.md) |
| A ticket card | 홈, 컬렉션, 티켓 발행, 응모완료 |
| A map pin / place card | 지도, 장소/상세 |
| A feed post card | 커뮤니티 |

## Related

- [design-tokens.md](design-tokens.md) — the values these components consume
- [../explanation/design-language.md](../explanation/design-language.md) — why the system looks the way it does
- [screens.md](screens.md) — which screen needs which component
