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
