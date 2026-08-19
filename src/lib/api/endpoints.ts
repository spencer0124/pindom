/**
 * SUPERSEDED — see ADR 0005 (docs/decisions/0005-keep-firebase-behind-a-repository-boundary.md).
 *
 * This file is part of the axios layer built for a REST backend that is not
 * being built. PINDOM talks to Firebase through src/lib/repositories/ instead.
 * Nothing imports it. Kept rather than deleted so the history of the decision
 * stays legible; `types.ts` is the one part of this directory still in use.
 */
/**
 * Centralized API path definitions.
 *
 * Paths are unencoded — axios handles percent-encoding automatically.
 *
 * Shaped from the PINDOM flowchart (Figma node `30:2`). These are provisional:
 * the backend is not built yet, so treat every path here as a proposal that the
 * server contract will confirm or override.
 */
export const ApiEndpoints = {
  // ── Filming locations (촬영지) ──
  places: () => '/places',
  placeDetail: (placeId: string) => `/places/${placeId}`,
  placesNearby: () => '/places/nearby',

  // ── GPS verification (GPS인증) ──
  // The 50m-radius and speed checks are anti-spoofing measures and must be
  // adjudicated server-side — the client submits a reading, it does not decide.
  verifyLocation: () => '/verify/location',

  // ── Tickets (티켓 발행 / 컬렉션) ──
  issueTicket: () => '/tickets',
  ticketCollection: () => '/tickets/me',
  ticketDetail: (ticketId: string) => `/tickets/${ticketId}`,

  // ── Raffles (응모) ──
  raffles: () => '/raffles',
  raffleDetail: (raffleId: string) => `/raffles/${raffleId}`,
  enterRaffle: (raffleId: string) => `/raffles/${raffleId}/entries`,

  // ── Community (커뮤니티 / 글쓰기) ──
  posts: () => '/posts',
  postDetail: (postId: string) => `/posts/${postId}`,

  // ── Account (마이페이지) ──
  me: () => '/me',
} as const;
