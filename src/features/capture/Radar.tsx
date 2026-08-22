import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { Txt, useAdaptive, useTheme } from '@/design-system';
import { formatDistance } from '@/features/shared';

const SIZE = 236;
const DISC = 132;
const RING_PERIOD_MS = 2600;
const RING_STAGGER_MS = 900;
const SWEEP_PERIOD_MS = 3400;

interface RadarProps {
  /** Null prints no number — an unknown distance is not a distance of zero. */
  distance: number | null;
  radiusMeters: number;
  /** Rings and the sweep run only while a verdict is pending. */
  active: boolean;
}

/**
 * The 레이더 from `1b`-A, the verification treatment the prototype applied.
 *
 * Three rings expand and fade on a stagger, a sweep turns behind the disc, and
 * the disc prints the distance. 1b draws the rings in two colours; under `2b`
 * there is one accent, so they differ in phase only. The number is feedback —
 * the decision the rings are waiting on is the server's.
 */
export function Radar({ distance, radiusMeters, active }: RadarProps) {
  const adaptive = useAdaptive();
  const { token } = useTheme();
  const accent = token.accent.fillColor;

  return (
    <View style={styles.frame}>
      {[0, 1, 2].map((index) => (
        <Ring key={index} index={index} color={accent} active={active} />
      ))}
      <Sweep color={accent} active={active} />
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

function Ring({ index, color, active }: { index: number; color: string; active: boolean }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      progress.value = withTiming(0, { duration: 300 });
      return;
    }
    progress.value = withDelay(
      index * RING_STAGGER_MS,
      withRepeat(
        withTiming(1, { duration: RING_PERIOD_MS, easing: Easing.out(Easing.quad) }),
        -1,
        false,
      ),
    );
  }, [active, index, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: active ? 0.7 * (1 - progress.value) : 0.25,
    transform: [{ scale: 0.56 + 0.44 * progress.value }],
  }));

  return <Animated.View style={[styles.ring, { borderColor: color }, style]} />;
}

function Sweep({ color, active }: { color: string; active: boolean }) {
  const turn = useSharedValue(0);

  useEffect(() => {
    if (!active) return;
    turn.value = 0;
    turn.value = withRepeat(
      withTiming(1, { duration: SWEEP_PERIOD_MS, easing: Easing.linear }),
      -1,
      false,
    );
  }, [active, turn]);

  const style = useAnimatedStyle(() => ({
    opacity: active ? 1 : 0,
    transform: [{ rotate: `${turn.value * 360}deg` }],
  }));

  const r = SIZE / 2 - 22;
  const c = SIZE / 2;
  // A 120° arc from 12 o'clock, fading to nothing along its length.
  const end = polar(c, r, 120);
  const d = `M ${c} ${c - r} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Svg width={SIZE} height={SIZE}>
        <Defs>
          <LinearGradient id="sweep" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.7" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Circle cx={c} cy={c} r={r} stroke={color} strokeOpacity={0.12} strokeWidth={1} />
        <Path d={d} stroke="url(#sweep)" strokeWidth={6} strokeLinecap="round" fill="none" />
      </Svg>
    </Animated.View>
  );
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
