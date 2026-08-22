import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import { Txt, useAdaptive, useTheme } from '@/design-system';
import {
  Cutout,
  MosaicPatch,
  PhotoFrame,
  ToolStrip,
  useCaptureStore,
  type ToolId,
} from '@/features/capture';
import { Shape } from '@/features/shared';

/**
 * 편집 — the shot with the cutout composed over it, and the tools.
 *
 * Built from prototype block `1a` for layout, copy and flow and `2b` for colour,
 * type and corners, matching `app/(tabs)/index.tsx`. Figma `33:2166` is the
 * earlier frame, and it still has the wide scale range and 좌우반전 — both gone
 * in the 2026-08-20 drop (docs/reference/screens.md).
 *
 * 다음 renders this canvas to a file, and that file is the ticket photo: the
 * composition happens here rather than on a server, which is also the single
 * re-encode the contract asks for — it drops the EXIF the raw shot carried.
 */
export default function EditScreen() {
  const adaptive = useAdaptive();
  const { token } = useTheme();

  const place = useCaptureStore((s) => s.place);
  const photoUri = useCaptureStore((s) => s.photoUri);
  const cutout = useCaptureStore((s) => s.cutout);
  const setComposed = useCaptureStore((s) => s.setComposed);

  const frame = useRef<View>(null);
  const [tool, setTool] = useState<ToolId>('모자이크');
  const [strength, setStrength] = useState(25);
  const [composing, setComposing] = useState(false);
  const now = useMemo(() => new Date(), []);

  useEffect(() => {
    if (photoUri == null || place == null) router.replace('/map' as never);
  }, [photoUri, place]);

  const next = useCallback(async () => {
    if (composing || frame.current == null) return;
    setComposing(true);
    try {
      const uri = await captureRef(frame, { format: 'jpg', quality: 0.9 });
      setComposed(uri);
      router.push('/capture/visibility' as never);
    } finally {
      setComposing(false);
    }
  }, [composing, setComposed]);

  if (place == null || photoUri == null) return null;

  // Only 모자이크 has an effect in 1a; the patch sits at a quarter opacity
  // until the tool is picked, then follows the slider.
  const mosaicOpacity = tool === '모자이크' ? strength / 100 : 0.25;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: adaptive.greyBackground }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={styles.headerSide}>
          <Txt typography="t7" fontWeight="medium" color={adaptive.grey600}>
            재촬영
          </Txt>
        </Pressable>
        <Txt typography="t6" fontWeight="bold" color={adaptive.grey900}>
          편집
        </Txt>
        <Pressable
          onPress={next}
          disabled={composing}
          accessibilityRole="button"
          style={[styles.headerSide, styles.headerRight]}
        >
          <Txt typography="t7" fontWeight="bold" color={token.accent.fillColor}>
            다음
          </Txt>
        </Pressable>
      </View>

      <PhotoFrame ref={frame} placeName={place.name} date={now} style={styles.frame}>
        {(size) => (
          <>
            <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <Cutout stage={size} placement={cutout} />
            <MosaicPatch stage={size} opacity={mosaicOpacity} />
          </>
        )}
      </PhotoFrame>

      <View style={styles.tools}>
        <ToolStrip tool={tool} strength={strength} onPickTool={setTool} onStrength={setStrength} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Shape.gutter,
    paddingVertical: 10,
  },
  headerSide: {
    width: 64,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  frame: {
    flex: 1,
    marginHorizontal: Shape.gutter,
    marginVertical: 8,
  },
  tools: {
    paddingTop: 8,
    paddingBottom: 12,
  },
});
