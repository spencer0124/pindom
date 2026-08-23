import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { Artist } from '@/lib/domain';
import { timingConfig, Txt, useAdaptive, useTheme } from '@/design-system';
import { Shape } from '@/features/shared';

const CHIP = 56;
/** 1a's `outline: 3px solid; outline-offset: 2px` — the ring, and the gap it stands off by. */
const RING = 3;
const RING_GAP = 2;
/** 1a's `transition: outline-color .25s ease`. */
const SELECT_MS = 250;

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
 *
 * Selection is a 3px accent ring standing 2px off the chip, easing in over
 * 250 ms — a ring is weight, and weight is 1a's; the colour it takes is 2b's.
 */
export function ArtistChips({ artists, selectedId, onSelect, onAdd }: ArtistChipsProps) {
  const adaptive = useAdaptive();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.track}
    >
      {artists.map((artist) => (
        <ArtistChip
          key={artist.id}
          artist={artist}
          selected={artist.id === selectedId}
          onSelect={onSelect}
        />
      ))}

      <Pressable
        onPress={onAdd}
        style={styles.item}
        accessibilityRole="button"
        accessibilityLabel="최애 추가"
      >
        <View style={styles.ring}>
          <View style={[styles.chip, styles.addChip, { borderColor: adaptive.grey300 }]}>
            <Txt typography="t5" color={adaptive.grey400}>
              +
            </Txt>
          </View>
        </View>
        <Txt typography="t7" color={adaptive.grey500}>
          추가
        </Txt>
      </Pressable>
    </ScrollView>
  );
}

interface ArtistChipProps {
  artist: Artist;
  selected: boolean;
  onSelect: (artistId: string) => void;
}

function ArtistChip({ artist, selected, onSelect }: ArtistChipProps) {
  const adaptive = useAdaptive();
  const { token } = useTheme();

  // Seeded so a chip mounts in its state without playing the transition.
  const progress = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, timingConfig('out', SELECT_MS));
  }, [selected, progress]);

  // The ring is always drawn and only its colour moves — from the page ground,
  // where it is invisible, to the accent. That is what 1a's `outline-color`
  // transition does, and it keeps the row from shifting when a ring appears.
  const off = adaptive.greyBackground;
  const on = token.accent.fillColor;
  const ringStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(progress.value, [0, 1], [off, on]),
  }));

  return (
    <Pressable
      onPress={() => onSelect(artist.id)}
      style={styles.item}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={artist.name}
    >
      <Animated.View style={[styles.ring, ringStyle]}>
        <View
          style={[
            styles.chip,
            { backgroundColor: adaptive.background, borderColor: adaptive.grey200 },
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
      </Animated.View>
      <Txt
        typography="t7"
        color={selected ? token.accent.fillColor : adaptive.grey500}
        numberOfLines={1}
      >
        {artist.name}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    paddingHorizontal: Shape.gutter,
    // Chip to chip stays 14: the ring's room on either side is in the item.
    gap: 14 - (RING + RING_GAP) * 2,
    paddingBottom: 4,
  },
  item: {
    alignItems: 'center',
    gap: 6,
    width: CHIP + (RING + RING_GAP) * 2,
  },
  ring: {
    padding: RING_GAP,
    borderWidth: RING,
    borderColor: 'transparent',
    borderRadius: Shape.chipRadius + RING + RING_GAP,
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
