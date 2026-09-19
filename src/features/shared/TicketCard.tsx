import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { SdsColors, Txt, useAdaptive } from '@/design-system';
import Svg, { Line } from 'react-native-svg';
import { Code128 } from './Code128';
import { PindomMark } from './PindomMark';
import { TicketFoil } from './TicketFoil';

/** The stub's width on the full card. 티켓 절취 tears along this boundary. */
export const TICKET_STUB_WIDTH = 94;
export const TICKET_ASPECT = 300 / 200;
const TILE_STUB_WIDTH = 28;
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
  /** Disable independent sweeps when rendering the two synchronized tear halves. */
  animate?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Shared holographic souvenir ticket, including the original tear boundary. */
export function TicketCard({
  placeName,
  subtitle,
  serial,
  issuedAt,
  spent = false,
  size = 'full',
  animate = size === 'full',
  style,
}: TicketCardProps) {
  const tile = size === 'tile';
  const adaptive = useAdaptive();
  const accent = SdsColors.ticketInk;
  const [{ width, height }, setLayout] = useState({ width: 0, height: 0 });
  const compact = !tile && width > 0 && width < 290;

  // A 17-character serial is some 220 modules — far wider than the stub. The
  // code runs along the stub's height instead, which is what a real stub does.
  const barcodeLength = Math.max(0, height - 36);

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setLayout(e.nativeEvent.layout)}
      accessible={!tile}
      accessibilityLabel={`${placeName}, ${subtitle ?? ''}, ${formatStamp(issuedAt)}, ${serial}, ${spent ? '사용 완료' : '사용 가능'}`}
      style={[
        styles.card,
        tile ? styles.cardTile : styles.cardFull,
        { backgroundColor: adaptive.grey100 },
        style,
      ]}
    >
      <TicketFoil animate={animate} spent={spent} />
      <View style={[styles.main, tile && styles.mainTile, compact && styles.mainCompact]}>
        <View style={[styles.heading, compact && styles.headingCompact]}>
          <View style={styles.brand}>
            <PindomMark size={tile || compact ? 17 : 22} color={accent} />
          <Txt
            typography="st13"
            fontWeight="bold"
            color={accent}
            style={[styles.label, (tile || compact) && styles.labelTile]}
            numberOfLines={1}
          >
            {tile || compact ? 'PINDOM' : 'PINDOM TICKET'}
          </Txt>
          </View>
          <Txt
            allowFontScaling={tile}
            typography={compact ? 't7' : tile ? 't6' : 't4'}
            fontWeight="bold"
            color={SdsColors.ticketInk}
            numberOfLines={2}
          >
            {placeName}
          </Txt>
          {subtitle != null && !tile && !compact && (
            <Txt typography="st13" color={SdsColors.ticketInk} numberOfLines={1}>
              {subtitle}
            </Txt>
          )}
        </View>
        <View style={[styles.stamp, compact && styles.stampCompact]}>
          <Txt typography="st13" color={SdsColors.ticketInk} style={styles.mono}>
              {formatStamp(issuedAt)}{!tile && !compact ? ' · GPS ✓' : ''}
          </Txt>
          <Txt
            typography="st13"
            fontWeight="medium"
            color={accent}
            style={[styles.mono, (tile || compact) && styles.monoTile]}
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
              stroke={SdsColors.ticketInk}
              strokeWidth={1}
              strokeOpacity={0.25}
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
              <Code128 value={serial} height={30} length={barcodeLength} color={SdsColors.ticketInk} />
            </View>
          </View>
        )}
        <Txt
          typography="st13"
          fontWeight="medium"
          color={SdsColors.ticketInk}
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
    flexDirection: 'row',
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardFull: { aspectRatio: TICKET_ASPECT },
  cardTile: {
    minHeight: 160,
  },
  main: {
    flex: 1,
    minWidth: 0,
    padding: 16,
    gap: 12,
    justifyContent: 'space-between',
  },
  mainCompact: { padding: 10, gap: 8 },
  headingCompact: { gap: 5 },
  stampCompact: { gap: 3 },
  mainTile: {
    padding: 12,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heading: {
    gap: 8,
  },
  label: {
    letterSpacing: 1.5,
  },
  labelTile: {
    letterSpacing: 1,
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
    fontSize: 10,
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
    backgroundColor: 'rgba(255,255,255,0.16)',
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
