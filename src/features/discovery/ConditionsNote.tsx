import { StyleSheet, View } from 'react-native';
import { Txt, useAdaptive } from '@/design-system';
import { Shape } from '@/features/shared';

interface ConditionsNoteProps {
  /** From `place.radiusMeters` — per-place so it stays tunable without a deploy. */
  radiusMeters: number;
  artistName?: string;
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
export function ConditionsNote({ radiusMeters, artistName }: ConditionsNoteProps) {
  const adaptive = useAdaptive();

  const overlay =
    artistName != null
      ? `인증되면 ${artistName}의 원본 컷이 카메라에 겹쳐집니다`
      : '인증되면 원본 컷이 카메라에 겹쳐집니다';

  return (
    <View style={styles.block}>
      <Txt typography="t6" fontWeight="bold" color={adaptive.grey900}>
        인증 조건
      </Txt>
      <Txt typography="t7" color={adaptive.grey600}>
        {`반경 ${radiusMeters}m 이내 · 이동속도 검증 통과 · 하루 1회 · ${overlay}`}
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
