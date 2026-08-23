import { Pressable, StyleSheet, View } from 'react-native';
import { Txt, useAdaptive } from '@/design-system';
import type { Ticket } from '@/lib/domain';
import { HoloTilt, Shape, TicketCard } from '@/features/shared';

/**
 * How long a finger rests on a tile before the hold takes it. A touch that
 * moves sooner is a scroll, and the grid keeps scrolling.
 */
const HOLD_MS = 120;

interface TicketGridProps {
  tickets: Ticket[];
  onSelect?: (ticketId: string) => void;
}

/**
 * 컬렉션's two-column grid of tiles, newest first.
 *
 * Each tile is the ticket at tile size — same component as 티켓 발행's card,
 * so a ticket looks like itself everywhere — and, like that card, it tilts
 * under a held finger through `HoloTilt` (fidelity decision 2). 1a gives
 * every tile a hologram kind (RAINBOW · BASIC · GALAXY); that is colour, and
 * under `2b` a ticket is a print. Spent tickets keep their place with the
 * stub reading USED.
 */
export function TicketGrid({ tickets, onSelect }: TicketGridProps) {
  const adaptive = useAdaptive();

  if (tickets.length === 0) {
    return (
      <View style={styles.empty}>
        <Txt typography="t6" color={adaptive.grey600} textAlign="center">
          아직 발행한 티켓이 없어요
        </Txt>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {tickets.map((ticket) => (
        <HoloTilt key={ticket.id} style={styles.cell} activateAfterLongPress={HOLD_MS}>
          <Pressable
            onPress={onSelect ? () => onSelect(ticket.id) : undefined}
            accessibilityRole={onSelect ? 'button' : undefined}
          >
            <TicketCard
              size="tile"
              placeName={ticket.placeName}
              serial={ticket.serial}
              issuedAt={ticket.issuedAt}
              spent={ticket.spent}
            />
          </Pressable>
        </HoloTilt>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: Shape.gutter,
    paddingTop: 14,
  },
  cell: {
    // Two across with the 10px gap between; an odd last tile keeps its width.
    width: '48.5%',
  },
  empty: {
    paddingHorizontal: Shape.gutter,
    paddingVertical: 40,
  },
});
