import Constants from 'expo-constants';

/**
 * Runtime configuration, read once from `app.config.ts` → `extra`.
 *
 * This is the only consumer of `Constants.expoConfig.extra`. Everything else
 * reads through `AppConfig`, so there is one place to look when a value is
 * wrong and one place to change when the contract moves.
 *
 * It replaces `src/lib/api/config.ts`, which was shaped around a REST base URL
 * that ADR 0005 removed — Firebase carries its project identity in the platform
 * config files, not in an environment variable.
 */
const extra = Constants.expoConfig?.extra as
  | {
      env?: string;
      useMocks?: boolean;
      firebaseConfigured?: boolean;
      functionsRegion?: string;
    }
  | undefined;

/**
 * Cloud Functions region.
 *
 * `asia-northeast3` (Seoul) is **confirmed** with the backend developer, not a
 * guess. It stays an env var so a redeployment elsewhere does not need a code
 * change.
 *
 * Firebase's client SDK defaults to `us-central1`, and a mismatch fails as
 * `not-found` on every callable — which reads like a missing function rather
 * than a wrong address, so it is worth being explicit about.
 */
const DEFAULT_FUNCTIONS_REGION = 'asia-northeast3';

export const AppConfig = {
  env: extra?.env ?? 'prod',

  /**
   * When true, repositories serve fixtures from `src/mocks/` and no Firebase
   * code is loaded at all. Defaults to true: if `extra` is somehow missing, an
   * app that renders fixtures beats an app that crashes on launch.
   */
  useMocks: extra?.useMocks ?? true,

  /** Whether both platform config files were present at build time. */
  firebaseConfigured: extra?.firebaseConfigured ?? false,

  functionsRegion: extra?.functionsRegion ?? DEFAULT_FUNCTIONS_REGION,

  get isProduction() {
    return this.env === 'prod';
  },
} as const;
