import type { Tier } from '@/lib/domain';

/**
 * The badge beside a nickname, in the prototype's own tier copy.
 *
 * The contract names the tiers club10 · club20 · clubGo and derives them from
 * `ticketsIssued`; 1a writes them as 10장 클럽 · 20장 클럽 and 수집 중 for the
 * rest. Shared by 촬영 팁 and 커뮤니티 so one author wears one badge.
 */
export const tierLabel: Record<Tier, string> = {
  club20: '20장 클럽',
  club10: '10장 클럽',
  clubGo: '수집 중',
};
