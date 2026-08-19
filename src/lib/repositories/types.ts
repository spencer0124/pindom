import type { Result } from '../api/types';
import type {
  FeedPage,
  LocationReading,
  NewPost,
  Place,
  PlaceWithDistance,
  Post,
  Raffle,
  RaffleEntry,
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
  /** 컬렉션 */
  listMine(): Promise<Result<Ticket[]>>;
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
  /** 커뮤니티. Pass the previous page's `cursor` to load more. */
  feed(cursor?: string | null): Promise<Result<FeedPage>>;
  getById(postId: string): Promise<Result<Post>>;
  /** 글쓰기 */
  create(input: NewPost): Promise<Result<Post>>;
}

export interface UserRepository {
  /** 마이페이지, and the ticket balance 홈 and 응모 read. */
  me(): Promise<Result<User>>;
}

export interface Repositories {
  auth: AuthRepository;
  places: PlaceRepository;
  verification: VerificationRepository;
  tickets: TicketRepository;
  raffles: RaffleRepository;
  posts: PostRepository;
  users: UserRepository;
}
