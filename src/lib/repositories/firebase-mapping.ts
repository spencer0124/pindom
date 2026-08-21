/**
 * Firestore document → domain object conversion.
 *
 * Kept separate from the repository so the awkward part is in one place. It is
 * awkward because Firestore enforces no schema: a renamed field throws nothing,
 * it just reads `undefined`. These accessors fall back to a safe value so a
 * mismatch degrades instead of crashing, and warn in development so it does not
 * degrade *silently* — which is the failure mode called out in
 * docs/how-to/connect-the-app-to-firebase.md.
 */
import { DEFAULT_LOCALE, type Locale } from '../domain';

export type DocData = Record<string, unknown>;

/**
 * The locale localized fields resolve to.
 *
 * A user preference, not a device setting — 언어 in 마이페이지 sets it, and it persists on the
 * user document. The session layer calls `setActiveLocale` once the user document loads;
 * before that, everything resolves to Korean.
 */
let activeLocale: Locale = DEFAULT_LOCALE;

export function setActiveLocale(locale: Locale): void {
  activeLocale = locale;
}

/**
 * Resolve a localized string map to a plain string.
 *
 * Firestore stores any user-visible string that varies by language as `{ ko, en }` — the
 * shipped locales. The prototype's helper emits two more; those keys are read as absent.
 * Resolving here, at the boundary, is the same move as turning a `Timestamp` into a `Date`:
 * every screen would otherwise have to pick a language out of a map, identically.
 *
 * Falls back to Korean, then to any populated value — a place with only Korean copy should
 * still render for an English reader rather than showing a blank.
 */
export function localized(d: DocData, key: string, where: string): string {
  const v = d[key];
  if (typeof v === 'string') return v; // tolerated: a plain string that was never localized
  if (v && typeof v === 'object') {
    const map = v as Partial<Record<Locale, string>>;
    const hit = map[activeLocale] ?? map[DEFAULT_LOCALE] ?? Object.values(map).find(Boolean);
    if (hit) return hit;
  }
  missing(key, where);
  return '';
}

function missing(field: string, where: string): void {
  if (__DEV__) {
    console.warn(
      `[pindom] Firestore field "${field}" missing on ${where}. ` +
        'Field names are fixed by docs/reference/backend-contract.md — ' +
        'check that document before changing the app.',
    );
  }
}

export function str(d: DocData, key: string, where: string): string {
  const v = d[key];
  if (typeof v === 'string') return v;
  missing(key, where);
  return '';
}

export function optStr(d: DocData, key: string): string | undefined {
  const v = d[key];
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

export function num(d: DocData, key: string, where: string): number {
  const v = d[key];
  if (typeof v === 'number') return v;
  missing(key, where);
  return 0;
}

export function optNum(d: DocData, key: string): number | undefined {
  const v = d[key];
  return typeof v === 'number' ? v : undefined;
}

export function bool(d: DocData, key: string): boolean {
  return d[key] === true;
}

export function strList(d: DocData, key: string): string[] {
  const v = d[key];
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

/** Firestore `Timestamp` → `Date`. No screen should ever see a Timestamp. */
export function date(d: DocData, key: string, where: string): Date {
  const v = d[key];
  if (v && typeof v === 'object' && typeof (v as { toDate?: unknown }).toDate === 'function') {
    return (v as { toDate(): Date }).toDate();
  }
  missing(key, where);
  return new Date(0);
}

/** Firestore `GeoPoint` → plain lat/lng. */
export function geo(
  d: DocData,
  key: string,
  where: string,
): { lat: number; lng: number } {
  const v = d[key] as { latitude?: unknown; longitude?: unknown } | undefined;
  if (v && typeof v.latitude === 'number' && typeof v.longitude === 'number') {
    return { lat: v.latitude, lng: v.longitude };
  }
  missing(key, where);
  return { lat: 0, lng: 0 };
}

/** Cloud Functions return ISO strings, not Timestamps. */
export function isoDate(value: unknown): Date {
  return typeof value === 'string' ? new Date(value) : new Date(0);
}

/** Narrow an unknown string to a union member, falling back to a default. */
export function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}
