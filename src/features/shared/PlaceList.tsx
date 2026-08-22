import { Image, StyleSheet, View } from 'react-native';
import type { PlaceWithDistance } from '@/lib/domain';
import { ListRow, SdsColors, Txt, useAdaptive, useTheme } from '@/design-system';
import { formatDistance } from './formatDistance';
import { Rule } from './Rule';

// 1a's own thumbnail size. It is also the smallest square the 인증 완료 stamp
// fits across on one line, which is why it is not smaller.
const THUMB = 56;

const workKindLabel: Record<PlaceWithDistance['workKind'], string> = {
  mv: 'MV 촬영',
  drama: '드라마 촬영',
  self: '자체 콘텐츠',
};

interface PlaceListProps {
  places: PlaceWithDistance[];
  artistName?: string;
  /** False when there is no fix; distances are hidden rather than shown as 0m. */
  hasPosition: boolean;
  /** Which places this user has already verified, for the 인증 완료 badge. */
  verifiedPlaceIds?: string[];
  /**
   * Print 방문 완료 · 티켓 발행됨 / 미방문 · 인증 가능 under the meta line.
   *
   * 지도 does; 홈 does not. On 홈 the list is a three-row summary and the stamp
   * on the thumbnail already carries the state, so the sentence would say the
   * same thing twice. On 지도 the list is the screen's content and the sentence
   * is what tells you which pin is worth walking to.
   */
  showState?: boolean;
  onSelect: (placeId: string) => void;
}

/**
 * 촬영지 rows — locations in distance order.
 *
 * Built on ListRow rather than a bespoke row: the design system documents it as
 * "the standard row, most list content is this", and its left/contents/right
 * slots take the thumbnail, the two text lines and the distance without a
 * hand-rolled Pressable.
 *
 * The thumbnail is kept even though 2b's mockup replaces it with an 01/02/03
 * numeral. The numeral is a type treatment; the thumbnail carries the
 * 미인증/인증 완료 state, which is content — and content is 1a's axis.
 *
 * Only the nearest distance is painted in the accent. That restraint is the
 * direction: the acid marks section labels and the single most important number
 * on the screen, nothing else.
 */
export function PlaceList({
  places,
  artistName,
  hasPosition,
  verifiedPlaceIds = [],
  showState = false,
  onSelect,
}: PlaceListProps) {
  const adaptive = useAdaptive();
  const { token } = useTheme();

  return (
    <View>
      {places.map((place, index) => {
        const verified = verifiedPlaceIds.includes(place.id);
        const nearest = index === 0;
        const meta = [artistName, workKindLabel[place.workKind], place.region]
          .filter(Boolean)
          .join(' · ');
        return (
          <View key={place.id}>
            {index > 0 && <Rule weight="row" inset />}
            <ListRow
              onPress={() => onSelect(place.id)}
              verticalPadding="small"
              accessibilityLabel={place.name}
              left={
                <View>
                  <Image
                    source={{ uri: place.coverImageUrl }}
                    style={[styles.thumb, { backgroundColor: adaptive.background }]}
                    accessibilityIgnoresInvertColors
                  />
                  <View
                    style={[
                      styles.state,
                      // Opaque, and dark enough to survive whatever photograph is
                      // behind it. The tint alone was unreadable over a bright
                      // frame — this badge sits on top of an image, not a surface.
                      { backgroundColor: verified ? token.accent.fillColor : SdsColors.ground },
                    ]}
                  >
                    <Txt
                      typography="t7"
                      fontWeight="bold"
                      color={verified ? token.accent.onFillColor : adaptive.grey800}
                      numberOfLines={1}
                      textAlign="center"
                    >
                      {verified ? '인증 완료' : '미인증'}
                    </Txt>
                  </View>
                </View>
              }
              contents={
                showState ? (
                  <View style={styles.stack}>
                    <Txt typography="t6" fontWeight="medium" color={adaptive.grey900}>
                      {place.name}
                    </Txt>
                    <Txt typography="t7" color={adaptive.grey600} numberOfLines={1}>
                      {meta}
                    </Txt>
                    {/* Deliberately not in the accent, even though it is the
                        state line. The stamp on the thumbnail already says this
                        in colour; painting the sentence too puts the acid on
                        screen three times in a list of three, and 2b spends it
                        on section labels and the single most important number
                        only. */}
                    <Txt typography="t7" fontWeight="bold" color={adaptive.grey700}>
                      {verified ? '방문 완료 · 티켓 발행됨' : '미방문 · 인증 가능'}
                    </Txt>
                  </View>
                ) : (
                  <ListRow.Texts type="2RowTypeB" top={place.name} bottom={meta} />
                )
              }
              right={
                hasPosition ? (
                  <Txt
                    typography="t6"
                    fontWeight="bold"
                    color={nearest ? token.accent.fillColor : adaptive.grey700}
                  >
                    {formatDistance(place.distanceMeters)}
                  </Txt>
                ) : undefined
              }
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: {
    width: THUMB,
    height: THUMB,
  },
  state: {
    // A bar across the foot of the thumbnail rather than a corner tag: 인증 완료
    // is four glyphs and will not fit in a corner at any legible size.
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 1,
  },
  stack: {
    gap: 3,
  },
});
