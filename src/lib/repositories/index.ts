import { AppConfig } from '../config';
import type {
  ArtistRepository,
  BoardRepository,
  AssistantRepository,
  AuthRepository,
  CourseRepository,
  PlaceRepository,
  PostRepository,
  RaffleRepository,
  ReportRepository,
  Repositories,
  TicketRepository,
  UserRepository,
  VerificationRepository,
} from './types';

/**
 * The data boundary. Screens import from here and nothing below it.
 *
 * Which implementation runs is decided once, on first use, from
 * `AppConfig.useMocks`:
 *
 *   EXPO_PUBLIC_USE_MOCKS=true   →  src/mocks/    typed fixtures
 *   EXPO_PUBLIC_USE_MOCKS=false  →  Firebase
 *
 * The import is **dynamic on purpose**. A static import of `./firebase` would
 * pull the Firebase SDK into every bundle, and touching it without the native
 * modules linked throws — which is precisely the state of the app until the
 * backend developer hands over the platform config files. Loading it lazily
 * means fixture mode never executes a line of Firebase code.
 *
 * See ADR 0005 and docs/how-to/connect-the-app-to-firebase.md.
 */

let loading: Promise<Repositories> | null = null;

function impl(): Promise<Repositories> {
  if (!loading) {
    loading = AppConfig.useMocks
      ? import('./mock').then((m) => m.mockRepositories)
      : import('./firebase').then((m) => m.firebaseRepositories);
  }
  return loading;
}

export const artistRepository: ArtistRepository = {
  search: async (queryText) => (await impl()).artists.search(queryText),
  getById: async (artistId) => (await impl()).artists.getById(artistId),
  listMine: async () => (await impl()).artists.listMine(),
  follow: async (artistId) => (await impl()).artists.follow(artistId),
  unfollow: async (artistId) => (await impl()).artists.unfollow(artistId),
};

export const boardRepository: BoardRepository = {
  listActive: async () => (await impl()).boards.listActive(),
};

export const courseRepository: CourseRepository = {
  listForArtist: async (artistId) => (await impl()).courses.listForArtist(artistId),
  route: async (placeIds, origin) => (await impl()).courses.route(placeIds, origin),
};

export const assistantRepository: AssistantRepository = {
  ask: async (input) => (await impl()).assistant.ask(input),
};

export const authRepository: AuthRepository = {
  signIn: async (email, password) => (await impl()).auth.signIn(email, password),
  signUp: async (email, password, nickname) =>
    (await impl()).auth.signUp(email, password, nickname),
  signOut: async () => (await impl()).auth.signOut(),
  currentSession: async () => (await impl()).auth.currentSession(),
  deleteAccount: async () => (await impl()).auth.deleteAccount(),
};

export const placeRepository: PlaceRepository = {
  listAll: async (lat, lng) => (await impl()).places.listAll(lat, lng),
  getById: async (placeId) => (await impl()).places.getById(placeId),
  reviews: async (placeId) => (await impl()).places.reviews(placeId),
  gallery: async (placeId) => (await impl()).places.gallery(placeId),
  addReview: async (input) => (await impl()).places.addReview(input),
};

export const verificationRepository: VerificationRepository = {
  submitReading: async (reading) =>
    (await impl()).verification.submitReading(reading),
};

export const ticketRepository: TicketRepository = {
  listMine: async () => (await impl()).tickets.listMine(),
  listVault: async () => (await impl()).tickets.listVault(),
  setVisibility: async (ticketId, visibility) =>
    (await impl()).tickets.setVisibility(ticketId, visibility),
  getById: async (ticketId) => (await impl()).tickets.getById(ticketId),
  uploadPhoto: async (localUri) => (await impl()).tickets.uploadPhoto(localUri),
  issue: async (input) => (await impl()).tickets.issue(input),
};

export const raffleRepository: RaffleRepository = {
  list: async () => (await impl()).raffles.list(),
  getById: async (raffleId) => (await impl()).raffles.getById(raffleId),
  enter: async (raffleId, idempotencyKey) =>
    (await impl()).raffles.enter(raffleId, idempotencyKey),
};

export const postRepository: PostRepository = {
  feed: async (boardId, cursor) => (await impl()).posts.feed(boardId, cursor),
  getById: async (postId) => (await impl()).posts.getById(postId),
  create: async (input) => (await impl()).posts.create(input),
};

export const reportRepository: ReportRepository = {
  create: async (input) => (await impl()).reports.create(input),
};

export const userRepository: UserRepository = {
  me: async () => (await impl()).users.me(),
  updateProfile: async (input) => (await impl()).users.updateProfile(input),
  setLocale: async (locale) => (await impl()).users.setLocale(locale),
  block: async (userId) => (await impl()).users.block(userId),
  unblock: async (userId) => (await impl()).users.unblock(userId),
};

export type {
  ArtistRepository,
  BoardRepository,
  AuthRepository,
  CourseRepository,
  PlaceRepository,
  PostRepository,
  RaffleRepository,
  ReportRepository,
  Repositories,
  TicketRepository,
  UserRepository,
  VerificationRepository,
} from './types';
