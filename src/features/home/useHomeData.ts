import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KOREA_CENTRE,
  readPosition,
  readVisitedPlaceIds,
  useDiscoveryStore,
} from '@/features/discovery';
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
  /** 추천 촬영지 for the selected 최애, re-sorted by distance for the 거리순 label. */
  places: PlaceWithDistance[];
  courses: Course[];
  /** True while a switched 최애's 코스 are still loading — the section skeletons. */
  coursesLoading: boolean;
  /** Places this user has already verified, for the 인증 완료 stamp on each row. */
  visitedPlaceIds: string[];
  /**
   * How many of the selected 최애's places the user has verified — 1a's
   * `{최애} n곳 · m곳 인증`, where `m` is that 최애's count, not the global one.
   */
  verifiedCount: number;
  /**
   * False when location permission was refused or no fix is available yet.
   *
   * The repositories return `distanceMeters: 0` in that case, which would render
   * as a confident "0m" next to every 촬영지. Screens must hide the distance
   * rather than print it — an unknown distance is not a distance of zero.
   */
  hasPosition: boolean;
}

/** Everything on 홈 that does not depend on which 최애 is selected. */
interface Base {
  user: User;
  artists: Artist[];
  closingRaffles: Raffle[];
  places: PlaceWithDistance[];
  /** Every place in the country, read once so the per-최애 verified count is whole. */
  allPlaces: PlaceWithDistance[];
  visitedPlaceIds: string[];
  hasPosition: boolean;
}

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: HomeData };

/**
 * Reads everything 홈 renders.
 *
 * The 최애 selection lives in `@/features/discovery` rather than here, because
 * 지도 writes it too — see that store's note. What stays here is the split
 * between the fetches that ignore the selection and the one that does not:
 * changing 최애 re-fetches 코스 and re-filters the place list, but does not throw
 * the screen back to a spinner for data that has not changed.
 *
 * Position comes from the same slice module, so the permission dialog appears
 * once per launch no matter which Discovery screen the user opens first.
 */
export function useHomeData() {
  const [base, setBase] = useState<{ status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: Base }>({
    status: 'loading',
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  const selectedArtistId = useDiscoveryStore((s) => s.selectedArtistId);
  const seed = useDiscoveryStore((s) => s.seed);
  const reconcile = useDiscoveryStore((s) => s.reconcile);

  const load = useCallback(async (silent = false) => {
    // A silent load keeps the screen up while the data is re-read — used when
    // 홈 regains focus after 최애 찾기 or 티켓 발행 changed what it shows. The
    // fixture path is deliberately slow, and a flash of the loader on every
    // return would read as a bug.
    if (!silent) setBase({ status: 'loading' });

    const position = await readPosition();
    const origin = position ?? KOREA_CENTRE;

    const [userResult, artistsResult, rafflesResult, placesResult, allPlacesResult, visitedPlaceIds] =
      await Promise.all([
        userRepository.me(),
        artistRepository.listMine(),
        raffleRepository.list(),
        placeRepository.listRecommended(position?.lat, position?.lng),
        // `listRecommended` is a ranked subset; the 인증 count needs every place
        // of the 최애, or a verified place outside the ranking goes uncounted.
        placeRepository.listAll(origin.lat, origin.lng),
        readVisitedPlaceIds(),
      ]);

    if (!userResult.ok)
      return setBase({ status: 'error', message: failureMessage(userResult.failure) });
    if (!artistsResult.ok)
      return setBase({ status: 'error', message: failureMessage(artistsResult.failure) });
    if (!rafflesResult.ok)
      return setBase({ status: 'error', message: failureMessage(rafflesResult.failure) });
    if (!placesResult.ok)
      return setBase({ status: 'error', message: failureMessage(placesResult.failure) });
    if (!allPlacesResult.ok)
      return setBase({ status: 'error', message: failureMessage(allPlacesResult.failure) });

    const artists = artistsResult.data;
    // A default, not a decision — `seed` is a no-op once the user has picked.
    seed(
      artists.find((a) => a.id === userResult.data.followedArtistIds[0])?.id ??
        artists[0]?.id ??
        null,
    );
    // And a correction when the pick is no longer followed.
    reconcile(artists.map((a) => a.id));

    setBase({
      status: 'ready',
      data: {
        user: userResult.data,
        artists,
        closingRaffles: rafflesResult.data
          .filter((r) => r.status === 'open')
          .sort((a, b) => a.closesAt.getTime() - b.closesAt.getTime()),
        // listRecommended ranks by popularity; the section is labelled 거리순, so
        // the order shown is by distance. See docs/plans for the note on that
        // mismatch between the contract and the design.
        places: [...placesResult.data].sort((a, b) => a.distanceMeters - b.distanceMeters),
        allPlaces: allPlacesResult.data,
        visitedPlaceIds,
        hasPosition: position != null,
      },
    });
  }, [seed, reconcile]);

  useEffect(() => {
    void load();
  }, [load]);

  // 코스 are per-artist, so this cannot join the batch above and has to re-run
  // when the selection changes. A failure here empties the section rather than
  // failing the screen: 홈 is still useful without it.
  //
  // The previous 최애's cards are cleared before the read, not after: 1a
  // re-keys every block in one render, and a moment of 루미나's cards under an
  // 에코라인 지역 코스 title would be a lie the skeleton is not.
  useEffect(() => {
    setCourses([]);
    if (selectedArtistId == null) {
      setCoursesLoading(false);
      return;
    }
    let live = true;
    setCoursesLoading(true);
    void courseRepository.listForArtist(selectedArtistId).then((result) => {
      if (!live) return;
      setCourses(result.ok ? result.data : []);
      setCoursesLoading(false);
    });
    return () => {
      live = false;
    };
  }, [selectedArtistId]);

  const state = useMemo<State>(() => {
    if (base.status !== 'ready') return base;

    const selectedArtist = base.data.artists.find((a) => a.id === selectedArtistId) ?? null;
    const { allPlaces, ...rest } = base.data;
    const ofArtist = (p: PlaceWithDistance) =>
      selectedArtist == null || p.artistIds.includes(selectedArtist.id);

    return {
      status: 'ready',
      data: {
        ...rest,
        selectedArtist,
        verifiedCount: allPlaces.filter(
          (p) => ofArtist(p) && base.data.visitedPlaceIds.includes(p.id),
        ).length,
        // The section is titled {최애}의 촬영지, so it has to be that 최애's.
        // `listRecommended` ranks across every artist — the filter is the
        // screen's, because the title is the screen's.
        places: base.data.places.filter(ofArtist),
        courses,
        coursesLoading,
      },
    };
  }, [base, courses, coursesLoading, selectedArtistId]);

  // Stable identities: 홈 hangs a focus effect off `refresh`, and a fresh
  // closure per render would re-fire it on every render.
  const reload = useCallback(() => load(), [load]);
  const refresh = useCallback(() => load(true), [load]);

  return { state, reload, refresh };
}
