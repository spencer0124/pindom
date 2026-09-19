/** Image-space coordinates keep edits attached to the photo while cropping. */
export interface Point { x: number; y: number }
export interface Rect extends Point { width: number; height: number }
export interface PhotoSize { width: number; height: number }
export interface Mosaic extends Rect { id: number; strength: number }
export interface Sticker extends Point { id: number; glyph: string; size: number }
export interface PhotoEdits { crop: Rect; mosaics: Mosaic[]; stickers: Sticker[] }

export const FULL_CROP: Rect = { x: 0, y: 0, width: 1, height: 1 };
export const EMPTY_EDITS: PhotoEdits = { crop: FULL_CROP, mosaics: [], stickers: [] };
export const MAX_OVERLAYS = 20;
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function moveCrop(crop: Rect, dx: number, dy: number): Rect {
  return { ...crop, x: clamp(crop.x + dx, 0, 1 - crop.width), y: clamp(crop.y + dy, 0, 1 - crop.height) };
}

/** Largest crop at the requested ratio, centered on the previous crop. */
export function cropForRatio(photo: PhotoSize, ratio: number, zoom = 1, previous = FULL_CROP): Rect {
  const sourceRatio = photo.width / photo.height;
  const width = Math.min(1, ratio / sourceRatio) / clamp(zoom, 1, 3);
  const height = Math.min(1, sourceRatio / ratio) / clamp(zoom, 1, 3);
  return {
    width, height,
    x: clamp(previous.x + previous.width / 2 - width / 2, 0, 1 - width),
    y: clamp(previous.y + previous.height / 2 - height / 2, 0, 1 - height),
  };
}

export function stagePoint(point: Point, stage: PhotoSize, crop: Rect): Point {
  return {
    x: clamp(crop.x + point.x / stage.width * crop.width, 0, 1),
    y: clamp(crop.y + point.y / stage.height * crop.height, 0, 1),
  };
}

export function mosaicAt(center: Point, size: number, photo: PhotoSize, id: number, strength: number): Mosaic {
  const width = clamp(size, 0.04, 0.8);
  const height = Math.min(1, width * photo.width / photo.height);
  return { id, strength, width, height, x: clamp(center.x - width / 2, 0, 1 - width), y: clamp(center.y - height / 2, 0, 1 - height) };
}

/** Opaque sample blocks; strength never lowers the covering area's opacity. */
export const PIXELATE_SHADER = `
uniform shader photo;
uniform float blockSize;
uniform float2 imageSize;
half4 main(float2 xy) {
  float2 sampleAt = floor((floor(xy / blockSize) + 0.5) * blockSize) + 0.5;
  return photo.eval(clamp(sampleAt, float2(0.5), imageSize - 0.5));
}`;
