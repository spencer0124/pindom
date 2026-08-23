import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ErrorPage, Loader, Txt, useAdaptive } from '@/design-system';
import { Radar, useVerification, VerifyChecks } from '@/features/capture';
import { Shape } from '@/features/shared';

/** 1a opens 카메라 this long after the last check ticks. */
const AUTO_OPEN_MS = 900;

/**
 * GPS인증 — submit a reading, render the verdict.
 *
 * Built from prototype block `1a` for layout, copy and flow, `1b`-A for the
 * radar, and `2b` for colour, type and corners, matching `app/(tabs)/index.tsx`.
 * The Figma frames `33:2330` and `33:2856` predate the radar.
 *
 * The client never decides whether a verification passed. The button produces
 * one reading and hands it to `submitReading`; the radius, the accuracy gate,
 * the implied speed and the mock-provider flag are the server's. The number in
 * the ring is feedback — see CLAUDE.md and docs/reference/backend-contract.md.
 * A refusal is a normal outcome, and it is 인증 실패's to render with the figures.
 *
 * The verdict is revealed at 1a's pace — one row every 900 ms, 인증 중… on the
 * button meanwhile — and 900 ms after the last row ticks the camera opens by
 * itself (fidelity decision 1). 카메라 열기 stays as the manual path; a tap on
 * it during those 900 ms just goes now.
 */
export default function GpsVerifyScreen() {
  const adaptive = useAdaptive();
  const { placeId } = useLocalSearchParams<{ placeId: string }>();
  const { state, phase, distance, checks, verify, reload } = useVerification(placeId);
  const autoOpen = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openCamera = useCallback(() => {
    if (autoOpen.current != null) {
      clearTimeout(autoOpen.current);
      autoOpen.current = null;
    }
    router.push('/capture/camera' as never);
  }, []);

  useEffect(
    () => () => {
      if (autoOpen.current != null) clearTimeout(autoOpen.current);
    },
    [],
  );

  const busy = phase === 'reading' || phase === 'judging';

  const onPress = useCallback(async () => {
    if (busy) return;
    if (phase === 'verified') {
      openCamera();
      return;
    }
    const verdict = await verify();
    if (verdict == null) return;
    if (verdict.verified) {
      autoOpen.current = setTimeout(() => {
        autoOpen.current = null;
        router.push('/capture/camera' as never);
      }, AUTO_OPEN_MS);
    } else {
      router.replace({
        pathname: '/verify/failed',
        params: {
          placeId,
          reason: verdict.reason ?? 'out_of_radius',
          distance: String(Math.round(verdict.distanceMeters)),
          radius: String(verdict.requiredRadiusMeters),
          accuracy: String(Math.round(verdict.accuracyMeters)),
        },
      } as never);
    }
  }, [busy, phase, verify, placeId, openCamera]);

  if (state.status === 'loading') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}>
        <Loader.Centered label="촬영지를 불러오는 중" />
      </SafeAreaView>
    );
  }

  if (state.status === 'error') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}>
        <ErrorPage
          title="촬영지를 불러오지 못했어요"
          subtitle={state.message}
          onPressRightButton={reload}
        />
      </SafeAreaView>
    );
  }

  const { place } = state;
  const remaining = distance != null ? Math.max(0, distance - place.radiusMeters) : null;

  const title =
    phase === 'verified'
      ? '인증 완료 · 원본 컷이 열립니다'
      : busy
        ? '위치를 확인하는 중'
        : remaining == null
          ? '반경까지 —'
          : remaining === 0
            // Inside the radius and still here — refused on accuracy or speed.
            // 1a has no line for it; the Capture checklist lists this one.
            ? '반경 안에 있어요'
            : remaining < place.radiusMeters
              ? `반경까지 ${remaining}m · 거의 다 왔어요`
              : `반경까지 ${remaining}m`;

  const cta = phase === 'verified' ? '카메라 열기' : busy ? '인증 중…' : '현재 위치로 인증';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}>
      <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button">
        <Txt typography="t7" fontWeight="medium" color={adaptive.grey600}>
          ‹ 장소 상세
        </Txt>
      </Pressable>

      <View style={styles.body}>
        <Radar distance={distance} radiusMeters={place.radiusMeters} />

        <View style={styles.copy}>
          <Txt typography="t3" fontWeight="bold" color={adaptive.grey900} textAlign="center">
            {title}
          </Txt>
          <Txt typography="t7" color={adaptive.grey600} textAlign="center">
            {place.name} · 반경 안에서만 촬영이 열립니다
          </Txt>
        </View>

        <VerifyChecks checks={checks} />
      </View>

      <View style={styles.footer}>
        {/* Not `loading` — that paints loader dots over the label, and 1a
            keeps the button at full strength reading 인증 중…; `onPress` is
            what ignores the tap. */}
        <Button size="large" type="primary" display="block" onPress={onPress}>
          {cta}
        </Button>
        <Txt typography="st13" color={adaptive.grey500} textAlign="center">
          반경·이동속도 판정은 인증을 누르면 자동으로 이뤄집니다
        </Txt>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingHorizontal: Shape.gutter,
  },
  back: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 26,
  },
  copy: {
    gap: 6,
  },
  footer: {
    gap: 10,
    paddingBottom: 8,
  },
});
