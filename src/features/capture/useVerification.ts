import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { failureMessage } from '@/lib/api/failure-message';
import type { Place, VerificationResult } from '@/lib/domain';
import { distanceMeters } from '@/lib/geo';
import {
  artistRepository,
  placeRepository,
  verificationRepository,
} from '@/lib/repositories';
import { readPosition, useDiscoveryStore } from '@/features/discovery';
import { useCaptureStore } from './state';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; place: Place; artistName: string | null };

/**
 * Where one attempt is, in the order 1b-A shows its three checks.
 *
 *   idle      — nothing submitted; the ring shows the client's own distance
 *   reading   — asking the device for a fix (위치 정확도 · 측정 중…)
 *   judging   — the reading is with the server, or its verdict is still being
 *               revealed row by row (인증 반경 판정 · 대기)
 *   verified  — the grant is in hand; the CTA opens the camera
 *   refused   — the verdict was no; the caller is on its way to 인증 실패
 */
export type VerifyPhase = 'idle' | 'reading' | 'judging' | 'verified' | 'refused';

/**
 * 1a reveals the verdict one row at a time, 900 ms apart, and leaves for
 * 인증 실패 800 ms after the last row it could tick. The server has already
 * decided by then; this is only the pace at which the screen says so.
 */
const REVEAL_STEP_MS = 900;
const REFUSAL_HOLD_MS = 800;

/**
 * What to send when the device declines to estimate an error radius.
 *
 * `accuracy` is nullable on both platforms, and the server is the one that has to
 * judge an unusable reading — it answers `poor_accuracy` above its 65 m gate, which
 * 인증 실패 already renders. Getting there requires a *finite* number: a callable
 * request is JSON, and the SDK throws `Data cannot be encoded in JSON: Infinity`
 * before the request leaves the device, so `Infinity` produced a verdict of nothing
 * at all — the button read 인증 중… and then silently went back to idle.
 *
 * It is far above the gate so that it reads as a sentinel in a server log rather
 * than as a plausible measurement, which it can only do because it never reaches
 * the screen: the rows and 인증 실패 print what the *device* reported, and there is
 * nothing to print when it reported nothing.
 */
const ACCURACY_UNKNOWN_M = 9999;

/**
 * The three rows under the radar. `ok` is null while the row is still pending.
 *
 * The rows are honest about what the client knows: accuracy is the device's
 * own number and can be shown as soon as there is a fix, but 반경 and 이동속도
 * are the server's verdicts and stay at 대기 until it has spoken. The client
 * never computes either — see src/lib/geo.ts.
 */
export interface VerifyCheck {
  label: string;
  value: string;
  ok: boolean | null;
}

export interface VerificationView {
  state: LoadState;
  phase: VerifyPhase;
  /** What the ring prints. Null when there is no fix yet — not a distance of zero. */
  distance: number | null;
  /**
   * The error radius the **device** reported, or null when it reported none.
   *
   * Not the server's echo of it: an unusable reading is sent as a sentinel large
   * enough to trip the accuracy gate, and quoting that back as `±9999m` would be
   * the app inventing a measurement. Null is the honest answer, and 인증 실패 has
   * a line for it.
   */
  accuracy: number | null;
  checks: VerifyCheck[];
  result: VerificationResult | null;
  /**
   * Why the last attempt produced no verdict at all, or null.
   *
   * Distinct from a refusal: a refusal *is* a verdict and belongs to 인증 실패,
   * with the figures. This is the case where nothing came back — no permission,
   * no fix, a malformed reading, a dropped call — and the screen would otherwise
   * return to idle saying nothing, which reads as a dead button.
   */
  error: string | null;
  /**
   * Submit one reading. Resolves with the verdict once the screen has finished
   * revealing it — a refusal resolves as the screen should leave for 인증 실패,
   * a pass as the last row ticks.
   */
  verify: () => Promise<VerificationResult | null>;
  reload: () => void;
}

/**
 * GPS인증's data and its one action.
 *
 * The client's part is to produce a reading and hand it over. The radius, the
 * accuracy gate, the implied-speed check and the mock-provider flag are all
 * adjudicated server-side — `submitReading` returns the verdict, and the screen
 * renders it. That is the hard constraint in CLAUDE.md, and it is why there is
 * no `if (distance <= radius)` anywhere in this file.
 */
