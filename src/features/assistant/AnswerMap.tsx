import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
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

/**
 * The map an answer draws, in the thread, under the words that describe it.
 *
 * Pindom AI names places for a living, and a list of names is the one thing a
 * map does better. So an answer that found 촬영지 draws them here: numbered in
 * driving order when it planned a drive, with 카카오모빌리티's road geometry
 * as the line — not the straight segments 추천 코스 draws between stops — and
 * the cafés it recommended as hollow dots beside them.
 *
 * Tapping a stop opens 장소/상세, which is where a 촬영지 is acted on. The
 * recommendations take no taps: there is no screen behind a café, and the
 * answer's own text already says why it is on the map.
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

  // The caption names only what the answer produced. A café recommendation
  // carries no 촬영지, and a leading `촬영지 0곳` on it reads as something
  // missing rather than something never asked for — so each half appears only
  // when its count is non-zero, mirroring the `추천` half's own guard.
  const counts = [
    map.stops.length > 0 ? `촬영지 ${map.stops.length}곳` : null,
    map.suggestions.length > 0 ? `추천 ${map.suggestions.length}곳` : null,
  ]
    .filter(Boolean)
    .join(' · ');

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
          {counts}
        </Txt>
        {legs != null && (
          <Txt typography="st13" color={token.accent.fillColor}>
            {legs}
          </Txt>
        )}
      </View>
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
});
