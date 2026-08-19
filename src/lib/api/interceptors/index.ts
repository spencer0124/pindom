/**
 * SUPERSEDED — see ADR 0005 (docs/decisions/0005-keep-firebase-behind-a-repository-boundary.md).
 *
 * This file is part of the axios layer built for a REST backend that is not
 * being built. PINDOM talks to Firebase through src/lib/repositories/ instead.
 * Nothing imports it. Kept rather than deleted so the history of the decision
 * stays legible; `types.ts` is the one part of this directory still in use.
 */
export { platformInterceptor } from './platform';
export { attachRetryInterceptor } from './retry';
export { observabilityInterceptor } from './observability';
export { attachAuthInterceptor, setAuthTokenProvider } from './auth';
