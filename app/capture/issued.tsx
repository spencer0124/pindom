import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeInDown, Keyframe } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ErrorPage, Loader, Txt, useAdaptive } from '@/design-system';
import { useCaptureStore, useIssuedTicket } from '@/features/capture';
import { HoloTilt, Shape, TicketCard, tierNote, workKindLabel } from '@/features/shared';

/** 1a's `dropIn .7s cubic-bezier(.2,.9,.3,1)`: from −90px and −6°, overshooting in. */
const dropIn = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: -90 }, { rotate: '-6deg' }] },
  100: {
    opacity: 1,
    transform: [{ translateY: 0 }, { rotate: '0deg' }],
    easing: Easing.bezier(0.2, 0.9, 0.3, 1),
  },
}).duration(700);

/** 1a's `fadeUp .5s` on the title block and the buttons: 14px up, CSS `ease`. */
const fadeUp = (delay: number) =>
  FadeInDown.delay(delay)
    .duration(500)
    .easing(Easing.bezier(0.25, 0.1, 0.25, 1))
    .withInitialValues({ opacity: 0, transform: [{ translateY: 14 }] });

/**
 * 티켓 발행 — the ticket, dropped in.
 *
 * Built from prototype block `1a` for layout, copy and flow, `1c`-A for the
 * ticket's layout, and `2b` for colour, type and corners, matching
 * `app/(tabs)/index.tsx`. Figma `33:2072` is the earlier frame.
 *
 * The card is `TicketCard`, shared with 컬렉션 and 티켓 절취. Motion is `1a`'s:
 * the card drops in with a twist, then tilts under a held finger through
 * `HoloTilt` — the hold is interaction, kept; the rainbow it came with is
 * colour, `2b`'s, and gone (fidelity decision 2). Both buttons clear the
 * Capture store: the grant was consumed by the mint, and the photo is now the
 * ticket's.
 */
export default function IssuedScreen() {
  const adaptive = useAdaptive();
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const { state, reload } = useIssuedTicket(ticketId);
  const place = useCaptureStore((s) => s.place);
  const reset = useCaptureStore((s) => s.reset);

  // `navigate` rather than push: the tabs are already in the stack, so this
  // pops the whole Capture chain and switches the tab in one move. The chain's
  // own screens guard against an empty store with a focus effect, not a plain
  // one — `reset()` here used to fire their redirect to 지도 from beneath this
  // screen and win the race against the switch.
  const leave = (to: '/(tabs)/tickets' | '/(tabs)/map') => {
    reset();
    router.navigate(to as never);
  };

  if (state.status === 'loading') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}>
        <Loader.Centered label="티켓을 발행하는 중" />
      </SafeAreaView>
    );
  }

  if (state.status === 'error') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}>
        <ErrorPage title="티켓을 불러오지 못했어요" subtitle={state.message} onPressRightButton={reload} />
      </SafeAreaView>
    );
  }

  const { ticket, user } = state;
  // The region and the kind of work are the place's, not the ticket's. They
  // are on the card when the chain that minted it is still in memory, and
  // left off on a cold deep link rather than fetched for a caption.
  const subtitle =
    place != null && place.id === ticket.placeId
      ? `${place.region} · ${workKindLabel[place.workKind]}`
      : undefined;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}>
      <View style={styles.body}>
        <Animated.View entering={dropIn} style={styles.card}>
          <HoloTilt>
            <TicketCard
              placeName={ticket.placeName}
              subtitle={subtitle}
              serial={ticket.serial}
              issuedAt={ticket.issuedAt}
            />
          </HoloTilt>
        </Animated.View>

        <Animated.View entering={fadeUp(350)} style={styles.copy}>
          <Txt typography="t2" fontWeight="bold" color={adaptive.grey900} textAlign="center">
            티켓이 발행됐어요
          </Txt>
          <Txt typography="t6" color={adaptive.grey600} textAlign="center">
            보유 {user.ticketBalance}장 · 지도의 핀이 유색으로 바뀝니다{'\n'}
            {tierNote(user.ticketBalance)}
          </Txt>
        </Animated.View>
      </View>

      <Animated.View entering={fadeUp(450)} style={styles.footer}>
        <Button size="large" type="primary" display="block" onPress={() => leave('/(tabs)/tickets')}>
          컬렉션에서 보기
        </Button>
        <Button size="large" style="weak" display="block" onPress={() => leave('/(tabs)/map')}>
          다음 촬영지 찾기
        </Button>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingHorizontal: Shape.gutter,
    // The card drops in from above the fold, as in 1a's clipped root.
    overflow: 'hidden',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: 22,
  },
  card: {
    alignSelf: 'stretch',
  },
  copy: {
    gap: 8,
  },
  footer: {
    gap: 8,
    paddingBottom: 8,
  },
});
