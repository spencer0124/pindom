import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ErrorPage, Loader, Txt, useAdaptive } from '@/design-system';
import {
  ConditionsNote,
  PlaceGallery,
  PlaceHero,
  PlaceStats,
  ReviewList,
  usePlaceDetail,
} from '@/features/discovery';
import { Rule, SectionHeader, Shape } from '@/features/shared';

/**
 * 장소/상세 — one 촬영지, and the way into GPS 인증.
 *
 * Built from prototype block `1a` for layout, copy and flow, and block `2b` for
 * colour, type and corners, matching `app/(tabs)/index.tsx`. The Figma frame
 * `33:2381` predates the 갤러리 and 촬영 팁 blocks entirely — see
 * docs/reference/screens.md on what this screen grew.
 *
 * The 인증하기 button carries `placeId` forward. GPS인증 belongs to the Capture
 * slice, which is keyed to that parameter — passing it here is what stops the
 * two slices from agreeing on a different route signature later.
 */
export default function PlaceDetailScreen() {
  const adaptive = useAdaptive();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, reload, addReview } = usePlaceDetail(id);

  // Pinned once per render pass so every 촬영 팁 is aged against one instant.
  const now = useMemo(() => new Date(), []);

  if (state.status === 'loading') {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}
        edges={['top']}
      >
        <Loader.Centered label="촬영지를 불러오는 중" />
      </SafeAreaView>
    );
  }

  if (state.status === 'error') {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}
        edges={['top']}
      >
        <ErrorPage
          title="촬영지를 불러오지 못했어요"
          subtitle={state.message}
          onPressRightButton={reload}
        />
      </SafeAreaView>
    );
  }

  const { place, artist, gallery, reviews, distance } = state.data;

  return (
    <View style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <PlaceHero place={place} artistName={artist?.name} />

        <View style={styles.title}>
          <Txt typography="t2" fontWeight="bold" color={adaptive.grey900}>
            {place.name}
          </Txt>
          {/* The uppercase Latin caption under the Korean name is `2b`'s
              typographic signature, not a translation — type is `2b`'s axis. */}
          <Txt typography="t7" color={adaptive.grey500} style={styles.roman}>
            {place.roman.toUpperCase()}
          </Txt>
          <Txt typography="t6" color={adaptive.grey600} style={styles.work}>
            {[place.workTitle, place.region].filter(Boolean).join(' · ')}
          </Txt>
        </View>

        <Rule />

        <PlaceStats
          verifyCount={place.verifyCount}
          photoCount={place.photoCount}
          distance={distance}
        />

        <Rule />

        <View style={styles.section}>
          <Txt typography="t6" color={adaptive.grey700} style={styles.description}>
            {place.description}
          </Txt>
        </View>

        {gallery.length > 0 && (
          <>
            <Rule />
            <View style={styles.section}>
              <SectionHeader title="공개 사진 갤러리" />
              <PlaceGallery photos={gallery} />
            </View>
          </>
        )}

        <Rule />

        <View style={styles.section}>
          <SectionHeader title="촬영 팁" count={reviews.length} />
          <ReviewList reviews={reviews} now={now} onSubmit={addReview} />
        </View>

        <Rule />

        <ConditionsNote radiusMeters={place.radiusMeters} artistName={artist?.name} />
      </ScrollView>

      <SafeAreaView
        edges={['bottom']}
        style={[
          styles.cta,
          { backgroundColor: adaptive.greyBackground, borderTopColor: adaptive.grey200 },
        ]}
      >
        <Button
          size="large"
          type="primary"
          display="block"
          onPress={() => router.push(`/verify/gps?placeId=${place.id}` as never)}
        >
          GPS 인증하기
        </Button>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  title: {
    paddingHorizontal: Shape.gutter,
    paddingTop: 18,
  },
  roman: {
    letterSpacing: 1.4,
    marginTop: 4,
  },
  work: {
    marginTop: 8,
  },
  description: {
    paddingHorizontal: Shape.gutter,
  },
  section: {
    gap: 2,
  },
  cta: {
    paddingHorizontal: Shape.gutter,
    paddingTop: 12,
    borderTopWidth: Shape.sectionRule,
  },
});
