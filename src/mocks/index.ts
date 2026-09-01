/**
 * Typed fixtures, served by `src/lib/repositories/` when `AppConfig.useMocks`
 * is on. Nothing under `app/` may import this directly — see ADR 0005.
 *
 * Shapes come from `src/lib/domain/`, which mirrors
 * docs/reference/backend-contract.md. When the contract changes, these change.
 */
export { mockArtists } from './artists';
export { mockCourses } from './courses';
export { mockDelay } from './delay';
export { mockPlaces } from './places';
export { mockPosts } from './posts';
export { mockRaffleEntries, mockRaffles } from './raffles';
export { mockGallery, mockReviews } from './reviews';
export { mockTickets } from './tickets';
export { mockPublicProfiles, mockUser } from './users';
export { mockVerificationSequence } from './verification';
export { mockAssistantReply } from './assistant';
