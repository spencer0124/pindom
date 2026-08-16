/**
 * PINDOM Color Tokens.
 *
 * Structure is inherited from TDS (Toss Design System) via SDS; the accent ramp
 * is PINDOM's own. Use these tokens instead of hardcoded hex values.
 *
 * The `brand` ramp replaces what SDS called `blue`. Three of its stops are
 * sampled directly from the PINDOM design (Figma `33:2617`); the rest are
 * interpolated along the same lightness ladder TDS used for blue, so the
 * contrast relationships the components were built around still hold.
 *
 * KNOWN GAP: the grey ladder below is TDS's, which is blue-tinted
 * (`grey900: #191F28`). The PINDOM design uses neutral greys (`#171719`,
 * `#2F2F30`). Only the surface tokens are corrected here — realigning the full
 * grey ramp is deferred until real screens exist to check it against.
 */
export const SdsColors = {
  // ── Grey Scale (TDS, blue-tinted — see KNOWN GAP above) ──
  grey50: '#F9FAFB',
  grey100: '#F2F4F6',
  grey200: '#E5E8EB',
  grey300: '#D1D6DB',
  grey400: '#B0B8C1',
  grey500: '#8B95A1',
  grey600: '#6B7684',
  grey700: '#4E5968',
  grey800: '#333D4B',
  grey900: '#191F28',

  // ── Grey Opacity (overlay/dim) ──
  greyOpacity50: 'rgba(0, 23, 51, 0.02)',
  greyOpacity200: 'rgba(0, 27, 55, 0.10)',
  greyOpacity500: 'rgba(3, 24, 50, 0.46)',
  greyOpacity800: 'rgba(0, 12, 30, 0.80)',
  greyOpacity900: 'rgba(2, 9, 19, 0.91)',

  // ── Brand (action, link, accent) — hue 252.2°, replaces TDS blue ──
  brand50: '#EFECFC', //  sampled — location icon chip tint
  brand200: '#AB97F8', //  interpolated
  brand400: '#8B70F5', //  sampled — ticket progress-bar gradient
  brand500: '#6541F2', //  sampled — primary CTA, active tab, distance text
  brand600: '#5129F0', //  interpolated — pressed
  brand700: '#3F12EF', //  interpolated — deep

  // ── Red (error, danger) ──
  red50: '#FFEEEE',
  red500: '#F04452',

  // ── Green (success, active) ──
  green50: '#F0FAF6',
  green500: '#03B26C',

  // ── Orange (caution) — `orange50` matches the "오늘 마감" badge tint ──
  orange50: '#FFF3E0',
  orange500: '#FE9800',

  // ── Yellow (warning) ──
  yellow50: '#FFF9E7',
  yellow400: '#FFD158',
  yellow500: '#FFC342',
  yellow800: '#EE8F11',
  yellow900: '#DD7D02',

  // ── Teal ──
  teal50: '#EDF8F8',
  teal500: '#18A5A5',

  // ── Utility ──
  highlight: '#FFE08C',

  // ── Surface (sampled from the PINDOM home screen) ──
  background: '#FFFFFF',
  greyBackground: '#F7F7F8', //  page ground
  layeredBackground: '#FFFFFF', //  cards
  floatedBackground: '#FFFFFF',

  // ── Dark surfaces — the ticket-balance card on 홈 ──
  darkSurface: '#171719',
  darkSurfaceRaised: '#2F2F30',
  darkSurfaceRaisedAlt: '#383839',
} as const;
