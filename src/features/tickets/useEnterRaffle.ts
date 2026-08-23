import { useCallback, useState } from 'react';
import { failureMessage } from '@/lib/api/failure-message';
import { raffleRepository } from '@/lib/repositories';
import { useTicketsStore } from './state';

export type EnterOutcome =
  | { kind: 'entered' }
  /** The No edge of 잔여 티켓 충족 — the flowchart sends it back to 컬렉션. */
  | { kind: 'insufficient' }
  | { kind: 'failed'; message: string };

/**
 * The one call the server sees for the whole 응모 → 절취 → 완료 chain.
 *
 * 티켓 절취 is client-side only; the server is asked once, at the end of the
 * tear, with the key minted when 응모 opened. The balance check is the
 * server's, and its `insufficient_tickets` is branched on by code, never by
 * message.
 */
export function useEnterRaffle() {
  const [busy, setBusy] = useState(false);
  const raffle = useTicketsStore((s) => s.raffle);
  const idempotencyKey = useTicketsStore((s) => s.idempotencyKey);
  const setEntry = useTicketsStore((s) => s.setEntry);

  const enter = useCallback(async (): Promise<EnterOutcome> => {
    if (raffle == null || idempotencyKey == null) {
      return { kind: 'failed', message: '응모를 찾을 수 없어요.' };
    }
    setBusy(true);
    try {
      const result = await raffleRepository.enter(raffle.id, idempotencyKey);
      if (!result.ok) {
        const failure = result.failure;
        const errorCode =
          failure.type === 'firebase' || failure.type === 'server' ? failure.errorCode : undefined;
        if (errorCode === 'insufficient_tickets') return { kind: 'insufficient' };
        return { kind: 'failed', message: failureMessage(failure) };
      }
      // The balance rides along with the entry — the server's figure after
      // the debit, never a subtraction done here.
      setEntry(result.data, result.data.ticketBalance);
      return { kind: 'entered' };
    } finally {
      setBusy(false);
    }
  }, [raffle, idempotencyKey, setEntry]);

  return { busy, enter };
}
