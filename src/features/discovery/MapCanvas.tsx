import { NaverMapMarkerOverlay, NaverMapView } from '@mj-studio/react-native-naver-map';
import { StyleSheet, View } from 'react-native';
import { Txt, useAdaptive, useTheme } from '@/design-system';
import type { PlaceWithDistance } from '@/lib/domain';
import { AppConfig } from '@/lib/config';
import { Shape } from '@/features/shared';
import type { Position } from './position';

/** Whole-country framing, which is where 1a opens the map. */
const COUNTRY_ZOOM = 6;
/** Close enough to see which side of a harbour a pin is on. */
const NEARBY_ZOOM = 12;

interface MapCanvasProps {
  places: PlaceWithDistance[];
  visitedPlaceIds: string[];
  origin: Position;
  hasPosition: boolean;
  onSelect: (placeId: string) => void;
}

/**
 * The 지도 surface: real tiles, real coordinates, one marker per 촬영지.
 *
 * A verified place is marked in the accent and an unverified one is muted —
 * that pairing is the whole point of the screen in `1a`, where visited pins are
 * one colour and unvisited another. The distinction is carried twice, by symbol
 * *and* by tint, because `tintColor` reaches the native icon on one platform
 * more reliably than the other and a map where every pin looks alike is worth
 * nothing.
 *
 * The markers are Naver's built-in symbols rather than custom views. A custom
 * child is supported and would let the pin follow `2b`'s square-cornered
 * treatment, but it cannot be checked without a client id and a native build —
 * see the stand-in below, which is what this repo currently renders.
 */
export function MapCanvas({
  places,
  visitedPlaceIds,
  origin,
  hasPosition,
  onSelect,
}: MapCanvasProps) {
  const adaptive = useAdaptive();
  const { token } = useTheme();

  if (!AppConfig.naverMapConfigured) {
    return <MapUnavailable />;
  }

  return (
    <NaverMapView
      style={StyleSheet.absoluteFill}
      initialCamera={{
        latitude: origin.lat,
        longitude: origin.lng,
        zoom: hasPosition ? NEARBY_ZOOM : COUNTRY_ZOOM,
      }}
      isShowLocationButton={hasPosition}
      locale="ko"
    >
      {places.map((place) => {
        const visited = visitedPlaceIds.includes(place.id);
        return (
          <NaverMapMarkerOverlay
            key={place.id}
            latitude={place.lat}
            longitude={place.lng}
            image={{ symbol: visited ? 'green' : 'gray' }}
            tintColor={visited ? token.accent.fillColor : undefined}
            caption={{
              text: place.name,
              color: adaptive.grey900,
              // The caption is drawn over map tiles, not over a surface, so it
              // needs its own ground to stay legible on a bright one.
              haloColor: adaptive.background,
            }}
            onTap={() => onSelect(place.id)}
          />
        );
      })}
    </NaverMapView>
  );
}

/**
 * What 지도 shows when the app was built without `EXPO_PUBLIC_NAVER_MAP_CLIENT_ID`.
 *
 * The Naver SDK does not surface that failure — it renders an empty tile
 * surface and no error — so without this the screen looks broken rather than
 * unconfigured, and the list underneath looks broken with it. It is not.
 */
function MapUnavailable() {
  const adaptive = useAdaptive();

  return (
    <View style={[StyleSheet.absoluteFill, styles.unavailable, { backgroundColor: adaptive.background }]}>
      <Txt typography="t5" fontWeight="bold" color={adaptive.grey900}>
        지도를 표시할 수 없어요
      </Txt>
      <Txt typography="t7" color={adaptive.grey600} textAlign="center">
        네이버 지도 클라이언트 ID 없이 빌드됐습니다.{'\n'}
        아래 촬영지 목록은 그대로 동작합니다.
      </Txt>
      <Txt typography="t7" color={adaptive.grey400}>
        EXPO_PUBLIC_NAVER_MAP_CLIENT_ID
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  unavailable: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: Shape.gutter,
  },
});
