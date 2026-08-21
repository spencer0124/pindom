---
title: 2026-08-22 Phase 2–3 Checklist
type: plan
status: draft
owner: zoyoong124@gmail.com
last-updated: 2026-08-22
audience: internal
---

# 2026-08-22 — Phase 2–3 Checklist

> The working checklist for the two phases that stand between this repo and its first screen: getting the app onto a simulator, and finishing the `2b` re-skin far enough to build 홈 on. Tracks [screen-implementation.md](screen-implementation.md) phases 2 and 3.

## Why this exists

The question this answers is *"do we start going through the pages one by one?"* — no.
[screen-implementation.md](screen-implementation.md) rejects file-order screen building, and two
phases before it were unfinished. This is the punch list for those two.

## Phase 2 — run the app (done 2026-08-22)

**The app has now been seen on a device.** iPhone 17 Pro simulator, iOS 26.2, debug build,
`EXPO_PUBLIC_USE_MOCKS=true`.

- [x] `npx expo prebuild --clean` completes
- [x] `pod install` succeeds
- [x] The native build succeeds — `0 error(s)`
- [x] The app renders past the splash screen without a redbox
- [x] `/sds-preview` opens

### What running it cost, and what it bought

Two things blocked the first run. Both were invisible on paper and obvious in ten seconds on a
device, which is the entire argument for doing this phase before building screens.

**1. Firebase + `useFrameworks: 'static'` — `pod install` refused outright.**

`expo-build-properties` sets static linkage because the Naver Map iOS SDK ships as a static
framework. react-native-firebase resolves Firebase through Swift Package Manager by default, and
firebase-ios-sdk's SPM products are *automatic* libraries — so under static linkage every
Firebase pod embeds its own copy and they collide as duplicate symbols:

```text
[react-native-firebase] SPM + static linkage is not supported (target(s): Pods-PINDOM).
```

Fixed with `disableSPM` on the `@react-native-firebase/app` config plugin in `app.config.ts`,
which routes Firebase through CocoaPods and leaves the static linkage Naver Map needs intact.
The other documented escape — `use_frameworks! :linkage => :dynamic` — was **not** taken,
because it trades away the constraint the linkage setting exists to satisfy.

> [!IMPORTANT]
> The fix belongs in `app.config.ts`, never in `ios/Podfile`. The Podfile is generated, so a
> hand-edit there survives exactly until the next `prebuild --clean` and then this same error
> comes back with no record of why.

**2. `expo run:ios` fails at the launch step even though the build is fine.**

It opens the app through a custom-scheme deep link, and iOS puts a
`'PINDOM'에서 열겠습니까?` confirmation in front of it. Nothing answers the dialog, so
`xcrun simctl openurl` times out with `code 60` and the CLI exits `1` — after a completely
successful build.

`expo-dev-client` is not a dependency, so the deep link buys nothing here: this is a plain
React Native debug build that attaches to Metro on launch. Start the two halves separately:

```bash
npx expo start                                   # terminal 1
xcrun simctl launch booted com.zoyoong.pindom    # terminal 2
```

### The three questions this phase existed to answer

- [x] **Is the type actually Wanted Sans?** **Yes.** iOS resolves fonts by the name embedded in
      the file, and the names here are not the filenames (`assets/fonts/NOTICE.md`), so this was
      the likeliest silent failure. It did not happen: `Info.plist` carries all three faces in
      `UIAppFonts`, no `Unrecognized font family` warning appears, and an unresolved family is a
      redbox in a debug build, not a quiet fallback. The font pipeline works — which is what
      needed knowing before swapping the family to Pretendard
- [x] **Does anything still render blue or violet?** **Yes, but only in the preview harness.**
      `brand500` (`#6541F2`, the pre-`2b` violet) still exists as a token, and `app/sds-preview.tsx`
      is the only file that still paints with it. No design-system *component* references the
      brand ramp — they take the accent from the seed, which is already acid. **Since resolved**:
      the preview's references moved to `token.accent` when it was converted, so nothing in the app
      paints with the old ramp. Re-check with
      `grep -rn "brand[0-9]" src/design-system/components app src/components`
- [x] **Does anything render light grey on the dark ground?** **The question was the wrong way
      round — the ground itself is still light.** Every screen renders on a near-white canvas
      despite `SDSProvider colorPreference="dark"` in `app/_layout.tsx`. See Phase 3, which this
      finding rewrites

## Phase 3 — finish the `2b` re-skin

**The plan overestimated this.** The adaptive dark mapping is already written and already
correct: `getAdaptiveColors('dark')` in `src/design-system/foundation/colors.ts` spreads
`SdsColors` and then overrides the grey ladder with the `2b` alpha ladder
(`ink`, `inkOpacity700…350`) and the surfaces with `ground` / `groundRaised` / `groundChrome` —
exactly the values [../reference/design-tokens.md](../reference/design-tokens.md) sampled from
block `2b`.

