import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, colorSeeds, Txt, useAdaptive } from '@/design-system';
import type { VerificationFailureReason } from '@/lib/domain';
import { Shape } from '@/features/shared';

type FailedParams = {
  placeId: string;
  reason: VerificationFailureReason;
  distance: string;
  radius: string;
  accuracy: string;
};

/**
 * 인증 실패 — the server said no, and here are its numbers.
 *
 * Built from prototype block `1a` for layout, copy and flow and `2b` for colour,
 * type and corners, matching `app/(tabs)/index.tsx`. Figma `33:2293` is the
 * earlier frame.
 *
 * 1a has two kinds, range and spoof; the contract has four reasons. They map
 * cleanly — `out_of_radius` and `poor_accuracy` are "not yet", `implausible_speed`
 * and `mock_location` are "not you" — and the fact table changes with them. Every
 * figure is the server's; nothing here is measured. The 다시 인증하기 path keeps
 * the verification session, so the speed check sees one series.
 */
export default function VerifyFailedScreen() {
  const adaptive = useAdaptive();
  const params = useLocalSearchParams<FailedParams>();

  const reason = params.reason ?? 'out_of_radius';
  const spoof = reason === 'implausible_speed' || reason === 'mock_location';
  const blurry = reason === 'poor_accuracy';
  const distance = Number(params.distance);
  const radius = Number(params.radius);
  const accuracy = Number(params.accuracy);

  const facts = spoof
    ? [
        {
          k: '탐지 사유',
          v: reason === 'implausible_speed' ? '이동속도 검증 (위조 방지)' : '위치 조작 앱 감지',
        },
        { k: '위치 정확도', v: `±${accuracy}m` },
        { k: '조치', v: '검토 대기 (24h)' },
      ]
    : blurry
      ? [
          { k: '현재 거리', v: `${distance}m` },
          { k: '인증 반경', v: `${radius}m` },
          { k: '위치 정확도', v: `±${accuracy}m` },
        ]
      : [
          { k: '현재 거리', v: `${distance}m` },
          { k: '인증 반경', v: `${radius}m` },
          { k: '남은 거리', v: `${Math.max(0, distance - radius)}m` },
        ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}>
      <View style={styles.body}>
        <View
          style={[
            styles.glyph,
            { borderColor: spoof ? colorSeeds.danger : adaptive.grey300 },
          ]}
        >
          <Txt
            typography="t2"
            fontWeight="bold"
            color={spoof ? colorSeeds.danger : adaptive.grey900}
          >
            {spoof ? '!' : '↻'}
          </Txt>
        </View>

        {/* 1a writes the range and spoof copy. `poor_accuracy` has none — the
            contract added the gate after the prototype — so these two lines are
            the build's, and the Capture checklist lists them for the designer. */}
        <Txt typography="t2" fontWeight="bold" color={adaptive.grey900}>
          {spoof ? '인증이 거부됐어요' : blurry ? '위치가 아직 흐릿해요' : '아직 반경 밖입니다'}
        </Txt>
        <Txt typography="t6" color={adaptive.grey700}>
          {spoof
            ? '위치 조작이 의심되어 이번 인증은 무효 처리되고, 계정에 검토 플래그가 등록됐습니다. 관리자 검토는 보통 24시간 안에 끝납니다.'
            : blurry
              ? `위치 오차가 ±${accuracy}m라 반경 ${radius}m 판정을 내릴 수 없어요. 하늘이 트인 곳에서 잠시 기다렸다가 다시 인증해 주세요.`
              : `인증 반경 ${radius}m 안으로 들어가면 카메라가 열립니다. 조금만 더 이동해 주세요.`}
        </Txt>

        <View style={[styles.facts, { borderColor: adaptive.grey200 }]}>
          {facts.map((fact, index) => (
            <View
              key={fact.k}
              style={[
                styles.fact,
                index > 0 && { borderTopWidth: Shape.rowRule, borderTopColor: adaptive.grey200 },
              ]}
            >
              <Txt typography="t7" fontWeight="medium" color={adaptive.grey600}>
                {fact.k}
              </Txt>
              <Txt typography="t7" fontWeight="bold" color={adaptive.grey900}>
                {fact.v}
              </Txt>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          size="large"
          type="primary"
          display="block"
          onPress={() =>
            spoof
              ? router.navigate('/my' as never)
              : router.replace({ pathname: '/verify/gps', params: { placeId: params.placeId } } as never)
          }
        >
          {spoof ? '검토 상태 확인' : '다시 인증하기'}
        </Button>
        <Button
          size="large"
          style="weak"
          display="block"
          onPress={() => router.navigate('/map' as never)}
        >
          지도로 돌아가기
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingHorizontal: Shape.gutter,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },
  glyph: {
    width: 64,
    height: 64,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  facts: {
    borderTopWidth: Shape.rowRule,
    borderBottomWidth: Shape.rowRule,
  },
  fact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  footer: {
    gap: 8,
    paddingBottom: 8,
  },
});
