import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Loader, Txt, useAdaptive } from '@/design-system';
import { raffleRepository } from '@/lib/repositories';
import type { Raffle, RaffleEntry } from '@/lib/domain';

export default function RaffleHistoryScreen() {
  const adaptive = useAdaptive();
  const [data, setData] = useState<{ entries: RaffleEntry[]; raffles: Raffle[] } | null>(null);
  useEffect(() => { void Promise.all([raffleRepository.listMine(), raffleRepository.list()]).then(([entries, raffles]) => setData({ entries: entries.ok ? entries.data : [], raffles: raffles.ok ? raffles.data : [] })); }, []);
  if (data == null) return <Loader.Centered label="응모 내역을 불러오는 중" />;
  const title = new Map(data.raffles.map((r) => [r.id, r.title]));
  return (
    <ScrollView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()}><Txt typography="t7" color={adaptive.grey600}>‹ 뒤로</Txt></Pressable>
      <Txt typography="t3" fontWeight="bold" color={adaptive.grey900}>응모 내역 / 당첨 확인</Txt>
      {data.entries.map((entry) => <View key={entry.id} style={[styles.row, { borderBottomColor: adaptive.grey200 }]}><Txt typography="t6" color={adaptive.grey900}>{title.get(entry.raffleId) ?? '응모'}</Txt><Txt typography="st13" color={adaptive.grey600}>{entry.ticketsSpent}장 사용 · 결과는 가입 이메일 안내</Txt></View>)}
      {data.entries.length === 0 && <Txt typography="t6" color={adaptive.grey600}>아직 응모한 내역이 없어요</Txt>}
    </ScrollView>
  );
}
const styles = StyleSheet.create({ safe: { flex: 1 }, content: { padding: 24, gap: 18 }, row: { gap: 6, paddingVertical: 14, borderBottomWidth: 1 } });
