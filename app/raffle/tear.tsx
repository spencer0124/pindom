import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Txt, useAdaptive, useTheme } from '@/design-system';
import { TEAR_SWING, TearStage, useEnterRaffle, useTicketsStore } from '@/features/tickets';
import { Shape } from '@/features/shared';

/** Past this, lifting the finger finishes the tear instead of letting it heal. */
const COMMIT_AT = 0.82;

type Phase = 'start' | 'mid' | 'near';

/**
 * 티켓 절취 — tear the ticket along the perforation to confirm the entry.
 *
 * Built from prototype block `1a` for layout, copy and flow and `2b` for colour,
 * type and corners, matching `app/(tabs)/index.tsx`. There is no Figma frame;
 * the screen is the 반권 mechanic `1c`-C added.
 *
 * The drag is the whole screen, as in 1a. Progress is the drag's distance over
 * the card's height; releasing before 82% heals the ticket, releasing after
 * finishes it, and 한 번에 뜯기 skips the drag. The server is asked once, at
 * the end, with the key 응모 minted — the tear is client-side only.
 */
export default function TearScreen() {
  const adaptive = useAdaptive();
  const { token } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const raffle = useTicketsStore((s) => s.raffle);
  const ticket = useTicketsStore((s) => s.tearing);
  const { busy, enter } = useEnterRaffle();

  const progress = useSharedValue(0);
  const [phase, setPhase] = useState<Phase>('start');
  const [message, setMessage] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    if (raffle == null) router.replace('/tickets' as never);
  }, [raffle]);

  const cardWidth = screenWidth - Shape.gutter * 2 - TEAR_SWING * 2;
  const travel = cardWidth / (300 / 168);

  const finish = useCallback(async () => {
    if (finishing) return;
    setFinishing(true);
    const outcome = await enter();
    if (outcome.kind === 'entered') {
      router.replace('/raffle/done' as never);
      return;
    }
    // 잔여 티켓 충족's No edge goes back to 컬렉션, per the flowchart. The
    // ticket heals so the screen is honest about what happened.
    progress.value = withSpring(0);
    setFinishing(false);
    if (outcome.kind === 'insufficient') {
      router.navigate('/tickets' as never);
    } else {
      setMessage(outcome.message);
    }
  }, [finishing, enter, progress]);

  const commit = useCallback(() => {
    progress.value = withTiming(1, { duration: 420 }, (done) => {
      if (done) runOnJS(finish)();
    });
  }, [progress, finish]);

  const pan = Gesture.Pan()
    .enabled(!finishing)
    .onUpdate((e) => {
      progress.value = Math.max(0, Math.min(1, e.translationY / travel));
    })
    .onEnd(() => {
      if (progress.value >= COMMIT_AT) {
        runOnJS(commit)();
      } else {
        progress.value = withSpring(0);
      }
    });

  // The title and hint change at 1a's thresholds; mirror only the phase into
  // React state, not every frame of the drag.
  useAnimatedReaction(
    () => (progress.value === 0 ? 'start' : progress.value >= COMMIT_AT ? 'near' : 'mid'),
    (next, prev) => {
      if (next !== prev) runOnJS(setPhase)(next);
    },
  );

  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  if (raffle == null || ticket == null) {
    // No unspent ticket to tear means the balance was zero — 응모 would have
    // said so. A cold arrival here has nothing to show.
    return null;
  }

  const title =
    phase === 'start' ? '절취선을 따라 뜯어주세요' : phase === 'near' ? '거의 다 뜯겼어요' : '그대로 계속 내려주세요';
  const hint =
    phase === 'start'
      ? '반짝이는 절취선을 누른 채 아래로 끌어내리면 티켓이 갈라집니다'
      : phase === 'near'
        ? '손을 떼면 응모가 확정됩니다'
        : '중간에 놓으면 티켓이 원래대로 붙습니다';

  return (
    <GestureDetector gesture={pan}>
      <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" disabled={finishing}>
            <Txt typography="t7" fontWeight="medium" color={adaptive.grey600}>
              ‹ 응모
            </Txt>
          </Pressable>
          <Txt typography="st13" fontWeight="medium" color={adaptive.grey600}>
            {raffle.title}
          </Txt>
        </View>

        <View style={styles.stage}>
          <TearStage ticket={ticket} progress={progress} width={cardWidth} />
        </View>

        <View style={styles.footer}>
          <View style={styles.copy}>
            <Txt typography="t3" fontWeight="bold" color={adaptive.grey900} textAlign="center">
              {title}
            </Txt>
            <Txt typography="t7" color={adaptive.grey600} textAlign="center">
              {message ?? hint}
            </Txt>
          </View>
          <View style={[styles.track, { backgroundColor: adaptive.grey200 }]}>
            <Animated.View style={[styles.fill, { backgroundColor: token.accent.fillColor }, barStyle]} />
          </View>
          <Button size="large" style="weak" display="block" loading={busy} disabled={finishing} onPress={commit}>
            한 번에 뜯기
          </Button>
        </View>
      </SafeAreaView>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingHorizontal: Shape.gutter,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    gap: 14,
    paddingBottom: 8,
  },
  copy: {
    gap: 7,
  },
  track: {
    height: 5,
  },
  fill: {
    height: 5,
  },
});
