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
import { getStorage, putFile, ref } from '@react-native-firebase/storage';

import { AppConfig } from '../config';
import { Failure, ResultHelper, type AppFailure, type Result } from '../api/types';
import { BLOCKED_USERS_MAX, DEFAULT_LOCALE, LOCALES } from '../domain';
import type {
  Artist,
  AssistantMap,
  AssistantStop,
  AssistantSuggestion,
  Course,
  FeedPage,
  GalleryPhoto,
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
import { FEED_PAGE_SIZE, type EnteredRaffle, type Repositories } from './types';

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
const storage = () => getStorage(getApp());

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

/** A finite number, or nothing. Callable payloads are not documents — a bad row is skipped, not fatal. */
function coord(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * The map an assistant answer draws, out of the callable's payload.
 *
 * Lenient on purpose. A document that fails to map is a seeding bug worth
 * throwing on; an answer that carries one malformed pin is still an answer,
 * and the thread should show the rest of it rather than fail the turn.
 * Returns null when there is nothing to draw, and the bubble stands alone.
 */
function toAssistantMap(d: DocData): AssistantMap | null {
  const stops = (Array.isArray(d.spots) ? d.spots : [])
    .map((raw) => {
      const s = raw as DocData;
      const lat = coord(s?.lat);
      const lng = coord(s?.lng);
      if (lat == null || lng == null || typeof s?.placeId !== 'string') return null;
      return {
        placeId: s.placeId,
        name: String(s.name ?? '촬영지'),
        lat,
        lng,
        ...(typeof s.region === 'string' && { region: s.region }),
      };
    })
    .filter((s): s is AssistantStop => s !== null);

  const suggestions = (Array.isArray(d.suggestions) ? d.suggestions : [])
    .map((raw) => {
      const s = raw as DocData;
      const lat = coord(s?.lat);
      const lng = coord(s?.lng);
      if (lat == null || lng == null || typeof s?.name !== 'string') return null;
      return {
        name: s.name,
        category: String(s.category ?? '장소'),
        address: String(s.address ?? ''),
        lat,
        lng,
        ...(typeof s.placeUrl === 'string' && { placeUrl: s.placeUrl }),
      };
    })
    .filter((s): s is AssistantSuggestion => s !== null);

  const route = (d.route ?? null) as DocData | null;
  const path = (Array.isArray(route?.path) ? route.path : [])
    .map((raw) => {
      const point = raw as DocData;
      const lat = coord(point?.lat);
      const lng = coord(point?.lng);
      return lat == null || lng == null ? null : { lat, lng };
    })
    .filter((p): p is { lat: number; lng: number } => p !== null);

  if (stops.length === 0 && suggestions.length === 0) return null;
  return {
    stops,
    suggestions,
    path,
    ordered: d.ordered === true,
    ...(coord(route?.distanceMeters) != null && { distanceMeters: Number(route?.distanceMeters) }),
    ...(coord(route?.durationSeconds) != null && { durationSeconds: Number(route?.durationSeconds) }),
  };
}

function toPlace(id: string, d: DocData): Place {
  const at = `places/${id}`;
  const { lat, lng } = geo(d, 'location', at);
  return {
    id,
    // A 촬영지 name is **not** translated, on purpose. 언어 says so in as many
    // words — `촬영지 이름은 번역하지 않습니다`, because a name that disagrees with
    // the signage and the map is worse than a foreign one when you are standing
    // in front of it looking for the spot. `roman` is the Latin caption that goes
    // under it; the seed's `name.en` is a translation (`Gwangtonggyo Bridge`) and
    // is deliberately not read. See the 2026-08-26 live verification, finding 7.
    name: localized(d, 'name', at, DEFAULT_LOCALE),
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
    // Absent on every account created before 차단 shipped, and `strList`
    // resolves a missing array to `[]` rather than reporting it — which is the
    // behaviour wanted here: nobody blocked is the correct reading of no field.
    blockedUserIds: strList(d, 'blockedUserIds'),
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
  // `issueTicket` inherits this from the place, and 컬렉션 groups by it. It was
  // written by the backend and read by nobody — the mock set it, so grouping
  // would have looked right on fixtures and collapsed to one bucket on Firebase.
  const artistId = optStr(d, 'artistId');
  return {
    id,
    userId: str(d, 'userId', at),
    placeId: str(d, 'placeId', at),
    ...(artistId && { artistId }),
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
  boards: {
    listActive: () =>
      attempt(async () => {
        const snap = await getDocs(
          query(collection(db(), 'boards'), where('archived', '==', false), orderBy('order')),
        );
        return snap.docs.map((d_) => ({
          // The deployed app reserved board-free; admin data uses the canonical free id.
          id: d_.id === 'free' ? 'board-free' : d_.id,
          name: localized(d_.data() as DocData, 'name', `boards/${d_.id}`, DEFAULT_LOCALE),
        }));
      }),
  },

  assistant: {
    /**
     * `askAssistant` was deployed on 2026-08-26 answering
     * `{ reply, suggestions, route }`, while the shape the client had recorded
     * in the Assistant checklist was `{ text, courseId }`. Neither side was
     * wrong: the function was never written into
     * docs/reference/backend-contract.md, so the two names drifted with nothing
     * to referee them. The contract now carries it; both spellings are read
     * until the deployment and the contract agree.
     *
     * The cost of the drift is worth remembering — the call *succeeded*, so
     * nothing threw and nothing logged, and 챗 simply drew an empty bubble.
     * That is the same silent-mismatch failure a renamed Firestore field
     * produces, and it is why the empty answer below is turned into an error.
     */
    ask: (input) =>
      attempt(async () => {
        const call = httpsCallable(fns(), 'askAssistant');
        const res = await call(input);
        const data = res.data as DocData;
        const map = toAssistantMap(data);

        // 계약서(backend-contract.md §askAssistant)의 이름은 `reply` 다. `text` 를
        // 읽고 있어 답변이 늘 빈 문자열이었다.
        const text = String(data.reply ?? '').trim();

        // An answer with no text is not an answer. Throwing puts it down the
        // same path a failed call takes, so the transcript says the assistant
        // could not answer — a blank bubble reads as the app being broken, and
        // is worse than the `not-found` this screen used to render.
        if (!text) throw new Error('답변을 받지 못했습니다.');

        return {
          text,
          ...(map != null && { map }),
          ...(typeof data.courseId === 'string' && { courseId: data.courseId }),
        };
      }),
  },

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

    route: (placeIds, origin) =>
      attempt(async () => {
        const call = httpsCallable(fns(), 'getRoute');
        const res = await call({ placeIds, ...(origin != null && { origin }) });
        const data = res.data as DocData;
        return {
          path: (Array.isArray(data.path) ? data.path : [])
            .map((raw) => {
              const point = raw as DocData;
              const lat = coord(point?.lat);
              const lng = coord(point?.lng);
              return lat == null || lng == null ? null : { lat, lng };
            })
            .filter((p_): p_ is { lat: number; lng: number } => p_ !== null),
          distanceMeters: Number(data.distanceMeters) || 0,
          durationSeconds: Number(data.durationSeconds) || 0,
        };
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

    deleteAccount: () =>
      attempt(async () => {
        requireUid();
        const call = httpsCallable(fns(), 'deleteAccount');
        await call({});
        // The function deletes the Auth account itself, and it does that last.
        // The SDK does not notice: `auth().currentUser` is still populated from
        // a token that now names nobody, so 마이페이지 would re-render a user
        // whose every read comes back `permission-denied`. Clearing it here
        // rather than in the screen means no caller can forget, and it is the
        // reason this method sits on `AuthRepository`.
        //
        // Deliberately not inside the same `attempt`-level failure path as the
        // call: if the deletion succeeded and only the local sign-out threw,
        // the account is still gone and reporting an error would invite the
        // user to try again against an account that no longer exists.
        try {
          await firebaseSignOut(auth());
        } catch {
          // Local sign-out is an in-process token clear and effectively cannot
          // fail, but if it did there is nothing to retry against — the account
          // is gone. **The caller must route away from the signed-in tree on
          // success regardless**, which is what makes this safe: 마이페이지
          // replaces the stack with 온보딩, so no screen is left reading against
          // the dead token even in that case.
        }
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

    uploadPhoto: (localUri) =>
      attempt(async () => {
        // `tickets/{uid}/` is what the rules and `issueTicket` both check, so the
        // prefix is built here and nowhere else. The object name only has to be
        // unique per user; a timestamp is enough.
        const path = `tickets/${requireUid()}/${Date.now()}.jpg`;
        await putFile(ref(storage(), path), localUri, { contentType: 'image/jpeg' });
        return path;
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

    listMine: () =>
      attempt(async () => {
        const snap = await getDocs(
          query(collection(db(), 'raffleEntries'), where('userId', '==', requireUid())),
        );
        return snap.docs
          .map((d_) => {
            const d = d_.data() as DocData;
            return {
              id: d_.id,
              userId: String(d.userId ?? ''),
              raffleId: String(d.raffleId ?? ''),
              ticketIds: strList(d, 'ticketIds'),
              ticketsSpent: Number(d.ticketsSpent ?? 0),
              createdAt: date(d, 'createdAt', `raffleEntries/${d_.id}`),
            };
          })
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
        const entry: EnteredRaffle = {
          id: String(d.entryId ?? ''),
          userId: requireUid(),
          raffleId,
          ticketIds: strList(d, 'ticketIds'),
          ticketsSpent: Number(d.ticketsSpent ?? 0),
          createdAt: new Date(),
          // The contract returns the balance after the debit; 응모완료 prints
          // it. Left off rather than guessed if the response has none.
          ...(typeof d.ticketBalance === 'number' && { ticketBalance: d.ticketBalance }),
        };
        return entry;
      }),
  },

  posts: {
    feed: (boardId, cursor) =>
      attempt(async () => {
        // One past the page, so a full page can be told from a last page. Asking
        // for exactly the page size cannot: `cursor` then had to be non-null
        // whenever the page came back full, and a board holding an exact multiple
        // of the page size spent one more query — and one more spinner — proving
        // there was nothing after it.
        const base = [
          collection(db(), 'posts'),
          where('boardId', '==', boardId),
          orderBy('createdAt', 'desc'),
          limit(FEED_PAGE_SIZE + 1),
        ] as const;
        const snap = await getDocs(
          cursor
            ? query(base[0], base[1], base[2], startAfter(await cursorSnapshot(cursor)), base[3])
            : query(base[0], base[1], base[2], base[3]),
        );
        const docs = snap.docs.slice(0, FEED_PAGE_SIZE);
        const last = docs[docs.length - 1];
        const page: FeedPage = {
          posts: docs.map((doc_) => toPost(doc_.id, doc_.data() as DocData)),
          cursor: snap.docs.length > FEED_PAGE_SIZE && last ? last.id : null,
        };
        return page;
      }),

    listMine: () =>
      attempt(async () => {
        const snap = await getDocs(
          query(collection(db(), 'posts'), where('authorId', '==', requireUid())),
        );
        return snap.docs
          .map((d_) => toPost(d_.id, d_.data() as DocData))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
        // The place is read alongside the author because 커뮤니티 draws its
        // location chip only when a post carries **both** `placeId` and
        // `placeName` — see `PostRow`. `NewPost` carries only the id, so the
        // name has to be denormalised here, exactly as the mock repository
        // does; without it the pin silently disappears the moment the app stops
        // serving fixtures, which is the one difference between the two
        // implementations ADR 0005 exists to prevent.
        //
        // The read is deliberately not allowed to fail the write. A chip label
        // is not worth losing a post someone typed, so a missing or unreadable
        // place resolves to no pin rather than to an error — and the pair is
        // written whole, because a `placeId` stored without its name is a chip
        // that can never render and that no later read repairs.
        const [meSnap, pin] = await Promise.all([
          getDoc(doc(db(), 'users', uid)),
          resolvePin(input.placeId),
        ]);
        const me = toUser(uid, (meSnap.data() ?? {}) as DocData);
        const payload = {
          boardId: input.boardId,
          authorId: uid,
          authorTier: me.tier,
          authorNickname: me.nickname,
          ...(me.avatarUrl && { authorAvatarUrl: me.avatarUrl }),
          body: input.body,
          imageUrls: input.imageUrls,
          ...pin,
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

  reports: {
    create: (input: NewReport) =>
      attempt(async () => {
        const uid = requireUid();
        // Exactly these five keys. The deployed rule uses `hasOnly`, so one
        // extra field — a client-side `createdAt`, a `targetName` for the
        // console's convenience — makes the whole write a permission error
        // with nothing naming the offending key.
        await addDoc(collection(db(), 'reports'), {
          reporterId: uid,
          targetType: input.targetType,
          targetId: input.targetId,
          reason: input.reason,
          createdAt: serverTimestamp(),
        });
      }),
  },

  users: {
    getPublicProfile: (userId) =>
      attempt(async () => {
        const call = httpsCallable(fns(), 'getPublicProfile');
        const d = (await call({ userId })).data as DocData;
        return {
          userId: String(d.userId ?? userId),
          nickname: String(d.nickname ?? ''),
          bio: String(d.bio ?? ''),
          ...(typeof d.avatarUrl === 'string' && { avatarUrl: d.avatarUrl }),
          ticketsIssued: Number(d.ticketsIssued ?? 0),
          placesVisited: Number(d.placesVisited ?? 0),
          tier: (['club10', 'club20', 'clubGo'].includes(String(d.tier)) ? d.tier : 'club10') as 'club10' | 'club20' | 'clubGo',
        };
      }),

    me: () =>
      attempt(async () => {
        const uid = requireUid();
        const snap = await getDoc(doc(db(), 'users', uid));
        if (!snap.exists()) {
          throw Object.assign(new Error('사용자 문서 없음'), { code: 'not-found' });
        }
        const me = toUser(snap.id, snap.data() as DocData);
        // This is the load `firebase-mapping.ts` means by "the session layer calls
        // `setActiveLocale` once the user document loads". Without it the mapper
        // stays on its Korean default for the whole run and a user who chose
        // English sees it only after setting the language a second time —
        // `users.setLocale` was the only caller.
        setActiveLocale(me.locale);
        return me;
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

    block: (userId: string) => writeBlocklist(userId, 'add'),
    unblock: (userId: string) => writeBlocklist(userId, 'remove'),
  },
};

/**
 * 차단 and 차단 해제 — the same write with the array operator flipped.
 *
 * `arrayUnion` / `arrayRemove` rather than a read-modify-write, so two devices
 * blocking two different people at once cannot drop one of them. Blocking
 * someone already blocked is a no-op at the server, which is what makes the
 * button safe to double-tap.
 *
 * The `BLOCKED_USERS_MAX` check is client-side and advisory: the rule is the
 * real cap, and `arrayUnion` on an already-present uid does not grow the array,
 * so this only refuses genuine additions past the limit.
 */
function writeBlocklist(userId: string, op: 'add' | 'remove'): Promise<Result<User>> {
  return attempt(async () => {
    const uid = requireUid();
    const ref = doc(db(), 'users', uid);
    if (op === 'add') {
      // Only the add path refuses this. Unblocking yourself is an `arrayRemove`
      // of a uid that was never in the list — a no-op — and refusing it would
      // mean a 차단 해제 loop over a stale list could fail on an entry that is
      // already absent.
      if (userId === uid) {
        throw Object.assign(new Error('본인은 차단할 수 없습니다.'), {
          code: 'invalid-argument',
        });
      }
      const current = toUser(uid, ((await getDoc(ref)).data() ?? {}) as DocData);
      if (
        !current.blockedUserIds.includes(userId) &&
        current.blockedUserIds.length >= BLOCKED_USERS_MAX
      ) {
        throw Object.assign(
          new Error(`차단은 최대 ${BLOCKED_USERS_MAX}명까지 가능합니다.`),
          { code: 'resource-exhausted' },
        );
      }
    }
    await updateDoc(ref, {
      blockedUserIds: op === 'add' ? arrayUnion(userId) : arrayRemove(userId),
    });
    const snap = await getDoc(ref);
    return toUser(uid, (snap.data() ?? {}) as DocData);
  });
}

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

/**
 * The `placeId` / `placeName` pair a new post carries, or nothing.
 *
 * Resolved in `ko` rather than in the author's language: the value is written to
 * the document and then read by everyone, so it must not be the writer's
 * language — and `ko` is what the backend already denormalises onto
 * `tickets.placeName`, so the same 촬영지 does not appear under two names.
 */
async function resolvePin(
  placeId: string | undefined,
): Promise<{ placeId: string; placeName: string } | Record<string, never>> {
  if (placeId == null) return {};
  try {
    const snap = await getDoc(doc(db(), 'places', placeId));
    if (!snap.exists()) return {};
    const placeName = localized(snap.data() as DocData, 'name', `places/${placeId}`, DEFAULT_LOCALE);
    return placeName ? { placeId, placeName } : {};
  } catch {
    return {};
  }
}

/** Firestore paginates from a snapshot, not an id, so the cursor is re-read. */
async function cursorSnapshot(postId: string) {
  return getDoc(doc(db(), 'posts', postId));
}
