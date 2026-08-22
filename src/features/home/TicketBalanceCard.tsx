import { StyleSheet, View } from 'react-native';
import type { User } from '@/lib/domain';
import { Button, ProgressBar, Txt, useAdaptive, useTheme } from '@/design-system';
import { Shape, sectionLabel } from '@/features/shared';

/** The next reward threshold. 1a writes it as 20장이면 팬사인회·굿즈가 열려요. */
const REWARD_AT = 20;

interface TicketBalanceCardProps {
  user: User;
  /** Selected 최애 — 1a captions the balance with their name and place counts. */
  artistName?: string;
  placeCount?: number;
  onFindPlaces: () => void;
  onEnterRaffle: () => void;
}

/**
 * 보유 티켓 — the balance, how far it is from the next reward, and the screen's
 * two primary actions.
 *
 * Drawn as a block bounded by rules rather than as a filled rounded card. 1a
 * renders it as a dark card because 1a predates the direction; 2b's rule is
 * "rules, not cards" and radius is chips only, and corner and divider treatment
 * is 2b's axis to win. The content and both button labels are 1a's.
 */
export function TicketBalanceCard({
  user,
  artistName,
  placeCount,
  onFindPlaces,
  onEnterRaffle,
}: TicketBalanceCardProps) {
  const adaptive = useAdaptive();
  const { token } = useTheme();

  const remaining = Math.max(0, REWARD_AT - user.ticketBalance);
  const caption = [
    '보유 티켓',
    artistName != null && placeCount != null ? `${artistName} ${placeCount}곳` : null,
    `${user.placesVisited}곳 인증`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.block}>
      <Txt typography="t7" color={token.accent.fillColor} style={sectionLabel}>
        {caption}
      </Txt>

      <View style={styles.figureRow}>
        <Txt typography="t1" fontWeight="bold" color={adaptive.grey900}>
          {user.ticketBalance}장
        </Txt>
        <Txt typography="t7" color={adaptive.grey600} textAlign="right" style={styles.reward}>
          {remaining > 0
            ? `${REWARD_AT}장이면 팬사인회·굿즈가 열려요`
            : '팬사인회·굿즈에 응모할 수 있어요'}
        </Txt>
      </View>

      <ProgressBar
        progress={Math.min(100, (user.ticketBalance / REWARD_AT) * 100)}
        color={token.accent.fillColor}
        style={styles.gauge}
      />

      <View style={styles.actions}>
        <Button size="medium" display="block" onPress={onFindPlaces} containerStyle={styles.action}>
          촬영지 찾기
        </Button>
        <Button
          size="medium"
          display="block"
          style="weak"
          onPress={onEnterRaffle}
          containerStyle={styles.action}
        >
          응모하러 가기
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    paddingHorizontal: Shape.gutter,
    paddingVertical: 20,
    gap: 10,
  },
  figureRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  reward: {
    flexShrink: 1,
    paddingBottom: 6,
  },
  gauge: {
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  action: {
    flex: 1,
  },
});
