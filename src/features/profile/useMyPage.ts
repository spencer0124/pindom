import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { failureMessage } from '@/lib/api/failure-message';
import type { Artist, User } from '@/lib/domain';
import { artistRepository, authRepository, ticketRepository, userRepository } from '@/lib/repositories';

export interface MyPageData {
  user: User;
  artists: Artist[];
  /** How many tickets sit in 보관함 — the menu row prints it. */
  vaultCount: number;
  /** Both of 1a's named permissions granted. Null while unknown. */
  permissionsGranted: boolean | null;
}

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: MyPageData };

/**
 * 마이페이지's data, and its one destructive action.
 *
 * The permission row reads the OS's answer rather than remembering one: a
 * user who revoked location in Settings should see that here, and the row
 * opens Settings because that is the only place it can be changed.
 */
export function useMyPage() {
  const [state, setState] = useState<State>({ status: 'loading' });

  const load = useCallback(async (silent = false) => {
    if (!silent) setState({ status: 'loading' });
    const [user, artists, vault] = await Promise.all([
      userRepository.me(),
      artistRepository.listMine(),
      ticketRepository.listVault(),
    ]);
    if (!user.ok) return setState({ status: 'error', message: failureMessage(user.failure) });

    let permissionsGranted: boolean | null = null;
    try {
      const [location, camera] = await Promise.all([
        Location.getForegroundPermissionsAsync(),
        Camera.getCameraPermissionsAsync(),
      ]);
      permissionsGranted = location.granted && camera.granted;
    } catch {
      permissionsGranted = null;
    }

    setState({
      status: 'ready',
      data: {
        user: user.data,
        artists: artists.ok ? artists.data : [],
        vaultCount: vault.ok ? vault.data.length : 0,
        permissionsGranted,
      },
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const signOut = useCallback(async () => {
    const result = await authRepository.signOut();
    return result.ok;
  }, []);

  const reload = useCallback(() => load(), [load]);
  const refresh = useCallback(() => load(true), [load]);

  return { state, reload, refresh, signOut };
}
