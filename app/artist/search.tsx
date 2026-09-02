import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ErrorPage, Loader, SearchField, Txt, useAdaptive, useTheme } from '@/design-system';
import { useArtistSearch } from '@/features/auth';
import { Shape } from '@/features/shared';

/**
 * 최애 찾기 — the roster, searchable, with a follow chip per artist.
 *
 * Built from prototype block `1a` for layout, copy and flow and `2b` for colour,
 * type and corners, matching `app/(tabs)/index.tsx`. There is no Figma frame;
 * docs/reference/screens.md lists this as one of the screens the prototype
 * added, and the route it proposed.
 *
 * Reached from 온보딩 (first run), 홈's 최애 추가 chip and 마이페이지. A follow
 * re-keys the Discovery slice to the artist, as 1a does — which is what the
 * note under the search field promises. The bottom CTA appears once a follow
 * exists — the header's ‹ 홈 was the only way forward and testers missed it; the
 * button names the count and goes the same way `back` does.
 */
export default function ArtistSearchScreen() {
  const adaptive = useAdaptive();
  const { token } = useTheme();
  const [query, setQuery] = useState('');
  const { state, reload, toggle } = useArtistSearch(query);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/' as never));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}>
      <View style={styles.header}>
        <Pressable onPress={back} accessibilityRole="button" style={styles.headerSide}>
          <Txt typography="st11" fontWeight="medium" color={adaptive.grey600}>
            ‹ 홈
          </Txt>
        </Pressable>
        <Txt typography="t6" fontWeight="bold" color={adaptive.grey900}>
          아티스트 찾기
        </Txt>
        <View style={styles.headerSide} />
      </View>

      <SearchField
        value={query}
        onChangeText={setQuery}
        hasClearButton
        placeholder="아이돌 이름을 검색하세요"
        style={[styles.search, { borderColor: adaptive.grey200 }]}
      />

      <Txt typography="t7" fontWeight="medium" color={adaptive.grey600} style={styles.note}>
        팔로우하면 홈·지도·응모가 그 아티스트 기준으로 바뀝니다
      </Txt>

      {state.status === 'loading' ? (
        <Loader.Centered label="아티스트를 불러오는 중" />
      ) : state.status === 'error' ? (
        <ErrorPage title="아티스트를 불러오지 못했어요" subtitle={state.message} onPressRightButton={reload} />
      ) : (
        <ScrollView keyboardShouldPersistTaps="handled">
          <View>
            {state.results.map((artist) => {
              const followed = state.followedIds.includes(artist.id);
              return (
                <View key={artist.id} style={[styles.row, { borderBottomColor: adaptive.grey200 }]}>
                  <View
                    style={[
                      styles.avatar,
                      {
                        backgroundColor: adaptive.background,
                        borderColor: followed ? token.accent.fillColor : adaptive.grey200,
                      },
                    ]}
                  >
                    <Txt
                      typography="st11"
                      fontWeight="bold"
                      color={followed ? token.accent.fillColor : adaptive.grey600}
                    >
                      {artist.initial}
                    </Txt>
                  </View>
                  <View style={styles.copy}>
                    <Txt typography="t6" fontWeight="bold" color={adaptive.grey900}>
                      {artist.name}
                    </Txt>
                    <Txt typography="st12" color={adaptive.grey600}>
                      {artist.placeCount}곳
                    </Txt>
                  </View>
                  <Pressable
                    onPress={() => void toggle(artist, followed)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: followed }}
                    style={[
                      styles.chip,
                      followed
                        ? { borderColor: adaptive.grey200, backgroundColor: 'transparent' }
                        : { borderColor: token.accent.fillColor, backgroundColor: token.accent.fillColor },
                    ]}
                  >
                    <Txt
                      typography="st12"
                      fontWeight="bold"
                      color={followed ? adaptive.grey600 : token.accent.onFillColor}
                    >
                      {followed ? '팔로우 중' : '팔로우'}
                    </Txt>
                  </Pressable>
                </View>
              );
            })}
            {state.results.length === 0 && (
              <View style={styles.empty}>
                <Txt typography="t6" color={adaptive.grey600} textAlign="center">
                  검색 결과가 없어요
                </Txt>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {state.status === 'ready' && state.followedIds.length > 0 && (
        <View style={styles.footer}>
          <Button size="large" type="primary" display="block" onPress={back}>
            {`${state.followedIds.length}팀 팔로우하고 시작하기`}
          </Button>
        </View>
      )}
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
    justifyContent: 'space-between',
    paddingHorizontal: Shape.gutter,
    paddingVertical: 10,
  },
  headerSide: {
    width: 48,
  },
  search: {
    marginHorizontal: Shape.gutter,
    borderRadius: 0,
    borderWidth: 1,
  },
  note: {
    paddingHorizontal: Shape.gutter,
    paddingTop: 14,
    paddingBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Shape.gutter,
    paddingVertical: 13,
    borderBottomWidth: Shape.rowRule,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  chip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: Shape.chipRadius,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    paddingVertical: 40,
  },
  footer: {
    paddingHorizontal: Shape.gutter,
    paddingTop: 10,
    paddingBottom: 8,
  },
});
