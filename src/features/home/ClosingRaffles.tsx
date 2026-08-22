import { Pressable, StyleSheet, View } from 'react-native';
import type { Raffle } from '@/lib/domain';
import { SdsColors, Txt, useAdaptive, useTheme } from '@/design-system';
import { Shape } from '@/features/shared';

/** 오늘 마감 / D-2 — the badge 1a puts at the top of each cell. */
function deadlineLabel(closesAt: Date, now: Date): string {
  const hours = (closesAt.getTime() - now.getTime()) / 3_600_000;
  if (hours <= 24) return '오늘 마감';
  return `D-${Math.ceil(hours / 24)}`;
}

/** 남은 시간 11시간 · 티켓 6장 */
function remainingLabel(raffle: Raffle, now: Date): string {
  const hours = Math.max(0, (raffle.closesAt.getTime() - now.getTime()) / 3_600_000);
  const time = hours < 24 ? `${Math.round(hours)}시간` : `${Math.ceil(hours / 24)}일`;
  return `남은 시간 ${time} · 티켓 ${raffle.ticketCost}장`;
}

interface ClosingRafflesProps {
  raffles: Raffle[];
  /** Passed in rather than read from the clock so the render stays pure. */
  now: Date;
  onSelect: (raffleId: string) => void;
}

/**
 * 마감 임박 응모 — the two soonest deadlines, side by side.
 *
 * A two-cell grid split by a vertical rule, which is how 2b draws paired values;
 * 1a uses two rounded cards, and corner and divider treatment is 2b's axis. The
 * closing one is flagged in the alert colour, the only place besides the accent
 * where this screen uses a hue at all.
 */
export function ClosingRaffles({ raffles, now, onSelect }: ClosingRafflesProps) {
  const adaptive = useAdaptive();
  const { token } = useTheme();
  const pair = raffles.slice(0, 2);

  if (pair.length === 0) {
    return (
      <View style={styles.empty}>
        <Txt typography="t6" color={adaptive.grey500}>
          지금 진행 중인 응모가 없어요
        </Txt>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {pair.map((raffle, index) => {
        const label = deadlineLabel(raffle.closesAt, now);
        const closingToday = label === '오늘 마감';
        return (
          <Pressable
            key={raffle.id}
            onPress={() => onSelect(raffle.id)}
            accessibilityRole="button"
            style={[
              styles.cell,
              index > 0 && { borderLeftWidth: Shape.rowRule, borderLeftColor: adaptive.grey200 },
            ]}
          >
            <Txt
              typography="t7"
              fontWeight="bold"
              // Fixed semantic, not brand-derived: the alert colour is 2b's own
              // #FF5E00 and does not follow the seed.
              color={closingToday ? SdsColors.alert500 : token.accent.fillColor}
            >
              {label}
            </Txt>
            <Txt typography="t6" fontWeight="bold" color={adaptive.grey900} numberOfLines={2}>
              {raffle.title}
            </Txt>
            <Txt typography="t7" color={adaptive.grey500}>
              {remainingLabel(raffle, now)}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    paddingHorizontal: Shape.gutter,
  },
  cell: {
    flex: 1,
    gap: 6,
    paddingRight: 14,
    paddingVertical: 2,
  },
  empty: {
    paddingHorizontal: Shape.gutter,
    paddingVertical: 8,
  },
});
