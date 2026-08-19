const EARTH_RADIUS_M = 6_371_000;

const toRadians = (deg: number) => (deg * Math.PI) / 180;

/**
 * Great-circle distance between two coordinates, in metres.
 *
 * This is **feedback only**. The 50m check that decides whether a ticket is
 * minted is adjudicated server-side against the place's stored coordinate — see
 * the trust boundary in docs/explanation/architecture.md. Use this to draw the
 * countdown ring on GPS인증 and to sort pins on 지도; never to gate the camera.
 */
export function distanceMeters(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): number {
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(EARTH_RADIUS_M * 2 * Math.asin(Math.sqrt(a)));
}
