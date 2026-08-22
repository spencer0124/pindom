import { Image, StyleSheet, View } from 'react-native';
import { useAdaptive } from '@/design-system';
import type { GalleryPhoto } from '@/lib/domain';
import { Shape } from '@/features/shared';

const COLUMNS = 3;

interface PlaceGalleryProps {
  photos: GalleryPhoto[];
}

/**
 * 공개 사진 갤러리 — the public ticket photos taken at this place.
 *
 * Every entry here was written by `issueTicket`, never by a client, so a photo
 * cannot exist without a verified ticket behind it. That is what the block is
 * for: a wall of proven presence rather than an upload feed.
 *
 * `1a` wraps this in a `placeVisited` gate, but the flag is hardcoded true in
 * the prototype so the gate is never exercised, and the backend contract puts no
 * viewer condition on the collection. It renders whenever there are photos and
 * disappears when there are none.
 *
 * The cells are butted together and separated by a hairline drawn on each one,
 * rather than spaced by a gutter and rounded. That is the same rule that
 * separates every other block on the screen — `2b` builds structure from rules.
 */
export function PlaceGallery({ photos }: PlaceGalleryProps) {
  const adaptive = useAdaptive();

  return (
    <View style={styles.grid}>
      {photos.map((photo) => (
        <View
          key={photo.id}
          style={[
            styles.cell,
            { backgroundColor: adaptive.background, borderColor: adaptive.grey200 },
          ]}
        >
          <Image
            source={{ uri: photo.photoUrl }}
            style={styles.image}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Shape.gutter,
  },
  cell: {
    width: `${100 / COLUMNS}%`,
    aspectRatio: 1,
    borderWidth: Shape.rowRule,
  },
  image: {
    flex: 1,
  },
});
