import { Failure, ResultHelper, type Result } from '../api/types';
import type {
  Artist,
  AssistantReply,
  FeedPage,
  Locale,
  NewReview,
  Review,
  LocationReading,
  NewPost,
  NewReport,
  Place,
  PlaceWithDistance,
  Post,
  Raffle,
  RaffleEntry,
  Session,
  Ticket,
  User,
  VerificationResult,
} from '../domain';
import { BLOCKED_USERS_MAX, tierFor } from '../domain';
import { distanceMeters } from '../geo';
import {
  mockArtists,
  mockAssistantReply,
  mockCourses,
  mockDelay,
  mockGallery,
  mockPlaces,
  mockPosts,
  mockPublicProfiles,
  mockRaffleEntries,
  mockRaffles,
  mockReviews,
  mockTickets,
  mockUser,
  mockVerificationSequence,
} from '../../mocks';
import { FEED_PAGE_SIZE, type Repositories } from './types';

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
let entries: RaffleEntry[] = [...mockRaffleEntries];
/**
 * Every 신고 this run has filed.
 *
 * Kept even though no screen can read it, and the real collection refuses every
 * read: without it a fixture run cannot tell "신고 succeeded" from "신고 did
 * nothing", and the sheet's success state would be the only evidence.
 */
const reports: (NewReport & { reporterId: string; createdAt: Date })[] = [];

/** How far through `mockVerificationSequence` each verify session has walked. */
const verifyProgress = new Map<string, number>();
/** Which 촬영지 each grant was minted for — the real function reads this off the session. */
const grantPlaces = new Map<string, string>();

let sequence = 0;
const nextId = (prefix: string) => `${prefix}-${(sequence += 1)}`;


/**
 * Crockford Base32 — uppercase and digits without `I`, `L`, `O` or `U`.
 *
 * Those four are dropped because a ticket serial is meant to be read off the barcode and
 * said out loud, and `1`/`I` and `0`/`O` do not survive that.
 */
const SERIAL_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * A fixture serial in the server's `PD-XXXX-XXXX-XXXX` shape.
 *
 * The real value is 8 random bytes minted inside `issueTicket`; this only has to *look*
 * like one, so it is derived from the sequence and stays stable across a fixture run.
 */
