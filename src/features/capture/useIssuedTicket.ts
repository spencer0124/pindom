import { useCallback, useEffect, useState } from 'react';
import { failureMessage } from '@/lib/api/failure-message';
import type { Ticket, User } from '@/lib/domain';
import { ticketRepository, userRepository } from '@/lib/repositories';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; ticket: Ticket; user: User };

/**
 * What 티켓 발행 renders: the ticket just minted and the balance it raised.
 *
 * Read back by id rather than carried over from 공개설정, so the screen is the
 * same whether it was reached by minting or by a deep link — and so the
 * number on it is the server's balance, not a client-side `+ 1`.
 */
export function useIssuedTicket(ticketId: string | undefined) {
  const [state, setState] = useState<State>({ status: 'loading' });

  const load = useCallback(async () => {
    if (ticketId == null) {
      return setState({ status: 'error', message: '티켓을 찾을 수 없어요.' });
    }
    setState({ status: 'loading' });
    const [ticket, user] = await Promise.all([
      ticketRepository.getById(ticketId),
      userRepository.me(),
    ]);
    if (!ticket.ok) return setState({ status: 'error', message: failureMessage(ticket.failure) });
    if (!user.ok) return setState({ status: 'error', message: failureMessage(user.failure) });
    setState({ status: 'ready', ticket: ticket.data, user: user.data });
  }, [ticketId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { state, reload: load };
}
