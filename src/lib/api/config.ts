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
