import { useId, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { SdsColors } from '@/design-system';

/** 1a's hologram constants: `MAX_TILT = 20`, `INTENSITY = .45`, `scale(1.04)`. */
const MAX_TILT_DEG = 20;
const HELD_SCALE = 0.04;
const PERSPECTIVE = 800;
const SHINE_HELD = 0.45;
const SHINE_IDLE = SHINE_HELD * 0.5;
const GLARE_HELD = 0.45;
const GLARE_IDLE = GLARE_HELD * 0.35;
/** The shine band's canvas, as a multiple of the card — 1a's `background-size: 220%`. */
const SHINE_CANVAS = 2.2;
/** How far the band slides across the card for a full swing of the finger. */
const SHINE_TRAVEL = 1.2;
/** The glare's canvas; its centre is the finger. */
const GLARE_CANVAS = 2;
/** `transform .06s linear` while held. */
const FOLLOW = { duration: 60, easing: Easing.linear };
/** `transform .5s cubic-bezier(.2,1.25,.4,1)` on release — an overshoot. */
const RETURN = { duration: 500, easing: Easing.bezier(0.2, 1.25, 0.4, 1) };
/** `opacity .2s ease` on the shine and the glare. */
const LIGHT = { duration: 200, easing: Easing.bezier(0.25, 0.1, 0.25, 1) };

interface HoloTiltProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * Wait this long before the hold takes the touch. Inside a ScrollView the
   * pan would otherwise win every touch and the list would never scroll; with
   * a short press the scroll keeps its gesture and the hold starts after it.
   */
  activateAfterLongPress?: number;
  disabled?: boolean;
}

/**
 * Hold a card and it tilts under the finger — 1a's hologram gesture, on any
 * card that should feel like a print catching light.
 *
 * The prototype pairs the tilt with a rainbow shine; the rainbow is colour,
 * and colour is `2b`'s, so it is not here (Capture checklist row 1). The
 * gesture is interaction, which is `1a`'s, and the prototype's own `basic`
 * style — a white band and a white glare — is exactly the gesture without the
 * rainbow (fidelity decision 2). So: ±20° in perspective at 1.04 while held,
 * following the finger in 60 ms; a 500 ms overshoot back on release. The band
 * and the glare slide with the finger and brighten while held. White only, at
 * plain opacity — on the `2b` ground that reads as light, and React Native has
 * no blend modes to argue with.
 *
 * Wraps anything; 티켓 발행 and 컬렉션 wrap `TicketCard`. It is not a
 * design-system primitive because it carries no look of its own — it only
 * moves what it is given.
 */
