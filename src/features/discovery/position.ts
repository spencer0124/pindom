import * as Location from 'expo-location';

export interface Position {
  lat: number;
  lng: number;
}

/**
 * Roughly the centre of the country, used only to order a place list when there
 * is no fix. It is never displayed: a distance measured from here is not the
 * user's distance, so screens hide the number when `hasPosition` is false.
 *
 * It is also 지도's opening camera, which is what 1a shows — the map starts at a
 * scale covering the whole country and zooms in.
 */
export const KOREA_CENTRE: Position = { lat: 36.2, lng: 127.9 };

let cached: Position | null = null;
let inFlight: Promise<Position | null> | null = null;

async function read(): Promise<Position | null> {
  try {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) return null;

    // Last known first: it returns immediately, and every Discovery screen only
    // needs a distance good enough to sort by. The 50m decision is the
    // server's, never this — see src/lib/geo.ts.
    const last = await Location.getLastKnownPositionAsync();
    const fix = last ?? (await Location.getCurrentPositionAsync({}));
    return { lat: fix.coords.latitude, lng: fix.coords.longitude };
  } catch {
    return null;
  }
}

/**
 * One position for the whole Discovery slice.
 *
 * Cached at module scope, and concurrent callers share one in-flight request.
 * Without that, 홈 and 지도 each ask on mount and the user gets the permission
 * dialog twice — and on a refusal, twice again on every reload.
 *
 * Returns null when permission was refused or no fix is available. That is not
 * an error: the screens render without distances.
 *
 * TODO(온보딩): 1a asks for location and camera permission on the onboarding
 * screen. Once that screen exists the request belongs there, and this becomes a
 * read of the last known position rather than a prompt.
 */
export function readPosition(refresh = false): Promise<Position | null> {
  if (cached != null && !refresh) return Promise.resolve(cached);
  if (inFlight == null) {
    inFlight = read().then((position) => {
      cached = position;
      inFlight = null;
      return position;
    });
  }
  return inFlight;
}
