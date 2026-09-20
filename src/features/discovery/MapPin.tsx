import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { SdsColors, Txt, useAdaptive, useTheme } from '@/design-system';
import { readableOn } from '@/design-system/utils/color';

/** The pushpin graphic's box: head and collar on top, needle down to its point. */
const PIN_W = 24;
const PIN_H = 34;
/** A recommendation's dot. Smaller than a 촬영지 pin: it is not a place you verify at. */
const DOT = 12;
/** Label-free marker bounds and geographic anchors. */
export const MAP_PIN_WIDTH = PIN_W;
export const MAP_PIN_HEIGHT = PIN_H;
export const MAP_PIN_ANCHOR = { x: 0.5, y: 1 };
export const MAP_POI_ANCHOR = { x: 0.5, y: 0.5 };
/** Switch at neighbourhood scale; native overlays handle the zoom boundary. */
export const MAP_PIN_MIN_ZOOM = 12;

interface MapPinProps {
  /** A verified place takes the accent and a `✓`; an unverified one is surface and rule. */
  visited: boolean;
  /** Actual place name, retained for accessibility. Native captions render it at close zoom. */
  label: string;
  /**
   * A stop's 1-based place in a course's walk order. Set, the head carries the
   * number instead of the visited mark: the first stop in the accent fill and
   * the rest in the soft accent (fidelity A-15).
   */
  order?: number;
  /**
   * A café · 음식점 · 관광지 the assistant recommended, not a 촬영지. Drawn as a
   * small hollow dot so a glance separates "티켓이 나오는 곳" from "가는 길에
   * 들를 곳" — the two never carry the same weight on one map.
   */
  poi?: boolean;
  compact?: boolean;
}

/**
 * The pushpin: a round head over a flared collar, a needle down to the point.
 * `fill` colours the head and collar; the needle stays metal-grey so the
 * silhouette reads as 압정 — the object the app is named for — at every fill.
 */
function PushPin({ fill, stroke, needle }: { fill: string; stroke?: string; needle: string }) {
  return (
    <Svg width={PIN_W} height={PIN_H} viewBox={`0 0 ${PIN_W} ${PIN_H}`}>
      <Path d="M10.6 19.5 L13.4 19.5 L12 33 Z" fill={needle} />
      <Path
        d="M4 16.5 C4 13 7.5 11.5 12 11.5 C16.5 11.5 20 13 20 16.5 C20 18.6 16.6 19.8 12 19.8 C7.4 19.8 4 18.6 4 16.5 Z"
        fill={fill}
        {...(stroke && { stroke, strokeWidth: 1 })}
      />
      <Path d="M9 6 h6 v7 h-6 Z" fill={fill} />
      <Circle cx={12} cy={7} r={6.8} fill={fill} {...(stroke && { stroke, strokeWidth: 1 })} />
    </Svg>
  );
}

/**
 * One 촬영지 on 지도.
 *
 * A pushpin rather than 1a's teardrop — PINDOM's own object. Visited places
 * take the accent fill and a ✓ on the head; unvisited ones the surface fill
 * and a hairline. On 추천 코스 the same pin is a stop: the head carries its
 * number, the first stop in the deep accent and the rest in the light one.
 *
 * Lives in the Discovery slice rather than the design system until a third
 * screen draws pins (fidelity decision 8). It is used twice: absolutely placed
 * on the stand-in canvas, and as the custom child of a tile marker.
 */
export function MapPin({ visited, label, order, poi, compact }: MapPinProps) {
  const adaptive = useAdaptive();
  const { token } = useTheme();

  const accented = order != null || visited;
  const fill = order != null
    ? (order === 1 ? token.accent.fillColor : token.accent.softColor)
    : visited
      ? token.accent.fillColor
      : adaptive.background;

  const badgeInk = readableOn(fill, { onLight: SdsColors.ticketInk, onDark: SdsColors.ink });

  return (
    <View style={styles.pin} pointerEvents="none" accessibilityLabel={label}>
      {poi || compact ? (
        <View style={styles.graphic}>
          <View
            style={[
              styles.dot,
              { backgroundColor: poi ? adaptive.background : token.accent.fillColor, borderColor: poi ? adaptive.grey600 : adaptive.background },
            ]}
          />
        </View>
      ) : (
        <View style={styles.graphic}>
          <PushPin
            fill={fill}
            stroke={accented ? undefined : adaptive.grey300}
            needle={adaptive.grey500}
          />
          {/* The head's badge — the walk number, or the visited mark. */}
          <View style={styles.badge}>
            {order != null ? (
              <Txt typography="st12" fontWeight="bold" color={badgeInk}>
                {order}
              </Txt>
            ) : visited ? (
              <Txt typography="st12" fontWeight="bold" color={badgeInk}>
                ✓
              </Txt>
            ) : null}
          </View>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: MAP_PIN_WIDTH,
    height: MAP_PIN_HEIGHT,
    alignItems: 'center',
  },
  graphic: {
    width: PIN_W,
    height: PIN_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Over the head circle: its centre is at y=7 in the 34px graphic.
  badge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 2,
  },
});
