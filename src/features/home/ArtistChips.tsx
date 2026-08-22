import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { Artist } from '@/lib/domain';
import { Txt, useAdaptive, useTheme } from '@/design-system';
import { Shape } from '@/features/shared';

const CHIP = 56;

interface ArtistChipsProps {
  artists: Artist[];
  selectedId?: string;
  onSelect: (artistId: string) => void;
  onAdd: () => void;
}

/**
 * The 최애 row at the top of 홈.
 *
 * Structural rather than decorative: every section below is keyed to the
 * selection, so this is the screen's primary control. Chips are the one shape
 * 2b allows a radius on.
 *
 * The avatar is the artist's `initial`, not a photograph. The prototype uses
 * silhouette placeholders for people throughout and the fixtures name fictional
 * groups, so an initial is the honest fallback rather than a missing image.
 */
export function ArtistChips({ artists, selectedId, onSelect, onAdd }: ArtistChipsProps) {
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
            style={styles.item}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={artist.name}
          >
            <View
              style={[
                styles.chip,
                {
                  backgroundColor: adaptive.background,
                  borderColor: selected ? token.accent.fillColor : adaptive.grey200,
                },
              ]}
            >
              <Txt
                typography="t6"
                fontWeight="bold"
                color={selected ? token.accent.fillColor : adaptive.grey600}
              >
                {artist.initial}
              </Txt>
            </View>
            <Txt
              typography="t7"
              color={selected ? token.accent.fillColor : adaptive.grey500}
              numberOfLines={1}
            >
              {artist.name}
            </Txt>
          </Pressable>
        );
      })}

      <Pressable
        onPress={onAdd}
        style={styles.item}
        accessibilityRole="button"
        accessibilityLabel="최애 추가"
      >
        <View style={[styles.chip, styles.addChip, { borderColor: adaptive.grey300 }]}>
          <Txt typography="t5" color={adaptive.grey400}>
            +
          </Txt>
        </View>
        <Txt typography="t7" color={adaptive.grey500}>
          추가
        </Txt>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  track: {
    paddingHorizontal: Shape.gutter,
    gap: 14,
    paddingBottom: 4,
  },
  item: {
    alignItems: 'center',
    gap: 6,
    width: CHIP + 8,
  },
  chip: {
    width: CHIP,
    height: CHIP,
    borderRadius: Shape.chipRadius,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addChip: {
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
});
