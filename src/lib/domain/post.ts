/**
 * A 커뮤니티 post — the 인증샷 자랑 feed.
 *
 * Mirrors the `posts` collection in docs/reference/backend-contract.md.
 * `likeCount` and `commentCount` are display-only: the designs show the numbers
 * but no like or comment interaction is drawn, so nothing writes them yet.
 */
export interface Post {
  id: string;
  authorId: string;
  /** Denormalised so the feed is one query rather than one read per author */
  authorNickname: string;
  authorAvatarUrl?: string;
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
