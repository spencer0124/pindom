/**
 * SUPERSEDED — see ADR 0005 (docs/decisions/0005-keep-firebase-behind-a-repository-boundary.md).
 *
 * This file is part of the axios layer built for a REST backend that is not
 * being built. PINDOM talks to Firebase through src/lib/repositories/ instead.
 * Nothing imports it. Kept rather than deleted so the history of the decision
 * stays legible; `types.ts` is the one part of this directory still in use.
 */
import Constants from 'expo-constants';

/**
 * Environment-aware API configuration.
 *
 * Reads from Expo's `app.config.ts` → `extra` field, which is injected
 * via EXPO_PUBLIC_* env vars at build time.
 *
 * The PINDOM backend does not exist yet. The fallback below is a deliberately
 * non-resolving placeholder rather than a real host: if `EXPO_PUBLIC_BASE_URL`
 * is missing, requests should fail loudly and immediately instead of quietly
 * pointing somewhere plausible. Replace it once the backend has an address.
 */
const extra = Constants.expoConfig?.extra as
  | { baseUrl?: string; env?: string }
  | undefined;

export const ApiConfig = {
  baseUrl: extra?.baseUrl ?? 'https://api.invalid.pindom.local',
  env: extra?.env ?? 'prod',
  get isProduction() {
    return this.env === 'prod';
  },
} as const;
