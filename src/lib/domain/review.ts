import type { Tier } from './user';

/**
 * A 리뷰 on 장소/상세.
 *
 * Mirrors the `places/{placeId}/reviews` subcollection in
 * docs/reference/backend-contract.md — a subcollection because reviews are only ever read in
 * the context of one place, and the parent carries the count.
 */
export interface Review {
  id: string;
  placeId: string;
  authorId: string;
  authorNickname: string;
  /** Denormalised. Every review card renders the tier badge */
  authorTier: Tier;
  text: string;
  /** Chips rendered under the body */
  tags: string[];
  likeCount: number;
  createdAt: Date;
}

/** What 리뷰 쓰기 submits. */
export interface NewReview {
  placeId: string;
  text: string;
  tags: string[];
}

/**
 * One photo in a place's 갤러리.
 *
 * Written by `issueTicket`, never by the client, so a gallery entry cannot exist without a
 * verified ticket behind it — the gallery is a wall of proven presence, not an upload feed.
 */
export interface GalleryPhoto {
  id: string;
  placeId: string;
  ticketId: string;
  authorId: string;
  photoUrl: string;
  createdAt: Date;
}
