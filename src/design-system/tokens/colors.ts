/** Pindom: rose actions, blush surfaces, and a separate photographic dark palette. */
export const SdsColors = {
  // ── Rose-tinted neutral scale ──
  grey50: '#FFFAFC',
  grey100: '#FCECF2',
  grey200: '#ECDCE3',
  grey300: '#D8BFCB',
  grey400: '#8A6878',
  grey500: '#795C6A',
  grey600: '#725564',
  grey700: '#604452',
  grey800: '#492C3B',
  grey900: '#321C29',

  // ── Grey Opacity (overlay/dim) ──
  greyOpacity50: 'rgba(0, 23, 51, 0.02)',
  greyOpacity200: 'rgba(0, 27, 55, 0.10)',
  greyOpacity500: 'rgba(3, 24, 50, 0.46)',
  greyOpacity800: 'rgba(0, 12, 30, 0.80)',
  greyOpacity900: 'rgba(2, 9, 19, 0.91)',

  // ── Pink brand: pale pink for surfaces, deep rose for readable actions ──
  brand50: '#FCECF2', // light tint
  brand200: '#F8AEBB', // reference pink
  brand400: '#DC7899', // soft rose
  brand500: '#B83265', // readable primary action
  brand600: '#A22656', //  interpolated — pressed
  brand700: '#861C46', //  interpolated — deep

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
  greyBackground: '#FFF7FA', //  page ground
  layeredBackground: '#FFFFFF', //  cards
  floatedBackground: '#FFFFFF',

  // ── Dark photo/overlay surfaces ──
  darkSurface: '#171719',
  darkSurfaceRaised: '#2F2F30',
  darkSurfaceRaisedAlt: '#383839',

  // ── Dark/photo surfaces and legacy palette ──
  // Sampled from block `2b` of design/2026-08-20-prototype.html. See
  // docs/reference/design-tokens.md for where each value appears.

  // ── Ground. Three steps, all near-black; `2b` has no mid-tone surface ──
  ground: '#0B0B0B', //  deepest — also the ink used *on* the accent
  groundRaised: '#131313', //  the screen canvas
  groundChrome: '#171719', //  bars and frames

  // ── Compatibility alias and holographic ticket stops ──
  acid500: '#B83265', // Compatibility alias; new code uses brand500.
  pink: '#F8AEBB',
  ticketInk: '#3D1720',
  ticketPink: '#F8C8DB',
  ticketLilac: '#D9D0FA',
  ticketMint: '#C7EEE6',
  ticketPearl: '#FFF5DB',

  // ── Alert. 마감 임박 and other urgency ──
  alert500: '#B74814',

  // ── Ink. `2b` has no grey scale — secondary tone is white at an opacity ──
  ink: '#FFFFFF',
  inkOpacity700: 'rgba(255, 255, 255, 0.70)', //  secondary values
  inkOpacity500: 'rgba(255, 255, 255, 0.50)', //  supporting sentences
  inkOpacity450: 'rgba(255, 255, 255, 0.45)', //  metadata
  inkOpacity420: 'rgba(255, 255, 255, 0.42)', //  roman captions
  inkOpacity400: 'rgba(255, 255, 255, 0.40)', //  sub-labels
  inkOpacity350: 'rgba(255, 255, 255, 0.35)', //  row numerals

  // ── Rules, not cards. Structure comes from these, not from fills ──
  rule: 'rgba(255, 255, 255, 0.14)',
} as const;
