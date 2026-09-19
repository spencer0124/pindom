// Original vector artwork. Rasterize the SAME geometry used by PindomMark,
// using the CanvasKit runtime already installed with Skia (no new dependency).
// Run with Node 22.18+ / 24: node scripts/generate-brand-icons.mjs
import { writeFile } from 'node:fs/promises';
import CanvasKitInit from 'canvaskit-wasm';
import { PINDOM_PIN_PATH, PINDOM_HEART_PATH } from '../src/features/shared/pindom-mark.ts';
const CK = await CanvasKitInit();
const rose = '#B83265';
const pink = '#F8AEBB';
const pin = CK.Path.MakeFromSVGString(PINDOM_PIN_PATH);
const heart = CK.Path.MakeFromSVGString(PINDOM_HEART_PATH);
async function render(name, { size = 1024, background, scale = 25, monochrome = false, mark = true } = {}) {
  const surface = CK.MakeSurface(size, size);
  const canvas = surface.getCanvas();
  canvas.clear(background ? CK.parseColorString(background) : CK.TRANSPARENT);
  if (mark) {
    const k = size / 1024;
    canvas.translate(size / 2 - 16 * scale * k, size / 2 - 16 * scale * k);
    canvas.scale(scale * k, scale * k);
    const paint = new CK.Paint();
    paint.setAntiAlias(true);
    paint.setColor(CK.parseColorString(monochrome ? '#FFFFFF' : rose));
    canvas.drawPath(pin, paint);
    paint.setColor(CK.WHITE);
    if (monochrome) paint.setBlendMode(CK.BlendMode.Clear);
    canvas.drawPath(heart, paint);
    paint.delete();
  }
  surface.flush();
  const snapshot = surface.makeImageSnapshot();
  // App Store icons must not carry an alpha channel, even when all pixels
  // happen to be opaque. Adaptive foregrounds and splash retain transparency.
  const info = { width: size, height: size, colorType: CK.ColorType.RGBA_8888,
    alphaType: CK.AlphaType.Opaque, colorSpace: CK.ColorSpace.SRGB };
  const image = background ? CK.MakeImage(info, snapshot.readPixels(0, 0, info), size * 4) : snapshot;
  await writeFile(new URL(`../assets/images/${name}.png`, import.meta.url), image.encodeToBytes());
  if (image !== snapshot) image.delete();
  snapshot.delete(); surface.dispose();
}
await render('icon', { background: pink });
await render('android-icon-foreground', { scale: 18 });
await render('android-icon-monochrome', { scale: 18, monochrome: true });
await render('android-icon-background', { background: pink, mark: false });
await render('splash-icon');
await render('favicon', { size: 64, background: pink });
await writeFile(new URL('../assets/images/pindom-mark.svg', import.meta.url), `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><rect width="1024" height="1024" fill="${pink}"/><g transform="translate(112 112) scale(25)"><path d="${PINDOM_PIN_PATH}" fill="${rose}"/><path d="${PINDOM_HEART_PATH}" fill="white"/></g></svg>\n`);
pin.delete(); heart.delete();
