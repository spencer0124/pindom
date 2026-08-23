import {
  NaverMapMarkerOverlay,
  NaverMapPathOverlay,
  NaverMapPolylineOverlay,
  NaverMapView,
} from '@mj-studio/react-native-naver-map';
import { useEffect, useMemo, useState } from 'react';
import { type LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import Svg, { Polyline } from 'react-native-svg';
import { Txt, useAdaptive, useTheme } from '@/design-system';
import type { PlaceWithDistance } from '@/lib/domain';
import { AppConfig } from '@/lib/config';
import { Shape } from '@/features/shared';
import { MAP_PIN_HEIGHT, MAP_PIN_WIDTH, MapPin } from './MapPin';
import { KOREA_CENTRE, type Position } from './position';

/** Whole-country framing, which is where 1a opens the map (fidelity decision 12). */
const COUNTRY_ZOOM = 6;
/** 1a's `pinDrop .5s` — every pin drops at once, no stagger. */
const DROP_MS = 500;
/** How far the stand-in keeps its pins from the edge of the field, as a share of it. */
const FIELD_INSET = 0.12;
/**
 * 1a's route through a course's stops (fidelity A-14): one polyline drawn
 * twice — a 2.6 surface halo under a 1.4 accent line dashed `3 2.2`, round
 * caps and joins. The tile SDK takes the dash as whole units.
 */
const ROUTE_WIDTH = 1.4;
const ROUTE_HALO_WIDTH = 2.6;
const ROUTE_DASH = 3;
const ROUTE_GAP = 2.2;
/**
 * The SDK's own layer for a 경로선 — under the markers, over the map — given
 * to both route overlays so their `zIndex` orders the halo under the line.
 */
const ROUTE_LAYER = -100000;

/**
 * `proto.css`'s `pinDrop`: from 16px above at .7, past 2px below at 1.06, to rest.
 * The easing is 1a's own `cubic-bezier(.2,.9,.3,1)`, applied to each leg as CSS does.
 */
const pinDrop = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: -16 }, { scale: 0.7 }] },
  60: {
    opacity: 1,
    transform: [{ translateY: 2 }, { scale: 1.06 }],
    easing: Easing.bezier(0.2, 0.9, 0.3, 1),
  },
  100: {
    opacity: 1,
    transform: [{ translateY: 0 }, { scale: 1 }],
    easing: Easing.bezier(0.2, 0.9, 0.3, 1),
  },
}).duration(DROP_MS);

