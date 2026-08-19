/**
 * SDS Color Foundation — bridges SdsColors to the theme system.
 *
 * Provides:
 * - Adaptive color maps for light/dark mode
 * - Semantic color seeds for the theme provider
 */
import { SdsColors } from '@/design-system/tokens';

export type ColorPreference = 'light' | 'dark';

/**
 * Full adaptive color map — resolves to actual hex values based on preference.
 *
 * **PINDOM runs `dark` everywhere.** Direction `2b` is a single dark surface
 * applied to every screen (ADR 0006), and `app/_layout.tsx` sets the preference
 * once. This is not a user setting and there is no toggle — see ADR 0004.
 *
 * The `light` branch is kept because the design system is vendored and its
 * components are written against a light default; deleting it would mean
 * rewriting all of them at once.
 *
 * Note what the dark branch does to the greys. `2b` has **no grey scale** — its
 * secondary tone is white at an opacity over the ground. So `grey900`, which is
 * primary text in light mode, becomes solid white here, and the ladder descends
 * through the sampled opacities rather than through darker greys. A component
 * asking for `grey600` gets "the metadata tone" either way, which is what makes
 * the swap work without touching the component.
 */
export function getAdaptiveColors(preference: ColorPreference) {
  if (preference === 'dark') {
    return {
      ...SdsColors,

      // Text ladder: darkest-in-light becomes brightest-in-dark.
      grey900: SdsColors.ink,
      grey800: SdsColors.inkOpacity700,
      grey700: SdsColors.inkOpacity500,
      grey600: SdsColors.inkOpacity450,
      grey500: SdsColors.inkOpacity420,
      grey400: SdsColors.inkOpacity400,
      grey300: SdsColors.inkOpacity350,

      // The bottom of the light ladder is fills and borders, not text.
      grey200: SdsColors.rule,
      grey100: SdsColors.groundChrome,
      grey50: SdsColors.groundRaised,

      // Surfaces. Deeper reads as further back, matching the light set where
      // the page ground (#F7F7F8) sits behind the cards (#FFFFFF).
      background: SdsColors.groundRaised,
      greyBackground: SdsColors.ground,
      layeredBackground: SdsColors.groundRaised,
      floatedBackground: SdsColors.groundChrome,
    };
  }

  return { ...SdsColors };
}

/** Default seed colors for the theme system */
export const colorSeeds = {
  // PINDOM acid green — the single brand action colour across the app. Every
  // accent-coloured component derives from this one value via
  // ThemeProvider.deriveToken(), so changing it here re-themes the whole
  // system. Sampled from block `2b` of the prototype: section labels and the
  // single most important number on screen.
  primary: SdsColors.acid500,
  danger: SdsColors.red500,
  // Sampled — 마감 임박 and other urgency in `2b`.
  warning: SdsColors.alert500,
  // Not present in `2b`, so this is inherited rather than verified. Note that
  // it is a second green next to the acid accent; if a success state ever gets
  // designed, expect this to change.
  success: SdsColors.green500,
} as const;

export type ColorSeeds = typeof colorSeeds;
