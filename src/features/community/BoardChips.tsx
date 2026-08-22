import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Txt, useAdaptive, useTheme } from '@/design-system';
import type { Artist } from '@/lib/domain';
import { Shape } from '@/features/shared';

interface BoardChipsProps {
  boards: Artist[];
  selectedId: string | null;
  onSelect: (artistId: string) => void;
}

/**
 * The board chips — one per followed 최애, no 전체.
 *
 * 1a puts 전체 first. The contract's feed takes a board id and has no global
 * query, so a 전체 chip would have to fan out across boards and merge by
 * time on the client; it is left off rather than faked.
 */
export function BoardChips({ boards, selectedId, onSelect }: BoardChipsProps) {
  const adaptive = useAdaptive();
  const { token } = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {boards.map((board) => {
        const on = board.id === selectedId;
        return (
          <Pressable
            key={board.id}
            onPress={() => onSelect(board.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[
              styles.chip,
              on
                ? { backgroundColor: token.accent.fillColor, borderColor: token.accent.fillColor }
                : { backgroundColor: 'transparent', borderColor: adaptive.grey200 },
            ]}
          >
            <Txt typography="st13" fontWeight="bold" color={on ? token.accent.onFillColor : adaptive.grey600}>
              {board.name}
            </Txt>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

interface BoardHeaderProps {
  board: Artist;
}

/** `{최애} 게시판 · 멤버 n` — the block under the chips. */
export function BoardHeader({ board }: BoardHeaderProps) {
  const adaptive = useAdaptive();
  const { token } = useTheme();

  return (
    <View style={[styles.header, { borderColor: adaptive.grey200 }]}>
      <View style={[styles.avatar, { borderColor: token.accent.fillColor }]}>
        <Txt typography="t7" fontWeight="bold" color={token.accent.fillColor}>
          {board.initial}
        </Txt>
      </View>
      <View style={styles.headerCopy}>
        <Txt typography="t7" fontWeight="bold" color={adaptive.grey900}>
          {board.name} 게시판
        </Txt>
        <Txt typography="st13" color={adaptive.grey600}>
          멤버 {board.memberCount.toLocaleString()}
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: Shape.gutter,
    gap: 7,
    paddingBottom: 12,
  },
  chip: {
    height: 34,
    paddingHorizontal: 13,
    borderRadius: Shape.chipRadius,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginHorizontal: Shape.gutter,
    marginBottom: 12,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    gap: 3,
  },
});
