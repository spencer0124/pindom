/** Position is relative to the camera viewport, independent of its pixel size. */
export interface CutoutPose { x: number; y: number; height: number; mirrored: boolean }
export interface CutoutDraft { uri: string; aspectRatio: number; pose: CutoutPose }
export interface Viewport { width: number; height: number }

export const DEFAULT_CUTOUT_POSE: CutoutPose = { x: 0.32, y: 0.58, height: 0.72, mirrored: false };
export const MIN_CUTOUT_HEIGHT = 0.2;
export const MAX_CUTOUT_HEIGHT = 0.95;
const clamp = (n: number, low: number, high: number) => Math.max(low, Math.min(high, n));

export function cutoutRect(pose: CutoutPose, aspectRatio: number, viewport: Viewport) {
  const ratio = Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : 0.5;
  const height = Math.min(
    clamp(pose.height, MIN_CUTOUT_HEIGHT, MAX_CUTOUT_HEIGHT) * viewport.height,
    viewport.width * MAX_CUTOUT_HEIGHT / ratio,
  );
  const width = height * ratio;
  return {
    x: clamp(pose.x * viewport.width - width / 2, 0, viewport.width - width),
    y: clamp(pose.y * viewport.height - height / 2, 0, viewport.height - height),
    width, height,
  };
}

export function moveCutout(pose: CutoutPose, aspectRatio: number, viewport: Viewport, dx: number, dy: number): CutoutPose {
  if (viewport.width <= 0 || viewport.height <= 0) return pose;
  const rect = cutoutRect(pose, aspectRatio, viewport);
  return { ...pose,
    x: (clamp(rect.x + dx, 0, viewport.width - rect.width) + rect.width / 2) / viewport.width,
    y: (clamp(rect.y + dy, 0, viewport.height - rect.height) + rect.height / 2) / viewport.height,
  };
}
