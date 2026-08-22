import { create } from 'zustand';
import type { Raffle, RaffleEntry, Ticket } from '@/lib/domain';

interface TicketsState {
  /** The reward picked on 응모 — what 티켓 절취 tears for and 응모완료 names. */
  raffle: Raffle | null;
  /**
   * Minted once, when 응모 opens, and reused for every retry of this entry.
   *
   * The server builds the entry document's id out of it, so a repeat call with
   * the same key returns the existing entry instead of debiting again. A key
   * minted per call would make one dropped response cost the user their
   * tickets twice — see `enterRaffle` in docs/reference/backend-contract.md.
   */
  idempotencyKey: string | null;
  /** The ticket under the finger on 티켓 절취 — the oldest unspent one, which is what the server spends first. */
  tearing: Ticket | null;
  /** What `enterRaffle` returned. 응모완료 reads it rather than a route param. */
  entry: RaffleEntry | null;

  begin: (raffle: Raffle, tearing: Ticket | null) => void;
  setEntry: (entry: RaffleEntry) => void;
  reset: () => void;
}

const EMPTY = {
  raffle: null,
  idempotencyKey: null,
  tearing: null,
  entry: null,
};

/**
 * Letters, digits, `-` and `_`, 1–64 characters — the server's format for an
 * idempotency key. A UUID satisfies it; so does this, without a native module.
 */
function makeIdempotencyKey(): string {
  const segment = () => Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${segment()}-${segment()}-${segment()}`;
}

/**
 * The state 컬렉션, 응모, 티켓 절취 and 응모완료 share — the raffle, the key and
 * the entry, per docs/reference/screens.md.
 */
export const useTicketsStore = create<TicketsState>((set, get) => ({
  ...EMPTY,

  begin: (raffle, tearing) => {
    // Re-opening 응모 on the same raffle keeps the key: that is the retry case
    // the key exists for. A different raffle is a different entry.
    if (get().raffle?.id === raffle.id && get().idempotencyKey != null) {
      return set({ raffle, tearing, entry: null });
    }
    set({ ...EMPTY, raffle, tearing, idempotencyKey: makeIdempotencyKey() });
  },
  setEntry: (entry) => set({ entry }),
  reset: () => set({ ...EMPTY }),
}));
