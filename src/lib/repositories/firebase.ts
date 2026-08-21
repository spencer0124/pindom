import { getApp } from '@react-native-firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from '@react-native-firebase/auth';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
} from '@react-native-firebase/firestore';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';

import { AppConfig } from '../config';
import { Failure, ResultHelper, type AppFailure, type Result } from '../api/types';
import { DEFAULT_LOCALE, LOCALES } from '../domain';
import type {
  Artist,
  Course,
  FeedPage,
  GalleryPhoto,
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
  User,
  VerificationResult,
} from '../domain';
import { distanceMeters } from '../geo';
import {
  bool,
  date,
  geo,
  isoDate,
  localized,
  num,
  oneOf,
  optNum,
  optStr,
  setActiveLocale,
  str,
  strList,
  type DocData,
} from './firebase-mapping';
import type { Repositories } from './types';

/**
 * The Firebase implementation of `Repositories`.
 *
 * This module statically imports the Firebase SDK, so it is loaded **only** by
 * the dynamic import in `./index.ts` and only when `AppConfig.useMocks` is
 * false. Importing it without the native modules linked throws at runtime,
 * which is exactly the state the app is in before the backend developer hands
 * over the platform config files.
 *
 * Field names come from docs/reference/backend-contract.md. Change that
 * document before changing anything here.
 */

const db = () => getFirestore(getApp());
const auth = () => getAuth(getApp());

/**
 * Callable functions, pinned to the deployment region.
 *
 * The SDK defaults to `us-central1`. A region mismatch surfaces as `not-found`
 * on every call, which reads like a missing function rather than a wrong
 * address — see `AppConfig.functionsRegion`.
 */
const fns = () => getFunctions(getApp(), AppConfig.functionsRegion);

const FEED_PAGE_SIZE = 10;

// ── Error handling ──

function toFailure(error: unknown): AppFailure {
  const e = error as {
    code?: unknown;
    message?: unknown;
    details?: { errorCode?: unknown; nextAvailableAt?: unknown };
  };
  const code = typeof e?.code === 'string' ? e.code : 'unknown';
  const message =
    typeof e?.message === 'string' ? e.message : '요청을 처리하지 못했습니다.';
  const errorCode =
    typeof e?.details?.errorCode === 'string' ? e.details.errorCode : undefined;
  // `cooldown_active` is the one failure that carries a value: the ISO date the
  // per-place cooldown lifts, which 장소/상세 renders.
  const raw = e?.details?.nextAvailableAt;
  const parsed = typeof raw === 'string' ? new Date(raw) : undefined;
  const nextAvailableAt =
    parsed && !Number.isNaN(parsed.getTime()) ? parsed : undefined;
  return Failure.firebase(code, message, errorCode, nextAvailableAt);
}

/** Every repository call funnels through here, so nothing throws past this file. */
async function attempt<T>(run: () => Promise<T>): Promise<Result<T>> {
  try {
    return ResultHelper.ok(await run());
  } catch (error) {
    return ResultHelper.error(toFailure(error));
  }
}

function requireUid(): string {
  const uid = auth().currentUser?.uid;
  if (!uid) {
    throw Object.assign(new Error('로그인이 필요합니다.'), {
      code: 'unauthenticated',
    });
  }
  return uid;
}

// ── Document mappers ──

function toPlace(id: string, d: DocData): Place {
  const at = `places/${id}`;
  const { lat, lng } = geo(d, 'location', at);
  return {
    id,
    name: localized(d, 'name', at),
    roman: str(d, 'roman', at),
    description: localized(d, 'description', at),
    address: str(d, 'address', at),
    region: localized(d, 'region', at),
    workTitle: localized(d, 'workTitle', at),
    workKind: oneOf(d.workKind, ['mv', 'drama', 'self'] as const, 'mv'),
    artistIds: strList(d, 'artistIds'),
    lat,
    lng,
    radiusMeters: optNum(d, 'radiusMeters') ?? 50,
    coverImageUrl: str(d, 'coverImageUrl', at),
    ticketCount: num(d, 'ticketCount', at),
    verifyCount: num(d, 'verifyCount', at),
    photoCount: num(d, 'photoCount', at),
    reviewCount: num(d, 'reviewCount', at),
    createdAt: date(d, 'createdAt', at),
  };
}

