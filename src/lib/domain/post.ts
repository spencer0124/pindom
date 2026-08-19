import type { Tier } from './user';

/**
 * A 커뮤니티 post — the 인증샷 자랑 feed, segmented by artist board.
 *
 * Mirrors the `posts` collection in docs/reference/backend-contract.md.
 * `likeCount` and `commentCount` are display-only: the designs show the numbers
 * but no like or comment interaction is drawn, so nothing writes them yet.
 */
export interface Post {
  id: string;
  /** The artist whose board this is. The feed is per 최애, never global */
  boardId: string;
  authorId: string;
  /** Denormalised so the feed is one query rather than one read per author */
  authorNickname: string;
  authorAvatarUrl?: string;
  /** Denormalised. Every post card renders the tier badge */
  authorTier: Tier;
  body: string;
  imageUrls: string[];
  placeId?: string;
  placeName?: string;
  /** Set when the post came from 「커뮤니티에 자랑하기」 */
  ticketId?: string;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
}

/** What 글쓰기 submits. */
export interface NewPost {
  boardId: string;
  body: string;
  imageUrls: string[];
  placeId?: string;
  ticketId?: string;
}

/** One page of the feed. `cursor` is null when there is nothing more to load. */
export interface FeedPage {
  posts: Post[];
  cursor: string | null;
}