function mockSerial(seed: number): string {
  const group = (offset: number) =>
    Array.from(
      { length: 4 },
      (_, i) =>
        SERIAL_ALPHABET[(seed * 7 + offset * 31 + i * 13) % SERIAL_ALPHABET.length],
    ).join('');
  return `PD-${group(0)}-${group(1)}-${group(2)}`;
}

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
  boards: {
    async listActive() {
      return mockDelay(ResultHelper.ok([
        { id: 'board-free', name: '자유게시판' },
        ...mockArtists.map(({ id, name }) => ({ id, name })),
      ]));
    },
  },

  assistant: {
    async ask(input) {
      if (!session) return mockDelay(unauthenticated<AssistantReply>());
      return mockDelay(ResultHelper.ok(mockAssistantReply(input)));
    },
  },

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

    // Straight segments between the stops. Road geometry is 카카오모빌리티's and
    // there is no network here — the fixture only has to draw a line at all.
    async route(placeIds, origin) {
      const stops = placeIds
        .map((id) => mockPlaces.find((p) => p.id === id))
        .filter((p): p is (typeof mockPlaces)[number] => p != null)
        .map((p) => ({ lat: p.lat, lng: p.lng }));
      const path = origin != null ? [origin, ...stops] : stops;
      return mockDelay(
        ResultHelper.ok({ path, distanceMeters: 120_000, durationSeconds: 6_600 }),
      );
    },
  },

  auth: {
    async signIn(email) {
      session = { userId: user.id, email };
      user = { ...user, email };
      return mockDelay(ResultHelper.ok(session));
    },

    async signUp(email, _password, nickname) {
      // A new account, not the demo one with its name changed. Keeping
      // `followedArtistIds` sent fixture sign-ups straight past 최애 찾기 — the
      // routing asks whether the user follows anyone — and kept `placesVisited: 5`
      // and someone else's avatar and bio on 마이페이지. Firebase writes exactly
      // these fields at sign-up; the two have to start from the same place.
      entries = entries.filter((entry) => entry.userId !== user.id);
      user = {
        ...mockUser,
        email,
        nickname,
        followedArtistIds: [],
        ticketBalance: 0,
        ticketsIssued: 0,
        placesVisited: 0,
        tier: 'club10',
        createdAt: new Date(),
      };
      delete (user as { avatarUrl?: string }).avatarUrl;
      delete (user as { bio?: string }).bio;
      tickets = [];
      session = { userId: user.id, email };
      return mockDelay(ResultHelper.ok(session));
    },

    async signOut() {
      session = null;
      return mockDelay(ResultHelper.ok<void>(undefined));
    },

    // Wipes the same fixture state 회원 탈퇴 wipes on the server — the user
    // document, the tickets, the posts and the reviews — then ends the session.
    // Reports survive with the reporter anonymised, which is the one part of
    // the real function that is not a deletion, and the part a fixture run
    // would otherwise never show.
    async deleteAccount() {
      if (!session) return mockDelay(unauthenticated<void>());
      const uid = user.id;
      // Filtered by owner, not emptied. Every ticket fixture happens to belong
      // to the demo user today, which makes the two identical — and would make
      // a second author's tickets vanish on 탈퇴 the day one is added.
      tickets = tickets.filter((t) => t.userId !== uid);
      posts = posts.filter((p) => p.authorId !== uid);
      reviews = reviews.filter((r) => r.authorId !== uid);
      entries = entries.filter((entry) => entry.userId !== uid);
      for (const report of reports) {
        if (report.reporterId === uid) report.reporterId = 'deleted';
      }
      user = { ...mockUser };
      session = null;
      return mockDelay(ResultHelper.ok<void>(undefined));
    },

    async currentSession() {
      return mockDelay(ResultHelper.ok(requireSession()));
    },
  },

  places: {
    async listAll(lat, lng) {
      // Every place, nearest first — 지도 shows the whole country, so nothing is
      // filtered out by distance here. Distance is for ordering and display only.
      const all = [...mockPlaces]
        .map((p) => withDistance(p, { lat, lng }))
        .sort((a, b) => a.distanceMeters - b.distanceMeters);
      return mockDelay(ResultHelper.ok(all));
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
      };
      if (scripted.verified) {
        const token = nextId('grant');
        grantPlaces.set(token, reading.placeId);
        result.grant = { token, expiresAt: new Date(Date.now() + 10 * 60 * 1000) };
      }
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

    async uploadPhoto(localUri) {
      if (!session) return mockDelay(unauthenticated<string>());
      // No Storage in the fixture path: the local file stands in for the object,
      // and its URI is the "path" `issue` echoes back as `photoUrl`.
      return mockDelay(ResultHelper.ok(localUri));
    },

    async issue({ grantToken, photoPath, visibility }) {
      if (!session) return mockDelay(unauthenticated<Ticket>());

      // The place comes from the grant, as it does server-side — the client
      // never names it. An unknown or re-used token is the `grant_expired` /
      // `grant_consumed` pair the contract describes, collapsed to one here.
      const placeId = grantPlaces.get(grantToken);
      const place = mockPlaces.find((p) => p.id === placeId);
      if (!place) {
        return mockDelay(
          ResultHelper.error(
            Failure.firebase('failed-precondition', '인증이 만료됐어요.', 'grant_expired'),
          ),
        );
      }
      grantPlaces.delete(grantToken);

      const ticket: Ticket = {
        id: nextId('ticket'),
        userId: user.id,
        placeId: place.id,
        placeName: place.name,
        artistId: place.artistIds[0],
        photoUrl: photoPath,
        serial: mockSerial(sequence),
        visibility,
        issuedAt: new Date(),
        spent: false,
      };
      // Read before the push: an empty result is a first visit, which is the same
      // question `issueTicket` answers from its cooldown query.
      const firstVisit = !tickets.some((t) => t.placeId === place.id);
      tickets = [ticket, ...tickets];
      const ticketsIssued = user.ticketsIssued + 1;
      user = {
        ...user,
        ticketBalance: user.ticketBalance + 1,
        ticketsIssued,
        placesVisited: user.placesVisited + (firstVisit ? 1 : 0),
        // Recomputed from the issued count, never from the balance — a
        // balance-derived tier demotes the user on every 응모. The server does
        // this inside the mint transaction; without it here the badge and the
        // 지역 n곳 stat never moved on fixtures, so neither could be seen working
        // without the live backend.
        tier: tierFor(ticketsIssued),
      };
      return mockDelay(ResultHelper.ok(ticket));
    },
  },

  raffles: {
    async list() {
      return mockDelay(ResultHelper.ok([...mockRaffles]));
    },

    async listMine() {
      if (!session) return mockDelay(unauthenticated<RaffleEntry[]>());
      return mockDelay(ResultHelper.ok(entries.filter((entry) => entry.userId === user.id)));
    },

    async getById(raffleId) {
      const raffle = mockRaffles.find((r) => r.id === raffleId);
      return mockDelay(
        raffle ? ResultHelper.ok(raffle) : notFound<Raffle>('응모'),
      );
    },

    // `idempotencyKey` is accepted to match the real repository's shape. The fixture
    // has no retry path to collapse, so it is not used — see RaffleRepository.enter.
    async enter(raffleId, _idempotencyKey) {
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
        .sort((a, b) => a.issuedAt.getTime() - b.issuedAt.getTime())
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

      // The balance after the debit rides along, as the contract's response does.
      return mockDelay(ResultHelper.ok({ ...entry, ticketBalance: user.ticketBalance }));
    },
  },

  posts: {
    async listMine() {
      if (!session) return mockDelay(unauthenticated<Post[]>());
      return mockDelay(ResultHelper.ok(posts.filter((p) => p.authorId === user.id)));
    },

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

  reports: {
    async create(input: NewReport) {
      if (!session) return mockDelay(unauthenticated<void>());
      reports.push({ ...input, reporterId: user.id, createdAt: new Date() });
      return mockDelay(ResultHelper.ok<void>(undefined));
    },
  },

  users: {
    async getPublicProfile(userId: string) {
      if (!session) return mockDelay(unauthenticated<import('../domain').PublicProfile>());
      if (userId !== user.id) {
        const profile = mockPublicProfiles.find((item) => item.userId === userId);
        return mockDelay(
          profile
            ? ResultHelper.ok(profile)
            : notFound<import('../domain').PublicProfile>('프로필'),
        );
      }
      if (user.profileVisibility !== 'public') {
        return mockDelay(ResultHelper.error<import('../domain').PublicProfile>(
          Failure.firebase('permission-denied', '비공개 프로필이다'),
        ));
      }
      return mockDelay(ResultHelper.ok({
        userId: user.id,
        nickname: user.nickname,
        bio: user.bio ?? '',
        ...(user.avatarUrl && { avatarUrl: user.avatarUrl }),
        ticketsIssued: user.ticketsIssued,
        placesVisited: user.placesVisited,
        tier: user.tier,
      }));
    },

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

    async block(userId: string) {
      if (!session) return mockDelay(unauthenticated<User>());
      // The same three refusals the Firebase side makes, so a screen cannot
      // behave one way on fixtures and another against the live project.
      if (userId === user.id) {
        return mockDelay(
          ResultHelper.error<User>(
            Failure.firebase('invalid-argument', '본인은 차단할 수 없습니다.'),
          ),
        );
      }
      if (user.blockedUserIds.includes(userId)) {
        return mockDelay(ResultHelper.ok(user));
      }
      if (user.blockedUserIds.length >= BLOCKED_USERS_MAX) {
        return mockDelay(
          ResultHelper.error<User>(
            Failure.firebase(
              'resource-exhausted',
              `차단은 최대 ${BLOCKED_USERS_MAX}명까지 가능합니다.`,
            ),
          ),
        );
      }
      user = { ...user, blockedUserIds: [...user.blockedUserIds, userId] };
      return mockDelay(ResultHelper.ok(user));
    },

    async unblock(userId: string) {
      if (!session) return mockDelay(unauthenticated<User>());
      user = {
        ...user,
        blockedUserIds: user.blockedUserIds.filter((id) => id !== userId),
      };
      return mockDelay(ResultHelper.ok(user));
    },
  },
};
