import { Image, StyleSheet, View } from 'react-native';
import { useAdaptive } from '@/design-system';
import type { GalleryPhoto } from '@/lib/domain';
import { ModerationButton } from '@/features/moderation';
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
 *
 * Every cell carries a ⋯ in its corner. A photo is user-submitted content that
 * a moderator may have to act on, and App Store guideline 1.2 wants the control
 * on the content — a grid with no per-photo affordance is the case the guideline
 * is written about. It is the `overlay` variant because a bare glyph on an
 * arbitrary photograph is unreadable half the time.
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
          {/* No nickname is passed: `GalleryPhoto` has none, and the contract
              does not denormalise one onto the collection. The sheet falls back
              to 이 사용자. */}
          <ModerationButton
            variant="overlay"
            target={{ type: 'photo', id: photo.id, authorId: photo.authorId }}
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
