import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { Txt, useAdaptive, useTheme } from '@/design-system';
import type { Artist } from '@/lib/domain';
import { Shape } from '@/features/shared';

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
 * rounded things on the screen — 4px, not a pill.
 */
export function MapFilters({ artists, selectedId, onSelect }: MapFiltersProps) {
  const adaptive = useAdaptive();
  const { token } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.track}
    >
      {artists.map((artist) => {
        const selected = artist.id === selectedId;
        return (
          <Pressable
            key={artist.id}
            onPress={() => onSelect(artist.id)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? token.accent.fillColor : adaptive.background,
                borderColor: selected ? token.accent.fillColor : adaptive.grey200,
              },
            ]}
          >
            <Txt
              typography="t7"
              fontWeight="bold"
              color={selected ? token.accent.onFillColor : adaptive.grey700}
            >
              {artist.name}
            </Txt>
          </Pressable>
        );
      })}
    </ScrollView>
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
