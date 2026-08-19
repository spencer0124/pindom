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
export type DocData = Record<string, unknown>;

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
