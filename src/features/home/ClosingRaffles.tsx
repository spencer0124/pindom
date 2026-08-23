import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
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

/** 1a's `width:186px` cell. */
const CELL = 186;
/** Between a cell's rule and its text — 1a's `gap:10px` between cards. */
const CELL_GAP = 10;

/**
 * 마감 임박 응모 — every open raffle, soonest first, scrolled horizontally.
 *
 * The scroller and the cell width are 1a's: it lays fixed-width cards in a row
 * that scrolls, and how many and whether they scroll is layout, which is 1a's
 * axis. The cell itself is 2b's — square, split from its neighbour by a
 * vertical rule rather than boxed in a rounded card. The closing one is flagged
 * in the alert colour, the only place besides the accent where this screen
 * uses a hue at all.
 *
 * The list is global, not per-최애: the contract's `list()` carries no artist
 * key (fidelity decision 9).
 */
export function ClosingRaffles({ raffles, now, onSelect }: ClosingRafflesProps) {
  const adaptive = useAdaptive();
  const { token } = useTheme();

  if (raffles.length === 0) {
    return (
      <View style={styles.empty}>
        <Txt typography="t6" color={adaptive.grey500}>
          지금 진행 중인 응모가 없어요
        </Txt>
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.track}>
      {raffles.map((raffle, index) => {
        const label = deadlineLabel(raffle.closesAt, now);
        const closingToday = label === '오늘 마감';
        return (
          <Pressable
            key={raffle.id}
            onPress={() => onSelect(raffle.id)}
            accessibilityRole="button"
            style={[
              styles.cell,
              index > 0 && {
                borderLeftWidth: Shape.rowRule,
                borderLeftColor: adaptive.grey200,
                paddingLeft: CELL_GAP,
              },
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  track: {
    paddingHorizontal: Shape.gutter,
  },
  cell: {
    width: CELL,
    gap: 6,
    paddingRight: CELL_GAP,
    paddingVertical: 2,
  },
  empty: {
    paddingHorizontal: Shape.gutter,
    paddingVertical: 8,
  },
});
