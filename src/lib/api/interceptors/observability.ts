/**
 * SUPERSEDED — see ADR 0005 (docs/decisions/0005-keep-firebase-behind-a-repository-boundary.md).
 *
 * This file is part of the axios layer built for a REST backend that is not
 * being built. PINDOM talks to Firebase through src/lib/repositories/ instead.
 * Nothing imports it. Kept rather than deleted so the history of the decision
 * stays legible; `types.ts` is the one part of this directory still in use.
 */
import type { AxiosResponse } from 'axios';

/**
 * Observability interceptor — logs server-generated request IDs and timing.
 *
 * Only active in __DEV__ mode. Logs X-Request-Id and X-Response-Time
 * headers from the Express server.
 */
export function observabilityInterceptor(
  response: AxiosResponse,
): AxiosResponse {
  if (__DEV__) {
    const requestId = response.headers['x-request-id'];
    const responseTime = response.headers['x-response-time'];
    const path = response.config.url;

    if (requestId || responseTime) {
      console.debug(`[api] ${requestId ?? ''} ${path} ${responseTime ?? ''}`);
    }
  }
  return response;
}
