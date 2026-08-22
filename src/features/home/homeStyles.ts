import { SdsRadius, SdsSpacing } from '@/design-system';

/**
 * The shape rules 2b imposes, in one place so every 홈 block obeys the same ones.
 *
 * Direction 2b is 인쇄물 — 블랙 & 애시드: structure comes from rules and spacing,
 * not from cards. Its radius rule is literally "chips only, everything else
 * square", so a block here has square corners and a hairline, never a corner
 * radius and a shadow. See docs/reference/design-tokens.md.
 */
export const HomeShape = {
  /** Horizontal page inset. Every section shares it so the rules line up. */
  gutter: SdsSpacing.lg,
  /** Between blocks. */
  sectionRule: 2,
  /** Between rows inside a block. */
  rowRule: 1,
  /** The only rounded thing on the screen: an artist chip. */
  chipRadius: SdsRadius.xs,
} as const;

/** Letter-spaced small caps for a section label — the typographic signature of 2b. */
export const sectionLabel = {
  letterSpacing: 1.4,
} as const;
