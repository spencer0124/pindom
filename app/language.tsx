import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Loader, Txt, useAdaptive, useTheme } from '@/design-system';
import { LOCALE_OPTIONS, useLocale } from '@/features/profile';
import { Rule, Shape } from '@/features/shared';

/**
 * 언어 — pick the app's locale.
 *
 * Built from prototype block `1a` for layout, copy and flow and `2b` for colour,
 * type and corners, matching `app/(tabs)/index.tsx`. The route screens.md
 * proposed; there is no Figma frame.
 *
 * Two rows, not 1a's four: the shipped locales are ko and en (the 2026-08-21
 * review resolutions), and the prototype's ja and zh are read as absent at the
 * repository boundary. The pick is stored on the user document; this build's
 * own strings are Korean, which the Profile checklist records.
 */
export default function LanguageScreen() {
  const adaptive = useAdaptive();
  const { token } = useTheme();
  const { locale, busy, pick } = useLocale();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={styles.headerSide}>
          <Txt typography="t7" fontWeight="medium" color={adaptive.grey600}>
            ‹ 마이
          </Txt>
        </Pressable>
        <Txt typography="t6" fontWeight="bold" color={adaptive.grey900}>
          언어 설정
        </Txt>
        <View style={styles.headerSide} />
      </View>

      <Txt typography="st13" color={adaptive.grey600} style={styles.note}>
        앱 전체 UI 언어를 바꿉니다. 촬영지 이름과 커뮤니티 글은 원문 그대로 표시됩니다.
      </Txt>

      {locale == null ? (
        <Loader.Centered label="" />
      ) : (
        <View style={styles.options}>
          {LOCALE_OPTIONS.map((option) => {
            const on = locale === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => void pick(option.id)}
                disabled={busy}
                accessibilityRole="radio"
                accessibilityLabel={option.label}
                accessibilityState={{ selected: on }}
                style={[
                  styles.option,
                  { borderColor: on ? token.accent.fillColor : adaptive.grey200 },
                  on && { backgroundColor: token.accent.dimColor },
                ]}
              >
                <View style={styles.optionCopy}>
                  <Txt typography="t6" fontWeight="bold" color={adaptive.grey900}>
                    {option.label}
                  </Txt>
                  <Txt typography="st13" color={adaptive.grey600}>
                    {option.native}
                  </Txt>
                </View>
                <View style={[styles.radio, { borderColor: on ? token.accent.fillColor : adaptive.grey300 }]}>
                  {on && <View style={[styles.radioDot, { backgroundColor: token.accent.fillColor }]} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      <Rule />

      <View style={styles.footnote}>
        <Txt typography="t7" fontWeight="bold" color={adaptive.grey900}>
          촬영지 이름은 번역하지 않습니다
        </Txt>
        <Txt typography="st13" color={adaptive.grey600}>
          현장에서 길을 찾을 때 표지판·지도와 이름이 달라지면 오히려 헷갈리기 때문입니다. 한국어가 아닐 때는 로마자 표기를 함께 보여줍니다.
        </Txt>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Shape.gutter,
    paddingVertical: 10,
  },
  headerSide: {
    width: 48,
  },
  note: {
    paddingHorizontal: Shape.gutter,
    paddingTop: 8,
    paddingBottom: 16,
  },
  options: {
    paddingHorizontal: Shape.gutter,
    paddingBottom: 20,
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    padding: 14,
  },
  optionCopy: {
    flex: 1,
    gap: 3,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  footnote: {
    paddingHorizontal: Shape.gutter,
    paddingTop: 18,
    gap: 6,
  },
});
