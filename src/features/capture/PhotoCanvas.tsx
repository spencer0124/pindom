import { Canvas, Fill, Group, Image as SkiaImage, ImageShader, Shader, Skia, type SkImage, type CanvasRef } from '@shopify/react-native-skia';
import { Image } from 'expo-image';
import { useRef, type RefObject } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { clamp, moveCrop, PIXELATE_SHADER, stagePoint, type PhotoEdits, type PhotoSize, type Point } from './editor-model';
import type { ToolId } from './ToolStrip';

const pixelate = Skia.RuntimeEffect.Make(PIXELATE_SHADER);

interface Props {
  image: SkImage;
  stage: PhotoSize;
  edits: PhotoEdits;
  tool: ToolId;
  selected: number | null;
  canvasRef: RefObject<CanvasRef | null>;
  flattened: string | null;
  onFlattened: () => void;
  onChange: (edits: PhotoEdits, commit: boolean) => void;
  onTap: (point: Point) => void;
}

export function PhotoCanvas({ image, stage, edits, tool, selected, canvasRef, flattened, onFlattened, onChange, onTap }: Props) {
  const { crop } = edits;
  const photo = { width: image.width(), height: image.height() };
  const scale = stage.width / (crop.width * photo.width);
  const start = useRef(edits);
  const pending = useRef(edits);
  const dragging = useRef(false);
  const pan = Gesture.Pan().enabled(flattened == null).minDistance(3).runOnJS(true)
    .onStart(() => { dragging.current = true; start.current = edits; pending.current = edits; })
    .onUpdate((event) => {
      const base = start.current;
      const dx = event.translationX / stage.width * base.crop.width;
      const dy = event.translationY / stage.height * base.crop.height;
      let next = base;
      if (tool === '자르기') next = { ...base, crop: moveCrop(base.crop, -dx, -dy) };
      if (tool === '모자이크') next = { ...base, mosaics: base.mosaics.map((p) => p.id === selected
        ? { ...p, x: clamp(p.x + dx, 0, 1 - p.width), y: clamp(p.y + dy, 0, 1 - p.height) } : p) };
      if (tool === '스티커') next = { ...base, stickers: base.stickers.map((p) => p.id === selected
        ? { ...p, x: clamp(p.x + dx, 0, 1), y: clamp(p.y + dy, 0, 1) } : p) };
      pending.current = next;
      onChange(next, false);
    })
    .onEnd(() => onChange(pending.current, true))
    .onFinalize((_event, success) => {
      if (dragging.current && !success) onChange(start.current, false);
      dragging.current = false;
    });
  const tap = Gesture.Tap().enabled(flattened == null).runOnJS(true).onEnd((event, success) => {
    if (success) onTap(stagePoint(event, stage, crop));
  });

  return (
    <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
      <View style={StyleSheet.absoluteFill} accessible accessibilityLabel="사진 편집 영역"
        accessibilityHint={tool === '자르기' ? '확대 후 드래그해서 자를 위치를 바꿉니다' : '드래그해서 선택한 항목을 옮깁니다'}>
        <Canvas ref={canvasRef} style={StyleSheet.absoluteFill} colorSpace="srgb">
          <Group transform={[{ scale }, { translateX: -crop.x * photo.width }, { translateY: -crop.y * photo.height }]}>
            <SkiaImage image={image} x={0} y={0} width={photo.width} height={photo.height} fit="fill" />
            {edits.mosaics.map((patch) => (
              <Group key={patch.id} clip={{ x: patch.x * photo.width, y: patch.y * photo.height, width: patch.width * photo.width, height: patch.height * photo.height }}>
                {/* If the shader cannot compile, cover the region opaquely. */}
                <Fill color="black">
                  {pixelate && <Shader source={pixelate} uniforms={{ blockSize: photo.width * (0.008 + patch.strength / 100 * 0.05), imageSize: [photo.width, photo.height] }}>
                    <ImageShader image={image} tx="clamp" ty="clamp" fit="fill" rect={{ x: 0, y: 0, width: photo.width, height: photo.height }} />
                  </Shader>}
                </Fill>
              </Group>
            ))}
          </Group>
        </Canvas>
        {/* Native view-shot cannot reliably capture every GPU surface. Export
            snapshots Skia first, then captures this loaded native image + stickers. */}
        {flattened && <Image source={flattened} style={StyleSheet.absoluteFill} contentFit="fill" onLoad={onFlattened} />}
        {edits.stickers.map((sticker) => {
          const size = sticker.size * photo.width * scale;
          return <Text key={sticker.id} pointerEvents="none" allowFontScaling={false} style={[
            styles.sticker,
            { left: (sticker.x - crop.x) / crop.width * stage.width - size,
              top: (sticker.y - crop.y) / crop.height * stage.height - size,
              width: size * 2, height: size * 2, fontSize: size, lineHeight: size * 2 },
          ]}>{sticker.glyph}</Text>;
        })}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  sticker: { position: 'absolute', textAlign: 'center', includeFontPadding: false },
});
