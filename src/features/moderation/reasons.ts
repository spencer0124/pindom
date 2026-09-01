import type { ReportTargetType } from '@/lib/domain';

/**
 * What the sheet calls the thing being reported.
 *
 * The contract's `targetType` values are the server's words, not the app's —
 * `review` is 촬영 팁 on every screen that shows one, and a sheet that said
 * "리뷰를 신고합니다" would be naming a screen the user has never seen.
 */
export const targetLabel: Record<ReportTargetType, string> = {
  post: '게시글',
  comment: '댓글',
  review: '촬영 팁',
  photo: '사진',
  user: '사용자',
  assistant: 'AI 답변',
};

/**
 * The reasons 신고 offers.
 *
 * A fixed list rather than a free-text box, and the chosen label is what gets
 * written to `reason`. Free text puts triage on the console reader; six
 * categories make a 신고 sortable the moment it lands. 기타 is last and is the
 * only one that opens a text field, so the escape hatch exists without being
 * the default.
 *
 * Ordered by how often each is expected, not by severity — the list is a menu,
 * and the top of a menu is where the eye lands.
 */
export const REPORT_REASONS = [
  '스팸 또는 광고',
  '욕설·혐오 표현',
  '음란물 또는 부적절한 사진',
  '개인정보 노출',
  '사칭 또는 허위 정보',
  '기타',
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

/** The one reason that asks for detail. */
export const OTHER_REASON: ReportReason = '기타';
