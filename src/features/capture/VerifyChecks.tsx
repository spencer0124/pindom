import { StyleSheet, View } from 'react-native';
import { Txt, useAdaptive, useTheme } from '@/design-system';
import { Shape } from '@/features/shared';
import type { VerifyCheck } from './useVerification';

interface VerifyChecksProps {
  checks: VerifyCheck[];
}

/**
 * The three rows under the radar: 위치 정확도 · 인증 반경 판정 · 이동속도 검증.
 *
 * 1a stacks them as filled rounded cards. Under `2b` they are rows on a hairline,
 * and the dot at the left is the only thing that changes colour — acid when the
 * server has said yes, a rule-coloured ring while it has not. A row that failed
 * never renders here: the screen has already left for 인증 실패 with the figures.
 */
export function VerifyChecks({ checks }: VerifyChecksProps) {
  const adaptive = useAdaptive();
  const { token } = useTheme();

  return (
    <View style={[styles.block, { borderColor: adaptive.grey200 }]}>
      {checks.map((check, index) => (
        <View
          key={check.label}
          style={[
            styles.row,
            index > 0 && { borderTopWidth: Shape.rowRule, borderTopColor: adaptive.grey200 },
          ]}
        >
          <View
            style={[
              styles.dot,
              check.ok
                ? { backgroundColor: token.accent.fillColor }
                : { borderWidth: 1, borderColor: adaptive.grey300 },
            ]}
          >
            {check.ok ? (
              <Txt typography="st13" fontWeight="bold" color={token.accent.onFillColor}>
                ✓
              </Txt>
            ) : null}
          </View>
          <Txt typography="t7" fontWeight="medium" color={adaptive.grey800} style={styles.label}>
            {check.label}
          </Txt>
          <Txt typography="t7" color={check.ok ? adaptive.grey700 : adaptive.grey500}>
            {check.value}
          </Txt>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    alignSelf: 'stretch',
    borderTopWidth: Shape.rowRule,
    borderBottomWidth: Shape.rowRule,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
  },
});
