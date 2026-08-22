import { useCallback, useEffect, useMemo, useState } from 'react';
import { failureMessage } from '@/lib/api/failure-message';
import type { Artist, PlaceWithDistance } from '@/lib/domain';
import { artistRepository, placeRepository } from '@/lib/repositories';
import { KOREA_CENTRE, readPosition, type Position } from './position';
import { useDiscoveryStore } from './state';
import { readVisitedPlaceIds } from './visited';

export interface MapData {
  artists: Artist[];
  selectedArtist: Artist | null;
  /** The selected 최애's 촬영지, nearest first, narrowed by the search box. */
  places: PlaceWithDistance[];
  visitedPlaceIds: string[];
  /** Where the camera opens, and what distances were measured from. */
  origin: Position;
  /** False when there is no fix. Distances are hidden rather than shown as 0m. */
  hasPosition: boolean;
}

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: MapData };

interface Base {
  artists: Artist[];
  /** Every 촬영지 in the country. `listAll` is not a radius query — see its note. */
  places: PlaceWithDistance[];
  visitedPlaceIds: string[];
  origin: Position;
  hasPosition: boolean;
}

/** 아티스트 · 촬영지 · 지역 — the three things 1a's placeholder promises to search. */
function matches(place: PlaceWithDistance, query: string, artistName?: string): boolean {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) return true;
  return [place.name, place.roman, place.region, place.workTitle, artistName]
    .filter((field): field is string => field != null)
    .some((field) => field.toLowerCase().includes(needle));
}

/**
 * Reads everything 지도 renders.
 *
 * Two things are worth knowing before changing it.
 *
 * **The fetch is not filtered.** `listAll` returns every 촬영지 in the country,
 * because 지도 opens at a scale that shows all of it and a pin must not vanish
 * for being far away. Narrowing by 최애 and by the search box happens here, over
 * data already in hand, so typing does not hit the network.
 *
 * **The origin is not always the user.** With no fix, distances are measured
 * from the centre of the country purely to give the list a stable order — and
 * `hasPosition` is false, so no screen prints them.
 */
export function useMapData(query: string) {
  const [base, setBase] = useState<
    { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: Base }
  >({ status: 'loading' });

  const selectedArtistId = useDiscoveryStore((s) => s.selectedArtistId);
  const seed = useDiscoveryStore((s) => s.seed);

  const load = useCallback(async () => {
    setBase({ status: 'loading' });

    const position = await readPosition();
    const origin = position ?? KOREA_CENTRE;

    const [placesResult, artistsResult, visitedPlaceIds] = await Promise.all([
      placeRepository.listAll(origin.lat, origin.lng),
      artistRepository.listMine(),
      readVisitedPlaceIds(),
    ]);

    if (!placesResult.ok)
      return setBase({ status: 'error', message: failureMessage(placesResult.failure) });
    if (!artistsResult.ok)
      return setBase({ status: 'error', message: failureMessage(artistsResult.failure) });

    // Only matters when 지도 is the first Discovery screen opened; 홈 usually
    // seeds this first, and `seed` will not overwrite a real selection.
    seed(artistsResult.data[0]?.id ?? null);

    setBase({
      status: 'ready',
      data: {
        artists: artistsResult.data,
        places: placesResult.data,
        visitedPlaceIds,
        origin,
        hasPosition: position != null,
      },
    });
  }, [seed]);

  useEffect(() => {
    void load();
  }, [load]);

  const state = useMemo<State>(() => {
    if (base.status !== 'ready') return base;

    const selectedArtist = base.data.artists.find((a) => a.id === selectedArtistId) ?? null;
    const forArtist =
      selectedArtist != null
        ? base.data.places.filter((p) => p.artistIds.includes(selectedArtist.id))
        : base.data.places;

    return {
      status: 'ready',
      data: {
        ...base.data,
        selectedArtist,
        places: forArtist.filter((p) => matches(p, query, selectedArtist?.name)),
      },
    };
  }, [base, query, selectedArtistId]);

  return { state, reload: load };
}
