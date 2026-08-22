import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { failureMessage } from '@/lib/api/failure-message';
import type { Artist, Course, PlaceWithDistance, Raffle, User } from '@/lib/domain';
import {
  artistRepository,
  courseRepository,
  placeRepository,
  raffleRepository,
  userRepository,
} from '@/lib/repositories';

export interface HomeData {
  user: User;
  artists: Artist[];
  /** The 최애 홈 is keyed to. Every section title and filter reads from this. */
  selectedArtist: Artist | null;
  /** Open raffles, soonest deadline first. 마감 임박 응모 shows the first two. */
  closingRaffles: Raffle[];
  /** 추천 촬영지, re-sorted by distance because the section is labelled 거리순. */
  places: PlaceWithDistance[];
  courses: Course[];
  /**
   * False when location permission was refused or no fix is available yet.
   *
   * The repositories return `distanceMeters: 0` in that case, which would render
   * as a confident "0m" next to every 촬영지. Screens must hide the distance
   * rather than print it — an unknown distance is not a distance of zero.
   */
  hasPosition: boolean;
}

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: HomeData };

/**
 * Reads the user's position, then everything 홈 renders, in one hook.
 *
 * Location is asked for here because proximity is what this screen is *for* —
 * the 촬영지 list is ordered by it and the nearest distance is the one value the
 * direction paints in the accent colour. Refusal is not an error: the screen
 * renders without distances.
 *
 * TODO(온보딩): 1a asks for location and camera permission on the onboarding
 * screen. Once that screen exists the request belongs there, and 홈 should read
 * the last known position rather than prompt.
 */
async function readPosition(): Promise<{ lat: number; lng: number } | null> {
  try {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) return null;

    // Last known first: it returns immediately and 홈 only needs a distance
    // good enough to sort by. The 50m decision is the server's, never this.
    const last = await Location.getLastKnownPositionAsync();
    const fix = last ?? (await Location.getCurrentPositionAsync({}));
    return { lat: fix.coords.latitude, lng: fix.coords.longitude };
  } catch {
    return null;
  }
}

export function useHomeData() {
  const [state, setState] = useState<State>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });

    const position = await readPosition();

    const [userResult, artistsResult, rafflesResult, placesResult] = await Promise.all([
      userRepository.me(),
      artistRepository.listMine(),
      raffleRepository.list(),
      placeRepository.listRecommended(position?.lat, position?.lng),
    ]);

    if (!userResult.ok) return setState({ status: 'error', message: failureMessage(userResult.failure) });
    if (!artistsResult.ok)
      return setState({ status: 'error', message: failureMessage(artistsResult.failure) });
    if (!rafflesResult.ok)
      return setState({ status: 'error', message: failureMessage(rafflesResult.failure) });
    if (!placesResult.ok)
      return setState({ status: 'error', message: failureMessage(placesResult.failure) });

    const artists = artistsResult.data;
    const selectedArtist =
      artists.find((a) => a.id === userResult.data.followedArtistIds[0]) ?? artists[0] ?? null;

    // Courses are per-artist, so this one cannot join the batch above.
    const coursesResult = selectedArtist
      ? await courseRepository.listForArtist(selectedArtist.id)
      : null;

    setState({
      status: 'ready',
      data: {
        user: userResult.data,
        artists,
        selectedArtist,
        closingRaffles: rafflesResult.data
          .filter((r) => r.status === 'open')
          .sort((a, b) => a.closesAt.getTime() - b.closesAt.getTime()),
        // listRecommended ranks by popularity; the section is labelled 거리순, so
        // the order shown is by distance. See docs/plans for the note on that
        // mismatch between the contract and the design.
        places: [...placesResult.data].sort((a, b) => a.distanceMeters - b.distanceMeters),
        courses: coursesResult?.ok ? coursesResult.data : [],
        hasPosition: position != null,
      },
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { state, reload: load };
}
