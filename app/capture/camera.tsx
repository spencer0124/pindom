import { useIsFocused } from '@react-navigation/native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Txt, useAdaptive, useTheme } from '@/design-system';
import {
  CameraStage,
  PhotoFrame,
  useCaptureStore,
  type CameraStageHandle,
} from '@/features/capture';
import { Shape } from '@/features/shared';

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
        {() => focused && active ? <CameraStage ref={stage} /> : null}
      </PhotoFrame>

      <SafeAreaView
        edges={['bottom']}
        style={[styles.bar, { backgroundColor: adaptive.background, borderTopColor: adaptive.grey200 }]}
      >
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
