import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { cropForRatio, FULL_CROP, mosaicAt, moveCrop, stagePoint } from '../src/features/capture/editor-model.ts';

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
describe('photo crop geometry', () => {
  it('keeps every ratio and zoom within portrait and landscape source pixels', () => {
    for (const photo of [{ width: 3000, height: 4000 }, { width: 4000, height: 3000 }]) {
      for (const ratio of [1, 3 / 4, 4 / 3, 16 / 9]) {
        for (const zoom of [1, 1.5, 3]) {
          const crop = cropForRatio(photo, ratio, zoom);
          near(crop.width * photo.width / (crop.height * photo.height), ratio);
          assert.ok(crop.x >= 0 && crop.y >= 0);
          assert.ok(crop.x + crop.width <= 1 && crop.y + crop.height <= 1);
          near(crop.x + crop.width / 2, 0.5);
          near(crop.y + crop.height / 2, 0.5);
        }
      }
    }
  });
  it('clamps drags at all edges and maps stage touches back into the cropped source', () => {
    const crop = cropForRatio({ width: 4000, height: 3000 }, 1, 2);
    assert.deepEqual(moveCrop(crop, -100, -100), { ...crop, x: 0, y: 0 });
    const moved = moveCrop(crop, 100, 100);
    near(moved.x + moved.width, 1);
    near(moved.y + moved.height, 1);
    const point = stagePoint({ x: 150, y: 150 }, { width: 300, height: 300 }, crop);
    near(point.x, 0.5); near(point.y, 0.5);
  });
  it('original ratio restores full image and minimum/maximum zoom are bounded', () => {
    const photo = { width: 3000, height: 4000 };
    assert.deepEqual(cropForRatio(photo, 3 / 4), FULL_CROP);
    assert.deepEqual(cropForRatio(photo, 3 / 4, 0), FULL_CROP);
    assert.deepEqual(cropForRatio(photo, 3 / 4, 100), cropForRatio(photo, 3 / 4, 3));
  });
  it('mosaic regions remain square in source pixels and fully inside each edge', () => {
    const photo = { width: 4000, height: 3000 };
    for (const point of [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 0.5, y: 0.5 }]) {
      const patch = mosaicAt(point, 0.2, photo, 1, 65);
      near(patch.width * photo.width, patch.height * photo.height);
      assert.ok(patch.x >= 0 && patch.y >= 0 && patch.x + patch.width <= 1 && patch.y + patch.height <= 1);
    }
  });
});

describe('native camera lens selection', () => {
  it('passes native names through, preferring the physical normal camera over virtual cameras', async () => {
    const { preferredLens, cameraLensOptions } = await import('../src/features/capture/camera-lenses.ts');
    const names = ['Back Triple Camera', 'Back Ultra Wide Camera', 'Back Camera'];
    assert.equal(preferredLens(names), 'Back Camera');
    assert.deepEqual(cameraLensOptions(names), [
      { id: 'Back Ultra Wide Camera', label: '광각 0.5×' },
      { id: 'Back Camera', label: '일반 1×' },
    ]);
  });
  it('handles Korean names and never labels an unknown or virtual camera as normal', async () => {
    const { preferredLens, cameraLensOptions, lensKind } = await import('../src/features/capture/camera-lenses.ts');
    assert.equal(preferredLens(['후면 울트라 와이드 카메라', '후면 카메라']), '후면 카메라');
    assert.equal(lensKind('Back Dual Wide Camera'), null);
    assert.equal(preferredLens(['Unrecognized camera']), undefined);
    assert.deepEqual(cameraLensOptions(['Unrecognized camera']), [{ id: 'Unrecognized camera', label: 'Unrecognized camera' }]);
  });
});
