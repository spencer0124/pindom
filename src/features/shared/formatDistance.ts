/**
 * 84m · 2.1km — metres under a kilometre, one decimal above it.
 *
 * Every distance in the app is feedback, never a check: the 50m decision is
 * adjudicated server-side against the place's stored coordinate. See
 * `src/lib/geo.ts` and the trust boundary in docs/explanation/architecture.md.
 */
export function formatDistance(meters: number): string {
  return meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`;
}
