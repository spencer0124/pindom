import { getApp } from '@react-native-firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from '@react-native-firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  where,
} from '@react-native-firebase/firestore';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';

import { AppConfig } from '../config';
import { Failure, ResultHelper, type AppFailure, type Result } from '../api/types';
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
  User,
  VerificationResult,
} from '../domain';
import { distanceMeters } from '../geo';
import {
  bool,
  date,
  geo,
  isoDate,
  num,
  oneOf,
  optNum,
  optStr,
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
    details?: { errorCode?: unknown };
  };
  const code = typeof e?.code === 'string' ? e.code : 'unknown';
  const message =
    typeof e?.message === 'string' ? e.message : '요청을 처리하지 못했습니다.';
  const errorCode =
    typeof e?.details?.errorCode === 'string' ? e.details.errorCode : undefined;
  return Failure.firebase(code, message, errorCode);
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
    name: str(d, 'name', at),
    description: str(d, 'description', at),
    address: str(d, 'address', at),
    workTitle: str(d, 'workTitle', at),
    lat,
    lng,
    radiusMeters: optNum(d, 'radiusMeters') ?? 50,
    coverImageUrl: str(d, 'coverImageUrl', at),
    ticketCount: num(d, 'ticketCount', at),
    createdAt: date(d, 'createdAt', at),
  };
}

function toUser(id: string, d: DocData): User {
  const at = `users/${id}`;
  const avatarUrl = optStr(d, 'avatarUrl');
  return {
    id,
    email: str(d, 'email', at),
    nickname: str(d, 'nickname', at),
    ...(avatarUrl && { avatarUrl }),
    ticketBalance: num(d, 'ticketBalance', at),
    ticketsIssued: num(d, 'ticketsIssued', at),
    placesVisited: num(d, 'placesVisited', at),
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
    authorId: str(d, 'authorId', at),
    authorNickname: str(d, 'authorNickname', at),
    ...(authorAvatarUrl && { authorAvatarUrl }),
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

export const firebaseRepositories: Repositories = {
  auth: {
    signIn: (email, password) =>
      attempt(async () => {
        const cred = await signInWithEmailAndPassword(auth(), email, password);
        return { userId: cred.user.uid, email: cred.user.email ?? email };
      }),

    signUp: (email, password, nickname) =>
      attempt(async () => {
        const cred = await createUserWithEmailAndPassword(auth(), email, password);
        // The user document is created here rather than by a trigger, so the
        // nickname from 회원가입 is not lost. Rules must restrict this write to
        // the caller's own uid and reject the counter fields.
        await addDoc(collection(db(), 'users'), {
          uid: cred.user.uid,
          email,
          nickname,
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
     * Distance is filtered client-side against every place.
     *
     * That is correct while the seeded 촬영지 list is small and wrong once it
     * is not: Firestore cannot express a radius query directly, so this needs a
     * geohash range query (the `geohash` field is already in the contract) or
     * multi-field inequalities before the collection grows.
     */
    listNearby: (lat, lng, radius = 50_000) =>
      attempt(async () => {
        const snap = await getDocs(collection(db(), 'places'));
        return snap.docs
          .map((doc_) => toPlace(doc_.id, doc_.data() as DocData))
          .map<PlaceWithDistance>((p) => ({
            ...p,
            distanceMeters: distanceMeters({ lat, lng }, p),
          }))
          .filter((p) => p.distanceMeters <= radius)
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
            reason: oneOf(
              d.reason,
              ['out_of_radius', 'implausible_speed', 'poor_accuracy'] as const,
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
    listMine: () =>
      attempt(async () => {
        const uid = requireUid();
        const snap = await getDocs(
          query(
            collection(db(), 'tickets'),
            where('userId', '==', uid),
            orderBy('issuedAt', 'desc'),
          ),
        );
        return snap.docs.map((doc_) => toTicket(doc_.id, doc_.data() as DocData));
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
    enter: (raffleId) =>
      attempt(async () => {
        const call = httpsCallable(fns(), 'enterRaffle');
        const res = await call({
          raffleId,
          idempotencyKey: `${requireUid()}-${raffleId}-${Date.now()}`,
        });
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
    feed: (cursor) =>
      attempt(async () => {
        const base = [
          collection(db(), 'posts'),
          orderBy('createdAt', 'desc'),
          limit(FEED_PAGE_SIZE),
        ] as const;
        const snap = await getDocs(
          cursor
            ? query(base[0], base[1], startAfter(await cursorSnapshot(cursor)), base[2])
            : query(base[0], base[1], base[2]),
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
          authorId: uid,
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
  },
};

/** Firestore paginates from a snapshot, not an id, so the cursor is re-read. */
async function cursorSnapshot(postId: string) {
  return getDoc(doc(db(), 'posts', postId));
}
