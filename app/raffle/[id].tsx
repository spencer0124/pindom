import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ErrorPage, Loader, Txt, useAdaptive, useTheme } from '@/design-system';
import { RewardList, useRaffles, useTicketsStore } from '@/features/tickets';
import { Shape } from '@/features/shared';

/**
 * 응모 — pick a reward, see what it costs, tear a ticket for it.
 *
 * Built from prototype block `1a` for layout, copy and flow and `2b` for colour,
 * type and corners, matching `app/(tabs)/index.tsx`. Figma `33:1871` is the
 * earlier frame.
 *
 * The route is keyed to a raffle id — 홈's 마감 임박 cards and 컬렉션's button
 * both arrive with one — and the screen lists every open raffle with that one
 * selected. Opening it mints the idempotency key for this entry; the key is
 * reused on every retry and is what stops a dropped response from debiting
 * twice. The balance check is the server's; the CTA only says what it will
 * say, and 잔여 티켓 충족's No edge is the server's `insufficient_tickets`.
 *
 * Both exits read 컬렉션, and both go there (fidelity decision 16): `navigate`
 * rather than `back`, because 홈's 마감 임박 cards open this screen too, and a
 * control that says 컬렉션 is a promise.
 */
export default function RaffleScreen() {
  const adaptive = useAdaptive();
  const { token } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, reload } = useRaffles();
  const begin = useTicketsStore((s) => s.begin);
  const [selectedId, setSelectedId] = useState<string | null>(id ?? null);

  const raffles = state.status === 'ready' ? state.data.raffles : [];
  const selected = raffles.find((r) => r.id === selectedId) ?? raffles[0] ?? null;

  // The first open raffle stands in when the id in the URL has closed since
  // the link was made.
  useEffect(() => {
    if (state.status === 'ready' && selected != null && selected.id !== selectedId) {
      setSelectedId(selected.id);
    }
  }, [state.status, selected, selectedId]);

  if (state.status === 'loading') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}>
        <Loader.Centered label="응모를 불러오는 중" />
      </SafeAreaView>
    );
  }

  if (state.status === 'error') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}>
        <ErrorPage title="응모를 불러오지 못했어요" subtitle={state.message} onPressRightButton={reload} />
      </SafeAreaView>
    );
  }

  const { user, oldestTicket, oldestPlace } = state.data;
  const canEnter = selected != null && user.ticketBalance >= selected.ticketCost;
  const toCollection = () => router.navigate('/(tabs)/tickets' as never);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}>
      <View style={styles.header}>
        <Pressable onPress={toCollection} accessibilityRole="button" style={styles.headerSide}>
          <Txt typography="t7" fontWeight="medium" color={adaptive.grey600}>
            ‹ 컬렉션
          </Txt>
        </Pressable>
        <Txt typography="t6" fontWeight="bold" color={adaptive.grey900}>
          응모
        </Txt>
        <Txt
          typography="t7"
          fontWeight="bold"
          color={token.accent.fillColor}
          style={[styles.headerSide, styles.headerRight]}
        >
          {user.ticketBalance}장
        </Txt>
      </View>

      <ScrollView style={styles.list}>
        {raffles.length > 0 ? (
          <RewardList
            raffles={raffles}
            balance={user.ticketBalance}
            selectedId={selected?.id ?? null}
            onSelect={setSelectedId}
          />
        ) : (
          <View style={styles.empty}>
            <Txt typography="t6" color={adaptive.grey600} textAlign="center">
              진행 중인 응모가 없어요
            </Txt>
          </View>
        )}
      </ScrollView>

      {selected != null && (
        <View style={[styles.footer, { borderTopColor: adaptive.grey200 }]}>
          <View style={styles.summary}>
            <Txt typography="t7" fontWeight="bold" color={adaptive.grey900}>
              {selected.title}
            </Txt>
            <Txt typography="st13" color={adaptive.grey600}>
              차감 티켓 {selected.ticketCost}장
            </Txt>
          </View>
          <Button
            size="big"
            type="primary"
            display="block"
            disabled={!canEnter}
            onPress={() => {
              begin(selected, oldestTicket, oldestPlace);
              router.push('/raffle/tear' as never);
            }}
          >
            {canEnter
              ? `티켓 뜯어서 응모하기 · ${selected.ticketCost}장`
              : `${selected.ticketCost}장을 모아야 응모할 수 있어요`}
          </Button>
          {/* App Store guideline 5.3.2: the official rules of a prize draw have
              to be presented inside the app. This is the point of decision —
              the user is about to spend tickets — so the link belongs beside
              the CTA rather than behind a menu. 마이페이지 carries the same
              link for anyone who has no tickets to reach this screen with. */}
          <Pressable
            onPress={() => router.push('/raffle/rules' as never)}
            accessibilityRole="button"
            style={styles.rules}
          >
            <Txt typography="st13" color={adaptive.grey500}>
              응모 공식 규정 보기
            </Txt>
          </Pressable>
          <Pressable onPress={toCollection} accessibilityRole="button" style={styles.cancel}>
            <Txt typography="t7" fontWeight="medium" color={adaptive.grey600}>
              취소하고 컬렉션으로
            </Txt>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Shape.gutter,
    paddingVertical: 10,
  },
  headerSide: {
    width: 64,
  },
  headerRight: {
    textAlign: 'right',
  },
  list: {
    flex: 1,
  },
  empty: {
    paddingVertical: 40,
  },
  footer: {
    borderTopWidth: Shape.sectionRule,
    paddingHorizontal: Shape.gutter,
    paddingTop: 14,
    gap: 12,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  rules: {
    alignSelf: 'center',
  },
  cancel: {
    alignSelf: 'center',
    paddingBottom: 8,
  },
});
