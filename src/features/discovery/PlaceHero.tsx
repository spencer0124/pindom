import { router } from 'expo-router';
import { CaretLeftIcon } from 'phosphor-react-native';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SdsColors, Txt, useAdaptive, useTheme } from '@/design-system';
import type { Place } from '@/lib/domain';
import { Shape } from '@/features/shared';

const HERO_HEIGHT = 270;

interface PlaceHeroProps {
  place: Place;
  artistName?: string;
}

/**
 * The 장소/상세 header: the cover photograph, the way back, and two badges.
 *
 * The badges are the 최애 and the 지역. Figma's `33:2381` puts the work kind
 * (`MV 촬영지`) in the first slot instead, but `1a` names the artist there and
 * content is `1a`'s axis — the work kind is already in the line under the title,
 * where naming it twice would cost the artist their place on the screen.
 *
 * Both badges and the back button sit on a photograph rather than on a surface,
 * so each carries its own opaque ground. A translucent tint disappears over a
 * bright frame; that failure was already found once, on 홈's 미인증 stamp.
 */
export function PlaceHero({ place, artistName }: PlaceHeroProps) {
  const adaptive = useAdaptive();
  const { token } = useTheme();

  return (
    <View style={[styles.hero, { backgroundColor: adaptive.background }]}>
      <Image
        source={{ uri: place.coverImageUrl }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />

      <SafeAreaView edges={['top']} style={styles.chrome} pointerEvents="box-none">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="뒤로"
          hitSlop={8}
          style={[styles.back, { backgroundColor: SdsColors.ground }]}
        >
          <CaretLeftIcon size={18} color={adaptive.grey900} />
        </Pressable>
      </SafeAreaView>

      <View style={styles.badges}>
        {artistName != null && (
          <View style={[styles.badge, { backgroundColor: token.accent.fillColor }]}>
            <Txt typography="t7" fontWeight="bold" color={token.accent.onFillColor}>
              {artistName}
            </Txt>
          </View>
        )}
        <View style={[styles.badge, { backgroundColor: SdsColors.ground }]}>
          <Txt typography="t7" fontWeight="bold" color={adaptive.grey900}>
            {place.region}
          </Txt>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: HERO_HEIGHT,
  },
  chrome: {
    paddingHorizontal: Shape.gutter,
    paddingTop: 8,
    alignItems: 'flex-start',
  },
  back: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badges: {
    position: 'absolute',
    left: Shape.gutter,
    bottom: 14,
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: Shape.chipRadius,
  },
});
