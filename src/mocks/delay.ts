/**
 * Latency the fixtures pretend to have.
 *
 * Not cosmetic. Fixtures that resolve instantly mean nobody builds the loading
 * state, and the design system ships both `Skeleton` and `Loader` — a screen
 * developed against a synchronous mock will flash or jump the first time it
 * meets a real network.
 */
const MOCK_LATENCY_MS = 320;

export function mockDelay<T>(value: T, ms = MOCK_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
