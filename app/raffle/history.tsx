import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorPage, Loader, Txt, useAdaptive } from '@/design-system';
import { failureMessage } from '@/lib/api/failure-message';
import { raffleRepository } from '@/lib/repositories';
import type { Raffle, RaffleEntry } from '@/lib/domain';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; entries: RaffleEntry[]; raffles: Raffle[] };

export default function RaffleHistoryScreen() {
  const adaptive = useAdaptive();
  const [state, setState] = useState<State>({ status: 'loading' });
  const load = useCallback(async () => {
    setState({ status: 'loading' });
    const [entries, raffles] = await Promise.all([raffleRepository.listMine(), raffleRepository.list()]);
    if (!entries.ok) return setState({ status: 'error', message: failureMessage(entries.failure) });
    if (!raffles.ok) return setState({ status: 'error', message: failureMessage(raffles.failure) });
    setState({ status: 'ready', entries: entries.data, raffles: raffles.data });
  }, []);
  useEffect(() => { void load(); }, [load]);
  if (state.status === 'loading') return <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}><Loader.Centered label="응모 내역을 불러오는 중" /></SafeAreaView>;
  if (state.status === 'error') return <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}><ErrorPage title="응모 내역을 불러오지 못했어요" subtitle={state.message} onPressRightButton={load} rightButtonLabel="다시 시도" /></SafeAreaView>;
  const title = new Map(state.raffles.map((r) => [r.id, r.title]));
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}>
      <ScrollView contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()}><Txt typography="t7" color={adaptive.grey600}>‹ 뒤로</Txt></Pressable>
      <Txt typography="t3" fontWeight="bold" color={adaptive.grey900}>응모 내역 / 당첨 확인</Txt>
      {state.entries.map((entry) => <View key={entry.id} style={[styles.row, { borderBottomColor: adaptive.grey200 }]}><Txt typography="t6" color={adaptive.grey900}>{title.get(entry.raffleId) ?? '응모'}</Txt><Txt typography="st13" color={adaptive.grey600}>{entry.ticketsSpent}장 사용 · 결과는 가입 이메일 안내</Txt></View>)}
      {state.entries.length === 0 && <Txt typography="t6" color={adaptive.grey600}>아직 응모한 내역이 없어요</Txt>}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({ safe: { flex: 1 }, content: { padding: 24, gap: 18 }, row: { gap: 6, paddingVertical: 14, borderBottomWidth: 1 } });
