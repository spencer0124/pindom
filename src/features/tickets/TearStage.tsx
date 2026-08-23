import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useAdaptive, useTheme } from '@/design-system';
import type { Ticket } from '@/lib/domain';
import { TICKET_STUB_WIDTH, TicketCard } from '@/features/shared';

/** The full card's own proportions, so the halves can be sized before layout. */
const CARD_ASPECT = 300 / 168;

/**
 * How far the torn panel's far corner travels past the card's edge at full
 * tear — the 9° swing plus the 10px drift. Callers leave this much room.
 */
export const TEAR_SWING = 44;

/** The tear front starts this far down the perforation and stops this far from its foot. */
const FRONT_INSET = 10;

/** The grip: 30px idle, 26px under the finger, `width .3s ease` between. */
const GRIP_IDLE = 30;
const GRIP_HELD = 26;
const GRIP_BORDER = 3;
const GRIP_SIZE = { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) };

/**
 * `gripPulse 1.8s ease-out infinite`: a halo spreads 18px from the grip's edge
 * over the first 70%, fading from half to nothing, then rests for the remainder.
 */
const PULSE_MS = 1800;
const PULSE_SPREAD = 18;
const PULSE_GROW = PULSE_MS * 0.7;
const PULSE_REST = PULSE_MS - PULSE_GROW;
const PULSE_OPACITY = 0.5;
const PULSE_SCALE = (GRIP_IDLE + PULSE_SPREAD * 2) / GRIP_IDLE;

/** `gripTwinkle 1.8s ease-in-out infinite`: opacity .5 → 1 → .5. */
const TWINKLE_HALF = PULSE_MS / 2;
const TWINKLE_LOW = 0.5;
const TWINKLE = { duration: TWINKLE_HALF, easing: Easing.inOut(Easing.quad) };

/** Past this much tear the sparks fly. */
const SPARKS_FROM = 0.06;

/**
 * `sparkA .8s` and `sparkD .9s .15s`, both `ease-out infinite`: from the tear
 * front, half size, up to full opacity by 22% and gone by the end.
 */
const SPARK_A = { size: 5, duration: 800, delay: 0, dx: -34, dy: -30 };
const SPARK_D = { size: 4, duration: 900, delay: 150, dx: 36, dy: 26 };
const SPARK_PEAK = 0.22;
const SPARK_EASE = Easing.out(Easing.quad);

interface TearStageProps {
  ticket: Ticket;
  /** 0 intact → 1 torn. Owned by the caller: a pan on 티켓 절취, a constant on 응모완료. */
  progress: SharedValue<number>;
  /**
   * True while the finger holds the tear, and through a commit. The grip's
   * idle loop stops while it is true and restarts when it drops — which a
   * heal does, and a commit does not.
   */
  dragging?: SharedValue<boolean>;
  width: number;
  /** The `{region} · {work kind}` line under the place name. 티켓 절취 prints it; 응모완료 does not. */
  subtitle?: string;
  /** 응모완료 shows the stub as USED. */
  spent?: boolean;
}

/**
 * The ticket as two halves that hinge apart along the perforation.
 *
 * Both halves are the same `TicketCard`, each clipped to its side of the stub
 * boundary and rotated about the foot of the perforation — the panel by −9°,
 * the stub by +7°, the angles 1a tears at. The tear front and the grip
 * travel down the perforation with `progress`. 1a's zig-zag teeth need a
 * polygon clip React Native does not have; the dashed rule is the tear line.
 *
 * The grip is the 반짝이는 절취선 the hint promises: at rest it pulses a halo and
 * twinkles on 1a's 1.8 s loop, shrinks from 30 to 26px under the finger, and
 * holds still while the tear is in hand. Past 6% two sparks fly off the front.
 * Their colours are the accent and the ink — 1a's yellow and cyan are the
 * hologram palette, which is `2b`'s axis.
 *
 * Purely visual. The server sees one `enterRaffle` at the end of the tear —
 * docs/reference/backend-contract.md is explicit that 절취 is client-side.
 */