const TIERS = ['club10', 'club20', 'clubGo'] as const;

function toUser(id: string, d: DocData): User {
  const at = `users/${id}`;
  const avatarUrl = optStr(d, 'avatarUrl');
  const bio = optStr(d, 'bio');
  return {
    id,
    email: str(d, 'email', at),
    nickname: str(d, 'nickname', at),
    ...(avatarUrl && { avatarUrl }),
    ...(bio && { bio }),
    followedArtistIds: strList(d, 'followedArtistIds'),
    ticketBalance: num(d, 'ticketBalance', at),
    ticketsIssued: num(d, 'ticketsIssued', at),
    placesVisited: num(d, 'placesVisited', at),
    tier: oneOf(d.tier, TIERS, 'club10'),
    profileVisibility: oneOf(d.profileVisibility, ['public', 'private'] as const, 'public'),
    locale: oneOf(d.locale, LOCALES, DEFAULT_LOCALE),
    createdAt: date(d, 'createdAt', at),
  };
}

function toTicket(id: string, d: DocData): Ticket {
  const at = `tickets/${id}`;
  const spentOnEntryId = optStr(d, 'spentOnEntryId');
  return {
    id,
    userId: str(d, 'userId', at),
    placeId: str(d, 'placeId', at),
    placeName: str(d, 'placeName', at),
    photoUrl: str(d, 'photoUrl', at),
    serial: str(d, 'serial', at),
    visibility: oneOf(d.visibility, ['public', 'private'] as const, 'private'),
    issuedAt: date(d, 'issuedAt', at),
    spent: bool(d, 'spent'),
    ...(spentOnEntryId && { spentOnEntryId }),
  };
}

function toRaffle(id: string, d: DocData): Raffle {
  const at = `raffles/${id}`;
  const capacity = optNum(d, 'capacity');
  return {
    id,
    title: str(d, 'title', at),
    prizeDescription: str(d, 'prizeDescription', at),
    imageUrl: str(d, 'imageUrl', at),
    ticketCost: num(d, 'ticketCost', at),
    closesAt: date(d, 'closesAt', at),
    entryCount: num(d, 'entryCount', at),
    ...(capacity !== undefined && { capacity }),
    status: oneOf(d.status, ['open', 'closed', 'drawn'] as const, 'open'),
  };
}

function toPost(id: string, d: DocData): Post {
  const at = `posts/${id}`;
  const authorAvatarUrl = optStr(d, 'authorAvatarUrl');
  const placeId = optStr(d, 'placeId');
  const placeName = optStr(d, 'placeName');
  const ticketId = optStr(d, 'ticketId');
  return {
    id,
    boardId: str(d, 'boardId', at),
    authorId: str(d, 'authorId', at),
    authorNickname: str(d, 'authorNickname', at),
    ...(authorAvatarUrl && { authorAvatarUrl }),
    authorTier: oneOf(d.authorTier, TIERS, 'club10'),
    body: str(d, 'body', at),
    imageUrls: strList(d, 'imageUrls'),
    ...(placeId && { placeId }),
    ...(placeName && { placeName }),
    ...(ticketId && { ticketId }),
    likeCount: num(d, 'likeCount', at),
    commentCount: num(d, 'commentCount', at),
    createdAt: date(d, 'createdAt', at),
  };
}

// ── Implementation ──

function toArtist(id: string, d: DocData): Artist {
  const at = `artists/${id}`;
  const imageUrl = optStr(d, 'imageUrl');
  const accentColor = optStr(d, 'accentColor');
  return {
    id,
    name: localized(d, 'name', at),
    initial: str(d, 'initial', at),
    ...(imageUrl && { imageUrl }),
    placeCount: num(d, 'placeCount', at),
    memberCount: num(d, 'memberCount', at),
    ...(accentColor && { accentColor }),
  };
}

