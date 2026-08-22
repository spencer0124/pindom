const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/**
 * 방금 · 12분 전 · 3시간 전 · 어제 · 5일 전 · 2주 전
 *
 * The shapes come from the prototype's own `timeAgo` table, which lists fixed
 * strings for each bucket rather than a rule — this is that table read back as
 * one. Anything older than a month falls back to a date, because "13주 전" is
 * arithmetic nobody does in their head.
 *
 * `now` is a parameter so a list can measure every row against one instant.
 */
export function formatTimeAgo(then: Date, now: Date = new Date()): string {
  const elapsed = now.getTime() - then.getTime();

  if (elapsed < MINUTE) return '방금';
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}분 전`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}시간 전`;
  if (elapsed < 2 * DAY) return '어제';
  if (elapsed < WEEK) return `${Math.floor(elapsed / DAY)}일 전`;
  if (elapsed < 4 * WEEK) return `${Math.floor(elapsed / WEEK)}주 전`;
  return `${then.getFullYear()}.${then.getMonth() + 1}.${then.getDate()}`;
}
