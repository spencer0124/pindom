import { forwardRef, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { Txt, useAdaptive } from '@/design-system';

export interface StageSize {
  width: number;
  height: number;
}

interface PhotoFrameProps {
  placeName: string;
  /** The day the shot is taken — printed beside the GPS mark. */
  date: Date;
  testMode?: boolean;
  /** Receives the stage's measured size so overlays can place themselves in it. */
  children: (stage: StageSize) => ReactNode;
  style?: StyleProp<ViewStyle>;
  /** 공개설정's thumbnail drops the caption — there is no room for it at 92px. */
  compact?: boolean;
  /** Fit a stable photo ratio within the available space on every screen. */
  aspectRatio?: number;
}

/**
 * The print every Capture stage sits inside: a frame with a wide foot, the
 * wordmark and place at the left, the date and the GPS mark at the right.
 *
 * It is the same object on the camera, on 편집 and as 공개설정's thumbnail, and
 * it is what `captureRef` renders to a file — so whatever is composed inside
 * this frame is exactly what the ticket carries. Under `2b` the corners are
 * square and the ground is the chrome surface; 1a's drop shadow is gone with
 * the radius.
 */
export const PhotoFrame = forwardRef<View, PhotoFrameProps>(function PhotoFrame(
  { placeName, date, testMode = false, children, style, compact = false, aspectRatio },
  ref,
) {
  const adaptive = useAdaptive();
  const [stage, setStage] = useState<StageSize>({ width: 0, height: 0 });
  const padding = compact ? 4 : 8;
  const foot = compact ? 12 : 34;
  const availableWidth = Math.max(0, stage.width - padding * 2);
  const availableHeight = Math.max(0, stage.height - padding - foot);
  const fittedWidth = aspectRatio ? Math.min(availableWidth, availableHeight * aspectRatio) : availableWidth;
  const fittedHeight = aspectRatio ? fittedWidth / aspectRatio : availableHeight;

  return (
    <View style={[styles.container, style]} onLayout={(e: LayoutChangeEvent) =>
      setStage({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}>
      {fittedWidth > 0 && fittedHeight > 0 && (
        <View ref={ref} collapsable={false}
          style={[styles.frame, compact && styles.frameCompact, { backgroundColor: adaptive.background }]}>
          <View style={[styles.stage, { width: fittedWidth, height: fittedHeight, backgroundColor: adaptive.greyBackground }]}>
            {children({ width: fittedWidth, height: fittedHeight })}
          </View>
          {!compact && (
            <View style={styles.caption}>
              <Txt typography="st13" fontWeight="bold" color={adaptive.grey900} numberOfLines={1} style={styles.wordmark}>
                PINDOM · {placeName}
              </Txt>
              <Txt typography="st13" color={adaptive.grey500} style={styles.mono}>
                {formatStamp(date)} · {testMode ? 'TEST' : 'GPS ✓'}
              </Txt>
            </View>
          )}
        </View>
      )}
    </View>
  );
});

/** 2026.08.12 — the stamp the print carries. */
export function formatStamp(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  frame: {
    padding: 8,
    paddingBottom: 0,
  },
  frameCompact: {
    padding: 4,
    paddingBottom: 12,
  },
  stage: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  wordmark: {
    flex: 1,
    letterSpacing: 1,
  },
  mono: {
    fontVariant: ['tabular-nums'],
    letterSpacing: 0,
  },
});