export function HoloTilt({ children, style, activateAfterLongPress, disabled = false }: HoloTiltProps) {
  // Two cards on one screen must not share a gradient id; `useId`'s own
  // punctuation is stripped because `url(#…)` does not take it.
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const shineId = `holo${id}shine`;
  const glareId = `holo${id}glare`;

  const [size, setSize] = useState({ width: 0, height: 0 });
  const width = useSharedValue(0);
  const height = useSharedValue(0);

  /** The finger, in 1a's units: −.5 … .5 across the card, 0 at the centre. */
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  /** 0 at rest, 1 while held — drives the scale on the tilt's own curve. */
  const held = useSharedValue(0);
  /** The same, on the light's slower curve. */
  const lit = useSharedValue(0);

  let pan = Gesture.Pan()
    .enabled(!disabled)
    .minDistance(0)
    .maxPointers(1)
    .onStart((e) => {
      held.value = withTiming(1, FOLLOW);
      lit.value = withTiming(1, LIGHT);
      tx.value = withTiming(swing(e.x, width.value), FOLLOW);
      ty.value = withTiming(swing(e.y, height.value), FOLLOW);
    })
    .onUpdate((e) => {
      tx.value = withTiming(swing(e.x, width.value), FOLLOW);
      ty.value = withTiming(swing(e.y, height.value), FOLLOW);
    })
    .onFinalize(() => {
      held.value = withTiming(0, RETURN);
      lit.value = withTiming(0, LIGHT);
      tx.value = withTiming(0, RETURN);
      ty.value = withTiming(0, RETURN);
    });
  if (activateAfterLongPress != null) pan = pan.activateAfterLongPress(activateAfterLongPress);

  const tilt = useAnimatedStyle(() => ({
    transform: [
      { perspective: PERSPECTIVE },
      { rotateX: `${ty.value * MAX_TILT_DEG}deg` },
      { rotateY: `${-tx.value * MAX_TILT_DEG}deg` },
      { scale: 1 + HELD_SCALE * held.value },
    ],
  }));

  // The band: its angle turns with the finger (`45 + (x+y)·90` degrees) and it
  // slides away from it, as a reflection does.
  const shine = useAnimatedStyle(() => ({
    opacity: SHINE_IDLE + (SHINE_HELD - SHINE_IDLE) * lit.value,
    transform: [
      { translateX: -tx.value * width.value * SHINE_TRAVEL },
      { translateY: -ty.value * height.value * SHINE_TRAVEL },
      { rotate: `${(tx.value + ty.value) * 90}deg` },
    ],
  }));

  // The glare sits under the finger.
  const glare = useAnimatedStyle(() => ({
    opacity: GLARE_IDLE + (GLARE_HELD - GLARE_IDLE) * lit.value,
    transform: [
      { translateX: tx.value * width.value },
      { translateY: ty.value * height.value },
    ],
  }));

  const onLayout = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    setSize({ width: w, height: h });
    width.value = w;
    height.value = h;
  };

  const shineW = size.width * SHINE_CANVAS;
  const shineH = size.height * SHINE_CANVAS;
  const glareW = size.width * GLARE_CANVAS;
  const glareH = size.height * GLARE_CANVAS;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[style, tilt]} onLayout={onLayout}>
        {children}
        {size.width > 0 && (
          <View style={styles.light} pointerEvents="none">
            <Animated.View
              style={[
                styles.canvas,
                centred(shineW, shineH, size.width, size.height),
                shine,
              ]}
            >
              <Svg width={shineW} height={shineH}>
                <Defs>
                  {/* CSS `45deg` runs bottom-left to top-right. */}
                  <LinearGradient id={shineId} x1="0" y1="1" x2="1" y2="0">
                    <Stop offset="0" stopColor={SdsColors.ink} stopOpacity="0" />
                    <Stop offset="0.5" stopColor={SdsColors.ink} stopOpacity="0.9" />
                    <Stop offset="1" stopColor={SdsColors.ink} stopOpacity="0" />
                  </LinearGradient>
                </Defs>
                <Rect x={0} y={0} width={shineW} height={shineH} fill={`url(#${shineId})`} />
              </Svg>
            </Animated.View>
            <Animated.View
              style={[
                styles.canvas,
                centred(glareW, glareH, size.width, size.height),
                glare,
              ]}
            >
              <Svg width={glareW} height={glareH}>
                <Defs>
                  <RadialGradient id={glareId} cx="50%" cy="50%" r="50%">
                    <Stop offset="0" stopColor={SdsColors.ink} stopOpacity="0.85" />
                    <Stop offset="0.7" stopColor={SdsColors.ink} stopOpacity="0" />
                  </RadialGradient>
                </Defs>
                <Rect x={0} y={0} width={glareW} height={glareH} fill={`url(#${glareId})`} />
              </Svg>
            </Animated.View>
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

/** Where the finger is across a side, clamped to 1a's −.5 … .5. */
function swing(position: number, length: number) {
  'worklet';
  if (length <= 0) return 0;
  return Math.max(-0.5, Math.min(0.5, position / length - 0.5));
}

/** A canvas of `w × h` with its centre on the centre of a `cw × ch` card. */
function centred(w: number, h: number, cw: number, ch: number): ViewStyle {
  return { width: w, height: h, left: (cw - w) / 2, top: (ch - h) / 2 };
}

const styles = StyleSheet.create({
  light: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  canvas: {
    position: 'absolute',
  },
});
