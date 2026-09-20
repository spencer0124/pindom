import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mmkvStateStorage } from '@/lib/store/mmkv-storage';

interface DiscoveryState {
  /** Null means all artists, including across app restarts. */
  selectedArtistId: string | null;
  select: (artistId: string | null) => void;
  reconcile: (artistIds: string[]) => void;
}

export const useDiscoveryStore = create<DiscoveryState>()(
  persist(
    (set, get) => ({
      selectedArtistId: null,
      select: (artistId) => set({ selectedArtistId: artistId }),
      reconcile: (followedIds) => {
        const current = get().selectedArtistId;
        if (current == null || followedIds.includes(current)) return;
        set({ selectedArtistId: null });
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
