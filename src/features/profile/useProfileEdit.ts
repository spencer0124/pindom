import { useCallback, useEffect, useState } from 'react';
import { failureMessage } from '@/lib/api/failure-message';
import type { Artist, ProfileVisibility, Ticket, User } from '@/lib/domain';
import { artistRepository, ticketRepository, userRepository } from '@/lib/repositories';

/** 1a's rule, and the server's: twelve characters, none of them blank. */
export const NICKNAME_MAX = 12;

export interface ProfileDraft {
  nickname: string;
  bio: string;
  avatarUrl?: string;
  profileVisibility: ProfileVisibility;
}

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; user: User; artists: Artist[]; shots: Ticket[] };

/**
 * 프로필 편집: the user, the 최애 chips, and the 인증컷 an avatar can be picked
 * from — plus the save.
 *
 * `updateProfile` takes only the fields the client may write (nickname, bio,
 * avatarUrl, profileVisibility), which is exactly the draft. 1a's 사진 올리기
 * needs a picker this build does not have; 내 인증컷에서 고르기 is the user's own
 * ticket photos, which are already uploaded and already theirs.
 */
export function useProfileEdit() {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [saving, setSaving] = useState<{ busy: boolean; message: string | null }>({
    busy: false,
    message: null,
  });

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    const [user, artists, tickets] = await Promise.all([
      userRepository.me(),
      artistRepository.listMine(),
      ticketRepository.listMine(),
    ]);
    if (!user.ok) return setState({ status: 'error', message: failureMessage(user.failure) });
    setState({
      status: 'ready',
      user: user.data,
      artists: artists.ok ? artists.data : [],
      shots: tickets.ok ? tickets.data : [],
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(async (draft: ProfileDraft): Promise<boolean> => {
    setSaving({ busy: true, message: null });
    const result = await userRepository.updateProfile({
      nickname: draft.nickname.trim(),
      bio: draft.bio.trim(),
      ...(draft.avatarUrl != null && { avatarUrl: draft.avatarUrl }),
      profileVisibility: draft.profileVisibility,
    });
    if (!result.ok) {
      setSaving({ busy: false, message: failureMessage(result.failure) });
      return false;
    }
    setSaving({ busy: false, message: null });
    return true;
  }, []);

  return { state, reload: load, saving, save };
}
