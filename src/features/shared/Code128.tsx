import Svg, { Rect } from 'react-native-svg';

/**
 * Code 128 bar/space widths, one entry per symbol value 0–106. Each entry is
 * six widths summing to eleven modules; the stop symbol is seven summing to
 * thirteen. The table is the standard one — see ISO/IEC 15417.
 */
const PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312',
  '132212', '221213', '221312', '231212', '112232', '122132', '122231', '113222',
  '123122', '123221', '223211', '221132', '221231', '213212', '223112', '312131',
  '311222', '321122', '321221', '312212', '322112', '322211', '212123', '212321',
  '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121',
  '313121', '211331', '231131', '213113', '213311', '213131', '311123', '311321',
  '331121', '312113', '312311', '332111', '314111', '221411', '431111', '111224',
  '111422', '121124', '121421', '141122', '141221', '112214', '112412', '122114',
  '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112',
  '421211', '212141', '214121', '412121', '111143', '111341', '131141', '114113',
  '114311', '411113', '411311', '113141', '114131', '311141', '411131', '211412',
  '211214', '211232', '2331112',
];

const START_B = 104;
const STOP = 106;

/**
 * Encode in code set B — printable ASCII, which is all a `PD-XXXX-XXXX-XXXX`
 * serial needs. Returns the module widths, bars and spaces alternating, bar
 * first. Characters outside set B are dropped rather than thrown on: a barcode
 * that will not scan is still a barcode, a crashed 티켓 발행 is not a screen.
 */
export function encodeCode128B(text: string): number[] {
  const values: number[] = [];
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code >= 32 && code <= 126) values.push(code - 32);
  }
  let checksum = START_B;
  values.forEach((value, index) => {
    checksum += value * (index + 1);
  });
  const symbols = [START_B, ...values, checksum % 103, STOP];
  return symbols.flatMap((symbol) => [...PATTERNS[symbol]].map(Number));
}

interface Code128Props {
  value: string;
  height: number;
  /** The length to fit the whole code into; the module width follows from it. */
  length: number;
  color: string;
}

/**
 * The serial as a scannable Code 128 — the contract names the symbology for
 * 티켓 발행, and a barcode that is only bars is a drawing of one.
 */
export function Code128({ value, height, length, color }: Code128Props) {
  const widths = encodeCode128B(value);
  const total = widths.reduce((sum, w) => sum + w, 0);
  const moduleWidth = total > 0 ? length / total : 0;

  let x = 0;
  const bars: { x: number; w: number }[] = [];
  widths.forEach((w, index) => {
    if (index % 2 === 0) bars.push({ x, w });
    x += w;
  });

  return (
    <Svg width={length} height={height} accessibilityLabel={value}>
      {bars.map((bar, index) => (
        <Rect
          key={index}
          x={bar.x * moduleWidth}
          y={0}
          width={bar.w * moduleWidth}
          height={height}
          fill={color}
        />
      ))}
    </Svg>
  );
}
