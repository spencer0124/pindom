import { StyleSheet, View } from 'react-native';
import { Txt, useAdaptive, useTheme } from '@/design-system';
import { Shape } from '@/features/shared';

/** 1a's pin head — a 30px teardrop. */
const HEAD = 30;
/** 추천 코스's numbered stop — 1a's 26px disc, centred in the head's slot. */
const STOP = 26;
/** A recommendation's dot. Smaller than a 촬영지 head: it is not a place you verify at. */
const DOT = 12;
/** Between the head and its caption chip. */
const GAP = 3;
/** The caption chip's inner padding. */
const CHIP_PAD_X = 5;
const CHIP_PAD_Y = 3;
/** `t7`'s line height plus the chip's vertical padding. */
const CHIP_HEIGHT = 19.5 + CHIP_PAD_Y * 2;

/**
 * The box a pin occupies, so the stand-in can place it and a tile marker can
 * size itself before the SDK rasterises the child. Wide enough for a two-word
 * region (`강원 강릉`) at `t7`; the chip centres inside it.
 */
export const MAP_PIN_WIDTH = 96;
export const MAP_PIN_HEIGHT = HEAD + GAP + CHIP_HEIGHT;

interface MapPinProps {
  /** A verified place takes the accent and a `✓`; an unverified one is surface and rule. */
  visited: boolean;
  /** The caption under the head — the place's region (fidelity decision 11). */
  label: string;
  /**
   * A stop's 1-based place in a course's walk order. Set, the head is a
   * numbered disc instead of the visited mark: the first stop in the accent
   * fill, the rest in the soft accent (fidelity A-15).
   */
  order?: number;
  /**
   * A café · 음식점 · 관광지 the assistant recommended, not a 촬영지. Drawn as a
   * small hollow dot so a glance separates "티켓이 나오는 곳" from "가는 길에
   * 들를 곳" — the two never carry the same weight on one map.
   */
  poi?: boolean;
}

/**
 * One 촬영지 on 지도.
 *
 * 1a draws a teardrop with a white border and a shadow, filled pink when
 * visited and grey when not, and a caption chip beneath.
 *
 * On 추천 코스 the same pin is a stop: a 26px disc with its number, the start
 * in the deep accent and the rest in the light one — 1a's own start-vs-rest
 * pair — and the caption is the place's name. A disc rather than a block
 * because a numbered dot is how a route reads its stops; it is the one place
 * a pin is round.
 *
 * Lives in the Discovery slice rather than the design system until a third
 * screen draws pins (fidelity decision 8). It is used twice: absolutely placed
 * on the stand-in canvas, and as the custom child of a tile marker.
 */
export function MapPin({ visited, label, order, poi }: MapPinProps) {
  const adaptive = useAdaptive();
  const { token } = useTheme();

  return (
    <View style={styles.pin} pointerEvents="none">
      {poi ? (
        <View style={[styles.head, styles.pinShape]}>
          <View style={styles.pinInner}>
            <View
              style={[
                styles.dot,
                { backgroundColor: adaptive.background, borderColor: adaptive.grey600 },
              ]}
            />
          </View>
        </View>
      ) : order != null ? (
        <View style={[styles.head, styles.pinShape]}>
          <View style={styles.pinInner}>
            <View
              style={[
                styles.stop,
                { backgroundColor: order === 1 ? token.accent.fillColor : token.accent.softColor },
              ]}
            >
              <Txt typography="st12" fontWeight="bold" color={token.accent.onFillColor}>
                {order}
              </Txt>
            </View>
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.head,
            styles.pinShape,
            visited
              ? { backgroundColor: token.accent.fillColor }
              : { backgroundColor: adaptive.background, borderColor: adaptive.grey300, borderWidth: 1 },
          ]}
        >
          <View style={styles.pinInner}>
            {visited && (
              <Txt typography="t7" fontWeight="bold" color={token.accent.onFillColor}>
                ✓
              </Txt>
            )}
          </View>
        </View>
      )}
      <View style={[styles.chip, { backgroundColor: adaptive.background }]}>
        <Txt typography="t7" fontWeight="semibold" color={adaptive.grey900} numberOfLines={1}>
          {label}
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: MAP_PIN_WIDTH,
    height: MAP_PIN_HEIGHT,
    alignItems: 'center',
    gap: GAP,
  },
  head: {
    width: HEAD,
    height: HEAD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinShape: {
    borderRadius: HEAD / 2,
    borderBottomLeftRadius: 4,
    transform: [{ rotate: '-45deg' }],
  },
  pinInner: {
    width: HEAD,
    height: HEAD,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 2,
  },
  stop: {
    width: STOP,
    height: STOP,
    borderRadius: STOP / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    maxWidth: MAP_PIN_WIDTH,
    paddingHorizontal: CHIP_PAD_X,
    paddingVertical: CHIP_PAD_Y,
    borderRadius: Shape.chipRadius,
  },
});
