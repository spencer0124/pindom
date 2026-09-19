import { MapPinIcon, TicketIcon } from 'phosphor-react-native';
import { StyleSheet, View } from 'react-native';
import type { User } from '@/lib/domain';
import { Button, ProgressBar, Txt, useAdaptive, useTheme } from '@/design-system';
import { Shape, TIER_NOTE_TOP, tierNote } from '@/features/shared';

interface TicketBalanceCardProps {
  user: User;
  artistName?: string;
  placeCount?: number;
  verifiedCount: number;
  onFindPlaces: () => void;
  onEnterRaffle: () => void;
}

/** The next trip and its reward, together on one quiet blush surface. */
export function TicketBalanceCard({ user, artistName, placeCount, verifiedCount, onFindPlaces, onEnterRaffle }: TicketBalanceCardProps) {
  const adaptive = useAdaptive();
  const { token } = useTheme();
  return (
    <View style={[styles.block, { backgroundColor: adaptive.grey100 }]}>
      <View style={styles.label}>
        <TicketIcon size={21} color={token.accent.fillColor} weight="duotone" />
        <Txt typography="t6" fontWeight="medium" color={adaptive.grey700}>보유 티켓</Txt>
      </View>
      <View style={styles.figureRow}>
        <Txt typography="t1" fontWeight="bold" color={adaptive.grey900} style={styles.figure}>
          {user.ticketBalance}<Txt typography="t4" color={adaptive.grey700}> 장</Txt>
        </Txt>
        <Txt typography="t7" color={adaptive.grey600} style={styles.reward}>
          {tierNote(user.ticketBalance)}
        </Txt>
      </View>
      <ProgressBar progress={Math.min(100, (user.ticketBalance / TIER_NOTE_TOP) * 100)} color={token.accent.fillColor} style={{ backgroundColor: adaptive.grey200 }} />
      <Txt typography="t7" color={adaptive.grey600}>
        {artistName != null && placeCount != null ? `${artistName} 촬영지 ${placeCount}곳 중 ` : ''}{verifiedCount}곳 인증
      </Txt>
      <View style={styles.actions}>
        <Button size="large" display="block" onPress={onFindPlaces} viewStyle={styles.action}
          leftAccessory={<MapPinIcon size={18} color={token.accent.onFillColor} style={styles.actionIcon} />}>
          촬영지 찾기
        </Button>
        <Button size="large" display="block" style="weak" onPress={onEnterRaffle} viewStyle={styles.action}>
          응모하러 가기
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { marginHorizontal: Shape.gutter, padding: 20, borderRadius: 16, gap: 14 },
  label: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  figureRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  figure: { fontSize: 40, lineHeight: 48 },
  reward: { flexGrow: 1, flexShrink: 1, flexBasis: 130 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  action: { flexGrow: 1, flexBasis: 135 },
  actionIcon: { marginRight: 6 },
});
