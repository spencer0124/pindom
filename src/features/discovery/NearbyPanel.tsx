import { ScrollView, StyleSheet, View } from 'react-native';
import { Txt, useAdaptive } from '@/design-system';
import type { PlaceWithDistance } from '@/lib/domain';
import { PlaceList, SectionHeader, Shape } from '@/features/shared';

interface NearbyPanelProps {
  places: PlaceWithDistance[];
  artistName?: string;
  visitedPlaceIds: string[];
  hasPosition: boolean;
  /** True while a search box has narrowed the list — it changes the empty copy. */
  filtered: boolean;
  onSelect: (placeId: string) => void;
}

/**
 * The 촬영지 list docked under the map.
 *
 * `1a` draws it as a sheet with a 20px radius, a drop shadow and a drag handle,
 * and it is none of those here: corner and divider treatment is `2b`'s axis, and
 * `2b` builds structure from rules and spacing rather than from cards. So the
 * panel is a flat block separated from the map by a 2px rule.
 *
 * The handle goes with the radius — it is not a real gesture in `1a` either,
 * where the panel is a fixed-height element with a decorative grip. A grip that
 * does not drag is worse than no grip.
 */
export function NearbyPanel({
  places,
  artistName,
  visitedPlaceIds,
  hasPosition,
  filtered,
  onSelect,
}: NearbyPanelProps) {
  const adaptive = useAdaptive();

  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: adaptive.greyBackground, borderTopColor: adaptive.grey200 },
      ]}
    >
      <View style={styles.header}>
        <SectionHeader
          title={artistName != null ? `${artistName}의 촬영지` : '촬영지'}
          count={places.length}
          right={hasPosition ? '거리순' : undefined}
        />
      </View>

      {places.length === 0 ? (
        <View style={styles.empty}>
          <Txt typography="t6" color={adaptive.grey600} textAlign="center">
            {filtered ? '검색과 맞는 촬영지가 없어요' : '아직 등록된 촬영지가 없어요'}
          </Txt>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <PlaceList
            places={places}
            artistName={artistName}
            hasPosition={hasPosition}
            verifiedPlaceIds={visitedPlaceIds}
            // 지도 is the list, not a summary of it, so each row says whether the
            // place is still worth walking to.
            showState
            onSelect={onSelect}
          />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    // Roughly the split 1a draws: the map keeps the larger half, and three rows
    // of the list are visible without scrolling.
    maxHeight: '46%',
    borderTopWidth: Shape.sectionRule,
    paddingTop: 14,
  },
  header: {
    paddingBottom: 2,
  },
  list: {
    paddingBottom: 12,
  },
  empty: {
    paddingHorizontal: Shape.gutter,
    paddingBottom: 28,
    paddingTop: 6,
  },
});
