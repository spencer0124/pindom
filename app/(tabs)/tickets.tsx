import { CaretRightIcon } from 'phosphor-react-native';
import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ErrorPage, Loader, SdsSpacing, Txt, useAdaptive } from '@/design-system';
import { ASSISTANT_FAB_CLEARANCE } from '@/features/assistant';
import { TicketGrid, TierGauge, useCollection } from '@/features/tickets';
import { PindomMark, Rule, SectionHeader, Shape } from '@/features/shared';

/** Balance, reward progress, entry history and public holographic tickets. */
export default function TicketsScreen() {
  const adaptive = useAdaptive();
  const { state, reload } = useCollection();

  if (state.status === 'loading') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]} edges={['top']}>
        <Loader.Centered label="컬렉션을 불러오는 중" />
      </SafeAreaView>
    );
  }

  if (state.status === 'error') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]} edges={['top']}>
        <ErrorPage title="컬렉션을 불러오지 못했어요" subtitle={state.message} onPressRightButton={reload} />
      </SafeAreaView>
    );
  }

  const { user, tickets, nextRaffle } = state.data;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={reload} tintColor={adaptive.grey500} />
        }
      >
        <View style={styles.title}>
          <PindomMark size={30} color={adaptive.brand500} />
          <Txt typography="t2" fontWeight="bold" color={adaptive.grey900}>나의 티켓</Txt>
        </View>
        <View style={styles.header}>
          <View>
            <Txt typography="t7" color={adaptive.grey600}>
              보유 티켓
            </Txt>
            <Txt typography="t1" fontWeight="bold" color={adaptive.grey900}>
              {user.ticketBalance}장
            </Txt>
          </View>
          {nextRaffle != null && (
            <Button
              size="medium"
              onPress={() => router.push(`/raffle/${nextRaffle.id}` as never)}
            >
              응모하러 가기
            </Button>
          )}
        </View>

        <Rule />

        <TierGauge user={user} />

        <Rule />

        {/* 응모 뒤의 행방 — 내역 화면은 마이페이지에만 걸려 있어, 방금 응모한
            사람이 컬렉션으로 돌아와서는 기록을 찾을 수 없었다. */}
        <Pressable
          onPress={() => router.push('/raffle/history' as never)}
          accessibilityRole="button"
          style={styles.historyRow}
        >
          <Txt typography="t6" color={adaptive.grey900}>
            응모 내역 / 당첨 확인
          </Txt>
          <CaretRightIcon size={20} color={adaptive.grey500} />
        </Pressable>

        <Rule />

        <SectionHeader title="모아둔 순간" right={`${tickets.length}장의 기록`} />
        <TicketGrid tickets={tickets} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    // The last tile clears the assistant's button, as 홈's last course does.
    paddingBottom: ASSISTANT_FAB_CLEARANCE + SdsSpacing.base,
  },
  title: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: Shape.gutter, paddingTop: 16, paddingBottom: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
    paddingHorizontal: Shape.gutter,
    paddingTop: 8,
    paddingBottom: 14,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Shape.gutter,
    paddingVertical: 18,
    minHeight: 56,
    gap: 12,
  },
});
