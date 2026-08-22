import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInUp, ZoomIn, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Txt, useAdaptive, useTheme } from '@/design-system';
import { userRepository } from '@/lib/repositories';
import { TEAR_SWING, TearStage, useTicketsStore } from '@/features/tickets';
import { Shape } from '@/features/shared';

/**
 * 응모완료 — the torn ticket, stamped, and the entry number.
 *
 * Built from prototype block `1a` for layout, copy and flow and `2b` for colour,
 * type and corners, matching `app/(tabs)/index.tsx`. Figma `33:1830` is the
 * earlier frame.
 *
 * The halves are `TearStage` held at 1 with the stub reading USED — the same
 * object the user just tore, not a second drawing of it. The entry number is
 * the server's entry id, and the balance is read back rather than computed.
 * 1a prints a fixed draw date; the contract has none, so the line names the
 * raffle's closing date, which the Tickets checklist records.
 */
export default function RaffleDoneScreen() {
  const adaptive = useAdaptive();
  const { token } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const raffle = useTicketsStore((s) => s.raffle);
  const ticket = useTicketsStore((s) => s.tearing);
  const entry = useTicketsStore((s) => s.entry);
  const reset = useTicketsStore((s) => s.reset);
  const torn = useSharedValue(1);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (entry == null) router.replace('/tickets' as never);
  }, [entry]);

  useEffect(() => {
    let live = true;
    void userRepository.me().then((me) => {
      if (live && me.ok) setBalance(me.data.ticketBalance);
    });
    return () => {
      live = false;
    };
  }, []);

  const leave = (to: '/community' | '/tickets') => {
    reset();
    router.navigate(to as never);
  };

  if (raffle == null || entry == null) return null;

  // Narrower than the gutters by the swing: the torn panel rotates about the
  // foot of the perforation and its far corner travels outward.
  const cardWidth = screenWidth - Shape.gutter * 2 - TEAR_SWING * 2;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}>
      <View style={styles.body}>
        <View style={styles.stage}>
          {ticket != null && <TearStage ticket={ticket} progress={torn} width={cardWidth} spent />}
          {/* The entering animation and the tilt live on different views:
              Reanimated's layout animation would otherwise overwrite the
              rotate transform, and warns that it will. */}
          <Animated.View entering={ZoomIn.delay(100).duration(500)} style={styles.stampWrap} pointerEvents="none">
            <View style={[styles.stamp, { borderColor: token.accent.fillColor }]}>
              <Txt typography="t6" fontWeight="bold" color={token.accent.fillColor} style={styles.stampText}>
                응모 완료
              </Txt>
            </View>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.copy}>
          <Txt typography="t2" fontWeight="bold" color={adaptive.grey900} textAlign="center">
            응모가 확정됐어요
          </Txt>
          <Txt typography="t6" color={adaptive.grey600} textAlign="center">
            응모번호 {entry.id}
            {balance != null ? ` · 남은 티켓 ${balance}장` : ''}
            {'\n'}
            당첨 발표는 {formatDay(raffle.closesAt)}, 앱 알림으로 안내됩니다
          </Txt>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInUp.delay(420).duration(500)} style={styles.footer}>
        <Button size="large" type="primary" display="block" onPress={() => leave('/community')}>
          커뮤니티에 자랑하기
        </Button>
        <Button size="large" style="weak" display="block" onPress={() => leave('/tickets')}>
          컬렉션으로
        </Button>
      </Animated.View>
    </SafeAreaView>
  );
}

/** 8월 30일 */
function formatDay(date: Date): string {
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingHorizontal: Shape.gutter,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: 26,
  },
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampWrap: {
    position: 'absolute',
  },
  stamp: {
    borderWidth: 3,
    paddingHorizontal: 12,
    paddingVertical: 6,
    transform: [{ rotate: '-9deg' }],
  },
  stampText: {
    letterSpacing: 2,
  },
  copy: {
    gap: 8,
  },
  footer: {
    gap: 8,
    paddingBottom: 8,
  },
});
