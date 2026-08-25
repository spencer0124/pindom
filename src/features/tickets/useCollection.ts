import { useCallback, useEffect, useState } from 'react';
import { failureMessage } from '@/lib/api/failure-message';
import { isEnterable } from '@/lib/domain';
import type { Raffle, Ticket, User } from '@/lib/domain';
import { raffleRepository, ticketRepository, userRepository } from '@/lib/repositories';

export interface CollectionData {
  user: User;
  /** Public tickets, newest first — 보관함 holds the private ones. */
  tickets: Ticket[];
  /** Where 응모하러 가기 lands: the soonest-closing open raffle, or null when none is. */
  nextRaffle: Raffle | null;
}

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: CollectionData };

/**
 * 컬렉션's data: the balance and tier, the tickets, and a raffle to point
 * 응모하러 가기 at — 응모 is keyed to a raffle id, so the button needs one.
 */
export function useCollection() {
  const [state, setState] = useState<State>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    const [user, tickets, raffles] = await Promise.all([
      userRepository.me(),
      ticketRepository.listMine(),
      raffleRepository.list(),
    ]);
    if (!user.ok) return setState({ status: 'error', message: failureMessage(user.failure) });
    if (!tickets.ok) return setState({ status: 'error', message: failureMessage(tickets.failure) });

    const open = raffles.ok
      ? raffles.data
          .filter((r) => isEnterable(r))
          .sort((a, b) => a.closesAt.getTime() - b.closesAt.getTime())
      : [];

    setState({
      status: 'ready',
      data: { user: user.data, tickets: tickets.data, nextRaffle: open[0] ?? null },
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { state, reload: load };
}
