import { useCallback, useEffect } from 'react';
import { failureMessage } from '@/lib/api/failure-message';
import type { NewReport } from '@/lib/domain';
import { authRepository, reportRepository, userRepository } from '@/lib/repositories';
import { useModerationStore } from './state';

/**
 * One in-flight load, shared by every caller.
 *
 * 커뮤니티, 장소/상세 and the 갤러리 all want the blocklist and all mount
 * independently; without this, opening the app would spend three `me()` reads
 * on the same field.
 */
let inFlight: Promise<boolean> | null = null;
/**
 * Whether a load has already succeeded this run.
 *
 * Separate from `inFlight`, which only dedupes *concurrent* calls. Without this
 * flag every later mount — and there is one on almost every navigation, since
 * the ⋯ button itself is a consumer — starts a fresh `me()`. That is not just
 * wasted reads: each one is another slow snapshot racing whatever 차단 the user
 * makes next. A failed load leaves this false, so being offline at launch does
 * not cost the blocklist for the rest of the session.
 */
let loaded = false;

async function loadBlocklist(): Promise<boolean> {
  const session = await authRepository.currentSession();
  if (!session.ok || session.data == null) return false;
  const userId = session.data.userId;
  // Paint the previous run's answer first. `me()` is a network read and the
  // feed's own fetch is racing it; without this the first frame of a cold start
  // shows the people the user blocked last week.
  useModerationStore.getState().hydrate(userId);

  // Read the revision *before* the round trip and refuse to adopt if anything
  // moved while it was out. A 차단 is one `arrayUnion` and resolves in a
  // fraction of the time this read takes, so the ordering that loses is the
  // ordering that happens: this snapshot predates the block, and adopting it
  // would put the blocked author straight back into the feed.
  const before = useModerationStore.getState().revision;
  const me = await userRepository.me();
  if (!me.ok) return false;
  if (useModerationStore.getState().revision !== before) return true;
  useModerationStore.getState().adopt(me.data.id, me.data.blockedUserIds);
  return true;
}

/** Load the blocklist once per app run. Safe to call from every list. */
function ensureBlocklist(): Promise<void> {
  if (loaded) return Promise.resolve();
  if (!inFlight) {
    inFlight = loadBlocklist().finally(() => {
      // Cleared so a later sign-in reloads rather than resolving instantly
      // against the previous account's promise.
      inFlight = null;
    });
  }
  return inFlight.then((ok) => {
    if (ok) loaded = true;
  });
}

/**
 * Forget everything about the signed-out account.
 *
 * Called by the sign-out and 탈퇴 paths. The store is in memory, so skipping
 * this would leave the next user on this device filtering their feed against
 * someone else's blocklist until `me()` answered.
 */
export function resetModeration(): void {
  inFlight = null;
  loaded = false;
  useModerationStore.getState().clear();
}

/**
 * The uids to hide, kept current.
 *
 * Returns the array rather than a filter function so a caller can pass it
 * straight to `hideBlocked` — one shared implementation of the actual filtering,
 * in the domain layer, rather than one per list.
 */
export function useBlocklist(): string[] {
  const blockedUserIds = useModerationStore((s) => s.blockedUserIds);
  useEffect(() => {
    void ensureBlocklist();
  }, []);
  return blockedUserIds;
}

/**
 * 신고 and 차단, as the sheet performs them.
 *
 * Both resolve a message on failure rather than a boolean, because the two
 * failures a user can actually hit — being signed out, and the 1000-block cap —
 * need different words, and the sheet has nowhere else to get them.
 */
export function useModeration() {
  const blockedUserIds = useBlocklist();
  const blockedNames = useModerationStore((s) => s.blockedNames);

  const report = useCallback(async (input: NewReport): Promise<string | null> => {
    const result = await reportRepository.create(input);
    return result.ok ? null : failureMessage(result.failure);
  }, []);

  const block = useCallback(
    async (userId: string, nickname?: string): Promise<string | null> => {
      const result = await userRepository.block(userId);
      if (!result.ok) return failureMessage(result.failure);
      // Adopted from the write's own response, so the feed loses the blocked
      // author on the next render rather than after a round trip.
      useModerationStore.getState().adopt(result.data.id, result.data.blockedUserIds);
      // After `adopt`, which prunes names to the server's ids — the uid just
      // blocked is among them, so the name survives. This is the only moment
      // the app will ever know it: `users` reads are closed to other users, so
      // 차단한 사용자 has no way to look it up later.
      if (nickname != null) useModerationStore.getState().remember(userId, nickname);
      return null;
    },
    [],
  );

  const unblock = useCallback(async (userId: string): Promise<string | null> => {
    const result = await userRepository.unblock(userId);
    if (!result.ok) return failureMessage(result.failure);
    useModerationStore.getState().adopt(result.data.id, result.data.blockedUserIds);
    return null;
  }, []);

  const isBlocked = useCallback(
    (userId: string) => blockedUserIds.includes(userId),
    [blockedUserIds],
  );

  return { blockedUserIds, blockedNames, isBlocked, report, block, unblock };
}
