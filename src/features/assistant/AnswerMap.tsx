import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Txt, useAdaptive, useTheme } from '@/design-system';
import type { AssistantMap } from '@/lib/domain';
import { MapCanvas } from '@/features/discovery';

/**
 * How tall the map sits in the thread. Enough for a drive across the country
 * to read as a line rather than a smudge, short enough that the answer's text
 * and the composer are both still on screen.
 */
const MAP_HEIGHT = 220;

/** Minutes, as the summary line says them: `1시간 40분`, `25분`. */
function readableDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}분`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}시간` : `${hours}시간 ${rest}분`;
}

/** Numbered rows, "이곳 다음 이곳" — the driving order as a list, not just pins. */
function StopSteps({ stops }: { stops: { id: string; name: string; region: string }[] }) {
  const adaptive = useAdaptive();
  const { token } = useTheme();

  return (
    <View style={[styles.list, { borderTopColor: adaptive.grey200 }]}>
      {stops.map((stop, i) => (
        <Pressable
          key={stop.id}
          style={styles.row}
          onPress={() => router.push(`/place/${stop.id}` as never)}
        >
          <View style={[styles.badge, { backgroundColor: token.accent.fillColor }]}>
            <Txt typography="st12" fontWeight="semibold" color={token.accent.onFillColor}>
              {i + 1}
            </Txt>
          </View>
          <Txt typography="st13" color={adaptive.grey900} style={styles.rowText}>
            {stop.name}
            {stop.region ? ` · ${stop.region}` : ''}
          </Txt>
        </Pressable>
      ))}
    </View>
  );
}

/** Cards for the cafés/관광지 the answer recommended, each opening its 카카오맵 상세. */
function SuggestionRows({ suggestions }: { suggestions: AssistantMap['suggestions'] }) {
  const adaptive = useAdaptive();
  const { token } = useTheme();

  return (
    <View style={[styles.list, { borderTopColor: adaptive.grey200 }]}>
      {suggestions.map((s) => (
        <View key={`${s.name}/${s.lat},${s.lng}`} style={styles.row}>
          <Txt typography="st13" color={adaptive.grey900} style={styles.rowText}>
            {s.name}
          </Txt>
          {s.placeUrl != null && (
            <Pressable onPress={() => void Linking.openURL(s.placeUrl as string).catch(() => {})}>
              <Txt typography="st13" color={token.accent.fillColor}>
                자세히 보기
              </Txt>
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
}

/**
 * The map an answer draws, in the thread, under the words that describe it.
 *
 * Pindom AI names places for a living, and a list of names is the one thing a
 * map does better. So an answer that found 촬영지 draws them here: numbered in
 * driving order when it planned a drive, with 카카오모빌리티's road geometry
 * as the line — not the straight segments 추천 코스 draws between stops — and
 * the cafés it recommended as hollow dots beside them.
 *
 * The map itself takes no taps on a poi — there is no screen behind a café.
 * `StopSteps`/`SuggestionRows` below the map are where the answer becomes
 * tappable: a stop opens 장소/상세, a recommendation opens its 카카오맵 상세.
 */
export function AnswerMap({ map }: { map: AssistantMap }) {
  const adaptive = useAdaptive();
  const { token } = useTheme();

  const stops = map.stops.map((stop) => ({
    id: stop.placeId,
    name: stop.name,
    region: stop.region ?? '',
    lat: stop.lat,
    lng: stop.lng,
  }));

  const legs =
    map.durationSeconds != null && map.distanceMeters != null
      ? `${readableDuration(map.durationSeconds)} · ${Math.round(map.distanceMeters / 100) / 10}km`
      : null;

  return (
    <View style={[styles.card, { borderColor: adaptive.grey200 }]}>
      <View style={styles.canvas}>
        <MapCanvas
          places={stops}
          visitedPlaceIds={[]}
          hasPosition={false}
          path={map.path}
          ordered={map.ordered}
          pois={map.suggestions}
          fit
          onSelect={(placeId) => router.push(`/place/${placeId}` as never)}
        />
      </View>
      <View style={[styles.summary, { borderTopColor: adaptive.grey200 }]}>
        <Txt typography="st13" fontWeight="semibold" color={adaptive.grey900}>
          촬영지 {map.stops.length}곳
          {map.suggestions.length > 0 ? ` · 추천 ${map.suggestions.length}곳` : ''}
        </Txt>
        {legs != null && (
          <Txt typography="st13" color={token.accent.fillColor}>
            {legs}
          </Txt>
        )}
      </View>
      {map.ordered && stops.length > 1 && <StopSteps stops={stops} />}
      {map.suggestions.length > 0 && <SuggestionRows suggestions={map.suggestions} />}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    // The bubble is capped at 84%; the map takes the thread's full width — it
    // is a picture, and cropping it to a speech bubble wastes the point of it.
    alignSelf: 'stretch',
    borderWidth: 1,
    overflow: 'hidden',
  },
  canvas: {
    height: MAP_HEIGHT,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  list: {
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    gap: 8,
  },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
});
