import { Failure, ResultHelper, type Result } from '../api/types';
import type {
  Artist,
  FeedPage,
  Locale,
  NewReview,
  Review,
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
import { distanceMeters } from '../geo';
import {
  mockArtists,
  mockCourses,
  mockDelay,
  mockGallery,
  mockPlaces,
  mockPosts,
  mockRaffles,
  mockReviews,
  mockTickets,
  mockUser,
  mockVerificationSequence,
} from '../../mocks';
import type { Repositories } from './types';

/**
 * The fixture implementation of `Repositories`.
 *
 * State is mutable and module-scoped, deliberately: minting a ticket has to
 * raise the balance and entering a raffle has to lower it, or the
 * `잔여 티켓 충족?` branch on 응모 is never exercised and 컬렉션 never grows.
 * It resets on reload, which is the right lifetime for fixtures.
 *
 * Nothing here imports Firebase. `src/lib/repositories/index.ts` only loads
 * this module or the Firebase one, never both.
 */

// ── Mutable fixture state ──

let session: Session | null = { userId: mockUser.id, email: mockUser.email };
let user: User = { ...mockUser };
let tickets: Ticket[] = [...mockTickets];
let posts: Post[] = [...mockPosts];
let reviews: Review[] = [...mockReviews];
const entries: RaffleEntry[] = [];

/** How far through `mockVerificationSequence` each verify session has walked. */
const verifyProgress = new Map<string, number>();

let sequence = 0;
const nextId = (prefix: string) => `${prefix}-${(sequence += 1)}`;

const FEED_PAGE_SIZE = 4;

// ── Helpers ──

function requireSession(): Session | null {
  return session;
}

function unauthenticated<T>(): Result<T> {
  return ResultHelper.error(
    Failure.firebase('unauthenticated', '로그인이 필요합니다.'),
  );
}

function notFound<T>(what: string): Result<T> {
  return ResultHelper.error(Failure.firebase('not-found', `${what} 없음`));
}

function withDistance(
  place: Place,
  from?: { lat: number; lng: number },
): PlaceWithDistance {
  return {
    ...place,
    distanceMeters: from ? distanceMeters(from, place) : 0,
  };
}

// ── Implementation ──

export const mockRepositories: Repositories = {
  artists: {
    async search(queryText) {
      const q = (queryText ?? '').trim();
      const hits = q
        ? mockArtists.filter((a) => a.name.includes(q) || a.initial.includes(q.toUpperCase()))
        : mockArtists;
      return mockDelay(ResultHelper.ok([...hits]));
    },

    async getById(artistId) {
      const artist = mockArtists.find((a) => a.id === artistId);
      return mockDelay(artist ? ResultHelper.ok(artist) : notFound<Artist>('아티스트'));
    },

    async listMine() {
      if (!session) return mockDelay(unauthenticated<Artist[]>());
      // Ordered by the user's own list, not by the fixture order — the first followed artist
      // is the one 홈 opens on.
      const mine = user.followedArtistIds
        .map((id) => mockArtists.find((a) => a.id === id))
        .filter((a): a is Artist => Boolean(a));
      return mockDelay(ResultHelper.ok(mine));
    },

    async follow(artistId) {
      if (!session) return mockDelay(unauthenticated<void>());
      if (!user.followedArtistIds.includes(artistId)) {
        user = { ...user, followedArtistIds: [...user.followedArtistIds, artistId] };
      }
      return mockDelay(ResultHelper.ok<void>(undefined));
    },

    async unfollow(artistId) {
      if (!session) return mockDelay(unauthenticated<void>());
      user = {
        ...user,
        followedArtistIds: user.followedArtistIds.filter((id) => id !== artistId),
      };
      return mockDelay(ResultHelper.ok<void>(undefined));
    },
  },

  courses: {
    async listForArtist(artistId) {
      const hits = mockCourses.filter((c) => c.artistId === artistId);
      return mockDelay(ResultHelper.ok(hits));
    },
  },

  auth: {
    async signIn(email) {
      session = { userId: user.id, email };
      user = { ...user, email };
      return mockDelay(ResultHelper.ok(session));
    },

    async signUp(email, _password, nickname) {
      user = { ...mockUser, email, nickname, ticketBalance: 0, ticketsIssued: 0 };
      tickets = [];
      session = { userId: user.id, email };
      return mockDelay(ResultHelper.ok(session));
    },

    async signOut() {
      session = null;
      return mockDelay(ResultHelper.ok<void>(undefined));
    },

    async currentSession() {
      return mockDelay(ResultHelper.ok(requireSession()));
    },
  },

  places: {
    async listNearby(lat, lng, radius = 50_000) {
      const near = mockPlaces
        .map((p) => withDistance(p, { lat, lng }))
        .filter((p) => p.distanceMeters <= radius)
        .sort((a, b) => a.distanceMeters - b.distanceMeters);
      return mockDelay(ResultHelper.ok(near));
    },

    async listRecommended(lat, lng) {
      const from = lat !== undefined && lng !== undefined ? { lat, lng } : undefined;
      const ranked = [...mockPlaces]
        .sort((a, b) => b.ticketCount - a.ticketCount)
        .map((p) => withDistance(p, from));
      return mockDelay(ResultHelper.ok(ranked));
    },

    async getById(placeId) {
      const place = mockPlaces.find((p) => p.id === placeId);
      return mockDelay(place ? ResultHelper.ok(place) : notFound<Place>('촬영지'));
    },

    async reviews(placeId) {
      const hits = reviews
        .filter((r) => r.placeId === placeId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return mockDelay(ResultHelper.ok(hits));
    },

    async gallery(placeId) {
      const hits = mockGallery
        .filter((g) => g.placeId === placeId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return mockDelay(ResultHelper.ok(hits));
    },

    async addReview(input: NewReview) {
      if (!session) return mockDelay(unauthenticated<Review>());
      const review: Review = {
        id: nextId('review'),
        placeId: input.placeId,
        authorId: user.id,
        authorNickname: user.nickname,
        authorTier: user.tier,
        text: input.text,
        tags: input.tags,
        likeCount: 0,
        createdAt: new Date(),
      };
      reviews = [review, ...reviews];
      return mockDelay(ResultHelper.ok(review));
    },
  },

  verification: {
    async submitReading(reading: LocationReading) {
      if (!session) return mockDelay(unauthenticated<VerificationResult>());

      const sessionId = reading.sessionId ?? nextId('verify-session');
      const step = verifyProgress.get(sessionId) ?? 0;
      const scripted =
        mockVerificationSequence[
          Math.min(step, mockVerificationSequence.length - 1)
        ];
      verifyProgress.set(sessionId, step + 1);

      const result: VerificationResult = {
        ...scripted,
        sessionId,
        ...(scripted.verified && {
          grant: {
            token: nextId('grant'),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          },
        }),
      };
      return mockDelay(ResultHelper.ok(result));
    },
  },

  tickets: {
    async listMine() {
      if (!session) return mockDelay(unauthenticated<Ticket[]>());
      const mine = tickets
        .filter((t) => t.visibility === 'public')
        .sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime());
      return mockDelay(ResultHelper.ok(mine));
    },

    async listVault() {
      if (!session) return mockDelay(unauthenticated<Ticket[]>());
      const vault = tickets
        .filter((t) => t.visibility === 'private')
        .sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime());
      return mockDelay(ResultHelper.ok(vault));
    },

    async setVisibility(ticketId, visibility) {
      if (!session) return mockDelay(unauthenticated<Ticket>());
      const found = tickets.find((t) => t.id === ticketId);
      if (!found) return mockDelay(notFound<Ticket>('티켓'));
      const updated = { ...found, visibility };
      tickets = tickets.map((t) => (t.id === ticketId ? updated : t));
      return mockDelay(ResultHelper.ok(updated));
    },

    async getById(ticketId) {
      const ticket = tickets.find((t) => t.id === ticketId);
      return mockDelay(
        ticket ? ResultHelper.ok(ticket) : notFound<Ticket>('티켓'),
      );
    },

    async issue({ visibility }: { visibility: TicketVisibility }) {
      if (!session) return mockDelay(unauthenticated<Ticket>());

      // The fixture mints against the most-visited place. The real function
      // reads the place from the grant, which the client cannot forge.
      const place = mockPlaces[0];
      const ticket: Ticket = {
        id: nextId('ticket'),
        userId: user.id,
        placeId: place.id,
        placeName: place.name,
        photoUrl: `https://picsum.photos/seed/${nextId('shot')}/900/1200`,
        serial: `PDM-MOCK-${String(sequence).padStart(4, '0')}`,
        visibility,
        issuedAt: new Date(),
        spent: false,
      };
      tickets = [ticket, ...tickets];
      user = {
        ...user,
        ticketBalance: user.ticketBalance + 1,
        ticketsIssued: user.ticketsIssued + 1,
      };
      return mockDelay(ResultHelper.ok(ticket));
    },
  },

  raffles: {
    async list() {
      return mockDelay(ResultHelper.ok([...mockRaffles]));
    },

    async getById(raffleId) {
      const raffle = mockRaffles.find((r) => r.id === raffleId);
      return mockDelay(
        raffle ? ResultHelper.ok(raffle) : notFound<Raffle>('응모'),
      );
    },

    async enter(raffleId) {
      if (!session) return mockDelay(unauthenticated<RaffleEntry>());

      const raffle = mockRaffles.find((r) => r.id === raffleId);
      if (!raffle) return mockDelay(notFound<RaffleEntry>('응모'));

      if (raffle.status !== 'open') {
        return mockDelay(
          ResultHelper.error<RaffleEntry>(
            Failure.firebase(
              'deadline-exceeded',
              '마감된 응모입니다.',
              'raffle_closed',
            ),
          ),
        );
      }

      // The No edge of `잔여 티켓 충족?`. Screens branch on `errorCode`, never
      // on the message.
      if (user.ticketBalance < raffle.ticketCost) {
        return mockDelay(
          ResultHelper.error<RaffleEntry>(
            Failure.firebase(
              'failed-precondition',
              '티켓이 부족합니다.',
              'insufficient_tickets',
            ),
          ),
        );
      }

      const spending = tickets
        .filter((t) => !t.spent)
        .slice(0, raffle.ticketCost);
      const entry: RaffleEntry = {
        id: nextId('entry'),
        userId: user.id,
        raffleId,
        ticketIds: spending.map((t) => t.id),
        ticketsSpent: raffle.ticketCost,
        createdAt: new Date(),
      };

      const spentIds = new Set(entry.ticketIds);
      tickets = tickets.map((t) =>
        spentIds.has(t.id) ? { ...t, spent: true, spentOnEntryId: entry.id } : t,
      );
      user = { ...user, ticketBalance: user.ticketBalance - raffle.ticketCost };
      entries.unshift(entry);

      return mockDelay(ResultHelper.ok(entry));
    },
  },

  posts: {
    async feed(boardId, cursor) {
      const board = posts.filter((p) => p.boardId === boardId);
      const start = cursor ? board.findIndex((p) => p.id === cursor) + 1 : 0;
      const page = board.slice(start, start + FEED_PAGE_SIZE);
      const last = page[page.length - 1];
      const more = start + FEED_PAGE_SIZE < board.length;
      const result: FeedPage = {
        posts: page,
        cursor: more && last ? last.id : null,
      };
      return mockDelay(ResultHelper.ok(result));
    },

    async getById(postId) {
      const post = posts.find((p) => p.id === postId);
      return mockDelay(post ? ResultHelper.ok(post) : notFound<Post>('게시글'));
    },

    async create(input: NewPost) {
      if (!session) return mockDelay(unauthenticated<Post>());

      const place = input.placeId
        ? mockPlaces.find((p) => p.id === input.placeId)
        : undefined;
      const post: Post = {
        id: nextId('post'),
        boardId: input.boardId,
        authorId: user.id,
        authorNickname: user.nickname,
        authorTier: user.tier,
        ...(user.avatarUrl && { authorAvatarUrl: user.avatarUrl }),
        body: input.body,
        imageUrls: input.imageUrls,
        ...(place && { placeId: place.id, placeName: place.name }),
        ...(input.ticketId && { ticketId: input.ticketId }),
        likeCount: 0,
        commentCount: 0,
        createdAt: new Date(),
      };
      posts = [post, ...posts];
      return mockDelay(ResultHelper.ok(post));
    },
  },

  users: {
    async me() {
      if (!session) return mockDelay(unauthenticated<User>());
      return mockDelay(ResultHelper.ok(user));
    },

    async updateProfile(input) {
      if (!session) return mockDelay(unauthenticated<User>());
      user = {
        ...user,
        ...(input.nickname !== undefined && { nickname: input.nickname }),
        ...(input.bio !== undefined && { bio: input.bio }),
        ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
        ...(input.profileVisibility !== undefined && {
          profileVisibility: input.profileVisibility,
        }),
      };
      return mockDelay(ResultHelper.ok(user));
    },

    async setLocale(locale: Locale) {
      if (!session) return mockDelay(unauthenticated<User>());
      user = { ...user, locale };
      return mockDelay(ResultHelper.ok(user));
    },
  },
};
