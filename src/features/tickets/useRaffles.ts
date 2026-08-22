import { useCallback, useEffect, useState } from 'react';
import { failureMessage } from '@/lib/api/failure-message';
import type { Raffle, Ticket, User } from '@/lib/domain';
import { raffleRepository, ticketRepository, userRepository } from '@/lib/repositories';

export interface RafflesData {
  user: User;
  /** Open raffles, soonest-closing first. */
  raffles: Raffle[];
  /** The oldest unspent ticket — what the server spends first, and what 티켓 절취 tears. */
  oldestTicket: Ticket | null;
}

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: RafflesData };

/**
 * 응모's data. The balance the rows are compared against is the server's
 * figure as of this load; the decision itself is `enterRaffle`'s, which
 * answers `insufficient_tickets` when the balance has moved underneath.
 */
export function useRaffles() {
  const [state, setState] = useState<State>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    const [user, raffles, tickets] = await Promise.all([
      userRepository.me(),
      raffleRepository.list(),
      ticketRepository.listMine(),
    ]);
    if (!user.ok) return setState({ status: 'error', message: failureMessage(user.failure) });
    if (!raffles.ok) return setState({ status: 'error', message: failureMessage(raffles.failure) });

    const open = raffles.data
      .filter((r) => r.status === 'open')
      .sort((a, b) => a.closesAt.getTime() - b.closesAt.getTime());
    const oldest = tickets.ok
      ? [...tickets.data]
          .filter((t) => !t.spent)
          .sort((a, b) => a.issuedAt.getTime() - b.issuedAt.getTime())[0] ?? null
      : null;

    setState({ status: 'ready', data: { user: user.data, raffles: open, oldestTicket: oldest } });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { state, reload: load };
}
