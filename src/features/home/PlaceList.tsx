import { Image, StyleSheet, View } from 'react-native';
import type { PlaceWithDistance } from '@/lib/domain';
import { ListRow, SdsColors, Txt, useAdaptive, useTheme } from '@/design-system';
import { HomeShape } from './homeStyles';

const THUMB = 52;

const workKindLabel: Record<PlaceWithDistance['workKind'], string> = {
  mv: 'MV 촬영',
  drama: '드라마 촬영',
  self: '자체 콘텐츠',
};

/** 84m · 2.1km — metres under a kilometre, one decimal above it. */
function formatDistance(meters: number): string {
  return meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`;
}

interface PlaceListProps {
  places: PlaceWithDistance[];
  artistName?: string;
  /** False when there is no fix; distances are hidden rather than shown as 0m. */
  hasPosition: boolean;
  /** Which places this user has already verified, for the 인증 완료 badge. */
  verifiedPlaceIds?: string[];
  onSelect: (placeId: string) => void;
}

/**
 * {최애}의 촬영지 — the nearest locations, in distance order.
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
  onSelect,
}: PlaceListProps) {
  const adaptive = useAdaptive();
  const { token } = useTheme();

  return (
    <View>
      {places.map((place, index) => {
        const verified = verifiedPlaceIds.includes(place.id);
        const nearest = index === 0;
        return (
          <View key={place.id}>
            {index > 0 && (
              <View
                style={[
                  styles.rule,
                  { borderTopColor: adaptive.grey200, marginHorizontal: HomeShape.gutter },
                ]}
              />
            )}
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
                    >
                      {verified ? '인증 완료' : '미인증'}
                    </Txt>
                  </View>
                </View>
              }
              contents={
                <ListRow.Texts
                  type="2RowTypeB"
                  top={place.name}
                  bottom={[artistName, workKindLabel[place.workKind], place.region]
                    .filter(Boolean)
                    .join(' · ')}
                />
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
  rule: {
    borderTopWidth: HomeShape.rowRule,
  },
  thumb: {
    width: THUMB,
    height: THUMB,
  },
  state: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
});