/** Room the canvas keeps clear — the chrome floating over it, for instance. */
export interface MapInset {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

interface MapCanvasProps {
  places: PlaceWithDistance[];
  visitedPlaceIds: string[];
  /**
   * Retained for 추천 코스's call site. The camera opens on the country frame
   * regardless (fidelity decision 12), so nothing reads it here any more.
   */
  origin?: Position;
  hasPosition: boolean;
  /**
   * Re-plays the pin drop when it changes — 지도 passes the selected 최애, so a
   * switch drops the new set the way 1a's re-render does. Unset, pins drop once.
   */
  dropKey?: string;
  /** Forwarded to the SDK as `mapPadding`; the stand-in keeps the same room clear. */
  inset?: MapInset;
  /**
   * An ordered route through the stops, for 추천 코스: a dashed accent line
   * with a surface halo, drawn under the pins (fidelity A-14). Straight
   * segments between the coordinates the client already holds — not a
   * geometry the server owns (fidelity decision 20).
   */
  path?: Position[];
  /**
   * `places` are a course's stops in walk order: each pin is numbered, the
   * first in the accent fill and the rest in the soft accent, and captioned
   * with the place's name (fidelity A-15). Unset, 지도's visited/unvisited
   * pins captioned with the region.
   */
  ordered?: boolean;
  onSelect: (placeId: string) => void;
}

/**
 * The 지도 surface: real tiles, real coordinates, one marker per 촬영지.
 *
 * A verified place is marked in the accent and an unverified one is muted —
 * that pairing is the whole point of the screen in `1a`, where visited pins are
 * one colour and unvisited another. The pin is `MapPin`, the same component on
 * tiles and on the stand-in.
 *
 * 1a drops every pin on entry (`pinDrop`). The SDK rasterises a marker's custom
 * child to an image on iOS, so nothing can animate *inside* a marker; on tiles
 * the markers mount hidden and are shown once the drop would have finished
 * (fidelity decision 7). The stand-in — what every run of this repo draws,
 * there being no client id — plays the drop itself.
 */
export function MapCanvas({
  places,
  visitedPlaceIds,
  hasPosition,
  dropKey,
  inset,
  path,
  ordered,
  onSelect,
}: MapCanvasProps) {
  if (!AppConfig.naverMapConfigured) {
    return (
      <StandIn
        places={places}
        visitedPlaceIds={visitedPlaceIds}
        dropKey={dropKey}
        inset={inset}
        path={path}
        ordered={ordered}
        onSelect={onSelect}
      />
    );
  }

  return (
    <Tiles
      places={places}
      visitedPlaceIds={visitedPlaceIds}
      hasPosition={hasPosition}
      dropKey={dropKey}
      inset={inset}
      path={path}
      ordered={ordered}
      onSelect={onSelect}
    />
  );
}

/** What a pin reads for a place: its number and caption under `ordered`, 지도's region otherwise. */
function pinProps(
  place: PlaceWithDistance,
  index: number,
  ordered: boolean | undefined,
): { order?: number; label: string } {
  return ordered ? { order: index + 1, label: place.name } : { label: place.region };
}

type TilesProps = Omit<MapCanvasProps, 'origin'>;

function Tiles({ places, visitedPlaceIds, hasPosition, dropKey, inset, path, ordered, onSelect }: TilesProps) {
  const adaptive = useAdaptive();
  const { token } = useTheme();
  // Hidden until the drop's duration has passed, then shown together — the
  // cheap reveal decision 7 settles on, re-armed on every 최애 switch.
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    setRevealed(false);
    const timer = setTimeout(() => setRevealed(true), DROP_MS);
    return () => clearTimeout(timer);
  }, [dropKey]);

  const routeCoords = useMemo(
    () => (path ?? []).map((p) => ({ latitude: p.lat, longitude: p.lng })),
    [path],
  );

  return (
    <NaverMapView
      style={StyleSheet.absoluteFill}
      initialCamera={{
        latitude: KOREA_CENTRE.lat,
        longitude: KOREA_CENTRE.lng,
        zoom: COUNTRY_ZOOM,
      }}
      mapPadding={inset}
      isShowLocationButton={hasPosition}
      locale="ko"
    >
      {places.map((place, index) => {
        const visited = visitedPlaceIds.includes(place.id);
        const pin = pinProps(place, index, ordered);
        return (
          <NaverMapMarkerOverlay
            key={place.id}
            latitude={place.lat}
            longitude={place.lng}
            width={MAP_PIN_WIDTH}
            height={MAP_PIN_HEIGHT}
            isHidden={!revealed}
            onTap={() => onSelect(place.id)}
          >
            {/* The SDK redraws a custom child only when the top child's key
                changes, so everything the pin's look depends on is in it. */}
            <View
              key={`${place.id}/${visited}/${pin.order ?? ''}/${pin.label}`}
              collapsable={false}
              style={styles.markerChild}
            >
              <MapPin visited={visited} {...pin} />
            </View>
          </NaverMapMarkerOverlay>
        );
      })}
      {/* The route: a path overlay as the halo, a dashed polyline over it.
          The SDK's `pattern` is declared on the polyline but not forwarded
          to the native view in the pinned version, so on tiles the line is
          solid until it is — the halo and the colour still read as the route. */}
      {routeCoords.length >= 2 && (
        <>
          <NaverMapPathOverlay
            coords={routeCoords}
            width={ROUTE_HALO_WIDTH}
            color={adaptive.background}
            outlineWidth={0}
            globalZIndex={ROUTE_LAYER}
            zIndex={0}
          />
          <NaverMapPolylineOverlay
            coords={routeCoords}
            width={ROUTE_WIDTH}
            color={token.accent.fillColor}
            pattern={[ROUTE_DASH, Math.round(ROUTE_GAP)]}
            capType="Round"
            joinType="Round"
            globalZIndex={ROUTE_LAYER}
            zIndex={1}
          />
        </>
      )}
    </NaverMapView>
  );
}

interface Point {
  x: number;
  y: number;
}

interface Field {
  width: number;
  height: number;
}

/**
 * Project lat/lng into the stand-in's box.
 *
 * An equal-scale fit of the places' bounds into the field, inset by
 * `FIELD_INSET` on each side and by `inset` where the chrome sits. Longitude
 * is foreshortened by the cosine of the middle latitude so the country keeps
 * its shape instead of being stretched to the box. A single place, or a set
 * on one line, is centred on the axis it has no range on.
 */
