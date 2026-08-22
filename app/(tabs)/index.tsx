import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorPage, Loader, Txt, useAdaptive, useTheme } from '@/design-system';
import { useDiscoveryStore } from '@/features/discovery';
import {
  ArtistChips,
  ClosingRaffles,
  CourseCards,
  TicketBalanceCard,
  useHomeData,
} from '@/features/home';
import { PlaceList, Rule, SectionHeader, Shape } from '@/features/shared';

/**
 * 홈 — the reference screen.
 *
 * Built from prototype block `1a` for layout, copy and flow, and block `2b` for
 * colour, type and corners. Where they disagree those are the two axes, and they
 * do not overlap — see design/README.md.
 *
 * Conventions later screens should match:
 *
 *   - Data comes from `src/lib/repositories/` through one hook per screen, never
 *     from `src/mocks/` or Firebase directly (ADR 0005).
 *   - Loading, failure and empty are three states, all rendered, none assumed.
 *     The fixture path is deliberately slow so the loading state is visible.
 *   - Colour is read from `useAdaptive()` for greys and surfaces and from
 *     `useTheme().token.accent` for the brand. A raw hex here is a bug.
 *   - Structure comes from rules and spacing. 2b's radius rule is chips only.
 *   - Sections are a `SectionHeader` plus a block, separated by a 2px rule.
 */
export default function HomeScreen() {
  const adaptive = useAdaptive();
  const { token } = useTheme();
  const { state, reload, refresh } = useHomeData();
  const selectArtist = useDiscoveryStore((s) => s.select);

  // Re-read silently on every return to the tab, not on the first focus —
  // 최애 찾기 changes the chips and 티켓 발행 changes the balance, and this is
  // the screen that shows both. The loader is for the first load only.
  const focused = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focused.current) void refresh();
      focused.current = true;
    }, [refresh]),
  );

  // Pinned once per render pass so every deadline in this tree is measured
  // against the same instant.
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
          title="홈을 불러오지 못했어요"
          subtitle={state.message}
          onPressRightButton={reload}
        />
      </SafeAreaView>
    );
  }

  const {
    user,
    artists,
    selectedArtist,
    closingRaffles,
    places,
    courses,
    visitedPlaceIds,
    hasPosition,
  } = state.data;
  const artistName = selectedArtist?.name;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={reload} tintColor={adaptive.grey500} />
        }
      >
        <View style={styles.header}>
          <Txt
            typography="t7"
            fontWeight="bold"
            color={token.accent.fillColor}
            style={styles.wordmark}
          >
            PINDOM
          </Txt>
          <Txt typography="t2" fontWeight="bold" color={adaptive.grey900}>
            {artistName != null ? `${artistName}의 자리로` : '최애의 자리로'}
          </Txt>
          <Txt typography="t2" fontWeight="bold" color={adaptive.grey900}>
            떠나볼까요
          </Txt>
        </View>

        <ArtistChips
          artists={artists}
          selectedId={selectedArtist?.id}
          // Re-keys every section below, and 지도 with them — the selection is
          // the Discovery slice's, not this screen's.
          onSelect={selectArtist}
          onAdd={() => router.push('/artist/search' as never)}
        />

        <Rule />

        <TicketBalanceCard
          user={user}
          artistName={artistName}
          placeCount={selectedArtist?.placeCount}
          onFindPlaces={() => router.push('/map')}
          onEnterRaffle={() => router.push('/tickets')}
        />

        <Rule />

        <View style={styles.section}>
          <SectionHeader title="마감 임박 응모" right="전체 보기" />
          <ClosingRaffles
            raffles={closingRaffles}
            now={now}
            onSelect={(raffleId) => router.push(`/raffle/${raffleId}` as never)}
          />
        </View>

        <Rule />

        <View style={styles.section}>
          <SectionHeader
            title={artistName != null ? `${artistName}의 촬영지` : '촬영지'}
            right={hasPosition ? '거리순' : undefined}
          />
          <PlaceList
            // 홈 is a summary, not the list. 1a shows three; everything else is
            // 지도's job, which is why this section has no 전체 보기.
            places={places.slice(0, 3)}
            artistName={artistName}
            hasPosition={hasPosition}
            verifiedPlaceIds={visitedPlaceIds}
            onSelect={(placeId) => router.push(`/place/${placeId}` as never)}
          />
        </View>

        <Rule />

        <View style={styles.section}>
          <SectionHeader
            title={artistName != null ? `${artistName} 지역 코스` : '지역 코스'}
          />
          <CourseCards
            courses={courses}
            artistName={artistName}
            onSelect={(courseId) => router.push({ pathname: '/course', params: { courseId } } as never)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: Shape.gutter,
    paddingTop: 8,
    paddingBottom: 18,
    gap: 2,
  },
  wordmark: {
    letterSpacing: 3,
    marginBottom: 6,
  },
  section: {
    gap: 2,
  },
});
