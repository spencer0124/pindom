import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Txt, useAdaptive, useTheme } from '@/design-system';
import {
  CameraStage,
  CUTOUT_SCALE,
  Cutout,
  PhotoFrame,
  Slider,
  useCaptureStore,
  type CameraStageHandle,
} from '@/features/capture';
import { Shape } from '@/features/shared';

/** 1a's `fadeUp .4s both` on the 인증 완료 chip: 14px up from below, CSS `ease`. */
const chipRise = FadeInDown.duration(400)
  .easing(Easing.bezier(0.25, 0.1, 0.25, 1))
  .withInitialValues({ opacity: 0, transform: [{ translateY: 14 }] });

/**
 * 카메라 — the live view, the 최애 cutout over it, and the shutter.
 *
 * Built from prototype block `1a` for layout, copy and flow and `2b` for colour,
 * type and corners, matching `app/(tabs)/index.tsx`. Figma `33:2230` predates
 * the cutout entirely.
 *
 * The screen opens only on a grant. That is not the gate — a patched build can
 * navigate here — it is so the screen never shows a shutter it cannot honour:
 * `issueTicket` is what requires the grant, and without one the chain ends at
 * 티켓 발행하기 with `grant_expired`. The shot is the raw photo; the cutout and
 * the tools are composed on 편집, so a retake keeps the alignment.
 *
 * The drag that places the cutout covers the whole print, as in 1a — the
 * `Cutout` lays its gesture over the stage, under the hint.
 */
export default function CameraScreen() {
  const adaptive = useAdaptive();
  const { token } = useTheme();

  const place = useCaptureStore((s) => s.place);
  const grant = useCaptureStore((s) => s.grant);
  const cutout = useCaptureStore((s) => s.cutout);
  const setCutout = useCaptureStore((s) => s.setCutout);
  const resetCutout = useCaptureStore((s) => s.resetCutout);
  const setPhoto = useCaptureStore((s) => s.setPhoto);

  const stage = useRef<CameraStageHandle>(null);
  const [shooting, setShooting] = useState(false);
  const now = useMemo(() => new Date(), []);

  useEffect(() => {
    if (grant == null || place == null) {
      router.replace(place != null ? (`/verify/gps?placeId=${place.id}` as never) : ('/map' as never));
    }
  }, [grant, place]);

  const shoot = useCallback(async () => {
    if (shooting) return;
    setShooting(true);
    try {
      // A real camera gives a file; the simulator gives the stand-in rendered
      // to one, so the rest of the chain is still walkable there.
      const uri = await stage.current?.capture();
      if (uri == null) return;
      setPhoto(uri);
      router.push('/capture/edit' as never);
    } finally {
      setShooting(false);
    }
  }, [shooting, setPhoto]);

  if (place == null) return null;

  return (
    <View style={[styles.root, { backgroundColor: adaptive.greyBackground }]}>
      <SafeAreaView edges={['top']} style={styles.top}>
        <Animated.View
          entering={chipRise}
          style={[
            styles.badge,
            { backgroundColor: token.accent.dimColor, borderColor: token.accent.fillColor },
          ]}
        >
          <View style={[styles.badgeDot, { backgroundColor: token.accent.fillColor }]}>
            <Txt typography="st13" fontWeight="bold" color={token.accent.onFillColor}>
              ✓
            </Txt>
          </View>
          <Txt typography="st13" fontWeight="bold" color={adaptive.grey900}>
            GPS 인증 완료 · 원본 컷 열림
          </Txt>
        </Animated.View>
      </SafeAreaView>

      <PhotoFrame placeName={place.name} date={now} style={styles.frame}>
        {(size) => (
          <>
            <CameraStage ref={stage} />
            <Cutout stage={size} placement={cutout} onMove={setCutout} />
            <View style={[styles.hint, { backgroundColor: adaptive.background }]} pointerEvents="none">
              <Txt typography="st13" color={adaptive.grey600}>
                드래그해서 나와 겹치는 위치를 맞추세요
              </Txt>
            </View>
          </>
        )}
      </PhotoFrame>

      <SafeAreaView
        edges={['bottom']}
        style={[styles.bar, { backgroundColor: adaptive.background, borderTopColor: adaptive.grey200 }]}
      >
        <View style={styles.scaleRow}>
          <Txt typography="st13" color={adaptive.grey500} style={styles.scaleLabel}>
            {cutout.scale === 100 ? '원본 비율' : '크기'}
          </Txt>
          <Slider
            value={cutout.scale}
            min={CUTOUT_SCALE.min}
            max={CUTOUT_SCALE.max}
            onChange={(scale) => setCutout({ scale })}
            accessibilityLabel="컷아웃 크기"
          />
          <Pressable
            onPress={resetCutout}
            accessibilityRole="button"
            style={[styles.reset, { borderColor: adaptive.grey200 }]}
          >
            <Txt typography="st13" fontWeight="bold" color={adaptive.grey600}>
              초기화
            </Txt>
          </Pressable>
        </View>

        <View style={styles.shutterRow}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" style={styles.side}>
            <Txt typography="t7" fontWeight="medium" color={adaptive.grey600}>
              취소
            </Txt>
          </Pressable>
          <Pressable
            onPress={shoot}
            disabled={shooting}
            accessibilityRole="button"
            accessibilityLabel="촬영"
            style={[
              styles.shutter,
              { backgroundColor: token.accent.fillColor, borderColor: adaptive.grey900 },
              shooting && styles.shutterBusy,
            ]}
          />
          <Txt typography="st13" color={adaptive.grey500} style={[styles.side, styles.sideRight]}>
            티켓 1장
          </Txt>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  top: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 28,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderRadius: Shape.chipRadius,
  },
  badgeDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    flex: 1,
    marginHorizontal: 10,
  },
  hint: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    opacity: 0.92,
  },
  bar: {
    borderTopWidth: Shape.sectionRule,
    paddingHorizontal: Shape.gutter,
    paddingTop: 12,
    gap: 12,
  },
  scaleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scaleLabel: {
    width: 52,
  },
  reset: {
    height: 26,
    paddingHorizontal: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  side: {
    width: 70,
  },
  sideRight: {
    textAlign: 'right',
  },
  shutter: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 4,
  },
  shutterBusy: {
    opacity: 0.5,
  },
});
