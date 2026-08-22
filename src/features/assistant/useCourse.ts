import { useCallback, useEffect, useState } from 'react';
import { failureMessage } from '@/lib/api/failure-message';
import type { Artist, Course, PlaceWithDistance } from '@/lib/domain';
import { artistRepository, courseRepository, placeRepository } from '@/lib/repositories';
import {
  KOREA_CENTRE,
  readPosition,
  readVisitedPlaceIds,
  useDiscoveryStore,
  type Position,
} from '@/features/discovery';

export interface CourseData {
  course: Course;
  artist: Artist | null;
  /** In the course's walk order. */
  stops: PlaceWithDistance[];
  visitedPlaceIds: string[];
  origin: Position;
  hasPosition: boolean;
}

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: CourseData };

/**
 * 추천 코스's data: the course document and its stops in walk order.
 *
 * A `courses` document carries the ordered `placeIds` and nothing about the
 * legs — travel time, the shooting window, nearby food are the route API's,
 * which is the backend's to call (external-apis.md §2). So the screen shows
 * the stops, in order, on the map and in a list, and not numbers it does not
 * have.
 */
export function useCourse(courseId: string | undefined) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const selectedArtistId = useDiscoveryStore((s) => s.selectedArtistId);

  const load = useCallback(async () => {
    if (courseId == null) return setState({ status: 'error', message: '코스를 찾을 수 없어요.' });
    setState({ status: 'loading' });

    const position = await readPosition();
    const origin = position ?? KOREA_CENTRE;
    // There is no getById on courses; the list for the artist is short and
    // the course names its artist, so the selected one is tried first.
    const artistIds = [selectedArtistId, ...(await followedIds())].filter(
      (id, i, all): id is string => id != null && all.indexOf(id) === i,
    );
    let course: Course | null = null;
    for (const artistId of artistIds) {
      const courses = await courseRepository.listForArtist(artistId);
      course = courses.ok ? (courses.data.find((c) => c.id === courseId) ?? null) : null;
      if (course) break;
    }
    if (course == null) return setState({ status: 'error', message: '코스를 찾을 수 없어요.' });

    const [places, artist, visitedPlaceIds] = await Promise.all([
      placeRepository.listAll(origin.lat, origin.lng),
      artistRepository.getById(course.artistId),
      readVisitedPlaceIds(),
    ]);
    if (!places.ok) return setState({ status: 'error', message: failureMessage(places.failure) });

    const byId = new Map(places.data.map((p) => [p.id, p]));
    const stops = course.placeIds.map((id) => byId.get(id)).filter((p): p is PlaceWithDistance => p != null);

    setState({
      status: 'ready',
      data: {
        course,
        artist: artist.ok ? artist.data : null,
        stops,
        visitedPlaceIds,
        origin,
        hasPosition: position != null,
      },
    });
  }, [courseId, selectedArtistId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { state, reload: load };
}

async function followedIds(): Promise<string[]> {
  const mine = await artistRepository.listMine();
  return mine.ok ? mine.data.map((a) => a.id) : [];
}
