/**
 * 최애 — the artist a user collects for.
 *
 * Structural rather than additive: onboarding picks one, 홈 is keyed to the selection, the map
 * filters on it, and 커뮤니티 boards are per-artist. Mirrors the `artists` collection in
 * docs/reference/backend-contract.md.
 */
export interface Artist {
  id: string;
  name: string;
  /** One or two characters, used as the avatar fallback throughout */
  initial: string;
  imageUrl?: string;
  /** 촬영지 count, shown on 최애 찾기 */
  placeCount: number;
  /** Board members, shown in the 커뮤니티 header */
  memberCount: number;
  /** Per-artist tint for the board header */
  accentColor?: string;
}
