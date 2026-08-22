import * as Location from 'expo-location';
import { useCallback, useState } from 'react';
import { failureMessage } from '@/lib/api/failure-message';
import { artistRepository, authRepository } from '@/lib/repositories';

export type AuthMode = 'signIn' | 'signUp';

type State = { status: 'idle' } | { status: 'busy' } | { status: 'error'; message: string };

/**
 * Where to go after signing in. `artist` when the account follows nobody —
 * the rest of the app is keyed to a 최애, so the flow stops there first.
 */
export type Destination = 'home' | 'artist';

/**
 * 온보딩's one action in two modes — 이메일로 로그인 and 시작하기.
 *
 * On success the location permission is requested here, which is where 1a
 * asks for it (its note under the buttons names it), rather than on the first
 * screen that happens to need a distance. A refusal is not a failure: every
 * Discovery screen renders without one.
 */
export function useSignIn() {
  const [state, setState] = useState<State>({ status: 'idle' });

  const submit = useCallback(
    async (mode: AuthMode, email: string, password: string, nickname: string): Promise<Destination | null> => {
      setState({ status: 'busy' });
      const result =
        mode === 'signIn'
          ? await authRepository.signIn(email.trim(), password)
          : await authRepository.signUp(email.trim(), password, nickname.trim());
      if (!result.ok) {
        setState({ status: 'error', message: failureMessage(result.failure) });
        return null;
      }

      try {
        await Location.requestForegroundPermissionsAsync();
      } catch {
        // Refused or unavailable — the screens cope.
      }

      const mine = await artistRepository.listMine();
      setState({ status: 'idle' });
      return mine.ok && mine.data.length > 0 ? 'home' : 'artist';
    },
    [],
  );

  return { state, submit };
}
