import { useCallback, useEffect, useState } from 'react';
import { failureMessage } from '@/lib/api/failure-message';
import type { Place, Raffle, Ticket, User } from '@/lib/domain';
import { placeRepository, raffleRepository, ticketRepository, userRepository } from '@/lib/repositories';

export interface RafflesData {
  user: User;
  /** Open raffles, soonest-closing first. */
  raffles: Raffle[];
  /** The oldest unspent ticket — what the server spends first, and what 티켓 절취 tears. */
  oldestTicket: Ticket | null;
  /** Its place, for the `{region} · {work kind}` line under the name on 티켓 절취. Null when the read fails. */
  oldestPlace: Place | null;
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
    // The region and the kind of work are the place's, not the ticket's. A
    // caption is not worth failing the screen for, so a miss is just no line.
    const place = oldest != null ? await placeRepository.getById(oldest.placeId) : null;

    setState({
      status: 'ready',
      data: {
        user: user.data,
        raffles: open,
        oldestTicket: oldest,
        oldestPlace: place?.ok ? place.data : null,
      },
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { state, reload: load };
}
