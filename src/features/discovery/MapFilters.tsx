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
  onSelect: (artistId: string | null) => void;
}

/** All artists or one contributor, shared with home. */
export function MapFilters({ artists, selectedId, onSelect }: MapFiltersProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.track}
    >
      <FilterChip
        artist={{ id: 'all', name: '전체', initial: '전체', placeCount: 0 }}
        selected={selectedId == null}
        onSelect={() => onSelect(null)}
      />
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