export function TearStage({ ticket, progress, dragging, width, subtitle, spent = false }: TearStageProps) {
  const { token } = useTheme();
  const adaptive = useAdaptive();
  const height = width / CARD_ASPECT;
  const left = width - TICKET_STUB_WIDTH;
  const right = TICKET_STUB_WIDTH;
  const frontTravel = height - FRONT_INSET * 2;

  /** 0 → 1 across one pulse; the halo's spread and fade read from it. */
  const pulse = useSharedValue(0);
  /** The grip's own opacity on the twinkle. */
  const twinkle = useSharedValue(TWINKLE_LOW);
  const gripSize = useSharedValue(GRIP_IDLE);
  /** Each spark's place along its flight, 0 → 1, looping while they are on. */
  const sparkA = useSharedValue(0);
  const sparkD = useSharedValue(0);

  // The idle loop runs whenever the tear is not in hand. Reacting to the
  // shared value keeps the start and the stop on the UI thread, with the
  // gesture that flips it.
  useAnimatedReaction(
    () => (dragging?.value ?? false) || spent,
    (held, prev) => {
      if (held === prev) return;
      if (held) {
        cancelAnimation(pulse);
        cancelAnimation(twinkle);
        pulse.value = 0;
        twinkle.value = withTiming(1, TWINKLE);
        gripSize.value = withTiming(GRIP_HELD, GRIP_SIZE);
        return;
      }
      pulse.value = 0;
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: PULSE_GROW, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: PULSE_REST }),
        ),
        -1,
      );
      twinkle.value = TWINKLE_LOW;
      twinkle.value = withRepeat(
        withSequence(withTiming(1, TWINKLE), withTiming(TWINKLE_LOW, TWINKLE)),
        -1,
      );
      gripSize.value = withTiming(GRIP_IDLE, GRIP_SIZE);
    },
    [spent],
  );

  // The sparks come on past 6% and stay on through the commit.
  useAnimatedReaction(
    () => progress.value > SPARKS_FROM && !spent,
    (on, prev) => {
      if (on === prev) return;
      if (!on) {
        cancelAnimation(sparkA);
        cancelAnimation(sparkD);
        sparkA.value = 0;
        sparkD.value = 0;
        return;
      }
      sparkA.value = 0;
      sparkA.value = withRepeat(withTiming(1, { duration: SPARK_A.duration, easing: SPARK_EASE }), -1);
      sparkD.value = 0;
      sparkD.value = withDelay(
        SPARK_D.delay,
        withRepeat(withTiming(1, { duration: SPARK_D.duration, easing: SPARK_EASE }), -1),
      );
    },
    [spent],
  );

  useEffect(
    () => () => {
      cancelAnimation(pulse);
      cancelAnimation(twinkle);
      cancelAnimation(gripSize);
      cancelAnimation(sparkA);
      cancelAnimation(sparkD);
    },
    [pulse, twinkle, gripSize, sparkA, sparkD],
  );

  const panelStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      transform: [
        { translateX: left / 2 },
        { translateY: height / 2 },
        { rotate: `${-p * 9}deg` },
        { translateX: -left / 2 },
        { translateY: -height / 2 },
        { translateX: -p * 10 },
      ],
    };
  });

  const stubStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      transform: [
        { translateX: -right / 2 },
        { translateY: height / 2 },
        { rotate: `${p * 7}deg` },
        { translateX: right / 2 },
        { translateY: -height / 2 },
        { translateX: p * 10 },
      ],
    };
  });

  const frontStyle = useAnimatedStyle(() => ({
    height: FRONT_INSET + progress.value * frontTravel,
    opacity: spent ? 0 : 0.35 + progress.value * 0.65,
  }));

  const gripStyle = useAnimatedStyle(() => {
    const size = gripSize.value;
    return {
      width: size,
      height: size,
      borderRadius: size / 2,
      left: left - size / 2,
      top: FRONT_INSET + progress.value * frontTravel - size / 2,
      opacity: spent ? 0 : twinkle.value,
    };
  });

  const haloStyle = useAnimatedStyle(() => ({
    left: left - GRIP_IDLE / 2,
    top: FRONT_INSET + progress.value * frontTravel - GRIP_IDLE / 2,
    opacity: spent ? 0 : PULSE_OPACITY * (1 - pulse.value),
    transform: [{ scale: 1 + (PULSE_SCALE - 1) * pulse.value }],
  }));

  const sparkAStyle = useAnimatedStyle(() =>
    sparkStyle(sparkA.value, SPARK_A, left, FRONT_INSET + progress.value * frontTravel),
  );
  const sparkDStyle = useAnimatedStyle(() =>
    sparkStyle(sparkD.value, SPARK_D, left, FRONT_INSET + progress.value * frontTravel),
  );

  const card = (
    <TicketCard
      placeName={ticket.placeName}
      subtitle={subtitle}
      serial={ticket.serial}
      issuedAt={ticket.issuedAt}
      spent={spent}
    />
  );

  return (
    <View style={{ width, height }}>
      <Animated.View style={[styles.half, { width: left, height }, panelStyle]}>
        <View style={{ width }}>{card}</View>
      </Animated.View>
      <Animated.View style={[styles.half, { left, width: right, height }, stubStyle]}>
        <View style={{ width, marginLeft: -left }}>{card}</View>
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[styles.front, { left: left - 1, backgroundColor: token.accent.fillColor }, frontStyle]}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.halo, { backgroundColor: token.accent.dimColor }, haloStyle]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.grip,
          { backgroundColor: token.accent.fillColor, borderColor: token.accent.onFillColor },
          gripStyle,
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.spark, { backgroundColor: token.accent.fillColor }, sparkAStyle]}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.spark, { backgroundColor: adaptive.grey900 }, sparkDStyle]}
      />
    </View>
  );
}

/**
 * One spark at `t` along its flight: anchored on the tear front, it scales
 * from half size, is brightest at 22% and lands `dx, dy` away, gone.
 */
function sparkStyle(
  t: number,
  spark: { size: number; dx: number; dy: number },
  frontLeft: number,
  frontTop: number,
) {
  'worklet';
  return {
    width: spark.size,
    height: spark.size,
    borderRadius: spark.size / 2,
    left: frontLeft - spark.size / 2,
    top: frontTop - spark.size / 2,
    opacity: interpolate(t, [0, SPARK_PEAK, 1], [0, 1, 0]),
    transform: [
      { translateX: interpolate(t, [0, 1], [0, spark.dx]) },
      { translateY: interpolate(t, [0, 1], [0, spark.dy]) },
      { scale: interpolate(t, [0, 1], [0.5, 1]) },
    ],
  };
}

const styles = StyleSheet.create({
  half: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
  front: {
    position: 'absolute',
    top: 0,
    width: 2,
  },
  halo: {
    position: 'absolute',
    width: GRIP_IDLE,
    height: GRIP_IDLE,
    borderRadius: GRIP_IDLE / 2,
  },
  grip: {
    position: 'absolute',
    borderWidth: GRIP_BORDER,
  },
  spark: {
    position: 'absolute',
  },
});
