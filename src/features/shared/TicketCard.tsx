import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { Txt, useAdaptive, useTheme } from '@/design-system';
import Svg, { Line } from 'react-native-svg';
import { Code128 } from './Code128';

/** The stub's width on the full card. 티켓 절취 tears along this boundary. */
export const TICKET_STUB_WIDTH = 94;
const TILE_STUB_WIDTH = 40;
const NOTCH = 14;

export interface TicketCardProps {
  placeName: string;
  /** `강원 강릉 · MV 촬영` — omitted when the caller has no place to derive it from. */
  subtitle?: string;
  serial: string;
  issuedAt: Date;
  /** 티켓 절취 renders the spent stub; 티켓 발행 and 컬렉션 never do. */
  spent?: boolean;
  /**
   * `full` is the ticket — 티켓 발행 and 티켓 절취. `tile` is 컬렉션's grid cell: the
   * same object at a quarter of the area, so the barcode and subtitle go and the
   * stub keeps only its word.
   */
  size?: 'full' | 'tile';
  style?: StyleProp<ViewStyle>;
}

/**
 * The ticket — 1c's layout on 2b's surface.
 *
 * The layout is `1c`-A's, the variant the prototype applied: a main panel with
 * the wordmark, the place and the stamp; a perforation with punched notches; a
 * stub with the barcode and ADMIT ONE. Its hologram is a colour treatment, and
 * colour is `2b`'s axis — so the card is a print on the chrome ground, acid for
 * the label and the serial, square corners, a hairline rather than a shadow.
 * That also answers most of design/README.md's open question 1: what was open
 * was the surface, and the direction had already decided it. The 반권 mechanic
 * `1c`-C adds is 티켓 절취's, built on this same perforation.
 *
 * Shared because 컬렉션 and 티켓 절취 draw the same object — a second ticket
 * component is how two screens end up with two tickets. The card itself is
 * still; the hold-and-tilt the prototype gives it is `HoloTilt`'s, wrapped
 * around this where a screen wants it.
 */
export function TicketCard({
  placeName,
  subtitle,
  serial,
  issuedAt,
  spent = false,
  size = 'full',
  style,
}: TicketCardProps) {
  const tile = size === 'tile';
  const adaptive = useAdaptive();
  const { token } = useTheme();
  const accent = token.accent.fillColor;
  const [height, setHeight] = useState(0);

  // A 17-character serial is some 220 modules — far wider than the stub. The
  // code runs along the stub's height instead, which is what a real stub does.
  const barcodeLength = Math.max(0, height - 36);

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setHeight(e.nativeEvent.layout.height)}
      style={[
        styles.card,
        tile && styles.cardTile,
        { backgroundColor: adaptive.background, borderColor: adaptive.grey200 },
        style,
      ]}
    >
      <View style={[styles.main, tile && styles.mainTile]}>
        <View style={styles.heading}>
          <Txt
            typography="st13"
            fontWeight="bold"
            color={accent}
            style={[styles.label, tile && styles.labelTile]}
            numberOfLines={1}
          >
            PINDOM TICKET
          </Txt>
          <Txt
            typography={tile ? 't7' : 't4'}
            fontWeight="bold"
            color={adaptive.grey900}
            numberOfLines={tile ? 2 : 1}
          >
            {placeName}
          </Txt>
          {subtitle != null && !tile && (
            <Txt typography="st13" color={adaptive.grey600} numberOfLines={1}>
              {subtitle}
            </Txt>
          )}
        </View>
        <View style={styles.stamp}>
          {!tile && (
            <Txt typography="st13" color={adaptive.grey700} style={styles.mono}>
              {formatStamp(issuedAt)} · GPS ✓
            </Txt>
          )}
          <Txt
            typography="st13"
            fontWeight="medium"
            color={spent ? adaptive.grey500 : accent}
            style={[styles.mono, tile && styles.monoTile]}
            numberOfLines={1}
          >
            {serial}
          </Txt>
        </View>
      </View>

      {/* The perforation: a dashed rule with a notch punched at either end.
          Drawn in SVG — React Native only honours a dashed borderStyle when
          all four sides carry a border, so a lone dashed left edge vanishes. */}
      <View style={styles.perforation} pointerEvents="none">
        {height > 0 && (
          <Svg width={2} height={height} style={styles.dash}>
            <Line
              x1={1}
              y1={0}
              x2={1}
              y2={height}
              stroke={adaptive.grey300}
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
          </Svg>
        )}
        <View
          style={[
            styles.notch,
            styles.notchTop,
            { backgroundColor: adaptive.greyBackground, borderColor: adaptive.grey200 },
          ]}
        />
        <View
          style={[
            styles.notch,
            styles.notchBottom,
            { backgroundColor: adaptive.greyBackground, borderColor: adaptive.grey200 },
          ]}
        />
      </View>

      <View style={[styles.stub, tile && styles.stubTile, spent && styles.stubSpent]}>
        {barcodeLength > 0 && !tile && (
          <View style={[styles.barcode, { width: 30, height: barcodeLength }]}>
            <View style={{ transform: [{ rotate: '90deg' }] }}>
              <Code128 value={serial} height={30} length={barcodeLength} color={adaptive.grey900} />
            </View>
          </View>
        )}
        <Txt
          typography="st13"
          fontWeight="medium"
          color={adaptive.grey500}
          style={[styles.admit, tile && styles.admitTile]}
        >
          {spent ? 'USED' : tile ? 'STUB' : 'ADMIT ONE'}
        </Txt>
      </View>
    </View>
  );
}

function formatStamp(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    aspectRatio: 300 / 168,
    flexDirection: 'row',
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardTile: {
    aspectRatio: 170 / 104,
  },
  main: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  mainTile: {
    padding: 12,
  },
  heading: {
    gap: 4,
  },
  label: {
    letterSpacing: 3,
  },
  labelTile: {
    letterSpacing: 1.2,
  },
  stamp: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 8,
  },
  mono: {
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  monoTile: {
    letterSpacing: 0,
  },
  perforation: {
    width: 0,
    alignItems: 'center',
  },
  dash: {
    position: 'absolute',
    top: 0,
    left: -1,
  },
  notch: {
    position: 'absolute',
    width: NOTCH,
    height: NOTCH,
    borderRadius: NOTCH / 2,
    borderWidth: 1,
    marginLeft: -NOTCH / 2,
  },
  notchTop: {
    top: -NOTCH / 2,
  },
  notchBottom: {
    bottom: -NOTCH / 2,
  },
  stub: {
    width: TICKET_STUB_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  stubTile: {
    width: TILE_STUB_WIDTH,
  },
  barcode: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stubSpent: {
    opacity: 0.4,
  },
  admit: {
    letterSpacing: 1.5,
    transform: [{ rotate: '90deg' }],
    width: 80,
    marginHorizontal: -28,
    textAlign: 'center',
  },
  admitTile: {
    marginHorizontal: -34,
  },
});
