/**
 * SDS Color Foundation — bridges SdsColors to the theme system.
 *
 * Provides:
 * - Adaptive color maps for light/dark mode
 * - Semantic color seeds for the theme provider
 */
import { SdsColors } from '@/design-system/tokens';

export type ColorPreference = 'light' | 'dark';

/** Light pink is the app default; dark remains available for photo surfaces. */
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

      // Surfaces, one step up from where this mapping first put them.
      //
      // The relationship is unchanged and still mirrors the light set — one page
      // ground with the raised surfaces above it — but 2b anchors it higher than
      // an inversion of the light ladder would suggest. The direction assigns
      // #131313 to the canvas and #171719 to frames and bars, and #0B0B0B is not
      // a surface in it at all: it is the ink used *on* an acid chip, which is
      // the one place it is read from (see onAccent in ThemeProvider).
      //
      // This is also what makes the contrast table in
      // docs/reference/design-tokens.md describe the screen: those ratios were
      // measured against #131313.
      background: SdsColors.groundChrome,
      greyBackground: SdsColors.groundRaised,
      layeredBackground: SdsColors.groundChrome,
      floatedBackground: SdsColors.groundChrome,
    };
  }

  return { ...SdsColors };
}

/** Semantic actions derive from the same rose seed across all screens. */
export const colorSeeds = {
  primary: SdsColors.brand500,
  danger: SdsColors.red500,
  warning: SdsColors.alert500,
  success: SdsColors.green500,
} as const;

export type ColorSeeds = typeof colorSeeds;
