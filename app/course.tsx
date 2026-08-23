import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorPage, Loader, Txt, useAdaptive, useTheme } from '@/design-system';
import { useCourse } from '@/features/assistant';
import { MapCanvas } from '@/features/discovery';
import { Rule, Shape, workKindLabel } from '@/features/shared';

/** 1a's map block: 262 tall, inset by the page gutter (fidelity A-16). */
const MAP_HEIGHT = 262;

/**
 * 추천 코스 — the route the assistant drew, on the map and as a list.
 *
 * Built from prototype block `1a` for layout, copy and flow and `2b` for colour,
 * type and corners, matching `app/(tabs)/index.tsx`. The route screens.md
 * proposed; there is no Figma frame.
 *
 * A `courses` document is an ordered list of 촬영지 and a description. The legs
 * 1a annotates — 자동차 n분 이동, 촬영 추천 07:00–08:30, 근처 해장국·카페 3곳 — are
 * the route and local APIs' figures, which the backend calls; they are not on
 * the document and are not made up here. 길안내 needs the same API and is not
 * drawn. The map is 지도's own canvas with the course's stops as its pins —
 * numbered in walk order, the first in the accent, with 1a's dashed route
 * through them (fidelity A-14, A-15) — inset by the page gutter as 1a's is.
 * The description is the document's own field, kept above the legs (A-17).
 */
export default function CourseScreen() {
  const adaptive = useAdaptive();
  const { token } = useTheme();
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { state, reload } = useCourse(courseId);

  if (state.status === 'loading') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}>
        <Loader.Centered label="코스를 불러오는 중" />
      </SafeAreaView>
    );
  }
  if (state.status === 'error') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}>
        <ErrorPage title="코스를 불러오지 못했어요" subtitle={state.message} onPressRightButton={reload} />
      </SafeAreaView>
    );
  }

  const { course, artist, stops, visitedPlaceIds, origin, hasPosition } = state.data;
  const title = artist != null ? `${artist.name} 성지순례 코스` : course.name;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="뒤로" style={styles.back}>
          <Txt typography="t5" color={adaptive.grey600}>
            ‹
          </Txt>
        </Pressable>
        <View style={styles.headerCopy}>
          <Txt typography="t6" fontWeight="bold" color={adaptive.grey900} numberOfLines={1}>
            {title}
          </Txt>
          <Txt typography="st13" color={adaptive.grey600}>
            {stops.length}곳 · {course.name}
          </Txt>
        </View>
      </View>

      <View style={styles.map}>
        <MapCanvas
          places={stops}
          visitedPlaceIds={visitedPlaceIds}
          origin={origin}
          hasPosition={hasPosition}
          path={stops}
          ordered
          onSelect={(placeId) => router.push(`/place/${placeId}` as never)}
        />
      </View>

      <Rule />

      <ScrollView contentContainerStyle={styles.legs}>
        <Txt typography="t7" color={adaptive.grey700} style={styles.description}>
          {course.description}
        </Txt>
        {stops.map((stop, index) => (
          <Pressable
            key={stop.id}
            onPress={() => router.push(`/place/${stop.id}` as never)}
            accessibilityRole="button"
            style={[styles.leg, { borderTopColor: adaptive.grey200 }]}
          >
            <View style={styles.legMark}>
              <View
                style={[
                  styles.legNumber,
                  { backgroundColor: index === 0 ? token.accent.fillColor : adaptive.background, borderColor: token.accent.fillColor },
                ]}
              >
                <Txt typography="st13" fontWeight="bold" color={index === 0 ? token.accent.onFillColor : token.accent.fillColor}>
                  {index + 1}
                </Txt>
              </View>
              {index < stops.length - 1 && <View style={[styles.legLine, { backgroundColor: adaptive.grey200 }]} />}
            </View>
            <View style={styles.legCopy}>
              <Txt typography="t6" fontWeight="bold" color={adaptive.grey900}>
                {stop.name}
              </Txt>
              <Txt typography="st13" color={adaptive.grey600}>
                {[artist != null ? `${artist.name} 촬영지` : workKindLabel[stop.workKind], stop.region].join(' · ')}
              </Txt>
              {index < stops.length - 1 && (
                <Txt typography="st13" color={adaptive.grey500} style={styles.next}>
                  ↓ {stops[index + 1].name}
                </Txt>
              )}
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Shape.gutter,
    paddingVertical: 8,
  },
  back: {
    width: 28,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  map: {
    height: MAP_HEIGHT,
    marginHorizontal: Shape.gutter,
  },
  legs: {
    paddingBottom: 24,
  },
  description: {
    paddingHorizontal: Shape.gutter,
    paddingVertical: 14,
  },
  leg: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: Shape.gutter,
    paddingVertical: 14,
    borderTopWidth: Shape.rowRule,
  },
  legMark: {
    alignItems: 'center',
    width: 26,
  },
  legNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legLine: {
    flex: 1,
    width: 1,
    marginTop: 6,
  },
  legCopy: {
    flex: 1,
    gap: 3,
  },
  next: {
    marginTop: 8,
  },
});
