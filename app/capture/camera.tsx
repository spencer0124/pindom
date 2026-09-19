import { useIsFocused } from '@react-navigation/native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, SdsSpacing, Txt, useAdaptive, useTheme } from '@/design-system';
import {
  CameraStage,
  PhotoFrame,
  useCaptureStore,
  type CameraStageHandle,
} from '@/features/capture';
import { Shape } from '@/features/shared';
import { DEFAULT_CUTOUT_POSE, type CutoutPose } from '@/features/capture/cutout-model';
import { Slider } from '@/features/capture/Slider';

/** 1a's `fadeUp .4s both` on the 인증 완료 chip: 14px up from below, CSS `ease`. */
const chipRise = FadeInDown.duration(400)
  .easing(Easing.bezier(0.25, 0.1, 0.25, 1))
  .withInitialValues({ opacity: 0, transform: [{ translateY: 14 }] });

/** Verified camera capture. Edits are applied to the captured photo on the next screen. */
export default function CameraScreen() {
  const adaptive = useAdaptive();
  const { token } = useTheme();

  const place = useCaptureStore((s) => s.place);
  const grant = useCaptureStore((s) => s.grant);
  const setPhoto = useCaptureStore((s) => s.setPhoto);

  const stage = useRef<CameraStageHandle>(null);
  const [shooting, setShooting] = useState(false);
  const [cutoutEnabled, setCutoutEnabled] = useState(true);
  const [cutoutPose, setCutoutPose] = useState<CutoutPose>(DEFAULT_CUTOUT_POSE);
  useEffect(() => {
    setCutoutEnabled(true);
    setCutoutPose(DEFAULT_CUTOUT_POSE);
  }, [place?.id]);
  const focused = useIsFocused();
  const [active, setActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setActive(state === 'active'));
    return () => subscription.remove();
  }, []);
  const now = useMemo(() => new Date(), []);

  // Only the focused screen may redirect: 티켓 발행 resets the store while this
  // screen is still mounted beneath it, and a plain effect would race its tab
  // switch with a replace to 지도. An unfocused screen is popped, not redirected.
  useFocusEffect(
    useCallback(() => {
      if (grant == null || place == null) {
        router.replace(place != null ? (`/verify/gps?placeId=${place.id}` as never) : ('/map' as never));
      }
    }, [grant, place]),
  );

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
            GPS 인증 완료 · 촬영 준비
          </Txt>
        </Animated.View>
      </SafeAreaView>

      <PhotoFrame placeName={place.name} date={now} style={styles.frame} aspectRatio={3 / 4}>
        {() => focused && active ? <CameraStage ref={stage} previewImageUrl={place.coverImageUrl}
          cutout={place.cutoutImageUrl && cutoutEnabled ? { uri: place.cutoutImageUrl, aspectRatio: place.cutoutAspectRatio ?? 0.5, pose: cutoutPose } : undefined}
          onCutoutChange={setCutoutPose} /> : null}
      </PhotoFrame>

      <SafeAreaView
        edges={['bottom']}
        style={[styles.bar, { backgroundColor: adaptive.background, borderTopColor: adaptive.grey200 }]}
      >
        {place.cutoutImageUrl && <View style={styles.cutoutControls} pointerEvents={shooting ? 'none' : 'auto'}>
          <View style={styles.cutoutActions}>
            <Button size="medium" style={cutoutEnabled ? 'weak' : 'outline'}
              accessibilityState={{ selected: cutoutEnabled }}
              onPress={() => setCutoutEnabled((value) => !value)} disabled={shooting}>
              {cutoutEnabled ? '누끼 켜짐' : '누끼 꺼짐'}
            </Button>
            <Button size="medium" style="outline" disabled={!cutoutEnabled || shooting}
              onPress={() => setCutoutPose((pose) => ({ ...pose, mirrored: !pose.mirrored }))}>좌우 반전</Button>
            <Button size="medium" style="outline" disabled={!cutoutEnabled || shooting}
              onPress={() => setCutoutPose(DEFAULT_CUTOUT_POSE)}>초기화</Button>
          </View>
          {cutoutEnabled && <>
            <View style={styles.cutoutScale}>
              <Txt typography="st13" color={adaptive.grey600}>누끼 크기</Txt>
              <Slider accessibilityLabel="누끼 크기" value={Math.round(cutoutPose.height * 100)} min={20} max={95}
                onChange={(height) => setCutoutPose((pose) => ({ ...pose, height: height / 100 }))} />
            </View>
            <Txt typography="st13" color={adaptive.grey600}>누끼를 드래그해 옮기면, 보이는 구도대로 함께 저장돼요.</Txt>
          </>}
        </View>}
        <View style={styles.shutterRow}>
          <Pressable onPress={() => router.back()} disabled={shooting} accessibilityRole="button" style={styles.side}>
            <Txt typography="t7" fontWeight="medium" color={adaptive.grey600}>
              취소
            </Txt>
          </Pressable>
          <Pressable
            onPress={shoot}
            disabled={shooting}
            accessibilityRole="button"
            accessibilityLabel={shooting ? '사진 저장 중' : '촬영'}
            accessibilityState={{ disabled: shooting, busy: shooting }}
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
  bar: {
    borderTopWidth: Shape.sectionRule,
    paddingHorizontal: Shape.gutter,
    paddingTop: 12,
    gap: 12,
  },
  shutterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  cutoutControls: { gap: SdsSpacing.xs },
  cutoutActions: { flexDirection: 'row', flexWrap: 'wrap', gap: SdsSpacing.sm },
  cutoutScale: { flexDirection: 'row', alignItems: 'center', gap: SdsSpacing.base, paddingRight: SdsSpacing.sm },
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
