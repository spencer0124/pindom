import { useCallback, useEffect, useState } from 'react';
import { failureMessage } from '@/lib/api/failure-message';
import type { Artist, Course, PlaceWithDistance } from '@/lib/domain';
import { artistRepository, placeRepository } from '@/lib/repositories';
import {
  KOREA_CENTRE,
  readPosition,
  readVisitedPlaceIds,
  useDiscoveryStore,
  type Position,
} from '@/features/discovery';
import { findCourse } from './findCourse';

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
    const course = await findCourse(courseId, selectedArtistId);
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
