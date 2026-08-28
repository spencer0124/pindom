/**
 * 코스 — a curated, ordered itinerary of places, shown on 홈.
 *
 * Read-only to the client. Mirrors the `courses` collection in
 * docs/reference/backend-contract.md.
 */
export interface Course {
  id: string;
  artistId: string;
  name: string;
  description: string;
  /** Ordered. The walk order is the point of a course */
  placeIds: string[];
  placeCount: number;
}

/**
 * The drive through a course's stops, as 카카오모빌리티 draws it.
 *
 * `path` is road geometry, not the straight segments between stops the client
 * could derive itself — which is the whole reason it is a server call: the
 * coastline a course follows is not the line between its ends.
 */
export interface CourseRoute {
  path: { lat: number; lng: number }[];
  distanceMeters: number;
  durationSeconds: number;
}
