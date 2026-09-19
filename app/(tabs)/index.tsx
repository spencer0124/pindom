import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorPage, Loader, SdsSpacing, Txt, useAdaptive, useTheme } from '@/design-system';
import { ASSISTANT_FAB_CLEARANCE } from '@/features/assistant';
import { useDiscoveryStore } from '@/features/discovery';
import {
  ArtistChips,
  ClosingRaffles,
  CourseCards,
  TicketBalanceCard,
  useHomeData,
} from '@/features/home';
import { PindomMark, PlaceList, Rule, SectionHeader, Shape, wordmark } from '@/features/shared';

/** 1a's `38px` avatar at the right of the greeting. No tap — 1a wires none. */
const AVATAR = 38;

/** Artist-led discovery. Data and navigation retain the existing repository flow. */
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
    coursesLoading,
    visitedPlaceIds,
    verifiedCount,
    hasPosition,
  } = state.data;
  const artistName = selectedArtist?.name;
  // 1a's 응모하러 가기 opens 응모 directly. The app's 응모 is keyed to one raffle,
  // so it is the soonest open one — the rule 컬렉션 already follows — and the
  // 컬렉션 tab only when there is nothing open (fidelity decision 10).
  const nextRaffle = closingRaffles[0];

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
          <View style={styles.greeting}>
            <View style={styles.brand}>
              <PindomMark size={26} color={token.accent.fillColor} />
            <Txt
              typography="t7"
              fontWeight="bold"
              color={token.accent.fillColor}
              style={styles.wordmark}
            >
              PINDOM
            </Txt>
            </View>
            <Txt typography="t2" fontWeight="bold" color={adaptive.grey900}>
              {artistName != null ? `${artistName}의 자리로` : '최애의 자리로'}
            </Txt>
            <Txt typography="t2" fontWeight="bold" color={adaptive.grey900}>
              떠나볼까요
            </Txt>
          </View>
          {/* 마이's avatar, smaller: the photograph, else the nickname's initial. */}
          <View
            style={[
              styles.avatar,
              { backgroundColor: adaptive.background, borderColor: adaptive.grey200 },
            ]}
            accessibilityLabel={user.nickname}
          >
            {user.avatarUrl != null ? (
              <Image source={{ uri: user.avatarUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : (
              <Txt typography="t6" fontWeight="bold" color={adaptive.grey600}>
                {user.nickname.slice(0, 1)}
              </Txt>
            )}
          </View>
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
          verifiedCount={verifiedCount}
          onFindPlaces={() => router.push('/map')}
          onEnterRaffle={() =>
            router.push(nextRaffle != null ? (`/raffle/${nextRaffle.id}` as never) : '/tickets')
          }
        />

        <Rule />

        <View style={styles.section}>
          <SectionHeader title="마감 임박 응모" />
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
            loading={coursesLoading}
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
    // 1a's `padding-bottom: 100px`: the last card clears the FAB.
    paddingBottom: ASSISTANT_FAB_CLEARANCE + SdsSpacing.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: Shape.gutter,
    paddingTop: 16,
    paddingBottom: 24,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  greeting: {
    flex: 1,
    gap: 2,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: Shape.chipRadius,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    ...wordmark,
    marginBottom: 0,
  },
  section: {
    gap: 2,
  },
});
