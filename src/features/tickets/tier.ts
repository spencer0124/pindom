import type { User } from '@/lib/domain';

/** The two marks on the gauge, as 1a labels them. */
export const GAUGE_FIRST = 10;
export const GAUGE_TOP = 20;

export interface TierView {
  /** 수집 중 · 10장부터 응모 가능 — the line over the gauge. */
  label: string;
  /** 7장 남음, or 최고 등급. */
  next: string;
  /** 0–1 along the gauge, whose top is `GAUGE_TOP`. */
  progress: number;
}

/**
 * The collection tier as 1a prints it, from the count the contract says it
 * comes from.
 *
 * The contract derives `tier` from `ticketsIssued`, never the balance — a
 * balance-derived tier would demote the user every time they spend on a
 * raffle — and its thresholds are 20 and 30. 1a's gauge is marked at 10 and
 * 20, and its copy names those numbers, so the gauge reads `ticketsIssued`
 * against 1a's marks. The Tickets checklist records the gap.
 */
export function tierView(user: User): TierView {
  const n = user.ticketsIssued;
  if (n >= GAUGE_TOP) {
    return { label: '20장 클럽 · 전체 응모 가능', next: '최고 등급', progress: 1 };
  }
  if (n >= GAUGE_FIRST) {
    return {
      label: '10장 클럽 · 앨범/콘서트 응모 가능',
      next: `${GAUGE_TOP - n}장 남음`,
      progress: n / GAUGE_TOP,
    };
  }
  return {
    label: '수집 중 · 10장부터 응모 가능',
    next: `${GAUGE_FIRST - n}장 남음`,
    progress: n / GAUGE_TOP,
  };
}