export function useVerification(placeId: string | undefined): VerificationView {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [phase, setPhase] = useState<VerifyPhase>('idle');
  const [distance, setDistance] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  // How many of the server's two rows (반경, 이동속도) the screen has revealed.
  // Only a row the server passed is ever revealed, so revealed means ticked.
  const [revealed, setRevealed] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const selectedArtistId = useDiscoveryStore((s) => s.selectedArtistId);
  const begin = useCaptureStore((s) => s.begin);
  const sessionId = useCaptureStore((s) => s.sessionId);
  const setSessionId = useCaptureStore((s) => s.setSessionId);
  const setGrant = useCaptureStore((s) => s.setGrant);
  const grant = useCaptureStore((s) => s.grant);
  const setLastDistance = useCaptureStore((s) => s.setLastDistance);

  const load = useCallback(async () => {
    if (placeId == null) {
      return setState({ status: 'error', message: '촬영지를 찾을 수 없어요.' });
    }
    setState({ status: 'loading' });

    const [placeResult, position] = await Promise.all([
      placeRepository.getById(placeId),
      readPosition(),
    ]);
    if (!placeResult.ok) {
      return setState({ status: 'error', message: failureMessage(placeResult.failure) });
    }
    const place = placeResult.data;

    const artistId =
      selectedArtistId != null && place.artistIds.includes(selectedArtistId)
        ? selectedArtistId
        : place.artistIds[0];
    const artist = artistId != null ? await artistRepository.getById(artistId) : null;
    const artistName = artist?.ok ? artist.data.name : null;

    begin(place, artistName);
    // The opening number is the client's own measurement, the same feedback
    // 장소/상세 prints — unless the server has already measured this session,
    // in which case its figure is the one 인증 실패 just showed, and it stays.
    const remembered = useCaptureStore.getState().lastDistance;
    if (remembered != null) {
      setDistance(remembered);
    } else if (position != null) {
      setDistance(Math.round(distanceMeters(position, { lat: place.lat, lng: place.lng })));
    }
    setState({ status: 'ready', place, artistName });
  }, [placeId, selectedArtistId, begin]);

  useEffect(() => {
    void load();
  }, [load]);

  // Arriving back from 인증 실패 with a grant already in hand — 다시 인증하기 after
  // a pass cannot happen, but a stale screen must not offer 현재 위치로 인증 twice.
  useEffect(() => {
    if (grant != null) {
      setPhase('verified');
      setRevealed(2);
    }
  }, [grant]);

  // The reveal is a presentation sequence; a screen that leaves mid-way must
  // not keep ticking rows — or minting phases — into nothing.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.length = 0;
    };
  }, []);

  const after = useCallback((ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const verify = useCallback(async (): Promise<VerificationResult | null> => {
    if (state.status !== 'ready') return null;
    const { place } = state;

    setPhase('reading');
    setResult(null);
    setRevealed(0);
    setError(null);

    let fix: Location.LocationObject;
    try {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) {
        setPhase('idle');
        setAccuracy(null);
        setError('위치 권한이 있어야 인증할 수 있어요. 설정에서 허용해 주세요.');
        return null;
      }
      fix = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    } catch {
      setPhase('idle');
      setAccuracy(null);
      setError('현재 위치를 가져오지 못했어요. 하늘이 트인 곳에서 다시 시도해 주세요.');
      return null;
    }

    // Held separately from what is sent: the row under the radar prints the
    // device's own number, and there is none to print when it declined to estimate.
    // iOS reports a negative `horizontalAccuracy` for a fix it considers invalid,
    // which is not a small error radius — treating it as one would let a garbage
    // coordinate through the server's gate looking like a perfect measurement.
    const raw = fix.coords.accuracy;
    const measured = raw != null && raw > 0 ? raw : null;

    const reading = {
      placeId: place.id,
      lat: fix.coords.latitude,
      lng: fix.coords.longitude,
      // A radius in metres, nullable on both platforms. The server's gate is what
      // judges it — see `ACCURACY_UNKNOWN_M` for why the absent case is a number.
      accuracy: measured ?? ACCURACY_UNKNOWN_M,
      // Sent as measured, and straight away: the server refuses a `capturedAt`
      // more than five minutes from its own clock, because that value is the
      // denominator of every speed check. Do not build a flow that holds a
      // reading and re-sends it later.
      capturedAt: new Date(fix.timestamp),
      // Android exposes the mock-provider flag; iOS has no equivalent and sends
      // false. Self-reported, and the contract says so.
      isMock: Platform.OS === 'android' ? (fix.mocked ?? false) : false,
      ...(sessionId != null && { sessionId }),
    };
    setAccuracy(measured != null ? Math.round(measured) : null);
    setPhase('judging');

    const verdict = await verificationRepository.submitReading(reading);
    if (!verdict.ok) {
      setPhase('idle');
      setError(failureMessage(verdict.failure));
      return null;
    }

    const data = verdict.data;
    setSessionId(data.sessionId);
    setResult(data);
    // `poor_accuracy` is the one verdict whose distance means nothing. The gate
    // fires before the radius is ever considered, and the server reports the
    // distance with the error radius already subtracted — so a reading too blurry
    // to judge comes back as 0 m, which the radar would then show as 반경 안에
    // 있어요 and `lastDistance` would keep showing on every later visit.
    if (data.reason !== 'poor_accuracy') {
      setDistance(Math.round(data.distanceMeters));
      setLastDistance(Math.round(data.distanceMeters));
    }

    // The verdict is in. What follows is 1a's pace of saying so — the rows the
    // server passed tick 900 ms apart, in the order it checks them, and a row
    // it refused never ticks. The server checks accuracy, then the radius, then
    // the speed series, so a refusal at one gate leaves the later ones unjudged.
    // The deployed order is mock → accuracy → radius → speed, so a refusal reveals
    // only the rows the server actually got past. `mock_location` is refused first
    // of all and passes none of them — it used to tick 인증 반경 판정 ✓ for a radius
    // the server never measured.
    const passedRows = data.verified ? 2 : data.reason === 'implausible_speed' ? 1 : 0;

    return new Promise<VerificationResult>((resolve) => {
      for (let row = 1; row <= passedRows; row += 1) {
        after((row - 1) * REVEAL_STEP_MS, () => setRevealed(row));
      }
      const lastTickAt = Math.max(0, passedRows - 1) * REVEAL_STEP_MS;
      if (data.verified && data.grant) {
        const grant = data.grant;
        after(lastTickAt, () => {
          setGrant(grant);
          setPhase('verified');
          resolve(data);
        });
      } else {
        after(lastTickAt + REFUSAL_HOLD_MS, () => {
          setPhase('refused');
          resolve(data);
        });
      }
    });
  }, [state, sessionId, setSessionId, setGrant, setLastDistance, after]);

  const checks = buildChecks(phase, accuracy, result, revealed);

  return { state, phase, distance, accuracy, checks, result, error, verify, reload: load };
}

function buildChecks(
  phase: VerifyPhase,
  accuracy: number | null,
  result: VerificationResult | null,
  revealed: number,
): VerifyCheck[] {
  const pending = phase === 'idle' || phase === 'reading';
  const accuracyOk =
    result != null ? result.reason !== 'poor_accuracy' : accuracy != null ? true : null;
  // A server row shows its tick only once the reveal has reached it; until
  // then it reads 대기 whether the server has spoken or not.
  const radiusOk = revealed >= 1 ? true : null;
  const speedOk = revealed >= 2 ? true : null;

  return [
    {
      label: '위치 정확도',
      value:
        phase === 'reading'
          ? '측정 중…'
          : accuracy != null
            ? `±${accuracy}m${accuracyOk === false ? '' : ' 양호'}`
            : '측정 중…',
      ok: pending ? null : accuracyOk,
    },
    {
      label: '인증 반경 판정',
      value: radiusOk && result != null ? `${result.requiredRadiusMeters}m 이내` : '대기',
      ok: radiusOk,
    },
    {
      label: '이동속도 검증 (위조 방지)',
      value: speedOk ? '정상' : '대기',
      ok: speedOk,
    },
  ];
}
