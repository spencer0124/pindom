import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { useAdaptive } from '@/design-system';
import type { CutoutPlacement } from './state';

/** The silhouette's own canvas, from the prototype's SVG. */
const VIEW_W = 200;
const VIEW_H = 340;

/** 1a's pose A — 원본 컷: arms raised. The other poses are placeholders too. */
const ARMS = 'M74 118 L172 34 M126 118 L28 34';
const BODY =
  'M100 78 C78 78 66 96 66 122 L66 196 C66 210 72 218 78 220 L84 300 L96 300 L100 232 L104 300 L116 300 L122 220 C128 218 134 210 134 196 L134 122 C134 96 122 78 100 78 Z';

/** How tall the figure stands against the stage it is placed on. */
const FIGURE_HEIGHT_RATIO = 0.5;

/** 1a's `transform .16s ease` on every move that is not a drag. */
const SETTLE = { duration: 160, easing: Easing.bezier(0.25, 0.1, 0.25, 1) };

interface CutoutProps {
  /** The stage the figure is placed over — measured by the parent's onLayout. */
  stage: { width: number; height: number };
  placement: CutoutPlacement;
  /** Omit to render a fixed figure — the 편집 canvas and the 공개설정 thumbnail. */
  onMove?: (placement: Pick<CutoutPlacement, 'x' | 'y'>) => void;
}

/**
 * The 최애 cutout the camera overlays on the live view.
 *
 * It is a silhouette because the prototype's is: every person in it is a
 * placeholder, and the real cutout is an asset the artist side supplies later.
 * Position is kept as fractions of the stage, so the figure the user aligned
 * over the live view lands on the same spot of the captured photo on 편집 —
 * the stages are different sizes and the alignment has to survive that.
 *
 * The drag is the whole stage, as in 1a: a finger anywhere on the print moves
 * the figure by its delta, not to its position. Dragging is raw; everything
 * else — 초기화, the scale slider, the settle after a release — eases over
 * 160 ms. The drag's translation is folded into the base before it is zeroed,
 * so a release never shows the figure at its old place for a frame.
 *
 * Scale is the slider's job, not a pinch: 1a narrowed it to 88–112% and dropped
 * 좌우반전, which reads as an anti-fake measure (design/README.md #4), and a
 * pinch would reopen what the slider closed.
 */
export function Cutout({ stage, placement, onMove }: CutoutProps) {
  const adaptive = useAdaptive();

  const height = stage.height * FIGURE_HEIGHT_RATIO;
  const width = (height * VIEW_W) / VIEW_H;

  const baseX = useSharedValue(placement.x * stage.width);
  const baseY = useSharedValue(placement.y * stage.height);
  const scale = useSharedValue(placement.scale / 100);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);

  // A placement that changes from outside a drag — 초기화, the slider, the
  // clamp a commit applied — eases to its target. After a release the base is
  // already there, and this is a no-op.
  useEffect(() => {
    baseX.value = withTiming(placement.x * stage.width, SETTLE);
    baseY.value = withTiming(placement.y * stage.height, SETTLE);
    scale.value = withTiming(placement.scale / 100, SETTLE);
  }, [placement.x, placement.y, placement.scale, stage.width, stage.height, baseX, baseY, scale]);

  const commit = (dx: number, dy: number) => {
    if (!onMove || stage.width === 0 || stage.height === 0) return;
    const x = clamp(placement.x + dx / stage.width, -0.5, 0.5);
    const y = clamp(placement.y + dy / stage.height, -0.5, 0.5);
    onMove({ x, y });
  };

  const pan = Gesture.Pan()
    .enabled(onMove != null)
    .minDistance(0)
    .onUpdate((event) => {
      dragX.value = event.translationX;
      dragY.value = event.translationY;
    })
    .onFinalize((event) => {
      // Fold the drag into the base on the UI thread first; the store's
      // round-trip lands afterwards and only has the clamp to add.
      baseX.value += event.translationX;
      baseY.value += event.translationY;
      dragX.value = 0;
      dragY.value = 0;
      runOnJS(commit)(event.translationX, event.translationY);
    });

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: baseX.value + dragX.value },
      { translateY: baseY.value + dragY.value },
      { scale: scale.value },
    ],
  }));

  const figure = (
    <Animated.View
      style={[
        styles.figure,
        { width, height, marginLeft: -width / 2, marginTop: -height / 2 },
        style,
      ]}
      pointerEvents="none"
    >
      <Svg width={width} height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} fill="none">
        {/* Outline first, fill over it — the same two-pass stroke the prototype draws. */}
        <Path d={ARMS} stroke={adaptive.grey900} strokeWidth={30} strokeLinecap="round" />
        <Path
          d={BODY}
          fill={adaptive.grey900}
          stroke={adaptive.grey900}
          strokeWidth={16}
          strokeLinejoin="round"
        />
        <Circle cx={100} cy={50} r={34} fill={adaptive.grey900} />
        <Path d={BODY} fill={adaptive.background} />
        <Circle cx={100} cy={50} r={26} fill={adaptive.background} />
        <Path d={ARMS} stroke={adaptive.background} strokeWidth={16} strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );

  if (!onMove) return figure;

  // The whole stage is the drag surface — 1a binds the pointer on the print,
  // not on the figure, so a drag that starts on the background still moves it.
  return (
    <GestureDetector gesture={pan}>
      <View
        style={StyleSheet.absoluteFill}
        accessible
        accessibilityLabel="최애 컷아웃"
        accessibilityHint="드래그해서 위치를 옮깁니다"
      >
        {figure}
      </View>
    </GestureDetector>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const styles = StyleSheet.create({
  figure: {
    position: 'absolute',
    left: '50%',
    top: '50%',
  },
});
