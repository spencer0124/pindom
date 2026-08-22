import { useCallback, useEffect, useState } from 'react';
import type { Locale } from '@/lib/domain';
import { DEFAULT_LOCALE } from '@/lib/domain';
import { userRepository } from '@/lib/repositories';

/** The two locales that ship, with 1a's lines for each. */
export const LOCALE_OPTIONS: { id: Locale; label: string; native: string }[] = [
  { id: 'ko', label: '한국어', native: '한국어 · 기본' },
  { id: 'en', label: 'English', native: '영어 · 로마자 표기 함께 표시' },
];

/** The label 마이페이지's row prints. */
export function localeLabel(locale: Locale): string {
  return LOCALE_OPTIONS.find((o) => o.id === locale)?.label ?? locale;
}

/**
 * 언어: the user's locale, and the write. Stored on the user document per the
 * contract; the UI's own strings are Korean in this build, and the Profile
 * checklist says so.
 */
export function useLocale() {
  const [locale, setLocale] = useState<Locale | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    void userRepository.me().then((me) => {
      if (live) setLocale(me.ok ? me.data.locale : DEFAULT_LOCALE);
    });
    return () => {
      live = false;
    };
  }, []);

  const pick = useCallback(async (next: Locale) => {
    setBusy(true);
    setLocale(next);
    const result = await userRepository.setLocale(next);
    if (result.ok) setLocale(result.data.locale);
    setBusy(false);
  }, []);

  return { locale, busy, pick };
}
