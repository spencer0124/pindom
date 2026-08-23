import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Txt, useAdaptive, useTheme } from '@/design-system';
import { formatDistance } from '@/features/shared';

const SIZE = 236;
const DISC = 132;
/** 1b-A's `ringPulse 2.6s ease-out infinite`, delays 0 / .9s / 1.8s. */
const RING_PERIOD_MS = 2600;
const RING_STAGGER_MS = 900;
const RING_SCALE_FROM = 0.35;
const RING_SCALE_TO = 1.35;
const RING_OPACITY_FROM = 0.55;
/** CSS `ease-out`. */
const EASE_OUT = Easing.bezier(0, 0, 0.58, 1);
/** 1b-A's `spinSlow 3.4s linear infinite` on the sweep. */
const SWEEP_PERIOD_MS = 3400;
const SWEEP_INSET = 22;
/** The sweep's `conic-gradient` fades to nothing over 62% of a turn. */
const SWEEP_DEGREES = 223;
const SWEEP_OPACITY_FROM = 0.6;
const SWEEP_STEPS = 12;
const WEDGE_SEAM = 0.5;

interface RadarProps {
  /** Null prints no number — an unknown distance is not a distance of zero. */
  distance: number | null;
  radiusMeters: number;
}

/**
 * The 레이더 from `1b`-A, the verification treatment the prototype applied.
 *
 * Three rings expand and fade on a stagger, a sweep turns behind the disc, and
 * the disc prints the distance. Both run from the moment the screen opens —
 * the prototype's radar is never at rest, idle or checking alike — and stop
 * only when the screen leaves. 1b draws the rings in two colours; under `2b`
 * there is one accent, so they differ in phase only. The number is feedback —
 * the decision the rings are waiting on is the server's.
 */
export function Radar({ distance, radiusMeters }: RadarProps) {
  const adaptive = useAdaptive();
  const { token } = useTheme();
  const accent = token.accent.fillColor;

  return (
    <View style={styles.frame}>
      {[0, 1, 2].map((index) => (
        <Ring key={index} index={index} color={accent} />
      ))}
      <Sweep color={accent} />
      <View
        style={[
          styles.disc,
          { backgroundColor: token.accent.dimColor, borderColor: adaptive.grey200 },
        ]}
      >
        <Txt typography="t1" fontWeight="bold" color={adaptive.grey900}>
          {distance != null ? formatDistance(distance) : '–'}
        </Txt>
        <Txt typography="st12" color={adaptive.grey600}>
          인증 반경 {radiusMeters}m
        </Txt>
      </View>
    </View>
  );
}

function Ring({ index, color }: { index: number; color: string }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      index * RING_STAGGER_MS,
      withRepeat(withTiming(1, { duration: RING_PERIOD_MS, easing: EASE_OUT }), -1, false),
    );
    return () => cancelAnimation(progress);
  }, [index, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: RING_OPACITY_FROM * (1 - progress.value),
    transform: [{ scale: RING_SCALE_FROM + (RING_SCALE_TO - RING_SCALE_FROM) * progress.value }],
  }));

  return <Animated.View style={[styles.ring, { borderColor: color }, style]} />;
}

/**
 * The sweep: a filled sector fading over ~223°, turning once every 3.4 s.
 *
 * 1b draws it as a `conic-gradient`, which `react-native-svg` has no equivalent
 * for — so it is a fan of wedges from the centre with stepped opacity. The
 * colour is the single accent, per `2b`.
 */
function Sweep({ color }: { color: string }) {
  const turn = useSharedValue(0);

  useEffect(() => {
    turn.value = withRepeat(
      withTiming(1, { duration: SWEEP_PERIOD_MS, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(turn);
  }, [turn]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.value * 360}deg` }],
  }));

  const c = SIZE / 2;
  const r = SIZE / 2 - SWEEP_INSET;
  const step = SWEEP_DEGREES / SWEEP_STEPS;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Svg width={SIZE} height={SIZE}>
        {Array.from({ length: SWEEP_STEPS }, (_, i) => (
          <Path
            key={i}
            d={wedge(c, r, i * step, (i + 1) * step)}
            fill={color}
            fillOpacity={SWEEP_OPACITY_FROM * (1 - i / SWEEP_STEPS)}
          />
        ))}
      </Svg>
    </Animated.View>
  );
}

/** A pie slice from 12 o'clock, clockwise, `from`→`to` degrees. */
function wedge(c: number, r: number, from: number, to: number) {
  const a = polar(c, r, from);
  // A hair of overlap so the seams between wedges do not show as lines.
  const b = polar(c, r, to + WEDGE_SEAM);
  return `M ${c} ${c} L ${a.x} ${a.y} A ${r} ${r} 0 0 1 ${b.x} ${b.y} Z`;
}

function polar(c: number, r: number, degrees: number) {
  const rad = ((degrees - 90) * Math.PI) / 180;
  return { x: c + r * Math.cos(rad), y: c + r * Math.sin(rad) };
}

const styles = StyleSheet.create({
  frame: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    // The outermost ring reaches 1.35× the frame; nothing here may clip it.
    overflow: 'visible',
  },
  ring: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: SIZE / 2,
    borderWidth: 1,
  },
  disc: {
    width: DISC,
    height: DISC,
    borderRadius: DISC / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
});
