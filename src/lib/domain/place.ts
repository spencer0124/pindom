/**
 * 촬영지 — a filming location a user can travel to and verify against.
 *
 * Mirrors the `places` collection in docs/reference/backend-contract.md.
 * `lat`/`lng` come from a Firestore GeoPoint; `createdAt` from a Timestamp.
 * Both are converted in the repository, never in a screen.
 */
export interface Place {
  id: string;
  name: string;
  description: string;
  address: string;
  /** The drama or music video the location appeared in */
  workTitle: string;
  lat: number;
  lng: number;
  /** Verification radius. Per-place so it stays tunable without a deploy */
  radiusMeters: number;
  coverImageUrl: string;
  /** How many tickets have been minted here. Feeds 홈 recommendations */
  ticketCount: number;
  createdAt: Date;
}

/**
 * A place plus its distance from the user.
 *
 * Distance is computed against the caller's position rather than stored, so it
 * is a separate type — 지도 and 홈 need it, 장소/상세 opened from a deep link
 * may not have a position to measure from.
 */
export interface PlaceWithDistance extends Place {
  distanceMeters: number;
}
