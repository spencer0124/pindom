import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  timingConfig,
  toFontWeightStyle,
  useAdaptive,
  useTheme,
  useTypographyTheme,
} from '@/design-system';
import type { Artist } from '@/lib/domain';
import { Shape } from '@/features/shared';

/** 1a's `transition: background-color .3s ease, color .3s ease` on a filter chip. */
const SELECT_MS = 300;

interface MapFiltersProps {
  artists: Artist[];
  selectedId?: string;
  onSelect: (artistId: string) => void;
}

/**
 * The filter row over 지도 — the 최애 the user follows, one active at a time.
 *
 * `1a` filters this map by artist; the older Figma frame (`33:2460`) filters it
 * by 작품 종류 — 전체 / MV / 드라마 / 자체 콘텐츠. What a filter filters on is flow,
 * and flow is `1a`'s axis, so the artist wins. It is also the only reading that
 * agrees with 홈, which is keyed to one 최애 throughout.
 *
 * There is deliberately no 전체: the selection is shared with 홈 and 장소/상세,
 * and an "all artists" state has no meaning on either of those.
 *
 * Chips are the one shape `2b` allows a radius on, so these are the only
 * rounded things on the screen — 4px, not a pill. Selection cross-fades over
 * 300 ms as 1a's does; the label is an `Animated.Text` dressed from the same
 * typography map `Txt` reads, because `Txt` takes a fixed colour.
 */
export function MapFilters({ artists, selectedId, onSelect }: MapFiltersProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.track}
    >
      {artists.map((artist) => (
        <FilterChip
          key={artist.id}
          artist={artist}
          selected={artist.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </ScrollView>
  );
}

interface FilterChipProps {
  artist: Artist;
  selected: boolean;
  onSelect: (artistId: string) => void;
}

function FilterChip({ artist, selected, onSelect }: FilterChipProps) {
  const adaptive = useAdaptive();
  const { token } = useTheme();
  const { typography } = useTypographyTheme();

  // Seeded so a chip mounts in its state without playing the transition.
  const progress = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, timingConfig('out', SELECT_MS));
  }, [selected, progress]);

  const offFill = adaptive.background;
  const offBorder = adaptive.grey200;
  const offInk = adaptive.grey700;
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
      onPress={() => onSelect(artist.id)}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Animated.View style={[styles.chip, chipStyle]}>
        <Animated.Text
          allowFontScaling={false}
          style={[typography.t7, toFontWeightStyle('bold'), labelStyle]}
        >
          {artist.name}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    paddingHorizontal: Shape.gutter,
    gap: 6,
  },
  chip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: Shape.chipRadius,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
