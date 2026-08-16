/**
 * Colour helpers for cases where a hex string is not enough.
 *
 * Reanimated worklets run on the UI thread and cannot call arbitrary JS, so a
 * component that needs to interpolate a colour's alpha inside a worklet must
 * capture the numeric channels on the JS side first. `hexToRgbChannels` exists
 * for exactly that hand-off.
 */
export interface RgbChannels {
  r: number;
  g: number;
  b: number;
}

/** Parse `#RGB` or `#RRGGBB(AA)` into 0–255 channels. */
export function hexToRgbChannels(hex: string): RgbChannels {
  const h = hex.replace('#', '');
  if (h.length === 3) {
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
    };
  }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}
