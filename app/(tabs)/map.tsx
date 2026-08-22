import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorPage, Loader, SearchField, useAdaptive } from '@/design-system';
import {
  MapCanvas,
  MapFilters,
  NearbyPanel,
  useDiscoveryStore,
  useMapData,
} from '@/features/discovery';
import { Shape } from '@/features/shared';

/**
 * 지도 — every 촬영지 on real tiles, and the list of the ones nearest you.
 *
 * Built from prototype block `1a` for layout, copy and flow, and block `2b` for
 * colour, type and corners, matching `app/(tabs)/index.tsx`. Three places where
 * the older Figma frame (`33:2460`) disagrees are resolved in
 * docs/plans/2026-08-22-discovery-slice-checklist.md.
 *
 * The 최애 filter writes the selection 홈 reads, which is why it lives in a store
 * rather than in this file — see `@/features/discovery/state`.
 *
 * The search box filters what is already loaded rather than querying. `1a` draws
 * a search field whose tap handler goes nowhere, so there is no designed search
 * screen to route to; filtering the list in place is the smallest thing that
 * makes the control honest instead of decorative.
 */
export default function MapScreen() {
  const adaptive = useAdaptive();
  const [query, setQuery] = useState('');
  const { state, reload } = useMapData(query);
  const selectArtist = useDiscoveryStore((s) => s.select);

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
          title="지도를 불러오지 못했어요"
          subtitle={state.message}
          onPressRightButton={reload}
        />
      </SafeAreaView>
    );
  }

  const { artists, selectedArtist, places, visitedPlaceIds, origin, hasPosition } = state.data;
  const openPlace = (placeId: string) => router.push(`/place/${placeId}` as never);

  return (
    <View style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}>
      <View style={styles.canvas}>
        <MapCanvas
          places={places}
          visitedPlaceIds={visitedPlaceIds}
          origin={origin}
          hasPosition={hasPosition}
          onSelect={openPlace}
        />

        {/* `box-none` so the map keeps every touch that is not on the chrome —
            without it this container swallows panning across the whole width. */}
        <SafeAreaView style={styles.chrome} edges={['top']} pointerEvents="box-none">
          <SearchField
            value={query}
            onChangeText={setQuery}
            hasClearButton
            placeholder="아티스트 · 촬영지 · 지역 검색"
            style={[styles.search, { borderColor: adaptive.grey200 }]}
          />
          <MapFilters
            artists={artists}
            selectedId={selectedArtist?.id}
            onSelect={selectArtist}
          />
        </SafeAreaView>
      </View>

      <NearbyPanel
        places={places}
        artistName={selectedArtist?.name}
        visitedPlaceIds={visitedPlaceIds}
        hasPosition={hasPosition}
        filtered={query.trim().length > 0}
        onSelect={openPlace}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  canvas: {
    flex: 1,
  },
  chrome: {
    gap: 10,
    paddingTop: 8,
  },
  search: {
    marginHorizontal: Shape.gutter,
    // 2b's radius rule is chips only; the design system's own 12px is the light
    // default this direction replaces.
    borderRadius: 0,
    borderWidth: 1,
  },
});
