import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ErrorPage, Loader, SdsSpacing, Txt, useAdaptive } from '@/design-system';
import { ASSISTANT_FAB_CLEARANCE } from '@/features/assistant';
import { BoardChips, BoardHeader, FREE_BOARD, PostRow, useBoards, useFeed } from '@/features/community';
import { Shape } from '@/features/shared';

/**
 * 커뮤니티 — per-최애 boards, one feed at a time.
 *
 * Built from prototype block `1a` for layout, copy and flow and `2b` for colour,
 * type and corners, matching `app/(tabs)/index.tsx`. Figma `33:1717` and
 * `33:2922` are the earlier frames; docs/reference/screens.md records that the
 * feed became per-artist after them.
 *
 * The chip row opens on 자유게시판 and the chips switch it. There is still no
 * 전체: the contract's feed takes a board id and has no global query, and
 * 자유게시판 is one more board id rather than a merge across boards — which is
 * why nothing below the screen had to change for it.
 *
 * Opening here rather than on the 최애 Discovery selected is deliberate, and it
 * retires that link: `boardId` starts on a board that is always present, so the
 * effect below returns before it can read Discovery. It buys a 커뮤니티 that is
 * never empty for someone who follows nobody yet. The community slice checklist
 * records the trade.
 *
 * The list pages on `cursor`, and the boards and the list both re-read silently
 * on focus, so a 최애 followed on 최애 찾기 has a chip and a post made on 글쓰기
 * is at the top when the user comes back.
 */
export default function CommunityScreen() {
  const adaptive = useAdaptive();
  const { boards, artists, reload: reloadBoards } = useBoards();
  const [boardId, setBoardId] = useState<string | null>(FREE_BOARD.id);
  const { state, reload, refresh, loadMore } = useFeed(boardId);

  // Never sit on a board that is no longer followed. 자유게시판 is always in
  // `ids` and always first, so unfollowing the current 최애 lands there rather
  // than on an empty screen.
  useEffect(() => {
    if (boards == null) return;
    const ids = boards.map((b) => b.id);
    if (boardId != null && ids.includes(boardId)) return;
    setBoardId(ids[0] ?? null);
  }, [boards, boardId]);

  // Re-read silently on every return to the tab, not on the first focus —
  // 최애 찾기 changes the boards and 글쓰기 changes the feed, and both must be
  // current when this tab is shown again. Same shape as 홈's focus effect.
  const focused = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focused.current) {
        void reloadBoards();
        void refresh();
      }
      focused.current = true;
    }, [reloadBoards, refresh]),
  );

  // Looked up in `artists`, not `boards`: 자유게시판 is not a 최애, so this is
  // null there and the `{최애} 게시판` block below disappears — as 1a's does on 전체.
  const board = artists?.find((a) => a.id === boardId) ?? null;

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
            <PostRow post={item} now={state.loadedAt} onOpenPlace={(placeId) => router.push(`/place/${placeId}` as never)} onOpenAuthor={(userId) => router.push(`/profile/${userId}` as never)} />
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
    paddingBottom: ASSISTANT_FAB_CLEARANCE + SdsSpacing.base,
  },
  empty: {
    paddingVertical: 40,
    paddingHorizontal: Shape.gutter,
  },
  more: {
    height: 56,
  },
});
