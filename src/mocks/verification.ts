import type { VerificationResult } from '../lib/domain';

/**
 * The scripted GPS verification sequence.
 *
 * Successive calls to `submitReading` walk this list, so the distance counts
 * down and then passes. This is what makes the whole capture chain walkable in
 * a simulator without travelling to 주문진:
 *
 *   GPS인증(84m) → GPS인증(66m) → 인증 실패 → GPS인증(32m) → 카메라 → 티켓 발행
 *
 * The 84m and 32m readings match the two designed frames (GPS인증 `33:2330`
 * and GPS인증2 `33:2856`); 66m matches the 인증 실패 mockup, which shows
 * 「현재 66m · 제한 50m」.
 */
export const mockVerificationSequence: Omit<VerificationResult, 'sessionId'>[] = [
  {
    verified: false,
    distanceMeters: 84,
    requiredRadiusMeters: 50,
    accuracyMeters: 12,
    reason: 'out_of_radius',
  },
  {
    verified: false,
    distanceMeters: 66,
    requiredRadiusMeters: 50,
    accuracyMeters: 9,
    reason: 'out_of_radius',
  },
  {
    // Inside the radius but refused anyway: the server gates on accuracy first, and at
    // ±72m "within 50m" cannot mean anything. The gate is a global 65m, so this number
    // has to sit above it — see the 2026-08-21 contract review resolutions.
    verified: false,
    distanceMeters: 32,
    requiredRadiusMeters: 50,
    accuracyMeters: 72,
    reason: 'poor_accuracy',
  },
  {
    verified: true,
    distanceMeters: 32,
    requiredRadiusMeters: 50,
    accuracyMeters: 8,
  },
];
