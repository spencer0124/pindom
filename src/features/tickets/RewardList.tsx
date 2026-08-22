import { Pressable, StyleSheet, View } from 'react-native';
import { Txt, useAdaptive, useTheme } from '@/design-system';
import type { Raffle } from '@/lib/domain';
import { Shape } from '@/features/shared';

interface RewardListProps {
  raffles: Raffle[];
  balance: number;
  selectedId: string | null;
  onSelect: (raffleId: string) => void;
}

/**
 * 응모's reward rows: the prize, its description, and what it costs — or what
 * it would take.
 *
 * 1a gates rows on a tier minimum and a cost; the contract has only the cost,
 * and the balance check is the server's. So a row the balance cannot cover is
 * shown dimmed with `{n}장 필요`, the way 1a dims a locked one, and is still
 * selectable — the CTA below says what it would take, and a press there does
 * not call the server. 1a's glyph tile has no field behind it and is not drawn.
 */
export function RewardList({ raffles, balance, selectedId, onSelect }: RewardListProps) {
  const adaptive = useAdaptive();
  const { token } = useTheme();

  return (
    <View style={[styles.list, { borderTopColor: adaptive.grey200 }]}>
      {raffles.map((raffle) => {
        const short = balance < raffle.ticketCost;
        const on = raffle.id === selectedId;
        return (
          <Pressable
            key={raffle.id}
            onPress={() => onSelect(raffle.id)}
            accessibilityRole="radio"
            accessibilityLabel={raffle.title}
            accessibilityState={{ selected: on }}
            style={[
              styles.row,
              { borderBottomColor: adaptive.grey200 },
              on && { backgroundColor: token.accent.dimColor },
            ]}
          >
            <View style={[styles.mark, { borderColor: on ? token.accent.fillColor : adaptive.grey300 }]}>
              {on && <View style={[styles.markDot, { backgroundColor: token.accent.fillColor }]} />}
            </View>
            <View style={[styles.copy, short && styles.dim]}>
              <Txt typography="t6" fontWeight="bold" color={adaptive.grey900}>
                {raffle.title}
              </Txt>
              <Txt typography="st13" color={adaptive.grey600}>
                {raffle.prizeDescription}
              </Txt>
            </View>
            <Txt
              typography="st13"
              fontWeight="bold"
              color={short ? adaptive.grey500 : token.accent.fillColor}
            >
              {short ? `${raffle.ticketCost}장 필요` : `티켓 ${raffle.ticketCost}장`}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    borderTopWidth: Shape.rowRule,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Shape.gutter,
    paddingVertical: 14,
    borderBottomWidth: Shape.rowRule,
  },
  mark: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  dim: {
    opacity: 0.5,
  },
});
