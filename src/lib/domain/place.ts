/** Drives the `MV / GANGNEUNG` caption and the 지도 filter. */
export type PlaceWorkKind = 'mv' | 'drama' | 'self';

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
  /** Latin caption shown under the Korean name — `Jumunjin Breakwater` */
  roman: string;
  description: string;
  address: string;
  /** 강원 강릉 — rendered beside the work title */
  region: string;
  /** The drama or music video the location appeared in */
  workTitle: string;
  workKind: PlaceWorkKind;
  /** Which 최애 this place belongs to. 지도 and 홈 filter on it */
  artistIds: string[];
  lat: number;
  lng: number;
  /** Verification radius. Per-place so it stays tunable without a deploy */
  radiusMeters: number;
  coverImageUrl: string;
  /** How many tickets have been minted here. Feeds 홈 recommendations */
  ticketCount: number;
  /** 인증 · 사진 · 리뷰 stats on 장소/상세 */
  verifyCount: number;
  photoCount: number;
  reviewCount: number;
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