**And the keys do not change.** `grey600` is still `grey600`; only its value differs by
preference. So this is not a token redesign. It is one substitution, repeated:

```tsx
// Before — pins the light value, ignores colorPreference
import { SdsColors } from '@/design-system';
color={SdsColors.grey600}

// After — same key, resolved against the active preference
const colors = useAdaptive();
color={colors.grey600}
```

### What actually has to change

Regenerate the list rather than trusting this one:

```bash
grep -rl "SdsColors" src/design-system/components   # candidates
grep -rl "useAdaptive" src/design-system/components # already wired
```

Three groups fall out of those two lists:

| Group | What it needs |
| --- | --- |
| Already correct | `Tab` and `Toast` read `SdsColors` only for fixed semantic colours. Nothing to do |
| Partly wired | Nine components already call `useAdaptive()` and have leftover direct reads — `AccordionList`, `BottomSheet`, `Dropdown`, `ListHeader`, `ListRow`, `NumericSpinner`, `Radio`, `SegmentedControl` |
| Not wired | The rest have no adaptive call at all and need the hook added — `BadgeNavRow`, `Button`, `BottomCTA`, `Checkbox`, `Dialog`, `Loader`, `ProgressBar`, `Rating`, `SearchField`, `Skeleton`, `Switch`, `TextField` |

> [!IMPORTANT]
> **Only the grey ladder and the surface keys move.** Fixed semantics — `red500`, `acid500`,
> `alert500` — are not brand-dependent and stay on `SdsColors`. That is the rule in
> [../reference/design-tokens.md](../reference/design-tokens.md), and following it keeps this a
> substitution rather than a judgement call per call site.

### The screens are the other half, and they are why the ground is light

The design system was never the only thing painting light. Two screen-level files hardcode the
canvas, and they are what the simulator is actually showing:

- [x] `src/components/ScreenPlaceholder.tsx` — was `backgroundColor: SdsColors.greyBackground`
      plus `grey900` / `grey600` / `grey500` text. Converted, and with it every skeleton screen
      in the app
- [x] `app/(tabs)/_layout.tsx` — **not on the original list.** Converting the screens exposed it:
      the bar read `SdsColors.background` and stayed white under five dark screens. Converted
- [x] `app/_layout.tsx` — `StatusBar style="dark"` confirmed dark-on-dark on device and changed
      to `"light"`
- [x] `app/sds-preview.tsx` — container ground, the `brand500` / `brand50` references above, and
      one literal `'#fff'`. Converted; the brand ramp went to `token.accent` rather than to a grey,
      because reading `SdsColors.brand*` is a `CLAUDE.md` violation in its own right. **No file in
      the app references the pre-`2b` ramp any more** — only its definitions survive, in
      `src/design-system/tokens/colors.ts`, now unused. Deleting them is a separate call:
      they are the record of what
      [ADR 0006](../decisions/0006-adopt-the-prototype-as-the-design-source-of-truth.md) replaced

Fixing the components without these leaves dark components on a white page. Doing the screen
files first is what makes `/sds-preview` a usable verification surface at all.

> [!NOTE]
> The tab bar is the general lesson here: converting one layer makes the next unconverted layer
> obvious, and briefly *worse-looking* than before. Expect that, and finish the layer you
> started rather than leaving a half-dark app.

### Settled — the surfaces were one step too deep

Sampled from the running app, the canvas rendered `#0B0B0B` and the tab bar `#131313`.
[../reference/design-tokens.md](../reference/design-tokens.md) sampled block `2b` the other way:
the device canvas is `#131313`, chrome is `#171719`, and `#0B0B0B` is not a surface at all — it is
the ink used *on* an acid chip, which `onAccent()` in `ThemeProvider` is the one place that reads.

`getAdaptiveColors` had inverted the light ladder faithfully — page ground below, raised surfaces
above — but anchored the pair a step lower than `2b` puts it. The relationship was right; the
depth was not.

- [x] Surfaces shifted up one step: `greyBackground` → `groundRaised`, and `background` /
      `layeredBackground` / `floatedBackground` → `groundChrome`. Verified on device: canvas
      `#131313`, tab bar `#171719`

The deciding evidence was not the surface table but the contrast table further down that document,
which states its ratios were **measured against the canvas `#131313`**. Running on `#0B0B0B` meant
the recorded accessibility figures did not describe what was on screen, which is a worse failure
than a shade being off.

### Order: by what 홈 and Discovery actually need

The deadline does not fund converting every component before the first screen. Take them in the
order the build reaches them.

**Tier 1 — blocks 홈 and the Discovery slice.** From the `2b` evidence in
[../reference/design-tokens.md](../reference/design-tokens.md), 홈 is a numeral-and-rule screen:
`TICKETS OWNED`, a tier gauge, a `CLOSING TODAY` badge, and a `NEARBY LOCATIONS` list of numbered
rows with distances.

