import { Alert } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { failureMessage } from '@/lib/api/failure-message';
import type { Ticket } from '@/lib/domain';
import { ticketRepository } from '@/lib/repositories';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; tickets: Ticket[] };

/**
 * 보관함: every ticket the user has shot, both visibilities in one list, and
 * the one thing that can be done to them — flipping that visibility either
 * way. `listMine` is the public half (컬렉션's own query) and `listVault` the
 * private half; they are merged newest-first so the two read as one roll of
 * film rather than two screens.
 *
 * It does **not** write a gallery entry, and does not have to: the backend's
 * `syncGalleryOnVisibility` trigger watches `tickets` and follows the flip —
 * writing `places/{placeId}/gallery` when a ticket turns public, removing that
 * entry and rotating the photo URL when it turns private, so a ticket taken
 * back out of public view leaves nothing behind on 장소/상세.
 */
export function useVault() {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [state, setState] = useState<State>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    const [mine, vault] = await Promise.all([ticketRepository.listMine(), ticketRepository.listVault()]);
    if (!mine.ok) return setState({ status: 'error', message: failureMessage(mine.failure) });
    if (!vault.ok) return setState({ status: 'error', message: failureMessage(vault.failure) });
    const tickets = [...mine.data, ...vault.data].filter((ticket) => !ticket.photoDeleted).sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime());
    setState({ status: 'ready', tickets });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Flip one ticket to the other visibility; the tile stays put, its chip changes. */
  const toggle = useCallback(async (ticket: Ticket) => {
    const next = ticket.visibility === 'private' ? 'public' : 'private';
    const result = await ticketRepository.setVisibility(ticket.id, next);
    if (result.ok) {
      const updated = result.data;
      setState((current) =>
        current.status === 'ready'
          ? { status: 'ready', tickets: current.tickets.map((t) => (t.id === updated.id ? updated : t)) }
          : current,
      );
    }
    return result.ok;
  }, []);

  const remove = useCallback(async (ticket: Ticket) => {
    setBusyId(ticket.id);
    const result = await ticketRepository.deletePhoto(ticket.id);
    setBusyId(null);
    if (result.ok) {
      setState((current) => current.status === 'ready'
        ? { ...current, tickets: current.tickets.filter((t) => t.id !== ticket.id) } : current);
    } else Alert.alert('사진을 삭제하지 못했어요', failureMessage(result.failure));
  }, []);

  return { state, reload: load, toggle, remove, busyId };
}
