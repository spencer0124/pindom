import { useCallback, useEffect, useState } from 'react';
import { failureMessage } from '@/lib/api/failure-message';
import type { Artist } from '@/lib/domain';
import { artistRepository } from '@/lib/repositories';
import { useDiscoveryStore } from '@/features/discovery';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; results: Artist[]; followedIds: string[] };

/**
 * 최애 찾기: the roster filtered by the query, and which of them are followed.
 *
 * A follow also selects the artist in the Discovery store, as 1a does — the
 * point of following is that 홈, 지도 and 응모 re-key to them, and a follow
 * that changed nothing on 홈 would look like it failed.
 */
export function useArtistSearch(query: string) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const select = useDiscoveryStore((s) => s.select);

  const load = useCallback(async () => {
    const [results, mine] = await Promise.all([
      artistRepository.search(query),
      artistRepository.listMine(),
    ]);
    if (!results.ok) return setState({ status: 'error', message: failureMessage(results.failure) });
    setState({
      status: 'ready',
      results: results.data,
      followedIds: mine.ok ? mine.data.map((a) => a.id) : [],
    });
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = useCallback(
    async (artist: Artist, followed: boolean) => {
      // Optimistic: the chip flips now and the list is re-read after.
      setState((current) =>
        current.status === 'ready'
          ? {
              ...current,
              followedIds: followed
                ? current.followedIds.filter((id) => id !== artist.id)
                : [...current.followedIds, artist.id],
            }
          : current,
      );
      const result = followed
        ? await artistRepository.unfollow(artist.id)
        : await artistRepository.follow(artist.id);
      if (result.ok && !followed) select(artist.id);
      void load();
    },
    [load, select],
  );

  return { state, reload: load, toggle };
}
