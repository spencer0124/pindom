/**
 * SUPERSEDED — see ADR 0005 (docs/decisions/0005-keep-firebase-behind-a-repository-boundary.md).
 *
 * This file is part of the axios layer built for a REST backend that is not
 * being built. PINDOM talks to Firebase through src/lib/repositories/ instead.
 * Nothing imports it. Kept rather than deleted so the history of the decision
 * stays legible; `types.ts` is the one part of this directory still in use.
 */
import type { InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { getLocales } from 'expo-localization';
import { Platform } from 'react-native';

/**
 * Platform interceptor — injects client metadata headers.
 *
 * Headers: Accept-Language, X-App-Version, X-Platform.
 * Values are resolved once on first call, then cached.
 */

let cachedLocale: string | null = null;
let cachedVersion: string | null = null;
let cachedPlatform: string | null = null;

function resolveLocale(): string {
  const locales = getLocales();
  const lang = locales[0]?.languageCode ?? 'en';
  switch (lang) {
    case 'ko':
      return 'ko';
    case 'zh':
      return 'zh';
    default:
      return 'en';
  }
}

export function platformInterceptor(
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig {
  cachedPlatform ??= Platform.OS === 'ios' ? 'ios' : 'android';
  cachedVersion ??= Constants.expoConfig?.version ?? 'unknown';
  cachedLocale ??= resolveLocale();

  config.headers.set('Accept-Language', cachedLocale);
  config.headers.set('X-App-Version', cachedVersion);
  config.headers.set('X-Platform', cachedPlatform);

  return config;
}
