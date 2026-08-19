/**
 * SUPERSEDED — see ADR 0005 (docs/decisions/0005-keep-firebase-behind-a-repository-boundary.md).
 *
 * This file is part of the axios layer built for a REST backend that is not
 * being built. PINDOM talks to Firebase through src/lib/repositories/ instead.
 * Nothing imports it. Kept rather than deleted so the history of the decision
 * stays legible; `types.ts` is the one part of this directory still in use.
 */
import axios, { type AxiosInstance } from 'axios';
import { ApiConfig } from './config';
import {
  platformInterceptor,
  observabilityInterceptor,
  attachRetryInterceptor,
  attachAuthInterceptor,
} from './interceptors';

/**
 * Creates a fully-configured axios instance with the interceptor chain.
 *
 * Interceptor execution order (request path):
 *   auth (token) → platform (headers) → [network] → retry → observability
 *
 * Axios request interceptors are LIFO — auth is added last so it runs first,
 * ensuring the token is attached before platform headers.
 */
export function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: ApiConfig.baseUrl,
    timeout: 10_000,
  });

  // Request interceptor: platform headers
  client.interceptors.request.use(platformInterceptor);

  // Response interceptor: observability logging
  client.interceptors.response.use(observabilityInterceptor);

  // Retry interceptor: transient failure recovery
  attachRetryInterceptor(client);

  // Auth interceptor: token attachment + 401 refresh
  // Axios request interceptors are LIFO — added last, runs first on requests.
  // This ensures the token is attached before platform headers.
  attachAuthInterceptor(client);

  return client;
}

// ── Singleton ──

let instance: AxiosInstance | null = null;

/** Lazy singleton accessor */
export function getApiClient(): AxiosInstance {
  if (!instance) {
    instance = createApiClient();
  }
  return instance;
}

/** Reset singleton — for tests */
export function resetApiClient(): void {
  instance = null;
}
