import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { cutoutRect, moveCutout, DEFAULT_CUTOUT_POSE } from '../src/features/capture/cutout-model.ts';

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
describe('camera cutout composition geometry', () => {
  it('keeps portrait and landscape cutouts fully visible at all camera edges', () => {
    for (const aspectRatio of [0.25, 0.75, 1.5, 3]) {
      for (const viewport of [{ width: 300, height: 400 }, { width: 1200, height: 1600 }]) {
        for (const height of [0.2, 0.72, 0.95]) {
          for (const position of [-10, 0.5, 10]) {
            const rect = cutoutRect({ x: position, y: position, height, mirrored: false }, aspectRatio, viewport);
            assert.ok(rect.x >= 0 && rect.y >= 0);
            assert.ok(rect.x + rect.width <= viewport.width + 1e-8);
            assert.ok(rect.y + rect.height <= viewport.height + 1e-8);
            near(rect.width / rect.height, aspectRatio);
          }
        }
      }
    }
  });
  it('exports the same normalized bounds at 4x resolution without distorting the PNG', () => {
    const preview = cutoutRect(DEFAULT_CUTOUT_POSE, 0.4, { width: 300, height: 400 });
    const exportRect = cutoutRect(DEFAULT_CUTOUT_POSE, 0.4, { width: 1200, height: 1600 });
    for (const key of ['x', 'y', 'width', 'height']) near(exportRect[key], preview[key] * 4);
  });
  it('drags from the visible clamped position and preserves size and reflection', () => {
    const viewport = { width: 300, height: 400 };
    const pose = { ...DEFAULT_CUTOUT_POSE, x: -2, y: -2, mirrored: true };
    const moved = moveCutout(pose, 0.5, viewport, 20, 30);
    const rect = cutoutRect(moved, 0.5, viewport);
    near(rect.x, 20); near(rect.y, 30);
    assert.equal(moved.mirrored, true);
    assert.equal(moved.height, pose.height);
    assert.deepEqual(moveCutout(pose, 0.5, { width: 0, height: 0 }, 20, 30), pose);
  });
});
