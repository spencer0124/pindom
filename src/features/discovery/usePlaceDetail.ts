import { useCallback, useEffect, useState } from 'react';
import { failureMessage } from '@/lib/api/failure-message';
import type { Artist, GalleryPhoto, Place, Review } from '@/lib/domain';
import { distanceMeters } from '@/lib/geo';
import { artistRepository, placeRepository } from '@/lib/repositories';
import { readPosition } from './position';
import { useDiscoveryStore } from './state';
import { readVisitedPlaceIds } from './visited';

export interface PlaceDetailData {
  place: Place;
  /** The 최애 the hero badge names. Null if the place has no artist on it. */
  artist: Artist | null;
  gallery: GalleryPhoto[];
  reviews: Review[];
  /** True when this user already has a ticket from here. */
  visited: boolean;
  /** Null when there is no fix — the 현재 거리 stat is dropped rather than faked. */
  distance: number | null;
}

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: PlaceDetailData };

/**
 * Reads everything 장소/상세 renders, for one `placeId`.
 *
 * Distance is computed here rather than fetched. `getById` returns a `Place`,
 * not a `PlaceWithDistance`, because a place reached from a deep link has no
 * position behind it — the caller may not have one either, which is why this
 * can resolve to null. It is feedback in any case: the 50m decision belongs to
 * `verifyLocation`, server-side (see `src/lib/geo.ts`).
 *
 * The artist is resolved from the place, preferring the one already selected in
 * the Discovery slice. A place can belong to several 최애, and labelling it with
 * whichever happens to be first would rename the badge depending on how you got
 * here.
 */
export function usePlaceDetail(placeId: string | undefined) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const selectedArtistId = useDiscoveryStore((s) => s.selectedArtistId);

  const load = useCallback(async () => {
    if (placeId == null) {
      return setState({ status: 'error', message: '촬영지를 찾을 수 없어요.' });
    }
    setState({ status: 'loading' });

    const position = await readPosition();

    const [placeResult, galleryResult, reviewsResult, visitedPlaceIds] = await Promise.all([
      placeRepository.getById(placeId),
      placeRepository.gallery(placeId),
      placeRepository.reviews(placeId),
      readVisitedPlaceIds(),
    ]);

    if (!placeResult.ok) {
      return setState({ status: 'error', message: failureMessage(placeResult.failure) });
    }
    const place = placeResult.data;

    const artistId =
      selectedArtistId != null && place.artistIds.includes(selectedArtistId)
        ? selectedArtistId
        : place.artistIds[0];
    const artistResult = artistId != null ? await artistRepository.getById(artistId) : null;

    setState({
      status: 'ready',
      data: {
        place,
        artist: artistResult?.ok ? artistResult.data : null,
        // The gallery and the tips are secondary: a failure on either empties
        // that block rather than replacing the whole screen, which still has
        // the place, the stats and the 인증 button on it.
        gallery: galleryResult.ok ? galleryResult.data : [],
        reviews: reviewsResult.ok ? reviewsResult.data : [],
        visited: visitedPlaceIds.includes(place.id),
        distance:
          position != null
            ? distanceMeters(position, { lat: place.lat, lng: place.lng })
            : null,
      },
    });
  }, [placeId, selectedArtistId]);

  useEffect(() => {
    void load();
  }, [load]);

  /**
   * Post a 촬영 팁 and fold it into the list.
   *
   * The new review is prepended from the repository's response rather than
   * re-fetching: `addReview` returns the stored document, so a round trip would
   * ask the server for something already in hand.
   */
  const addReview = useCallback(
    async (text: string, tags: string[]) => {
      if (placeId == null) return false;
      const result = await placeRepository.addReview({ placeId, text, tags });
      if (!result.ok) return false;

      setState((current) =>
        current.status === 'ready'
          ? {
              status: 'ready',
              data: { ...current.data, reviews: [result.data, ...current.data.reviews] },
            }
          : current,
      );
      return true;
    },
    [placeId],
  );

  return { state, reload: load, addReview };
}
