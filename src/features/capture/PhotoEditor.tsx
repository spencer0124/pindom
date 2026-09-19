import { ImageFormat, useCanvasRef, useImage } from '@shopify/react-native-skia';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { Txt, useAdaptive, useTheme } from '@/design-system';
import { Shape } from '@/features/shared';
import { cropForRatio, EMPTY_EDITS, MAX_OVERLAYS, mosaicAt, type PhotoEdits, type Point } from './editor-model';
import { PhotoCanvas } from './PhotoCanvas';
import { PhotoFrame } from './PhotoFrame';
import { Slider } from './Slider';
import { ToolStrip, type ToolId } from './ToolStrip';

const STICKERS = ['❤️', '⭐', '✨', '🌸', '😊', '🎵'];
const RATIOS = [{ label: '원본', value: 0 }, { label: '1:1', value: 1 }, { label: '3:4', value: 3 / 4 }, { label: '4:3', value: 4 / 3 }];

export function PhotoEditor({ uri, placeName, onBack, onNext }: {
  uri: string; placeName: string; onBack: () => void; onNext: (uri: string) => void;
}) {
  const adaptive = useAdaptive();
  const { token } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const image = useImage(uri, () => setError('사진을 불러오지 못했어요. 다시 촬영해 주세요.'));
  const canvas = useCanvasRef();
  const frame = useRef<View>(null);
  const [history, setHistory] = useState<PhotoEdits[]>([EMPTY_EDITS]);
  const [draft, setDraft] = useState<PhotoEdits | null>(null);
  const edits = draft ?? history[history.length - 1]!;
  const [tool, setTool] = useState<ToolId>('모자이크');
  const [selected, setSelected] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [flattened, setFlattened] = useState<string | null>(null);
  const locked = useRef(false);
  const sliding = useRef(false);
  const sliderDraft = useRef<PhotoEdits | null>(null);
  const id = useRef(0);
  const date = useRef(new Date()).current;
  const readyToCapture = useRef<(() => void) | null>(null);
  const photo = image ? { width: image.width(), height: image.height() } : null;
  const selectedMosaic = edits.mosaics.find((p) => p.id === selected);
  const selectedSticker = edits.stickers.find((p) => p.id === selected);

  const change = (next: PhotoEdits, commit = true) => {
    if (locked.current) return;
    setError(null);
    if (sliding.current) { sliderDraft.current = next; setDraft(next); return; }
    if (!commit) { setDraft(next); return; }
    setHistory((old) => [...old.slice(-29), next]);
    setDraft(null);
  };
  const center = { x: edits.crop.x + edits.crop.width / 2, y: edits.crop.y + edits.crop.height / 2 };
  const addMosaic = (point = center) => {
    if (!photo || edits.mosaics.length >= MAX_OVERLAYS) return;
    const nextId = ++id.current;
    change({ ...edits, mosaics: [...edits.mosaics, mosaicAt(point, edits.crop.width * 0.25, photo, nextId, 65)] });
    setSelected(nextId);
  };
  const addSticker = (glyph: string) => {
    if (edits.stickers.length >= MAX_OVERLAYS) return;
    const nextId = ++id.current;
    change({ ...edits, stickers: [...edits.stickers, { ...center, id: nextId, glyph, size: edits.crop.width * 0.16 }] });
    setSelected(nextId);
  };
  const tap = (point: Point) => {
    if (tool === '모자이크') {
      const hit = [...edits.mosaics].reverse().find((p) => point.x >= p.x && point.x <= p.x + p.width && point.y >= p.y && point.y <= p.y + p.height);
      if (hit) setSelected(hit.id); else addMosaic(point);
    } else if (tool === '스티커' && photo) {
      const hit = [...edits.stickers].reverse().find((p) => Math.abs(point.x - p.x) <= p.size && Math.abs(point.y - p.y) <= p.size * photo.width / photo.height);
      if (hit) setSelected(hit.id);
    }
  };
  const next = async () => {
    if (locked.current || !image || !canvas.current || !frame.current) return;
    locked.current = true;
    setBusy(true);
    setError(null);
    try {
      const snapshot = await canvas.current.makeImageSnapshotAsync();
      const data = snapshot.encodeToBase64(ImageFormat.PNG);
      snapshot.dispose();
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => { readyToCapture.current = null; reject(new Error('image timeout')); }, 10_000);
        readyToCapture.current = () => { clearTimeout(timeout); resolve(); };
        setFlattened(`data:image/png;base64,${data}`);
      });
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const composed = await captureRef(frame, { format: 'jpg', quality: 0.95 });
      onNext(composed.startsWith('/') ? `file://${composed}` : composed);
    } catch {
      setError('편집한 사진을 저장하지 못했어요. 다시 시도해 주세요.');
    } finally {
      locked.current = false;
      readyToCapture.current = null;
      setFlattened(null);
      setBusy(false);
    }
  };

  const action = (label: string, onPress: () => void, disabled = false, picked = false) => (
    <Pressable key={label} onPress={onPress} disabled={disabled || busy} accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy, selected: picked }}
      style={[styles.action, { borderColor: picked ? token.accent.fillColor : adaptive.grey200, opacity: disabled ? 0.4 : 1 }]}>
      <Txt typography="st13" fontWeight="bold" color={adaptive.grey900}>{label}</Txt>
    </Pressable>
  );
  const slider = (label: string, value: number, min: number, max: number, onChange: (value: number) => void) => (
    <View style={styles.slider}>
      <Txt typography="st13" color={adaptive.grey600} style={styles.sliderLabel}>{label}</Txt>
      <Slider value={value} min={min} max={max} onChange={(value) => { sliding.current = true; onChange(value); }} onChangeEnd={() => {
        sliding.current = false;
        if (sliderDraft.current) change(sliderDraft.current);
        sliderDraft.current = null;
      }} accessibilityLabel={label} />
    </View>
  );
  const cropRatio = photo ? edits.crop.width * photo.width / (edits.crop.height * photo.height) : 3 / 4;
  const baseCrop = photo ? cropForRatio(photo, cropRatio) : edits.crop;
  const zoom = Math.round(baseCrop.width / edits.crop.width * 100);
  const overlays = tool === '모자이크' ? edits.mosaics : edits.stickers;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        {action('재촬영', onBack)}
        <Txt typography="t6" fontWeight="bold" color={adaptive.grey900}>편집</Txt>
        {action(busy ? '저장 중…' : '다음', () => void next(), !image || busy)}
      </View>
      <PhotoFrame ref={frame} placeName={placeName} date={date} style={styles.frame} aspectRatio={cropRatio}>
        {(stage) => image ? <PhotoCanvas image={image} stage={stage} edits={edits} tool={tool} selected={selected}
          canvasRef={canvas} flattened={flattened} onFlattened={() => readyToCapture.current?.()} onChange={change} onTap={tap} /> : null}
      </PhotoFrame>
      {!image && !error && <Txt typography="t7" textAlign="center" color={adaptive.grey600}>사진을 불러오는 중…</Txt>}
      {error && <Txt typography="st13" textAlign="center" color={adaptive.grey900}>{error}</Txt>}
      <View style={styles.tools} pointerEvents={busy ? 'none' : 'auto'}>
        <ToolStrip tool={tool} onPickTool={(nextTool) => { setTool(nextTool); setSelected(null); }} />
        <ScrollView style={styles.controls} contentContainerStyle={styles.controlContent}>
          {tool === '모자이크' && action('모자이크 추가', () => addMosaic(), edits.mosaics.length >= MAX_OVERLAYS || !image)}
          {tool === '스티커' && <View style={styles.row}>{STICKERS.map((glyph) => action(glyph, () => addSticker(glyph), edits.stickers.length >= MAX_OVERLAYS))}</View>}
          {tool !== '자르기' && overlays.length > 0 && <ScrollView horizontal contentContainerStyle={styles.row}>
            {overlays.map((item, index) => action(`${index + 1}번`, () => setSelected(item.id), false, selected === item.id))}
            {action('선택 삭제', () => { change({ ...edits, mosaics: edits.mosaics.filter((p) => p.id !== selected), stickers: edits.stickers.filter((p) => p.id !== selected) }); setSelected(null); }, selected == null)}
          </ScrollView>}
          {tool === '모자이크' && selectedMosaic && photo && <>
            {slider('영역 크기', Math.round(selectedMosaic.width / edits.crop.width * 100), 5, 80, (value) => change({ ...edits, mosaics: edits.mosaics.map((p) => p.id === selected
              ? mosaicAt({ x: p.x + p.width / 2, y: p.y + p.height / 2 }, value / 100 * edits.crop.width, photo, p.id, p.strength) : p) }))}
            {slider('입자 크기', selectedMosaic.strength, 10, 100, (strength) => change({ ...edits, mosaics: edits.mosaics.map((p) => p.id === selected ? { ...p, strength } : p) }))}
          </>}
          {tool === '스티커' && selectedSticker && slider('스티커 크기', Math.round(selectedSticker.size / edits.crop.width * 100), 5, 50,
            (size) => change({ ...edits, stickers: edits.stickers.map((p) => p.id === selected ? { ...p, size: size / 100 * edits.crop.width } : p) }))}
          {tool === '자르기' && photo && <>
            <View style={styles.row}>{RATIOS.map((ratio) => action(ratio.label, () => change({ ...edits, crop: cropForRatio(photo, ratio.value || photo.width / photo.height, 1, edits.crop) }), false,
              Math.abs(cropRatio - (ratio.value || photo.width / photo.height)) < 0.001))}</View>
            {slider('확대', zoom, 100, 300, (value) => change({ ...edits, crop: cropForRatio(photo, cropRatio, value / 100, edits.crop) }))}
          </>}
          <Txt typography="st13" color={adaptive.grey600}>{tool === '자르기' ? '비율을 고르고 확대하거나 드래그해서 구도를 맞추세요.' : '사진을 눌러 선택하고 드래그해서 위치를 바꾸세요.'}</Txt>
        </ScrollView>
        <View style={styles.row}>
          {action('실행 취소', () => { setDraft(null); setSelected(null); setHistory((old) => old.slice(0, -1)); }, history.length <= 1)}
          {action('전체 초기화', () => { change(EMPTY_EDITS); setSelected(null); }, history.length <= 1)}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Shape.gutter, paddingVertical: 8 },
  frame: { flex: 1, marginHorizontal: Shape.gutter, marginVertical: 8 },
  tools: { paddingHorizontal: Shape.gutter, paddingBottom: 8, gap: 8 },
  controls: { height: 180, flexGrow: 0 },
  controlContent: { gap: 8, paddingVertical: 4 },
  row: { flexDirection: 'row', gap: 8 },
  action: { minHeight: 44, minWidth: 40, paddingHorizontal: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  slider: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: 12 },
  sliderLabel: { width: 76 },
});
