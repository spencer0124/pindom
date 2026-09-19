import { StyleSheet, View } from 'react-native';
import { Txt, useAdaptive, useTheme } from '@/design-system';
import type { User } from '@/lib/domain';
import { Shape } from '@/features/shared';
import { GAUGE_FIRST, GAUGE_TOP, tierView } from './tier';

interface TierGaugeProps {
  user: User;
}

/** Tier progress and reward thresholds, with wrapping labels on narrow screens. */
export function TierGauge({ user }: TierGaugeProps) {
  const adaptive = useAdaptive();
  const { token } = useTheme();
  const tier = tierView(user);

  return (
    <View style={styles.block}>
      <View style={styles.row}>
        <Txt typography="t7" fontWeight="bold" color={adaptive.grey900}>
          {tier.label}
        </Txt>
        <Txt typography="t7" fontWeight="medium" color={adaptive.grey600}>
          {tier.next}
        </Txt>
      </View>
      <View style={[styles.track, { backgroundColor: adaptive.grey200 }]}>
        <View
          style={[
            styles.fill,
            { width: `${tier.progress * 100}%`, backgroundColor: token.accent.fillColor },
          ]}
        />
        <View
          style={[
            styles.tick,
            { left: `${(GAUGE_FIRST / GAUGE_TOP) * 100}%`, backgroundColor: adaptive.greyBackground },
          ]}
        />
      </View>
      <View style={styles.row}>
        <Txt typography="st13" color={adaptive.grey500}>
          0
        </Txt>
        <Txt typography="st13" color={adaptive.grey500}>
          10 · 앨범/콘서트
        </Txt>
        <Txt typography="st13" color={adaptive.grey500}>
          20 · 팬사인회/굿즈
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    paddingHorizontal: Shape.gutter,
    paddingVertical: 16,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 8,
  },
  track: {
    height: 8,
    borderRadius: 4,
  },
  fill: {
    height: 8,
    borderRadius: 4,
  },
  tick: {
    position: 'absolute',
    top: -4,
    width: 2,
    height: 16,
    marginLeft: -1,
  },
});
