import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorPage, Loader, Txt, useAdaptive } from '@/design-system';
import { failureMessage } from '@/lib/api/failure-message';
import { ticketRepository, userRepository } from '@/lib/repositories';
import type { PublicProfile } from '@/lib/domain';
import { useSession } from '@/features/auth';
import { Shape, tierLabel } from '@/features/shared';

/**
 * One cut, flattened out of whichever source this view had.
 *
 * A stranger's cuts come from the profile callable's `tickets` projection, the
 * user's own from `listMine` + `listVault`, and the two shapes agree on
 * everything the screen draws. `isPrivate` is the one thing only the owner can
 * ever see: the projection carries public tickets only.
 */
interface Cut {
  key: string;
  placeId: string;
  placeName: string;
  photoUrl: string;
  issuedAt: Date;
  isPrivate: boolean;
}

/** 인증 촬영지 — one row per place, however many cuts were shot there. */
function distinctPlaces(cuts: Cut[]): { placeId: string; placeName: string }[] {
  const seen = new Map<string, string>();
  for (const cut of cuts) if (!seen.has(cut.placeId)) seen.set(cut.placeId, cut.placeName);
  return [...seen].map(([placeId, placeName]) => ({ placeId, placeName }));
}

export default function PublicProfileScreen() {
  const adaptive = useAdaptive();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state: sessionState } = useSession();
  const isSelf = sessionState.status === 'ready' && sessionState.session?.userId === id;
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'error'; message: string; retryable: boolean }
    | { status: 'ready'; profile: PublicProfile; cuts: Cut[] }
  >({ status: 'loading' });

  const load = useCallback(async () => {
    if (!id) {
      setState({ status: 'error', message: '프로필을 찾을 수 없어요.', retryable: false });
      return;
    }
    // Who is looking decides which query the cuts come from, so the screen
    // waits for the session rather than loading twice.
    if (sessionState.status !== 'ready') return;
    setState({ status: 'loading' });
    const result = await userRepository.getPublicProfile(id);
    if (!result.ok) {
      const privateProfile =
        result.failure.type === 'firebase' && result.failure.code === 'permission-denied';
      setState({
        status: 'error',
        message: privateProfile ? '공개 프로필이 아니에요.' : failureMessage(result.failure),
        retryable: !privateProfile,
      });
      return;
    }
    const profile = result.data;
    if (!isSelf) {
      const cuts = profile.tickets.map((t) => ({
        key: t.ticketId,
        placeId: t.placeId,
        placeName: t.placeName,
        photoUrl: t.photoUrl,
        issuedAt: t.issuedAt,
        isPrivate: false,
      }));
      setState({ status: 'ready', profile, cuts });
      return;
    }
    // 자기 프로필이면 보관함과 같은 병합 — 공개 컷만 담은 투영 대신 비공개 컷까지
    // 한 줄의 필름으로 본다. 티켓을 못 읽어도 프로필 자체는 보여준다.
    const [mine, vault] = await Promise.all([
      ticketRepository.listMine(),
      ticketRepository.listVault(),
    ]);
    const owned = [...(mine.ok ? mine.data : []), ...(vault.ok ? vault.data : [])]
      .sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime())
      .map((t) => ({
        key: t.id,
        placeId: t.placeId,
        placeName: t.placeName,
        photoUrl: t.photoUrl,
        issuedAt: t.issuedAt,
        isPrivate: t.visibility === 'private',
      }));
    setState({ status: 'ready', profile, cuts: owned });
  }, [id, isSelf, sessionState.status]);

  useEffect(() => { void load(); }, [load]);

  if (state.status === 'loading') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}>
        <Loader.Centered label="프로필을 불러오는 중" />
      </SafeAreaView>
    );
  }
  if (state.status === 'error') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}>
        <ErrorPage
          title="프로필을 볼 수 없어요"
          subtitle={state.message}
          onPressRightButton={state.retryable ? load : router.back}
          rightButtonLabel={state.retryable ? '다시 시도' : '돌아가기'}
        />
      </SafeAreaView>
    );
  }
  const { profile, cuts } = state;
  const places = distinctPlaces(cuts);
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}>
      <ScrollView contentContainerStyle={styles.content}>
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

        {places.length > 0 ? (
          <View style={styles.section}>
            <Txt typography="t6" fontWeight="bold" color={adaptive.grey900}>인증 촬영지</Txt>
            <View style={styles.chips}>
              {places.map((place) => (
                <Pressable
                  key={place.placeId}
                  accessibilityRole="button"
                  onPress={() => router.push(`/place/${place.placeId}`)}
                  style={[styles.chip, { backgroundColor: adaptive.background, borderColor: adaptive.grey200 }]}
                >
                  <Txt typography="st13" color={adaptive.grey800}>{place.placeName}</Txt>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Txt typography="t6" fontWeight="bold" color={adaptive.grey900}>{isSelf ? '사진' : '공개 사진'}</Txt>
          {cuts.length === 0 ? (
            <Txt typography="st13" color={adaptive.grey500}>
              {isSelf ? '아직 촬영한 컷이 없어요' : '아직 공개한 컷이 없어요'}
            </Txt>
          ) : (
            <View style={styles.grid}>
              {cuts.map((cut) => (
                <View key={cut.key} style={[styles.tile, { backgroundColor: adaptive.background, borderColor: adaptive.grey200 }]}>
                  <Image source={{ uri: cut.photoUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  {cut.isPrivate ? (
                    <View style={[styles.badge, { backgroundColor: adaptive.background }]}>
                      <Txt typography="st13" fontWeight="semiBold" color={adaptive.grey900}>비공개</Txt>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 24, gap: 18 },
  head: { alignItems: 'center', gap: 6 },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  bio: { textAlign: 'center' },
  stats: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 18 },
  section: { gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderWidth: Shape.rowRule, borderRadius: Shape.chipRadius },
  // Three across with the 6px gaps between; a short last row keeps its tiles' width.
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tile: { width: '31.7%', aspectRatio: 1, borderWidth: Shape.rowRule, overflow: 'hidden' },
  badge: { position: 'absolute', left: 6, top: 6, paddingHorizontal: 6, paddingVertical: 3, borderRadius: Shape.chipRadius, opacity: 0.94 },
});
