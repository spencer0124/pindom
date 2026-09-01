import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ErrorPage, Loader, Txt, useAdaptive } from '@/design-system';
import { userRepository } from '@/lib/repositories';
import type { PublicProfile } from '@/lib/domain';
import { tierLabel } from '@/features/shared';

export default function PublicProfileScreen() {
  const adaptive = useAdaptive();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [state, setState] = useState<{ loading: boolean; profile?: PublicProfile; error?: string }>({ loading: true });

  useEffect(() => {
    if (!id) return;
    void userRepository.getPublicProfile(id).then((result) =>
      setState(result.ok ? { loading: false, profile: result.data } : { loading: false, error: '공개 프로필이 아니에요.' }),
    );
  }, [id]);

  if (state.loading) return <Loader.Centered label="프로필을 불러오는 중" />;
  if (!state.profile) return <ErrorPage title="프로필을 볼 수 없어요" subtitle={state.error} onPressRightButton={() => router.back()} />;
  const { profile } = state;
  return (
    <ScrollView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()}><Txt typography="t7" color={adaptive.grey600}>‹ 뒤로</Txt></Pressable>
      <View style={styles.head}>
        <View style={[styles.avatar, { backgroundColor: adaptive.background, borderColor: adaptive.grey200 }]}>
          {profile.avatarUrl ? <Image source={{ uri: profile.avatarUrl }} style={StyleSheet.absoluteFill} /> : <Txt typography="t1" fontWeight="bold" color={adaptive.grey600}>{profile.nickname.slice(0, 1)}</Txt>}
        </View>
        <Txt typography="t3" fontWeight="bold" color={adaptive.grey900}>{profile.nickname}</Txt>
        <Txt typography="st13" color={adaptive.grey500}>{tierLabel[profile.tier]}</Txt>
      </View>
      {profile.bio ? <Txt typography="t6" color={adaptive.grey700} style={styles.bio}>{profile.bio}</Txt> : null}
      <View style={styles.stats}>
        <Txt typography="st13" color={adaptive.grey600}>방문 인증 {profile.ticketsIssued}</Txt>
        <Txt typography="st13" color={adaptive.grey600}>방문 지역 {profile.placesVisited}곳</Txt>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 24, gap: 18 },
  head: { alignItems: 'center', gap: 6 },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  bio: { textAlign: 'center' },
  stats: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 18 },
});
