/**
 * SUPERSEDED — see ADR 0005 (docs/decisions/0005-keep-firebase-behind-a-repository-boundary.md).
 *
 * This file is part of the axios layer built for a REST backend that is not
 * being built. PINDOM talks to Firebase through src/lib/repositories/ instead.
 * Nothing imports it. Kept rather than deleted so the history of the decision
 * stays legible; `types.ts` is the one part of this directory still in use.
 */
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

/**
 * Auth token provider — injected by the mobile app at startup.
 *
 * The shared package never imports @react-native-firebase/auth directly.
 * Instead, the mobile app registers a function that wraps
 * `user.getIdToken(forceRefresh)`. This keeps the shared package
 * environment-agnostic (works in tests, web, etc.).
 */
type AuthTokenProvider = (forceRefresh?: boolean) => Promise<string | null>;

let tokenProvider: AuthTokenProvider | null = null;

/** Register the token provider. Call once during app init. */
export function setAuthTokenProvider(provider: AuthTokenProvider): void {
  tokenProvider = provider;
}

async function getToken(forceRefresh = false): Promise<string | null> {
  if (!tokenProvider) return null;
  try {
    return await tokenProvider(forceRefresh);
  } catch {
    return null;
  }
}

// ── 401 mutex ──
// Promise-based mutex prevents thundering herd on concurrent 401s.
// First 401 starts a refresh; concurrent 401s await the same promise.
let refreshPromise: Promise<string | null> | null = null;

const AUTH_RETRIED = '__authRetried';

/**
 * Attach auth request + 401 error interceptors to an axios instance.
 *
 * Request interceptor (LIFO in axios — added last, runs first):
 *   Calls getToken(false) → sets Authorization header.
 *
 * Error interceptor:
 *   On 401, uses promise-based mutex to refresh token once, then retries.
 *   The __authRetried flag prevents infinite retry loops.
 */
export function attachAuthInterceptor(client: AxiosInstance): void {
  // Request: attach Bearer token
  client.interceptors.request.use(async (config) => {
    const token = await getToken(false);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Response error: handle 401
  client.interceptors.response.use(undefined, async (error) => {
    const originalConfig = error.config as
      | (InternalAxiosRequestConfig & { [AUTH_RETRIED]?: boolean })
      | undefined;

    if (
      error.response?.status !== 401 ||
      !originalConfig ||
      originalConfig[AUTH_RETRIED]
    ) {
      return Promise.reject(error);
    }

    // Mark to prevent infinite loop
    originalConfig[AUTH_RETRIED] = true;

    // Mutex: only one refresh at a time
    if (!refreshPromise) {
      refreshPromise = getToken(true).finally(() => {
        refreshPromise = null;
      });
    }

    const freshToken = await refreshPromise;
    if (!freshToken) {
      return Promise.reject(error);
    }

    originalConfig.headers.Authorization = `Bearer ${freshToken}`;
    return client.request(originalConfig);
  });
}
