import type { AppFailure } from './types';

/**
 * A sentence a screen can show for any failure.
 *
 * `AppFailure` is a union and `CancelledFailure` carries no message, so reading
 * `failure.message` does not compile — which is the type system pointing out
 * that a cancelled request is not something to apologise for. Every screen that
 * renders an error needs this, so it lives here rather than being re-derived per
 * screen.
 *
 * Deliberately generic: a Firebase code or an HTTP status is a debugging detail,
 * not something to put in front of a user. Screens that need to branch should
 * match on `failure.type` or `errorCode` — the 잔여 티켓 충족 branch on 응모 keys
 * off `insufficient_tickets`, not off a string.
 */
export function failureMessage(failure: AppFailure): string {
  switch (failure.type) {
    case 'network':
      return '네트워크에 연결할 수 없어요. 연결을 확인하고 다시 시도해 주세요.';
    case 'cancelled':
      return '요청이 취소됐어요.';
    case 'parse':
      return '응답을 읽지 못했어요. 잠시 후 다시 시도해 주세요.';
    case 'server':
    case 'firebase':
      return '잠시 후 다시 시도해 주세요.';
  }
}
