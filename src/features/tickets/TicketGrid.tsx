import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Txt, useAdaptive } from '@/design-system';
import type { Ticket } from '@/lib/domain';
import { HoloTilt, PindomMark, Shape, TicketCard } from '@/features/shared';

/**
 * How long a finger rests on a tile before the hold takes it. A touch that
 * moves sooner is a scroll, and the grid keeps scrolling.
 */
const HOLD_MS = 120;

interface TicketGridProps {
  tickets: Ticket[];
  onSelect?: (ticketId: string) => void;
}

/** Responsive foil tickets. Small screens and enlarged text use one column. */
export function TicketGrid({ tickets, onSelect }: TicketGridProps) {
  const adaptive = useAdaptive();
  const { width, fontScale } = useWindowDimensions();
  const singleColumn = width < 380 || fontScale > 1.25;
  const cellWidth = singleColumn ? width - Shape.gutter * 2 : (width - Shape.gutter * 2 - 14) / 2;

  if (tickets.length === 0) {
    return (
      <View style={styles.empty}>
        <PindomMark size={42} color={adaptive.brand500} />
        <Txt typography="t6" color={adaptive.grey600} textAlign="center">
          아직 발행한 티켓이 없어요
        </Txt>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {tickets.map((ticket, index) => (
        <HoloTilt key={ticket.id} style={{ width: cellWidth }} disabled={ticket.spent} activateAfterLongPress={HOLD_MS}>
          <Pressable
            onPress={onSelect ? () => onSelect(ticket.id) : undefined}
            accessible
            accessibilityLabel={`${ticket.placeName}, ${ticket.issuedAt.toLocaleDateString('ko-KR')}, ${ticket.spent ? '사용 완료' : '사용 가능'}, ${ticket.serial}${ticket.testMode ? ', 카메라 테스트' : ''}`}
            accessibilityRole={onSelect ? 'button' : undefined}
          >
            <TicketCard
              size="tile"
              animate={index === 0 && !ticket.spent}
              placeName={ticket.placeName}
              serial={ticket.serial}
              issuedAt={ticket.issuedAt}
              testMode={ticket.testMode}
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
    gap: 14,
    paddingHorizontal: Shape.gutter,
    paddingTop: 8,
  },
  empty: {
    paddingHorizontal: Shape.gutter,
    paddingVertical: 40,
    alignItems: 'center',
    gap: 16,
  },
});
