import { router } from 'expo-router';
import { SparkleIcon } from 'phosphor-react-native';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SdsShadows, useAdaptive, useTheme } from '@/design-system';
import { Shape } from '@/features/shared';

/** 1a's 56px disc, 96px up from the bottom edge. */
const DISC = 56;
const BOTTOM = 96;
/** The spinning ring: 30px across, a 5px sweep, and the 20px disc that masks its centre. */
const RING = 30;
const SWEEP = 5;
const GLYPH = 17;
/** 1a's `aiSpin 7s linear infinite`. */
const SPIN_MS = 7000;

/**
 * How much of a tab's scroll the FAB covers — its top edge. A scroll's bottom
 * padding clears this so the last row is never under the button.
 */
export const ASSISTANT_FAB_CLEARANCE = BOTTOM + DISC;

/**
 * The floating Pindom AI button on the five tabbed screens — the only way into
 * `chat`. One component, mounted once over the tab navigator, so it sits in
 * the same place on every tab.
 *
 * 1a's button is a white disc with a rose conic ring turning once every seven
 * seconds around a pink sparkle. Under 2b the disc is the surface with a
 * hairline, and the ring and the sparkle take the accent (fidelity decision
 * 13). The ring is four border arcs in the accent's fill, soft and dim values
 * with one side clear — which reads as a conic sweep without a conic gradient,
 * something `Gradient` does not draw. Nothing is written on it: the `AI` label
 * the first build printed was invented copy.
 *
 * Round: the one other rounded thing besides chips, because a floating button
 * is a chip that floats.
 */
export function AssistantFab() {
  const adaptive = useAdaptive();
  const { token } = useTheme();

  const spin = useSharedValue(0);
  useEffect(() => {
    spin.value = withRepeat(
      withTiming(360, { duration: SPIN_MS, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(spin);
  }, [spin]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  return (
    <Pressable
      onPress={() => router.push('/chat' as never)}
      accessibilityRole="button"
      accessibilityLabel="Pindom AI"
      style={[
        styles.fab,
        SdsShadows.elevated.legacy,
        { backgroundColor: adaptive.background, borderColor: adaptive.grey200 },
      ]}
    >
      <View style={styles.ringBox}>
        <Animated.View
          style={[
            styles.ring,
            ringStyle,
            {
              borderTopColor: token.accent.fillColor,
              borderRightColor: token.accent.softColor,
              borderBottomColor: token.accent.dimColor,
              borderLeftColor: 'transparent',
            },
          ]}
        />
        <View style={[styles.core, { backgroundColor: adaptive.background }]} />
        <SparkleIcon size={GLYPH} weight="fill" color={token.accent.fillColor} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: Shape.gutter,
    bottom: BOTTOM,
    width: DISC,
    height: DISC,
    borderRadius: DISC / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringBox: {
    width: RING,
    height: RING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RING / 2,
    borderWidth: SWEEP,
  },
  core: {
    ...StyleSheet.absoluteFillObject,
    margin: SWEEP,
    borderRadius: (RING - SWEEP * 2) / 2,
  },
});
