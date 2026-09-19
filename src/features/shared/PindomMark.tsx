import Svg, { Path } from 'react-native-svg';
import { SdsColors } from '@/design-system';
import { PINDOM_PIN_PATH, PINDOM_HEART_PATH } from './pindom-mark';

/** A heart at a location: the place you love, pinned. */
export function PindomMark({ size = 28, color = SdsColors.brand500, filled = false }: {
  size?: number;
  color?: string;
  filled?: boolean;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" accessible={false}>
      <Path
        d={PINDOM_PIN_PATH}
        fill={filled ? color : 'none'} stroke={color} strokeWidth={2} strokeLinejoin="round"
      />
      <Path
        d={PINDOM_HEART_PATH}
        fill={filled ? SdsColors.ink : color}
      />
    </Svg>
  );
}