function toCourse(id: string, d: DocData): Course {
  const at = `courses/${id}`;
  return {
    id,
    artistId: str(d, 'artistId', at),
    name: localized(d, 'name', at),
    description: localized(d, 'description', at),
    placeIds: strList(d, 'placeIds'),
    placeCount: num(d, 'placeCount', at),
  };
}

function toReview(placeId: string, id: string, d: DocData): Review {
  const at = `places/${placeId}/reviews/${id}`;
  return {
    id,
    placeId,
    authorId: str(d, 'authorId', at),
    authorNickname: str(d, 'authorNickname', at),
    authorTier: oneOf(d.authorTier, TIERS, 'club10'),
    text: str(d, 'text', at),
    tags: strList(d, 'tags'),
    likeCount: num(d, 'likeCount', at),
    createdAt: date(d, 'createdAt', at),
  };
}

function toGalleryPhoto(placeId: string, id: string, d: DocData): GalleryPhoto {
  const at = `places/${placeId}/gallery/${id}`;
  return {
    id,
    placeId,
    ticketId: str(d, 'ticketId', at),
    authorId: str(d, 'authorId', at),
    photoUrl: str(d, 'photoUrl', at),
    createdAt: date(d, 'createdAt', at),
  };
}

export const firebaseRepositories: Repositories = {
  artists: {
    search: (queryText) =>
      attempt(async () => {
        // Filtered client-side: the roster is small and Firestore has no substring search.
        // If it grows, this needs a search index, not a bigger `getDocs`.
        const snap = await getDocs(collection(db(), 'artists'));
        const all = snap.docs.map((d_) => toArtist(d_.id, d_.data() as DocData));
        const q = (queryText ?? '').trim();
        return q ? all.filter((a) => a.name.includes(q) || a.initial.includes(q.toUpperCase())) : all;
      }),

    getById: (artistId) =>
      attempt(async () => {
        const snap = await getDoc(doc(db(), 'artists', artistId));
        if (!snap.exists()) {
          throw Object.assign(new Error('아티스트 없음'), { code: 'not-found' });
        }
        return toArtist(snap.id, snap.data() as DocData);
      }),

    listMine: () =>
      attempt(async () => {
        const uid = requireUid();
        const meSnap = await getDoc(doc(db(), 'users', uid));
        const ids = strList((meSnap.data() ?? {}) as DocData, 'followedArtistIds');
        const docs = await Promise.all(
          ids.map((id) => getDoc(doc(db(), 'artists', id))),
        );
        // Ordered by the user's own list, not by document order — the first followed artist
        // is the one 홈 opens on.
        return docs
          .filter((d_) => d_.exists())
          .map((d_) => toArtist(d_.id, d_.data() as DocData));
      }),

    follow: (artistId) =>
      attempt(async () => {
        await updateDoc(doc(db(), 'users', requireUid()), {
          followedArtistIds: arrayUnion(artistId),
        });
      }),

    unfollow: (artistId) =>
      attempt(async () => {
        await updateDoc(doc(db(), 'users', requireUid()), {
          followedArtistIds: arrayRemove(artistId),
        });
      }),
  },

  courses: {
    listForArtist: (artistId) =>
      attempt(async () => {
        const snap = await getDocs(
          query(collection(db(), 'courses'), where('artistId', '==', artistId)),
        );
        return snap.docs.map((d_) => toCourse(d_.id, d_.data() as DocData));
      }),
  },

  auth: {
    signIn: (email, password) =>
      attempt(async () => {
        const cred = await signInWithEmailAndPassword(auth(), email, password);
        return { userId: cred.user.uid, email: cred.user.email ?? email };
      }),

    signUp: (email, password, nickname) =>
      attempt(async () => {
        const cred = await createUserWithEmailAndPassword(auth(), email, password);
        // The client creates this document rather than an Auth trigger: a fourth
        // Cloud Function would be one more deployment unit, and rules give the same
        // guarantee in three lines. Two things are load-bearing —
        //
        //   1. the document **id** is the uid, not a `uid` field. Rules match on
        //      `request.auth.uid == uid`, so a generated id is refused outright.
        //   2. the three counters are written as an explicit `0`. Rules reject the
        //      create unless they are, which is what stops a client minting a balance.
        //
        // See docs/plans/2026-08-21-backend-contract-review-resolutions.md, finding D.
        await setDoc(doc(db(), 'users', cred.user.uid), {
          email,
          nickname,
          ticketBalance: 0,
          ticketsIssued: 0,
          placesVisited: 0,
          createdAt: serverTimestamp(),
        });
        return { userId: cred.user.uid, email };
      }),

    signOut: () => attempt(() => firebaseSignOut(auth())),

    currentSession: () =>
      attempt<Session | null>(async () => {
        const u = auth().currentUser;
        return u ? { userId: u.uid, email: u.email ?? '' } : null;
      }),
  },

  places: {
    /**
     * Reads the whole collection on purpose.
     *
     * 지도 has to know every 촬영지 at once — it opens showing the country and zooms in,
     * and a pin that vanished for being far away would be a bug, not an optimisation. So
     * there is nothing to narrow here, which is also why `places.geohash` was dropped from
     * the contract: a "fetch what is near me" index has no role in a screen that needs all
     * of them.
     *
     * Distance is attached for ordering and display only. Seeded 촬영지 do not grow like
     * user data, and MMKV caches the result. Past roughly a thousand places this becomes
     * heavy — and the answer then is a map-only projection or an `updatedAt` incremental
     * fetch, still not a geo index, because the nationwide requirement does not go away.
     */
    listAll: (lat, lng) =>
      attempt(async () => {
        const snap = await getDocs(collection(db(), 'places'));
        return snap.docs
          .map((doc_) => toPlace(doc_.id, doc_.data() as DocData))
          .map<PlaceWithDistance>((p) => ({
            ...p,
            distanceMeters: distanceMeters({ lat, lng }, p),
          }))
          .sort((a, b) => a.distanceMeters - b.distanceMeters);
      }),

    listRecommended: (lat, lng) =>
      attempt(async () => {
        const snap = await getDocs(
          query(collection(db(), 'places'), orderBy('ticketCount', 'desc'), limit(10)),
        );
        const from = lat !== undefined && lng !== undefined ? { lat, lng } : undefined;
        return snap.docs
          .map((doc_) => toPlace(doc_.id, doc_.data() as DocData))
          .map<PlaceWithDistance>((p) => ({
            ...p,
            distanceMeters: from ? distanceMeters(from, p) : 0,
          }));
      }),

    getById: (placeId) =>
      attempt(async () => {
        const snap = await getDoc(doc(db(), 'places', placeId));
        if (!snap.exists()) {
          throw Object.assign(new Error('촬영지 없음'), { code: 'not-found' });
        }
        return toPlace(snap.id, snap.data() as DocData);
      }),

    reviews: (placeId) =>
      attempt(async () => {
        const snap = await getDocs(
          query(
            collection(db(), 'places', placeId, 'reviews'),
            orderBy('createdAt', 'desc'),
          ),
        );
        return snap.docs.map((d_) => toReview(placeId, d_.id, d_.data() as DocData));
      }),

    gallery: (placeId) =>
      attempt(async () => {
        const snap = await getDocs(
          query(
            collection(db(), 'places', placeId, 'gallery'),
            orderBy('createdAt', 'desc'),
            limit(24),
          ),
        );
        return snap.docs.map((d_) => toGalleryPhoto(placeId, d_.id, d_.data() as DocData));
      }),

    addReview: (input: NewReview) =>
      attempt(async () => {
        const uid = requireUid();
        const meSnap = await getDoc(doc(db(), 'users', uid));
        const me = toUser(uid, (meSnap.data() ?? {}) as DocData);
        const written = await addDoc(
          collection(db(), 'places', input.placeId, 'reviews'),
          {
            authorId: uid,
            authorNickname: me.nickname,
            authorTier: me.tier,
            text: input.text,
            tags: input.tags,
            likeCount: 0,
            createdAt: serverTimestamp(),
          },
        );
        const snap = await getDoc(written);
        return toReview(input.placeId, snap.id, (snap.data() ?? {}) as DocData);
      }),
  },

  verification: {
    /**
     * A rejection resolves as `Result.ok` with `verified: false`. Only a
     * transport or auth fault becomes `Result.error` — see the contract.
     */
    submitReading: (reading: LocationReading) =>
      attempt(async () => {
        const call = httpsCallable(fns(), 'verifyLocation');
        const res = await call({
          placeId: reading.placeId,
          lat: reading.lat,
          lng: reading.lng,
          accuracy: reading.accuracy,
          capturedAt: reading.capturedAt.toISOString(),
          isMock: reading.isMock,
          ...(reading.sessionId && { sessionId: reading.sessionId }),
        });
        const d = res.data as DocData;
        const grant = d.grant as { token?: string; expiresAt?: string } | undefined;
        const result: VerificationResult = {
          sessionId: String(d.sessionId ?? ''),
          verified: d.verified === true,
          distanceMeters: Number(d.distanceMeters ?? 0),
          requiredRadiusMeters: Number(d.requiredRadiusMeters ?? 50),
          accuracyMeters: Number(d.accuracyMeters ?? 0),
          ...(typeof d.reason === 'string' && {
            // Keep this list in step with `VerificationFailureReason`. A reason the
            // server sends but this array omits does not throw — it silently becomes
            // the fallback, and 인증 실패 then explains the wrong failure.
            reason: oneOf(
              d.reason,
              [
                'out_of_radius',
                'implausible_speed',
                'poor_accuracy',
                'mock_location',
              ] as const,
              'out_of_radius',
            ),
          }),
          ...(grant?.token && {
            grant: {
              token: grant.token,
              expiresAt: isoDate(grant.expiresAt),
            },
          }),
        };
        return result;
      }),
  },

  tickets: {
    listMine: () => listTicketsByVisibility('public'),

    listVault: () => listTicketsByVisibility('private'),

    setVisibility: (ticketId, visibility) =>
      attempt(async () => {
        await updateDoc(doc(db(), 'tickets', ticketId), { visibility });
        const snap = await getDoc(doc(db(), 'tickets', ticketId));
        return toTicket(snap.id, (snap.data() ?? {}) as DocData);
      }),

    getById: (ticketId) =>
      attempt(async () => {
        const snap = await getDoc(doc(db(), 'tickets', ticketId));
        if (!snap.exists()) {
          throw Object.assign(new Error('티켓 없음'), { code: 'not-found' });
        }
        return toTicket(snap.id, snap.data() as DocData);
      }),

    issue: (input) =>
      attempt(async () => {
        const call = httpsCallable(fns(), 'issueTicket');
        const res = await call(input);
        const ticketId = String((res.data as DocData).ticketId ?? '');
        const snap = await getDoc(doc(db(), 'tickets', ticketId));
        return toTicket(snap.id, (snap.data() ?? {}) as DocData);
      }),
  },

  raffles: {
    list: () =>
      attempt(async () => {
        const snap = await getDocs(
          query(collection(db(), 'raffles'), orderBy('closesAt', 'asc')),
        );
        return snap.docs.map((doc_) => toRaffle(doc_.id, doc_.data() as DocData));
      }),

    getById: (raffleId) =>
      attempt(async () => {
        const snap = await getDoc(doc(db(), 'raffles', raffleId));
        if (!snap.exists()) {
          throw Object.assign(new Error('응모 없음'), { code: 'not-found' });
        }
        return toRaffle(snap.id, snap.data() as DocData);
      }),

    /**
     * Fails with `errorCode: 'insufficient_tickets'` when the balance is short.
     * `toFailure` lifts that out of `HttpsError.details` so 응모 can branch on
     * a code rather than parsing a message.
     */
    enter: (raffleId, idempotencyKey) =>
      attempt(async () => {
        const call = httpsCallable(fns(), 'enterRaffle');
        // The key comes from the caller and must be the same across retries — the
        // server derives the entry document's id from it, so a per-call key (a
        // timestamp, previously) makes every retry a fresh entry and debits twice.
        const res = await call({ raffleId, idempotencyKey });
        const d = res.data as DocData;
        const entry: RaffleEntry = {
          id: String(d.entryId ?? ''),
          userId: requireUid(),
          raffleId,
          ticketIds: strList(d, 'ticketIds'),
          ticketsSpent: Number(d.ticketsSpent ?? 0),
          createdAt: new Date(),
        };
        return entry;
      }),
  },

  posts: {
    feed: (boardId, cursor) =>
      attempt(async () => {
        const base = [
          collection(db(), 'posts'),
          where('boardId', '==', boardId),
          orderBy('createdAt', 'desc'),
          limit(FEED_PAGE_SIZE),
        ] as const;
        const snap = await getDocs(
          cursor
            ? query(base[0], base[1], base[2], startAfter(await cursorSnapshot(cursor)), base[3])
            : query(base[0], base[1], base[2], base[3]),
        );
        const posts = snap.docs.map((doc_) => toPost(doc_.id, doc_.data() as DocData));
        const last = snap.docs[snap.docs.length - 1];
        const page: FeedPage = {
          posts,
          cursor: snap.docs.length === FEED_PAGE_SIZE && last ? last.id : null,
        };
        return page;
      }),

    getById: (postId) =>
      attempt(async () => {
        const snap = await getDoc(doc(db(), 'posts', postId));
        if (!snap.exists()) {
          throw Object.assign(new Error('게시글 없음'), { code: 'not-found' });
        }
        return toPost(snap.id, snap.data() as DocData);
      }),

    create: (input: NewPost) =>
      attempt(async () => {
        const uid = requireUid();
        const meSnap = await getDoc(doc(db(), 'users', uid));
        const me = toUser(uid, (meSnap.data() ?? {}) as DocData);
        const payload = {
          boardId: input.boardId,
          authorId: uid,
          authorTier: me.tier,
          authorNickname: me.nickname,
          ...(me.avatarUrl && { authorAvatarUrl: me.avatarUrl }),
          body: input.body,
          imageUrls: input.imageUrls,
          ...(input.placeId && { placeId: input.placeId }),
          ...(input.ticketId && { ticketId: input.ticketId }),
          likeCount: 0,
          commentCount: 0,
          createdAt: serverTimestamp(),
        };
        const written = await addDoc(collection(db(), 'posts'), payload);
        const snap = await getDoc(written);
        return toPost(snap.id, (snap.data() ?? {}) as DocData);
      }),
  },

  users: {
    me: () =>
      attempt(async () => {
        const uid = requireUid();
        const snap = await getDoc(doc(db(), 'users', uid));
        if (!snap.exists()) {
          throw Object.assign(new Error('사용자 문서 없음'), { code: 'not-found' });
        }
        return toUser(snap.id, snap.data() as DocData);
      }),

    updateProfile: (input) =>
      attempt(async () => {
        const uid = requireUid();
        await updateDoc(doc(db(), 'users', uid), { ...input });
        const snap = await getDoc(doc(db(), 'users', uid));
        return toUser(uid, (snap.data() ?? {}) as DocData);
      }),

    setLocale: (locale: Locale) =>
      attempt(async () => {
        const uid = requireUid();
        await updateDoc(doc(db(), 'users', uid), { locale });
        // Localized fields resolve through this from the next read onward.
        setActiveLocale(locale);
        const snap = await getDoc(doc(db(), 'users', uid));
        return toUser(uid, (snap.data() ?? {}) as DocData);
      }),
  },
};

/** 컬렉션 and 보관함 are the same query with the visibility flag flipped. */
function listTicketsByVisibility(visibility: 'public' | 'private') {
  return attempt(async () => {
    const snap = await getDocs(
      query(
        collection(db(), 'tickets'),
        where('userId', '==', requireUid()),
        where('visibility', '==', visibility),
        orderBy('issuedAt', 'desc'),
      ),
    );
    return snap.docs.map((d_) => toTicket(d_.id, d_.data() as DocData));
  });
}

/** Firestore paginates from a snapshot, not an id, so the cursor is re-read. */
async function cursorSnapshot(postId: string) {
  return getDoc(doc(db(), 'posts', postId));
}
