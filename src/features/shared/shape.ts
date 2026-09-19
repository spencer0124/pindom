import { SdsRadius, SdsSpacing } from '@/design-system';

/** Shared spacing keeps discovery, collection and profile aligned. */
export const Shape = {
  gutter: SdsSpacing.xl,
  sectionRule: 0,
  rowRule: 0.5,
  chipRadius: SdsRadius.md,
} as const;

export const sectionLabel = { letterSpacing: 0 } as const;
export const wordmark = { letterSpacing: 2.4 } as const;
