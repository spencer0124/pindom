import assert from 'node:assert/strict';
import { before, it } from 'node:test';
import CanvasKitInit from 'canvaskit-wasm';
import { PIXELATE_SHADER } from '../src/features/capture/editor-model.ts';

let CK;
before(async () => { CK = await CanvasKitInit(); });
it('renders actual source-color blocks inside the mask, leaving every outside pixel unchanged', () => {
  const width = 64, height = 48;
  const info = { width, height, alphaType: CK.AlphaType.Unpremul, colorType: CK.ColorType.RGBA_8888, colorSpace: CK.ColorSpace.SRGB };
  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) pixels.set([x * 4, y * 4, (x + y) * 2, 255], (y * width + x) * 4);
  const image = CK.MakeImage(info, pixels, width * 4);
  const effect = CK.RuntimeEffect.Make(PIXELATE_SHADER, (error) => assert.fail(error));
  assert.ok(effect);
  const source = image.makeShaderOptions(CK.TileMode.Clamp, CK.TileMode.Clamp, CK.FilterMode.Nearest, CK.MipmapMode.None);
  const shader = effect.makeShaderWithChildren([8, width, height], [source]);
  const paint = new CK.Paint();
  const surface = CK.MakeSurface(width, height);
  const canvas = surface.getCanvas();
  canvas.drawImage(image, 0, 0);
  canvas.save();
  canvas.clipRect(CK.XYWHRect(16, 8, 24, 24), CK.ClipOp.Intersect, false);
  paint.setShader(shader);
  canvas.drawPaint(paint);
  canvas.restore();
  surface.flush();
  const output = surface.makeImageSnapshot();
  const result = output.readPixels(0, 0, info);
  let changed = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const at = (y * width + x) * 4;
    const inside = x >= 16 && x < 40 && y >= 8 && y < 32;
    if (!inside) assert.deepEqual(result.slice(at, at + 4), pixels.slice(at, at + 4));
    else {
      const sx = Math.floor(x / 8) * 8 + 4;
      const sy = Math.floor(y / 8) * 8 + 4;
      assert.deepEqual([...result.slice(at, at + 4)], [sx * 4, sy * 4, (sx + sy) * 2, 255]);
      if (result[at] !== pixels[at]) changed++;
    }
  }
  assert.ok(changed > 300);
  // The native-image handoff uses a lossless PNG snapshot.
  const encoded = output.encodeToBytes();
  assert.ok(encoded.length > 0);
  const decoded = CK.MakeImageFromEncoded(encoded);
  assert.deepEqual(decoded.readPixels(0, 0, info), result);
  decoded.delete();
  for (const obj of [output, paint, shader, source, effect, image]) obj.delete();
  surface.dispose();
});
