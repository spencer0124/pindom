import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Txt, useAdaptive, useTheme } from '@/design-system';

/** 1a's four-point star, 22px in a 24-unit box. */
const STAR = 22;
const STAR_BOX = 24;
const STAR_PATH =
  'M12 2.6l2.2 5.4a3 3 0 0 0 1.8 1.8l5.4 2.2-5.4 2.2a3 3 0 0 0-1.8 1.8L12 21.4l-2.2-5.4a3 3 0 0 0-1.8-1.8L2.6 12l5.4-2.2a3 3 0 0 0 1.8-1.8L12 2.6Z';
/** `aiSpin 1.5s cubic-bezier(.5,.1,.5,.9) infinite`. */
const SPIN_MS = 1500;
const SPIN_EASING = Easing.bezier(0.5, 0.1, 0.5, 0.9);
/** `dotBlink 1.6s ease-in-out infinite`: .3 → 1 → .3, and 3px up and back. */
const BREATH_MS = 1600;
const BREATH_EASING = Easing.inOut(Easing.ease);
const BREATH_DIM = 0.3;
const BREATH_RISE = -3;
/** The row's own `gap:9px; padding:4px 2px`. */
const GAP = 9;
const PAD_X = 2;
const PAD_Y = 4;

/**
 * 답변을 찾고 있어요 — what Pindom AI shows while an answer is on its way.
 *
 * Not a bubble: 1a puts a spinning star beside a breathing line, flush left in
 * the thread (fidelity A-01). The star turns once every 1.5 s on the
 * prototype's own curve; the label breathes between .3 and full opacity and
 * rises 3px at the top of each breath. Under 2b the star's rose gradient is
 * the accent.
 *
 * Both loops are cancelled when the row unmounts, which is when loading ends.
 */
export function ThinkingRow() {
  const adaptive = useAdaptive();
  const { token } = useTheme();

  const spin = useSharedValue(0);
  const breath = useSharedValue(0);
  useEffect(() => {
    spin.value = withRepeat(withTiming(360, { duration: SPIN_MS, easing: SPIN_EASING }), -1, false);
    breath.value = withRepeat(
      withSequence(
        withTiming(1, { duration: BREATH_MS / 2, easing: BREATH_EASING }),
        withTiming(0, { duration: BREATH_MS / 2, easing: BREATH_EASING }),
      ),
      -1,
      false,
    );
    return () => {
      cancelAnimation(spin);
      cancelAnimation(breath);
    };
  }, [spin, breath]);

  const starStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: BREATH_DIM + (1 - BREATH_DIM) * breath.value,
    transform: [{ translateY: BREATH_RISE * breath.value }],
  }));

  return (
    <View style={styles.row} accessibilityRole="progressbar" accessibilityLabel="답변을 찾고 있어요">
      <Animated.View style={[styles.star, starStyle]}>
        <Svg width={STAR} height={STAR} viewBox={`0 0 ${STAR_BOX} ${STAR_BOX}`}>
          <Path d={STAR_PATH} fill={token.accent.fillColor} />
        </Svg>
      </Animated.View>
      <Animated.View style={labelStyle}>
        <Txt typography="t7" fontWeight="medium" color={adaptive.grey600}>
          답변을 찾고 있어요
        </Txt>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: GAP,
    paddingHorizontal: PAD_X,
    paddingVertical: PAD_Y,
  },
  star: {
    width: STAR,
    height: STAR,
  },
});
