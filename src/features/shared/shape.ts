import { SdsRadius, SdsSpacing } from '@/design-system';

/**
 * The shape rules `2b` imposes, in one place so every block on every screen
 * obeys the same ones.
 *
 * Direction 2b is 인쇄물 — 블랙 & 애시드: structure comes from rules and spacing,
 * not from cards. Its radius rule is literally "chips only, everything else
 * square", so a block here has square corners and a hairline, never a corner
 * radius and a shadow. See docs/reference/design-tokens.md.
 *
 * This started life as `HomeShape` inside the 홈 feature. It moved when 지도
 * needed the same gutter — two screens measuring their insets separately is how
 * the rules stop lining up between them.
 */
export const Shape = {
  /** Horizontal page inset. Every section shares it so the rules line up. */
  gutter: SdsSpacing.lg,
  /** Between blocks. */
  sectionRule: 2,
  /** Between rows inside a block. */
  rowRule: 1,
  /** The only rounded thing on a screen: a chip. */
  chipRadius: SdsRadius.xs,
} as const;

/** Letter-spaced small caps for a section label — the typographic signature of 2b. */
export const sectionLabel = {
  letterSpacing: 1.4,
} as const;
