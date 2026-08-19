import type { Result } from '../api/types';
import type {
  Artist,
  Course,
  FeedPage,
  GalleryPhoto,
  NewReview,
  Review,
  LocationReading,
  NewPost,
  Place,
  PlaceWithDistance,
  Post,
  Raffle,
  RaffleEntry,
  Locale,
  Session,
  Ticket,
  TicketVisibility,
  User,
  VerificationResult,
} from '../domain';

/**
 * The data contract every screen sees.
 *
 * Two implementations satisfy it — fixtures and Firebase — and a screen cannot
 * tell which is running, because both sides return the same `Result<T>` and
 * neither leaks a Firestore type. See ADR 0005.
 */

export interface AuthRepository {
  signIn(email: string, password: string): Promise<Result<Session>>;
  signUp(
    email: string,
    password: string,
    nickname: string,
  ): Promise<Result<Session>>;
  signOut(): Promise<Result<void>>;
  /** Resolves `null` when nobody is signed in — that is not a failure. */
  currentSession(): Promise<Result<Session | null>>;
}

export interface ArtistRepository {
  /** 최애 찾기 — the full roster, or a filtered slice of it. */
  search(queryText?: string): Promise<Result<Artist[]>>;
  getById(artistId: string): Promise<Result<Artist>>;
  /** The artists the signed-in user follows, in the order they picked them. */
  listMine(): Promise<Result<Artist[]>>;
  follow(artistId: string): Promise<Result<void>>;
  unfollow(artistId: string): Promise<Result<void>>;
}

export interface CourseRepository {
  /** 코스 shown on 홈, for the selected 최애. */
  listForArtist(artistId: string): Promise<Result<Course[]>>;
}

export interface PlaceRepository {
  /** 지도 — pins within `radiusMeters` of the given position. */
  listNearby(
    lat: number,
    lng: number,
    radiusMeters?: number,
  ): Promise<Result<PlaceWithDistance[]>>;
  /** 홈 — 추천 촬영지, ordered by popularity rather than proximity. */
  listRecommended(
    lat?: number,
    lng?: number,
  ): Promise<Result<PlaceWithDistance[]>>;
  getById(placeId: string): Promise<Result<Place>>;
  /** 장소/상세 리뷰 list. */
  reviews(placeId: string): Promise<Result<Review[]>>;
  /** 장소/상세 갤러리 — public ticket photos taken here. */
  gallery(placeId: string): Promise<Result<GalleryPhoto[]>>;
  addReview(input: NewReview): Promise<Result<Review>>;
}

export interface VerificationRepository {
  /**
   * Submit one GPS reading and get the server's verdict.
   *
   * `verified: false` arrives as `Result.ok` — being out of radius is a normal
   * outcome, and 인증 실패 needs the numbers that come with it. Only a genuine
   * fault (offline, unknown place, signed out) is a `Result.error`.
   */
  submitReading(reading: LocationReading): Promise<Result<VerificationResult>>;
}

export interface TicketRepository {
  /** 컬렉션 — public tickets. */
  listMine(): Promise<Result<Ticket[]>>;
  /** 보관함 — the same user's private tickets. Visibility is the only difference. */
  listVault(): Promise<Result<Ticket[]>>;
  setVisibility(
    ticketId: string,
    visibility: 'public' | 'private',
  ): Promise<Result<Ticket>>;
  getById(ticketId: string): Promise<Result<Ticket>>;
  /** 티켓 발행. Requires the grant `submitReading` returned on success. */
  issue(input: {
    grantToken: string;
    photoPath: string;
    visibility: TicketVisibility;
  }): Promise<Result<Ticket>>;
}

export interface RaffleRepository {
  list(): Promise<Result<Raffle[]>>;
  getById(raffleId: string): Promise<Result<Raffle>>;
  /**
   * 응모. Fails with `errorCode: 'insufficient_tickets'` when the balance is
   * short — that code is the No edge of 잔여 티켓 충족, so branch on it rather
   * than on the message.
   */
  enter(raffleId: string): Promise<Result<RaffleEntry>>;
}

export interface PostRepository {
  /**
   * 커뮤니티. The feed is **per artist board**, never global — `boardId` is required, and
   * passing the wrong one silently shows another fandom's posts rather than erroring.
   * Pass the previous page's `cursor` to load more.
   */
  feed(boardId: string, cursor?: string | null): Promise<Result<FeedPage>>;
  getById(postId: string): Promise<Result<Post>>;
  /** 글쓰기 */
  create(input: NewPost): Promise<Result<Post>>;
}

export interface UserRepository {
  /** 마이페이지, and the ticket balance 홈 and 응모 read. */
  me(): Promise<Result<User>>;
  /** 프로필 편집. Only the fields the client is allowed to write. */
  updateProfile(input: {
    nickname?: string;
    bio?: string;
    avatarUrl?: string;
    profileVisibility?: 'public' | 'private';
  }): Promise<Result<User>>;
  /** 언어. */
  setLocale(locale: Locale): Promise<Result<User>>;
}

export interface Repositories {
  artists: ArtistRepository;
  auth: AuthRepository;
  courses: CourseRepository;
  places: PlaceRepository;
  verification: VerificationRepository;
  tickets: TicketRepository;
  raffles: RaffleRepository;
  posts: PostRepository;
  users: UserRepository;
}
