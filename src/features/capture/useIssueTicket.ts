import { useCallback, useState } from 'react';
import { failureMessage } from '@/lib/api/failure-message';
import type { AppFailure } from '@/lib/api/types';
import type { Ticket } from '@/lib/domain';
import { ticketRepository } from '@/lib/repositories';
import { useCaptureStore } from './state';

type IssueState =
  | { status: 'idle' }
  | { status: 'uploading' }
  | { status: 'issuing' }
  | { status: 'error'; message: string };

/**
 * 티켓 발행하기 — the two calls behind the one button.
 *
 * Upload first, then mint: the contract has `issueTicket` confirm an object
 * exists at `photoPath` before it writes anything, so the order is not a
 * choice. The grant comes from the store, never from a route param, and it is
 * spent on success — one verification mints one ticket, and a second press of
 * the button after a dropped response must not look like a second attempt to
 * the user when the server will answer `grant_consumed`.
 */
export function useIssueTicket() {
  const [state, setState] = useState<IssueState>({ status: 'idle' });
  const grant = useCaptureStore((s) => s.grant);
  const composedUri = useCaptureStore((s) => s.composedUri);
  const photoUri = useCaptureStore((s) => s.photoUri);
  const visibility = useCaptureStore((s) => s.visibility);

  const issue = useCallback(async (): Promise<Ticket | null> => {
    const localUri = composedUri ?? photoUri;
    if (grant == null || localUri == null) {
      setState({ status: 'error', message: '인증이 만료됐어요. 다시 인증해 주세요.' });
      return null;
    }

    setState({ status: 'uploading' });
    const upload = await ticketRepository.uploadPhoto(localUri);
    if (!upload.ok) {
      setState({ status: 'error', message: failureMessage(upload.failure) });
      return null;
    }

    setState({ status: 'issuing' });
    const minted = await ticketRepository.issue({
      grantToken: grant.token,
      photoPath: upload.data,
      visibility,
    });
    if (!minted.ok) {
      setState({ status: 'error', message: issueMessage(minted.failure) });
      return null;
    }

    setState({ status: 'idle' });
    return minted.data;
  }, [grant, composedUri, photoUri, visibility]);

  return { state, issue };
}

/**
 * The generic sentence, except for the one refusal that has something to say.
 *
 * `cooldown_active` is the only failure carrying data — the date the per-place
 * 30-day window lifts — and it arrives at the very end of GPS인증 → 카메라 →
 * 편집 → 공개설정, after the photo has already uploaded. Answering it with
 * 잠시 후 다시 시도해 주세요 tells a user who cannot succeed today to try again in
 * a moment. The repository already lifts the date out of `HttpsError.details`;
 * this is the only place that reads it.
 */
function issueMessage(failure: AppFailure): string {
  if (failure.type === 'firebase' && failure.errorCode === 'cooldown_active') {
    const at = failure.nextAvailableAt;
    return at != null
      ? `이 촬영지는 ${at.getFullYear()}년 ${at.getMonth() + 1}월 ${at.getDate()}일부터 다시 발행할 수 있어요.`
      : '이 촬영지는 아직 다시 발행할 수 없어요. 30일이 지나면 열립니다.';
  }
  return failureMessage(failure);
}
