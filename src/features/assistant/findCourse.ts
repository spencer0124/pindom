import type { Course } from '@/lib/domain';
import { artistRepository, courseRepository } from '@/lib/repositories';

/**
 * Read one `courses` document by id.
 *
 * There is no `getById` on courses (recorded in the Assistant checklist), so
 * the artist lists are searched: the selected 최애 first, then the followed
 * ones. The lists are short and a course names its artist, so the first list
 * is almost always the one. Null when no list carries the id.
 *
 * Shared by 추천 코스 and the chat's 지도에서 코스 보기 card (fidelity decision
 * 22), so the two read the same document the same way.
 */
export async function findCourse(courseId: string, selectedArtistId: string | null): Promise<Course | null> {
  const artistIds = [selectedArtistId, ...(await followedIds())].filter(
    (id, i, all): id is string => id != null && all.indexOf(id) === i,
  );
  for (const artistId of artistIds) {
    const courses = await courseRepository.listForArtist(artistId);
    const course = courses.ok ? courses.data.find((c) => c.id === courseId) : undefined;
    if (course != null) return course;
  }
  return null;
}

async function followedIds(): Promise<string[]> {
  const mine = await artistRepository.listMine();
  return mine.ok ? mine.data.map((a) => a.id) : [];
}
