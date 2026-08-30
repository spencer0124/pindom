import type { AppFailure } from './types';

/**
 * Auth codes that name a fixable mistake. Anything not listed here stays generic —
 * an internal Firebase code is not a sentence for a user.
 */
const AUTH_MESSAGES: Record<string, string> = {
  'auth/invalid-email': '이메일 주소 형식이 아니에요. @ 를 포함한 주소를 입력해 주세요.',
  'auth/missing-email': '이메일 주소를 입력해 주세요.',
  'auth/email-already-in-use': '이미 가입된 이메일이에요. 로그인해 주세요.',
  'auth/weak-password': '비밀번호는 6자 이상이어야 해요.',
  'auth/missing-password': '비밀번호를 입력해 주세요.',
  'auth/invalid-credential': '이메일 또는 비밀번호가 맞지 않아요.',
  'auth/wrong-password': '이메일 또는 비밀번호가 맞지 않아요.',
  'auth/user-not-found': '가입되지 않은 이메일이에요.',
  'auth/user-disabled': '정지된 계정이에요.',
  'auth/too-many-requests': '시도가 너무 많아요. 잠시 후 다시 시도해 주세요.',
  'auth/network-request-failed':
    '네트워크에 연결할 수 없어요. 연결을 확인하고 다시 시도해 주세요.',
};

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
 *
 * The exception is `AUTH_MESSAGES` above. "잠시 후 다시 시도해 주세요." is a lie
 * when the address has no `@` in it — waiting fixes nothing, and the user has no
 * way to learn what to change. These are the failures the user themselves can
 * clear, so each one says which field is wrong.
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
      return '잠시 후 다시 시도해 주세요.';
    case 'firebase':
      return AUTH_MESSAGES[failure.code] ?? '잠시 후 다시 시도해 주세요.';
  }
}
