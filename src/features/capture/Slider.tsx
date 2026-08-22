import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useAdaptive, useTheme } from '@/design-system';

const KNOB = 18;
const TRACK = 4;

interface SliderProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  accessibilityLabel: string;
}

/**
 * The range control 1a uses for the cutout scale and the tool strength.
 *
 * Capture-local rather than a design-system primitive: the system ships a
 * `ProgressBar` (read-only) and a `NumericSpinner` (stepped), and neither is a
 * continuous drag. It is written here so the two screens that need one share
 * it; if a third appears it is a candidate for promotion, per
 * docs/reference/design-system.md.
 *
 * Square track, round knob — the knob is the one thing a thumb has to find.
 */
export function Slider({ value, min, max, onChange, accessibilityLabel }: SliderProps) {
  const adaptive = useAdaptive();
  const { token } = useTheme();
  const [width, setWidth] = useState(0);

  const fraction = max > min ? (value - min) / (max - min) : 0;

  const update = (x: number) => {
    if (width === 0) return;
    const next = min + clamp(x / width, 0, 1) * (max - min);
    onChange(Math.round(next));
  };

  const gesture = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      runOnJS(update)(e.x);
    })
    .onUpdate((e) => {
      runOnJS(update)(e.x);
    });

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={styles.hit}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ text: String(value) }}
      >
        <View style={[styles.track, { backgroundColor: adaptive.grey200 }]}>
          <View
            style={[
              styles.fill,
              { width: `${fraction * 100}%`, backgroundColor: token.accent.fillColor },
            ]}
          />
        </View>
        <View
          style={[
            styles.knob,
            {
              left: fraction * width - KNOB / 2,
              backgroundColor: adaptive.grey900,
            },
          ]}
        />
      </View>
    </GestureDetector>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const styles = StyleSheet.create({
  hit: {
    flex: 1,
    height: 32,
    justifyContent: 'center',
  },
  track: {
    height: TRACK,
  },
  fill: {
    height: TRACK,
  },
  knob: {
    position: 'absolute',
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
  },
});
