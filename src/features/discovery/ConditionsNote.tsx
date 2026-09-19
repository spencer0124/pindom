import { StyleSheet, View } from 'react-native';
import { Txt, useAdaptive } from '@/design-system';
import { Shape } from '@/features/shared';

interface ConditionsNoteProps {
  /** From `place.radiusMeters` — per-place so it stays tunable without a deploy. */
  radiusMeters: number;
  artistName?: string;
  hasCutout: boolean;
  testMode?: boolean;
}

/**
 * 인증 조건 — what the server will check when 인증하기 is pressed.
 *
 * Worth being precise about what this block is: a description of a decision made
 * elsewhere. The radius, the speed check and the daily cooldown are adjudicated
 * by `verifyLocation`, server-side, against the place's stored coordinate. This
 * screen states the rules; it does not apply any of them, and the distance shown
 * above is feedback rather than a gate. See the trust boundary in
 * docs/explanation/architecture.md.
 *
 * The radius is read from the place rather than written as 50, because the
 * contract makes it per-place. Every other number in the sentence is fixed by
 * the function.
 */
export function ConditionsNote({ radiusMeters, artistName, hasCutout, testMode = false }: ConditionsNoteProps) {
  const adaptive = useAdaptive();

  const capture = hasCutout
    ? artistName != null
      ? `인증되면 ${artistName}의 누끼와 함께 사진을 찍을 수 있어요`
      : '인증되면 누끼와 함께 사진을 찍을 수 있어요'
    : '인증되면 현장에서 사진을 찍고 티켓을 만들 수 있어요';

  return (
    <View style={styles.block}>
      <Txt typography="t6" fontWeight="bold" color={adaptive.grey900}>
        {testMode ? '위치 제한 해제 · 카메라 테스트' : '인증 조건'}
      </Txt>
      <Txt typography="t7" color={adaptive.grey600}>
        {testMode
          ? '현재 위치와 관계없이 촬영할 수 있어요. 사진과 티켓에는 TEST가 표시되며, 티켓 발행 한도는 그대로 적용돼요.'
          : `반경 ${radiusMeters}m 이내 · 이동속도 검증 통과 · 하루 1회 · ${capture}`}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    paddingHorizontal: Shape.gutter,
    gap: 6,
  },
});
