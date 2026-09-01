import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, FadeInDown, Keyframe, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Txt, useAdaptive, useTheme } from '@/design-system';
import { userRepository } from '@/lib/repositories';
import { TEAR_SWING, TearStage, useTicketsStore } from '@/features/tickets';
import { Shape } from '@/features/shared';

/** The stamp's resting tilt. */
const STAMP_TILT = -9;

/**
 * 1a's `stampIn .5s .1s cubic-bezier(.2,.9,.3,1)`: the stamp slams down from
 * 2.4× and −18°, overshoots to .92 at 70%, and rests at 1 and −9°.
 *
 * The −9° rest lives on the stamp itself as a static transform, so the
 * keyframe on the wrapper turns only the other half, −9° → 0°, and ends at
 * identity: a layout animation hands the view back to its own style when it
 * finishes, and a rest angle left in the keyframe would snap upright then.
 */
const stampIn = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 2.4 }, { rotate: `${STAMP_TILT}deg` }] },
  70: {
    opacity: 1,
    transform: [{ scale: 0.92 }, { rotate: '0deg' }],
    easing: Easing.bezier(0.2, 0.9, 0.3, 1),
  },
  100: {
    opacity: 1,
    transform: [{ scale: 1 }, { rotate: '0deg' }],
    easing: Easing.bezier(0.2, 0.9, 0.3, 1),
  },
})
  .duration(500)
  .delay(100);

/** 1a's `fadeUp .5s` on the title block and the buttons: 14px up, CSS `ease`. */
const fadeUp = (delay: number) =>
  FadeInDown.delay(delay)
    .duration(500)
    .easing(Easing.bezier(0.25, 0.1, 0.25, 1))
    .withInitialValues({ opacity: 0, transform: [{ translateY: 14 }] });

/**
 * 응모완료 — the torn ticket, stamped, and what remains.
 *
 * Built from prototype block `1a` for layout, copy and flow and `2b` for colour,
 * type and corners, matching `app/(tabs)/index.tsx`. Figma `33:1830` is the
 * earlier frame.
 *
 * The halves are `TearStage` held at 1 with the stub reading USED — the same
 * object the user just tore, not a second drawing of it. The balance is the one
 * the server answered with the entry, so the note is whole on its first frame;
 * it is read back only when that answer carried none. The entry id itself is
 * not printed — it is the internal `{uid}_{raffleId}_{key}` idempotency key,
 * sixty-odd characters of noise to a person. Never computed here. 1a prints a
 * fixed draw date; the contract has none, so the line names the closing date,
 * which the Tickets checklist records.
 *
 * That line said 앱 알림으로 until 2026-08-27. It cannot: `PINDOM.entitlements`
 * is an empty dict, so the build has no push capability, and nothing in the
 * repo registers for notifications. It now says 가입 이메일로, matching
 * `/raffle/rules` — which became the operative rules of a **real** prize draw
 * on the same day, so a channel the app does not have is no longer a thing it
 * may promise. Deliberate divergence from 1a's copy; see
 * docs/plans/2026-08-27-apple-review-app-items.md.
 */
export default function RaffleDoneScreen() {
  const adaptive = useAdaptive();
  const { token } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const raffle = useTicketsStore((s) => s.raffle);
  const ticket = useTicketsStore((s) => s.tearing);
  const entry = useTicketsStore((s) => s.entry);
  const entryBalance = useTicketsStore((s) => s.entryBalance);
  const reset = useTicketsStore((s) => s.reset);
  const torn = useSharedValue(1);
  const [balance, setBalance] = useState<number | null>(entryBalance);

  // Only the focused screen may redirect: 자랑하기 resets the store while this
  // screen is still mounted beneath the tab it navigates to, and a plain
  // effect would answer that reset by replacing the destination with /tickets.
  useFocusEffect(
    useCallback(() => {
      if (entry == null) router.replace('/tickets' as never);
    }, [entry]),
  );

  useEffect(() => {
    if (entryBalance != null) return;
    let live = true;
    void userRepository.me().then((me) => {
      if (live && me.ok) setBalance(me.data.ticketBalance);
    });
    return () => {
      live = false;
    };
  }, [entryBalance]);

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
          {/* The slam and the rest angle live on different views — see `stampIn`. */}
          <Animated.View entering={stampIn} style={styles.stampWrap} pointerEvents="none">
            <View style={[styles.stamp, { borderColor: token.accent.fillColor }]}>
              <Txt typography="t6" fontWeight="bold" color={token.accent.fillColor} style={styles.stampText}>
                응모 완료
              </Txt>
            </View>
          </Animated.View>
        </View>

        <Animated.View entering={fadeUp(300)} style={styles.copy}>
          <Txt typography="t2" fontWeight="bold" color={adaptive.grey900} textAlign="center">
            응모가 확정됐어요
          </Txt>
          <Txt typography="t6" color={adaptive.grey600} textAlign="center">
            {balance != null ? `남은 티켓 ${balance}장\n` : ''}
            당첨 발표는 {formatDay(raffle.closesAt)}, 가입 이메일로 안내됩니다
          </Txt>
        </Animated.View>
      </View>

      <Animated.View entering={fadeUp(420)} style={styles.footer}>
        <Button size="big" type="primary" display="block" onPress={() => leave('/community')}>
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
    transform: [{ rotate: `${STAMP_TILT}deg` }],
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
