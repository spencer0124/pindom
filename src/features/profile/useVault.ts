import { useCallback, useEffect, useState } from 'react';
import { failureMessage } from '@/lib/api/failure-message';
import type { Ticket } from '@/lib/domain';
import { ticketRepository } from '@/lib/repositories';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; tickets: Ticket[] };

/**
 * 보관함: the private tickets, and the one thing that can be done to them —
 * 공개 전환, which moves a ticket to 컬렉션 and writes a gallery entry
 * server-side. The same tickets as 컬렉션's, the other visibility.
 */
export function useVault() {
  const [state, setState] = useState<State>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    const result = await ticketRepository.listVault();
    if (!result.ok) return setState({ status: 'error', message: failureMessage(result.failure) });
    setState({ status: 'ready', tickets: result.data });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const makePublic = useCallback(async (ticketId: string) => {
    const result = await ticketRepository.setVisibility(ticketId, 'public');
    if (result.ok) {
      setState((current) =>
        current.status === 'ready'
          ? { status: 'ready', tickets: current.tickets.filter((t) => t.id !== ticketId) }
          : current,
      );
    }
    return result.ok;
  }, []);

  return { state, reload: load, makePublic };
}
