import { useCallback, useEffect, useRef, useState } from 'react';
import { failureMessage } from '@/lib/api/failure-message';
import type { Artist } from '@/lib/domain';
import { artistRepository } from '@/lib/repositories';
import { useDiscoveryStore } from '@/features/discovery';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; results: Artist[]; followedIds: string[] };

type Results =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; results: Artist[] };

/** How long a keystroke waits before it is searched; an emptied field searches at once. */
const SEARCH_DEBOUNCE_MS = 150;

/**
 * 최애 찾기: the roster filtered by the query, and which of them are followed.
 *
 * 1a filters synchronously, so its list can never be stale. Here the search is
 * a repository call, so two keystrokes in flight at once could land out of
 * order — the sequence counter lets only the latest one paint. The followed
 * set is a separate read: once on mount and again after a follow, not on
 * every keystroke.
 *
 * A follow also selects the artist in the Discovery store, as 1a does — the
 * point of following is that 홈, 지도 and 응모 re-key to them, and a follow
 * that changed nothing on 홈 would look like it failed.
 */
export function useArtistSearch(query: string) {
  const [results, setResults] = useState<Results>({ status: 'loading' });
  // `null` until the first read lands, so the first paint waits for both reads
  // instead of flashing every chip as 팔로우 for a frame.
  const [followedIds, setFollowedIds] = useState<string[] | null>(null);
  const seq = useRef(0);
  const select = useDiscoveryStore((s) => s.select);

  const loadMine = useCallback(async () => {
    const mine = await artistRepository.listMine();
    if (mine.ok) setFollowedIds(mine.data.map((a) => a.id));
    else setFollowedIds((current) => current ?? []);
  }, []);

  const search = useCallback(async () => {
    const id = ++seq.current;
    const result = await artistRepository.search(query);
    if (id !== seq.current) return; // a later keystroke has already been searched
    if (!result.ok) return setResults({ status: 'error', message: failureMessage(result.failure) });
    setResults({ status: 'ready', results: result.data });
  }, [query]);

  useEffect(() => {
    void loadMine();
  }, [loadMine]);

  useEffect(() => {
    const delay = query.length === 0 ? 0 : SEARCH_DEBOUNCE_MS;
    const timer = setTimeout(() => void search(), delay);
    return () => clearTimeout(timer);
  }, [search, query.length]);

  const reload = useCallback(async () => {
    await Promise.all([search(), loadMine()]);
  }, [search, loadMine]);

  const toggle = useCallback(
    async (artist: Artist, followed: boolean) => {
      // Optimistic: the chip flips now and the set is re-read after.
      setFollowedIds((current) =>
        followed
          ? (current ?? []).filter((id) => id !== artist.id)
          : [...(current ?? []), artist.id],
      );
      const result = followed
        ? await artistRepository.unfollow(artist.id)
        : await artistRepository.follow(artist.id);
      if (result.ok && !followed) select(artist.id);
      void loadMine();
    },
    [loadMine, select],
  );

  const state: State =
    results.status === 'ready'
      ? followedIds == null
        ? { status: 'loading' }
        : { status: 'ready', results: results.results, followedIds }
      : results;

  return { state, reload, toggle };
}