**Tier 1 is done.**

- [x] `ListRow` — the 촬영지 rows, and by a wide margin the largest single job here
- [x] `SearchField` · `Rating` · `BottomSheet` · `Loader` · `ProgressBar` · `Skeleton` · `ListHeader`
- [x] `Button` — see the layer below; its own file needed nothing
- [x] `Tab` — nothing to do

### There is a third layer: the derived theme

The model above — components read `SdsColors`, so convert the components — missed a layer, and
`Button` is how it showed up. `/sds-preview` rendered its `weak` variant as a `#F2F4F6` slab on the
dark ground, but `Button.tsx` never reads that value. It comes from `token.button` in
`ThemeProvider`, where `deriveButtonTheme` pinned `SdsColors.grey100` and `SdsColors.background`.

A grep for `SdsColors` in `components/` cannot find that, so **the component counts above understate
the work**. `deriveButtonTheme` now takes the resolved palette; `ThemeProvider` sits inside
`AdaptiveColorProvider`, so the hook is available to pass it.

> [!NOTE]
> Not every fixed colour in a component is a defect. `Button`'s `typeToColor` and `Loader`'s
> `typeColor` name variants — `type="dark"` means *a dark button*, not *the dark theme* — so those
> greys are correct pinned and were left alone. The rule is whether the value describes the
> surface or the request.

### Two gaps this opened, both deferred

- [ ] **The `greyOpacity*` family is not in the adaptive map.** `getAdaptiveColors` overrides the
      grey ladder and the surfaces but not the translucent greys, so `Button`'s `dimWeakColor` stays
      a 2% near-black — near-invisible as press feedback on a dark button — and `Rating`'s
      `inactiveColor` stays a light-mode tint. Adding keys to the map is a token decision, not a
      substitution
- [ ] **`Button`'s `light` variant is a raw hex**, `'#FFFFFFDE'`, with `whiteOpacity900` written in
      the comment beside it. `Loader` repeats it. The token exists; the literal should go

### How ListRow was converted, because the shape matters

Its ladder lived in a module-scope preset table with resolved colours in it, which no hook can
reach. The table now stores a **key** into the palette (`colorKey: 'grey600'`) typed to the two
rungs ListRow actually uses, and the slot renderer resolves it against `useAdaptive()` at render.

Any other component whose colours live in a module-scope table wants this shape rather than a
hoisted hook: keep the table declarative, resolve at the edge.

**Tier 2 — deferred to the slice that first needs it.** `Dialog`, `BottomCTA`, `TextField`,
`Checkbox`, `SegmentedControl`, `Radio`, `AccordionList`, `BadgeNavRow`, `NumericSpinner`,
`Dropdown`.

> [!NOTE]
> `Switch` is on the raw list but has no known consumer. The prototype's only switch is the
> 마이페이지 theme toggle, which [ADR 0006](../decisions/0006-adopt-the-prototype-as-the-design-source-of-truth.md)
> declined to adopt. Re-skin it last, or not at all until something needs it.

### Still open once the ground is dark

- [ ] **`userInterfaceStyle: 'light'` in `app.config.ts`.** This is the appearance the OS hands to
      system-drawn UI — keyboards, scroll indicators, native alerts. Under `2b` there is no light
      screen for it to be right about. Check a focused `TextField`: a light keyboard under a dark
      app is the tell. Not yet verified — it needs a text input on screen

### Exit criterion

Not "every component converted" — **`/sds-preview` shows a dark canvas, no light-on-dark
component among the Tier 1 set, and no violet.** That is enough ground to build 홈 on.

## Phase 4 — the golden screen

Out of scope for this checklist, listed so the finish line is visible: build 홈
(`app/(tabs)/index.tsx`) against `placeRepository`, `userRepository` and `raffleRepository`, review
it line by line, and then point every later screen prompt at it.

## Appendix — running it again

```bash
npx expo start                                   # terminal 1
xcrun simctl launch booted com.zoyoong.pindom    # terminal 2
```

`yarn ios` still works for a clean native rebuild; expect it to exit `1` at the launch step for
the deep-link reason above, after the build itself has succeeded.

Two environment facts worth keeping in view while reading screens:

- `EXPO_PUBLIC_NAVER_MAP_CLIENT_ID` is blank, so 지도 renders empty — silently, and not a bug
- `@react-native-firebase/auth` warns that `REVERSED_CLIENT_ID` is missing from
  `GoogleService-Info.plist`. That key is for Google Sign-In; 온보딩 uses email, so this is
  expected until Google Sign-In is actually wanted

## Related

- [screen-implementation.md](screen-implementation.md) — the phases this tracks
- [../reference/design-tokens.md](../reference/design-tokens.md) — the `2b` surface being converted to
- [../reference/design-system.md](../reference/design-system.md) — the component index
- [../reference/screens.md](../reference/screens.md) — the flow slices Phase 5 builds