function projector(places: Position[], field: Field, inset: MapInset = {}) {
  const lats = places.map((p) => p.lat);
  const lngs = places.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const stretch = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);

  const left = (inset.left ?? 0) + field.width * FIELD_INSET;
  const top = (inset.top ?? 0) + field.height * FIELD_INSET;
  const spanX = field.width - left - (inset.right ?? 0) - field.width * FIELD_INSET;
  const spanY = field.height - top - (inset.bottom ?? 0) - field.height * FIELD_INSET;

  const rangeX = (maxLng - minLng) * stretch;
  const rangeY = maxLat - minLat;
  const scale = Math.min(
    rangeX > 0 ? spanX / rangeX : Number.POSITIVE_INFINITY,
    rangeY > 0 ? spanY / rangeY : Number.POSITIVE_INFINITY,
  );
  const fit = Number.isFinite(scale) ? scale : 0;
  const offsetX = left + (spanX - rangeX * fit) / 2;
  const offsetY = top + (spanY - rangeY * fit) / 2;

  return (p: Position): Point => ({
    x: offsetX + (p.lng - minLng) * stretch * fit,
    y: offsetY + (maxLat - p.lat) * fit,
  });
}

type StandInProps = Omit<MapCanvasProps, 'origin' | 'hasPosition'>;

/**
 * What 지도 shows when the app was built without `EXPO_PUBLIC_NAVER_MAP_CLIENT_ID`.
 *
 * The Naver SDK does not surface that failure — it renders an empty tile
 * surface and no error — so without this the screen looks broken rather than
 * unconfigured. It is a real map of the places, not a notice: every pin is
 * drawn at its normalised coordinate, tappable, and dropped on entry and on a
 * 최애 switch exactly as 1a does. The one line at the foot says why there are
 * no tiles under them.
 */
function StandIn({ places, visitedPlaceIds, dropKey, inset, path, ordered, onSelect }: StandInProps) {
  const adaptive = useAdaptive();
  const [field, setField] = useState<Field | null>(null);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setField({ width, height });
  };

  const project = useMemo(
    () => (field != null && places.length > 0 ? projector(places, field, inset) : null),
    [places, field, inset],
  );
  const route = useMemo(
    () => (project != null && path != null ? path.map(project) : []),
    [project, path],
  );

  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: adaptive.background }]}
      onLayout={onLayout}
    >
      {/* Keyed on the 최애 so a switch unmounts the field and the new one drops. */}
      <View key={dropKey ?? 'pins'} style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {field != null && <RouteSlot points={route} field={field} />}
        {project != null &&
          places.map((place, index) => {
            const { x, y } = project(place);
            return (
              <Animated.View
                key={place.id}
                entering={pinDrop}
                style={[
                  styles.pinSlot,
                  // 1a's `translate(-50%,-100%)`: the pin stands on its point.
                  { left: x - MAP_PIN_WIDTH / 2, top: y - MAP_PIN_HEIGHT },
                ]}
              >
                <Pressable
                  onPress={() => onSelect(place.id)}
                  accessibilityRole="button"
                  accessibilityLabel={place.name}
                  hitSlop={6}
                >
                  <MapPin visited={visitedPlaceIds.includes(place.id)} {...pinProps(place, index, ordered)} />
                </Pressable>
              </Animated.View>
            );
          })}
      </View>

      <View style={styles.notice} pointerEvents="none">
        <Txt typography="t7" color={adaptive.grey400} numberOfLines={1}>
          네이버 지도 클라이언트 ID 없이 빌드됐습니다 · EXPO_PUBLIC_NAVER_MAP_CLIENT_ID
        </Txt>
      </View>
    </View>
  );
}

/**
 * The stand-in's route — the stops already projected into the field, in
 * order, as 1a's polyline drawn twice: the surface halo under, the dashed
 * accent line over. It sits under the pins and takes no touches. Nothing is
 * drawn for fewer than two points; a line needs two ends.
 */
function RouteSlot({ points, field }: { points: Point[]; field: Field }) {
  const adaptive = useAdaptive();
  const { token } = useTheme();
  if (points.length < 2) return null;

  const line = points.map((p) => `${p.x},${p.y}`).join(' ');
  return (
    <Svg width={field.width} height={field.height} style={styles.route} pointerEvents="none">
      <Polyline
        points={line}
        fill="none"
        stroke={adaptive.background}
        strokeWidth={ROUTE_HALO_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polyline
        points={line}
        fill="none"
        stroke={token.accent.fillColor}
        strokeWidth={ROUTE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={[ROUTE_DASH, ROUTE_GAP]}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  route: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  markerChild: {
    width: MAP_PIN_WIDTH,
    height: MAP_PIN_HEIGHT,
  },
  pinSlot: {
    position: 'absolute',
  },
  notice: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Shape.gutter,
    paddingBottom: 6,
    alignItems: 'center',
  },
});
