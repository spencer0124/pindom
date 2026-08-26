import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  FONT_FAMILY,
  timingConfig,
  toFontWeightStyle,
  Txt,
  useAdaptive,
  useTheme,
  useTypographyTheme,
} from '@/design-system';
import type { Artist } from '@/lib/domain';
import { Shape } from '@/features/shared';

/** The prototype's `transition: background-color .3s ease, color .3s ease`. */
const SELECT_MS = 300;

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
 *
 * Selection cross-fades: 1a transitions the chip's fill and label colour over
 * 300 ms with CSS `ease`, which is the design system's `out` curve. The fill
 * and border ride `interpolateColor` on an `Animated.View`; the label is an
 * `Animated.Text` dressed from the same typography map `Txt` reads, because
 * `Txt` takes a fixed colour and cannot animate one.
 */
export function BoardChips({ boards, selectedId, onSelect }: BoardChipsProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {boards.map((board) => (
        <BoardChip key={board.id} board={board} on={board.id === selectedId} onSelect={onSelect} />
      ))}
    </ScrollView>
  );
}

interface BoardChipProps {
  board: Artist;
  on: boolean;
  onSelect: (artistId: string) => void;
}

function BoardChip({ board, on, onSelect }: BoardChipProps) {
  const adaptive = useAdaptive();
  const { token } = useTheme();
  const { typography } = useTypographyTheme();

  // 0 = unselected, 1 = selected. Seeded so a chip mounts in its state without
  // playing the transition.
  const progress = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    progress.value = withTiming(on ? 1 : 0, timingConfig('out', SELECT_MS));
  }, [on, progress]);

  const offFill = adaptive.greyBackground;
  const offBorder = adaptive.grey200;
  const offInk = adaptive.grey600;
  const onFill = token.accent.fillColor;
  const onInk = token.accent.onFillColor;

  const chipStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [offFill, onFill]),
    borderColor: interpolateColor(progress.value, [0, 1], [offBorder, onFill]),
  }));
  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [offInk, onInk]),
  }));

  return (
    <Pressable
      onPress={() => onSelect(board.id)}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
    >
      <Animated.View style={[styles.chip, chipStyle]}>
        <Animated.Text
          allowFontScaling={false}
          style={[styles.label, typography.st13, toFontWeightStyle('bold'), labelStyle]}
        >
          {board.name}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

interface BoardHeaderProps {
  board: Artist;
}

/**
 * `{최애} 게시판 · 촬영지 n곳` — the block under the chips.
 *
 * 1a's second line is 멤버 n. Nothing writes `artists.memberCount`: following
 * is a write to the *user's* `followedArtistIds`, and no function watches it,
 * so the header printed `0` for every board however many people followed it.
 * Keeping it honest needs a Firestore trigger on `users` — a new deployment
 * unit for a decorative number. `placeCount` is written by the seed, is
 * already printed as `{최애} n곳` on 홈, and tells a reader of a board
 * something they can act on. Decided 2026-08-26; the field is gone from
 * `Artist` rather than mapped and ignored.
 */
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
          촬영지 {board.placeCount.toLocaleString()}곳
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
  label: {
    fontFamily: FONT_FAMILY,
    includeFontPadding: false,
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
  // The same 최애 wears the same square on 홈's chip row (2b: radius is for
  // chips only).
  avatar: {
    width: 40,
    height: 40,
    borderRadius: Shape.chipRadius,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    gap: 3,
  },
});
