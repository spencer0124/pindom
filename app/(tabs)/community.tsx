import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ErrorPage, Loader, Txt, useAdaptive } from '@/design-system';
import { BoardChips, BoardHeader, PostRow, useBoards, useFeed } from '@/features/community';
import { useDiscoveryStore } from '@/features/discovery';
import { Shape } from '@/features/shared';

/**
 * 커뮤니티 — per-최애 boards, one feed at a time.
 *
 * Built from prototype block `1a` for layout, copy and flow and `2b` for colour,
 * type and corners, matching `app/(tabs)/index.tsx`. Figma `33:1717` and
 * `33:2922` are the earlier frames; docs/reference/screens.md records that the
 * feed became per-artist after them.
 *
 * The board opens on the 최애 Discovery has selected and the chips switch it.
 * There is no 전체: the contract's feed takes a board id and has no global
 * query. The list pages on `cursor`, and re-reads silently on focus so a post
 * made on 글쓰기 is at the top when the user comes back.
 */
export default function CommunityScreen() {
  const adaptive = useAdaptive();
  const selectedArtistId = useDiscoveryStore((s) => s.selectedArtistId);
  const { boards } = useBoards();
  const [boardId, setBoardId] = useState<string | null>(selectedArtistId);
  const { state, reload, refresh, loadMore } = useFeed(boardId);

  // Follow Discovery's pick until the user taps a chip here; and never sit on
  // a board that is no longer followed.
  useEffect(() => {
    if (boards == null) return;
    const ids = boards.map((b) => b.id);
    if (boardId != null && ids.includes(boardId)) return;
    setBoardId(
      selectedArtistId != null && ids.includes(selectedArtistId) ? selectedArtistId : (ids[0] ?? null),
    );
  }, [boards, boardId, selectedArtistId]);

  const focused = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focused.current) void refresh();
      focused.current = true;
    }, [refresh]),
  );

  const board = boards?.find((b) => b.id === boardId) ?? null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]} edges={['top']}>
      <View style={styles.header}>
        <Txt typography="t3" fontWeight="bold" color={adaptive.grey900}>
          커뮤니티
        </Txt>
        <Button
          size="medium"
          disabled={boardId == null}
          onPress={() => router.push({ pathname: '/post/write', params: { boardId } } as never)}
        >
          글쓰기
        </Button>
      </View>

      {boards != null && boards.length > 0 && (
        <BoardChips boards={boards} selectedId={boardId} onSelect={setBoardId} />
      )}
      {board != null && <BoardHeader board={board} />}

      {state.status === 'loading' ? (
        <Loader.Centered label="피드를 불러오는 중" />
      ) : state.status === 'error' ? (
        <ErrorPage title="피드를 불러오지 못했어요" subtitle={state.message} onPressRightButton={reload} />
      ) : (
        <FlatList
          data={state.posts}
          keyExtractor={(post) => post.id}
          renderItem={({ item }) => (
            <PostRow post={item} now={state.loadedAt} onOpenPlace={(placeId) => router.push(`/place/${placeId}` as never)} />
          )}
          onEndReached={() => void loadMore()}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Txt typography="t6" color={adaptive.grey600} textAlign="center">
                {boardId == null ? '팔로우한 최애의 게시판이 여기 열려요' : '아직 글이 없어요'}
              </Txt>
            </View>
          }
          ListFooterComponent={
            state.loadingMore ? (
              <View style={styles.more}>
                <Loader.Centered label="" />
              </View>
            ) : null
          }
          contentContainerStyle={styles.list}
        />
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
    paddingTop: 8,
    paddingBottom: 12,
  },
  list: {
    paddingBottom: 24,
  },
  empty: {
    paddingVertical: 40,
    paddingHorizontal: Shape.gutter,
  },
  more: {
    height: 56,
  },
});
