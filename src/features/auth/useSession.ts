import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@/lib/domain';
import { authRepository } from '@/lib/repositories';

type State =
  | { status: 'loading' }
  | { status: 'ready'; session: Session | null };

/**
 * Who is signed in — the question the tab layout asks before it renders.
 *
 * Null is an answer, not a failure: it sends the app to 온보딩. A repository
 * error is treated the same way, because a tab bar over screens that cannot
 * load is worse than the landing page.
 */
export function useSession() {
  const [state, setState] = useState<State>({ status: 'loading' });

  const load = useCallback(async () => {
    const result = await authRepository.currentSession();
    setState({ status: 'ready', session: result.ok ? result.data : null });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { state, reload: load };
}
