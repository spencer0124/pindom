import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorPage, Loader, Txt, useAdaptive } from '@/design-system';
import { PostRow } from '@/features/community';
import { failureMessage } from '@/lib/api/failure-message';
import { postRepository } from '@/lib/repositories';
import type { Post } from '@/lib/domain';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; posts: Post[] };

export default function MyPostsScreen() {
  const adaptive = useAdaptive();
  const [state, setState] = useState<State>({ status: 'loading' });
  const load = useCallback(async () => {
    setState({ status: 'loading' });
    const result = await postRepository.listMine();
    setState(result.ok ? { status: 'ready', posts: result.data } : { status: 'error', message: failureMessage(result.failure) });
  }, []);
  useEffect(() => { void load(); }, [load]);
  if (state.status === 'loading') return <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}><Loader.Centered label="내 글을 불러오는 중" /></SafeAreaView>;
  if (state.status === 'error') return <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}><ErrorPage title="내 글을 불러오지 못했어요" subtitle={state.message} onPressRightButton={load} rightButtonLabel="다시 시도" /></SafeAreaView>;
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}>
      <Pressable style={styles.back} onPress={() => router.back()}><Txt typography="t7" color={adaptive.grey600}>‹ 뒤로</Txt></Pressable>
      <Txt typography="t3" fontWeight="bold" color={adaptive.grey900} style={styles.title}>내 커뮤니티 글</Txt>
      <FlatList data={state.posts} keyExtractor={(p) => p.id} renderItem={({ item }) => <PostRow post={item} now={new Date()} onOpenPlace={(id) => router.push(`/place/${id}` as never)} onOpenAuthor={(id) => router.push(`/profile/${id}` as never)} />} ListEmptyComponent={<Txt typography="t6" color={adaptive.grey600} style={styles.empty}>작성한 글이 없어요</Txt>} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1 }, back: { padding: 24, paddingBottom: 8 }, title: { paddingHorizontal: 24, paddingBottom: 12 }, empty: { padding: 24 } });
