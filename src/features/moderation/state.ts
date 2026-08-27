import { create } from 'zustand';
import { readCache, writeCache } from '@/lib/store/mmkv-cache';

/**
 * Cache key for one account's blocklist.
 *
 * **Keyed by uid, not a bare `'blocklist'`.** Two accounts share a device more
 * often than they should — a demo login and a real one, on this project — and a
 * single key would let the first user's blocklist hide the second user's feed
 * for the seconds before `me()` answers. Nothing leaks either way; the wrong
 * posts simply go missing, which is the kind of bug nobody reports and nobody
 * can reproduce.
 */
const cacheKey = (userId: string) => `blocklist:${userId}`;

interface CachedBlocklist {
  ids: string[];
  /** uid → the nickname this app last saw on that user's content. */
  names: Record<string, string>;
}

/** A cached value written by an older build must not be trusted — see `readCache`. */
function asCached(raw: unknown): CachedBlocklist | null {
  if (raw == null || typeof raw !== 'object') return null;
  const value = raw as { ids?: unknown; names?: unknown };
  if (!Array.isArray(value.ids)) return null;
  const names: Record<string, string> = {};
  if (value.names != null && typeof value.names === 'object') {
    for (const [id, name] of Object.entries(value.names as Record<string, unknown>)) {
      if (typeof name === 'string') names[id] = name;
    }
  }
  return { ids: value.ids.filter((x): x is string => typeof x === 'string'), names };
}

interface ModerationState {
  /** Whose list this is. Null before anything has loaded. */
  userId: string | null;
  blockedUserIds: string[];
  /**
   * Bumped by every `adopt`. A background read compares it before and after
   * its round trip and drops its answer if anything moved — see `loadBlocklist`.
   *
   * Without it the store is last-write-wins between a fast write and a slow
   * read, and the losing order is the common one: a `me()` started when the
   * feed mounted resolves *after* a 차단 that took one `arrayUnion`, and
   * overwrites the new list with the snapshot it read before the block landed.
   * The blocked author reappears, and nothing retries.
   */
  revision: number;
  /**
   * What to call each blocked user on 차단한 사용자.
   *
   * Local, and deliberately so: the contract closes `users` reads to everyone
   * but the owner, so the app **cannot** look a blocked uid's nickname up. This
   * is the name that was on the content when the block was made. A name learned
   * on another device, or a nickname changed since, is not here — the row falls
   * back to a placeholder rather than showing a raw uid.
   */
  blockedNames: Record<string, string>;
  /**
   * Read the previous run's list back for `userId`, before the server answers.
   *
   * Optimistic and disposable: `adopt` overwrites it moments later. It exists
   * because the alternative is a feed that paints a blocked user on every cold
   * start and then blinks them away.
   */
  hydrate: (userId: string) => void;
  /**
   * Take the server's ids as the truth, and keep them for the next launch.
   *
   * Names are merged rather than replaced — the server sends none — and pruned
   * to the surviving ids so an unblock does not leave its name behind forever.
   */
  adopt: (userId: string, blockedUserIds: string[]) => void;
  /** Learn a nickname for a uid at the moment it is blocked. */
  remember: (userId: string, nickname: string) => void;
  /** Sign-out and 탈퇴. The next account must not inherit this. */
  clear: () => void;
}

/**
 * The blocklist every list filters against.
 *
 * Zustand for the same reason `useDiscoveryStore` is: the writer — a 차단 tap,
 * which can happen on 커뮤니티, on 장소/상세 or inside a 갤러리 — and the
 * readers are not in one subtree, and blocking someone has to remove them from
 * a list that is already on screen.
 *
 * Not persisted through `zustand/persist`: the ids are a copy of a server-owned
 * field (`users.blockedUserIds`), so they belong in the disposable cache rather
 * than beside the user's preferences. Losing the cache costs one refetch of the
 * ids and, at worst, the remembered names — which is why a missing name renders
 * as a placeholder rather than as a broken row.
 */
export const useModerationStore = create<ModerationState>((set, get) => ({
  userId: null,
  blockedUserIds: [],
  blockedNames: {},
  revision: 0,

  hydrate: (userId) => {
    // A list already adopted for this account is newer than anything on disk.
    if (get().userId === userId) return;
    const cached = readCache(cacheKey(userId), asCached);
    set({
      userId,
      blockedUserIds: cached?.ids ?? [],
      blockedNames: cached?.names ?? {},
    });
  },

  adopt: (userId, blockedUserIds) => {
    const previous = get().userId === userId ? get().blockedNames : {};
    const names: Record<string, string> = {};
    for (const id of blockedUserIds) {
      const name = previous[id];
      if (name != null) names[id] = name;
    }
    set({ userId, blockedUserIds, blockedNames: names, revision: get().revision + 1 });
    writeCache(cacheKey(userId), { ids: blockedUserIds, names } satisfies CachedBlocklist);
  },

  remember: (userId, nickname) => {
    const owner = get().userId;
    if (owner == null) return;
    const names = { ...get().blockedNames, [userId]: nickname };
    set({ blockedNames: names });
    writeCache(cacheKey(owner), {
      ids: get().blockedUserIds,
      names,
    } satisfies CachedBlocklist);
  },

  // `revision` keeps climbing across a sign-out: a read in flight when the
  // account changed must be discarded, not adopted onto the next account.
  clear: () =>
    set({
      userId: null,
      blockedUserIds: [],
      blockedNames: {},
      revision: get().revision + 1,
    }),
}));
