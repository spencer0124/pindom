import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mmkvStateStorage } from '@/lib/store/mmkv-storage';

interface DiscoveryState {
  /** The 최애 every Discovery screen is keyed to. Null until a load or the disk seeds it. */
  selectedArtistId: string | null;
  /** A deliberate choice — a chip tap on 홈 or 지도. */
  select: (artistId: string) => void;
  /**
   * A default, taken from whichever screen loaded first. Does nothing once a
   * selection exists, so arriving at 지도 second cannot silently reset what the
   * user picked on 홈 — and, since the store rehydrates before the first load
   * resolves, cannot reset what they picked in a previous session either.
   */
  seed: (artistId: string | null) => void;
  /**
   * The followed list changed under the selection. Keeps it when it is still
   * followed; otherwise falls to the first followed artist, or to nothing.
   * 최애 찾기 can unfollow the very artist 홈 is keyed to, and a restored
   * selection can name an artist unfollowed on another device.
   */
  reconcile: (followedIds: string[]) => void;
}

/**
 * The selection 홈, 지도 and 장소/상세 share.
 *
 * docs/reference/screens.md groups those three into one slice precisely because
 * of this value: every section title, every pin filter and the 최애 badge on a
 * place all read it. Keeping it inside 홈's data hook is what made the 최애 chips
 * a no-op — there was nowhere for a selection to go that another screen could
 * see.
 *
 * Zustand rather than context because the writer (a chip on either screen) and
 * the readers (three screens plus their data hooks) are not in one subtree, and
 * a provider high enough to cover them would re-render the whole tab stack on
 * every tap.
 *
 * Persisted, because the selection is a preference and not a session fact.
 * Without this the store came back empty on every cold start and `seed` fell to
 * `followedArtistIds[0]` — so a user who follows more than one 최애 found the
 * app back on the first of them every launch, which is a default nobody chose.
 * MMKV is synchronous, so rehydration happens during the first render and no
 * screen ever paints the wrong 최애 first. Only the id is written: the artists
 * themselves are server-owned and belong in the cache, not in settings.
 */
export const useDiscoveryStore = create<DiscoveryState>()(
  persist(
    (set, get) => ({
      selectedArtistId: null,
      select: (artistId) => set({ selectedArtistId: artistId }),
      seed: (artistId) => {
        if (get().selectedArtistId == null) set({ selectedArtistId: artistId });
      },
      reconcile: (followedIds) => {
        const current = get().selectedArtistId;
        if (current != null && followedIds.includes(current)) return;
        set({ selectedArtistId: followedIds[0] ?? null });
      },
    }),
    {
      name: 'discovery',
      storage: createJSONStorage(() => mmkvStateStorage),
      // The actions are recreated on every launch; only the choice is state.
      partialize: (s) => ({ selectedArtistId: s.selectedArtistId }),
    },
  ),
);
