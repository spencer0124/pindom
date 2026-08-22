import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { Course } from '@/lib/domain';
import { Txt, useAdaptive, useTheme } from '@/design-system';
import { Shape } from '@/features/shared';

interface CourseCardsProps {
  courses: Course[];
  artistName?: string;
  onSelect: (courseId: string) => void;
}

/**
 * {최애} 지역 코스 — curated itineraries, scrolled horizontally.
 *
 * The only horizontally scrolling content on 홈 besides the 최애 chips, and the
 * last block on the screen. Each card is a bounded rectangle rather than a
 * rounded tile, for the same reason as every other block here.
 */
export function CourseCards({ courses, artistName, onSelect }: CourseCardsProps) {
  const adaptive = useAdaptive();
  const { token } = useTheme();

  if (courses.length === 0) {
    return (
      <View style={styles.empty}>
        <Txt typography="t6" color={adaptive.grey500}>
          아직 준비된 코스가 없어요
        </Txt>
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.track}>
      {courses.map((course) => (
        <Pressable
          key={course.id}
          onPress={() => onSelect(course.id)}
          accessibilityRole="button"
          accessibilityLabel={course.name}
          style={[styles.card, { borderColor: adaptive.grey200 }]}
        >
          <Txt typography="t6" fontWeight="bold" color={adaptive.grey900} numberOfLines={1}>
            {course.name}
          </Txt>
          <Txt typography="t7" color={adaptive.grey500} numberOfLines={2} style={styles.desc}>
            {course.description}
          </Txt>
          <Txt typography="t7" fontWeight="bold" color={token.accent.fillColor}>
            {artistName != null ? `${artistName} ${course.placeCount}곳` : `${course.placeCount}곳`}
          </Txt>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  track: {
    paddingHorizontal: Shape.gutter,
    gap: 10,
  },
  card: {
    width: 190,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  desc: {
    flexGrow: 1,
  },
  empty: {
    paddingHorizontal: Shape.gutter,
  },
});
