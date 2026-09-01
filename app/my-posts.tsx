import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Loader, Txt, useAdaptive } from '@/design-system';
import { PostRow } from '@/features/community';
import { postRepository } from '@/lib/repositories';
import type { Post } from '@/lib/domain';

export default function MyPostsScreen() {
  const adaptive = useAdaptive();
  const [posts, setPosts] = useState<Post[] | null>(null);
  useEffect(() => { void postRepository.listMine().then((result) => setPosts(result.ok ? result.data : [])); }, []);
  if (posts == null) return <Loader.Centered label="내 글을 불러오는 중" />;
  return (
    <View style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}>
      <Pressable style={styles.back} onPress={() => router.back()}><Txt typography="t7" color={adaptive.grey600}>‹ 뒤로</Txt></Pressable>
      <Txt typography="t3" fontWeight="bold" color={adaptive.grey900} style={styles.title}>내 커뮤니티 글</Txt>
      <FlatList data={posts} keyExtractor={(p) => p.id} renderItem={({ item }) => <PostRow post={item} now={new Date()} onOpenPlace={(id) => router.push(`/place/${id}` as never)} onOpenAuthor={(id) => router.push(`/profile/${id}` as never)} />} ListEmptyComponent={<Txt typography="t6" color={adaptive.grey600} style={styles.empty}>작성한 글이 없어요</Txt>} />
    </View>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1 }, back: { padding: 24, paddingBottom: 8 }, title: { paddingHorizontal: 24, paddingBottom: 12 }, empty: { padding: 24 } });
