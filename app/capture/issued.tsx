import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ErrorPage, Loader, Txt, useAdaptive } from '@/design-system';
import { useCaptureStore, useIssuedTicket } from '@/features/capture';
import { Shape, TicketCard, workKindLabel } from '@/features/shared';

/** The next reward threshold, as 홈 prints it — 20장이면 팬사인회·굿즈가 열려요. */
const REWARD_AT = 20;

/**
 * 티켓 발행 — the ticket, dropped in.
 *
 * Built from prototype block `1a` for layout, copy and flow, `1c`-A for the
 * ticket's layout, and `2b` for colour, type and corners, matching
 * `app/(tabs)/index.tsx`. Figma `33:2072` is the earlier frame.
 *
 * The card is `TicketCard`, shared with 컬렉션 and 티켓 절취. The drop-in is
 * kept — motion is `1a`'s axis — and the hologram and its tilt are not, colour
 * being `2b`'s. Both buttons clear the Capture store: the grant was consumed by
 * the mint, and the photo is now the ticket's.
 */
export default function IssuedScreen() {
  const adaptive = useAdaptive();
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const { state, reload } = useIssuedTicket(ticketId);
  const place = useCaptureStore((s) => s.place);
  const reset = useCaptureStore((s) => s.reset);

  // `navigate` rather than push: the tabs are already in the stack, so this
  // pops the whole Capture chain and switches the tab in one move. A
  // `dismissAll()` first swallows the switch and lands on whichever tab
  // 장소/상세 was opened from.
  const leave = (to: '/tickets' | '/map') => {
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
        <Animated.View entering={FadeInDown.duration(700)} style={styles.card}>
          <TicketCard
            placeName={ticket.placeName}
            subtitle={subtitle}
            serial={ticket.serial}
            issuedAt={ticket.issuedAt}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(350).duration(500)} style={styles.copy}>
          <Txt typography="t2" fontWeight="bold" color={adaptive.grey900} textAlign="center">
            티켓이 발행됐어요
          </Txt>
          <Txt typography="t6" color={adaptive.grey600} textAlign="center">
            보유 {user.ticketBalance}장 · 지도의 핀이 유색으로 바뀝니다{'\n'}
            {user.ticketBalance < REWARD_AT
              ? `${REWARD_AT}장이면 팬사인회·굿즈가 열려요`
              : '팬사인회·굿즈까지 모두 열렸어요'}
          </Txt>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInUp.delay(450).duration(500)} style={styles.footer}>
        <Button size="large" type="primary" display="block" onPress={() => leave('/tickets')}>
          컬렉션에서 보기
        </Button>
        <Button size="large" style="weak" display="block" onPress={() => leave('/map')}>
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
