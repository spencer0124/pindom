import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Linking, PixelRatio, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { Txt, useAdaptive, useTheme } from '@/design-system';
import { AppConfig } from '@/lib/config';
import { cameraLensOptions, preferredLens } from './camera-lenses';
import { CutoutOverlay } from './CutoutOverlay';
import type { CutoutDraft, CutoutPose, Viewport } from './cutout-model';

export interface CameraStageHandle { capture: () => Promise<string | null> }
interface CameraStageProps {
  active: boolean;
  viewport: Viewport;
  cutout?: CutoutDraft;
  onCutoutChange: (pose: CutoutPose) => void;
  previewImageUrl?: string;
}
// Keep native-discovered names intact; see camera-lenses for the version-specific contract.

/** WideAngle is Apple's name for the normal 1× camera, not the 0.5× lens. */
export const CameraStage = forwardRef<CameraStageHandle, CameraStageProps>(function CameraStage({ active, viewport, cutout, onCutoutChange, previewImageUrl }, ref) {
  const adaptive = useAdaptive();
  const { token } = useTheme();
  const camera = useRef<CameraView>(null);
  const root = useRef<View>(null);
  const [frozen, setFrozen] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [loadedCutout, setLoadedCutout] = useState<string | null>(null);
  const [loadedPreview, setLoadedPreview] = useState<string | null>(null);
  const pendingImage = useRef<{ resolve: () => void; reject: (error: Error) => void } | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [available, setAvailable] = useState<boolean | null>(Platform.OS === 'web' ? null : true);
  const [ready, setReady] = useState(false);
  const [lens, setLens] = useState<string | undefined>(undefined);
  const [lenses, setLenses] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const mockCamera = AppConfig.useMocks && !AppConfig.isProduction;

  useEffect(() => () => { pendingImage.current?.reject(new Error('camera closed')); }, []);
  useEffect(() => { setLoadedCutout(null); }, [cutout?.uri]);
  useEffect(() => { setLoadedPreview(null); }, [previewImageUrl]);
  useEffect(() => { if (!active) setReady(false); }, [active]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let live = true;
    void CameraView.isAvailableAsync().then(
      (ok) => { if (live) setAvailable(ok); },
      () => { if (live) setAvailable(false); },
    );
    return () => { live = false; };
  }, []);

  useImperativeHandle(ref, () => ({
    capture: async () => {
      if (busy.current) return null;
      busy.current = true;
      setCapturing(true);
      setError(null);
      try {
        if (!active) return null;
        if (cutout && loadedCutout !== cutout.uri) {
          setError('누끼를 불러오는 중이에요. 잠시 후 촬영하거나 누끼를 꺼 주세요.');
          return null;
        }
        if (!mockCamera && ready && camera.current) {
          const shot = await camera.current.takePictureAsync({ quality: 0.9, shutterSound: false });
          if (!shot?.uri) throw new Error('empty camera photo');
          // Native camera textures are not captured by view-shot reliably.
          // Replace the preview with the real shot before exporting the same
          // cover crop and PNG overlay the user positioned on screen.
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('photo load timeout')), 10_000);
            pendingImage.current = {
              resolve: () => { clearTimeout(timeout); resolve(); },
              reject: (cause) => { clearTimeout(timeout); reject(cause); },
            };
            setFrozen(shot.uri);
          });
        } else if (!mockCamera) {
          setError('카메라가 준비되지 않았어요. 권한을 확인하고 다시 시도해 주세요.');
          return null;
        } else if (previewImageUrl && loadedPreview !== previewImageUrl) {
          setError('미리보기 사진을 불러오는 중이에요. 잠시 후 다시 촬영해 주세요.');
          return null;
        }
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        if (root.current && viewport.width > 0) {
          // iOS view-shot sizes are points; Android sizes are physical pixels.
          const width = 1200 / (Platform.OS === 'ios' ? PixelRatio.get() : 1);
          const uri = await captureRef(root, { format: 'jpg', quality: 0.95, width, height: width * viewport.height / viewport.width });
          // iOS view-shot returns a bare path; Skia requires a file URL.
          return uri.startsWith('/') ? `file://${uri}` : uri;
        }
      } catch {
        setError('사진을 촬영하지 못했어요. 다시 시도해 주세요.');
      } finally {
        pendingImage.current = null;
        setFrozen(null);
        setCapturing(false);
        busy.current = false;
      }
      return null;
    },
  }));

  const enableCamera = async () => {
    try {
      if (permission?.canAskAgain === false) await Linking.openSettings();
      else await requestPermission();
    } catch {
      setError('카메라 권한을 확인하지 못했어요. 설정에서 허용해 주세요.');
    }
  };

  const options = Platform.OS === 'ios' ? cameraLensOptions(lenses) : [{ id: 'default', label: '일반 1×' }];
  const discoverLenses = (names: string[]) => {
    setLenses(names);
    if (lens && names.includes(lens)) return;
    const normal = preferredLens(names);
    // selectedLens updates the existing native capture session. Remounting a
    // keyed CameraView can reorder it above the cutout; no new ready event is
    // emitted for a normal lens update, so retain the session's ready state.
    if (normal !== lens) setLens(normal);
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Keep camera textures OUTSIDE the snapshot root: Android view-shot's
          TextureView pass can otherwise draw them over the PNG overlay. */}
      {!mockCamera && active && available && permission?.granted && (
        <CameraView ref={camera} style={styles.camera} facing="back" mute zoom={0}
          selectedLens={Platform.OS === 'ios' ? lens : undefined} ratio="4:3"
          onCameraReady={() => { setReady(true); setError(null); }}
          onMountError={() => { setReady(false); setError('카메라를 열지 못했어요. 촬영 화면을 다시 열어 주세요.'); }}
          onAvailableLensesChanged={({ lenses: next }) => discoverLenses(next)} />
      )}
      {/* Use PhotoFrame's measured viewport immediately. The transparent native
          snapshot view must stay above the camera, including after lens changes. */}
      <View ref={root} collapsable={false} pointerEvents="box-none"
        style={[styles.composition, { backgroundColor: mockCamera || frozen ? adaptive.greyBackground : 'transparent' }]}>
      {mockCamera && previewImageUrl && <Image source={previewImageUrl} contentFit="cover" transition={0}
        style={StyleSheet.absoluteFill} onDisplay={() => setLoadedPreview(previewImageUrl)}
        onError={() => setError('미리보기 사진을 불러오지 못했어요. 인터넷 연결을 확인해 주세요.')} />}
      {frozen && <Image key={frozen} source={frozen} contentFit="cover" transition={0} style={StyleSheet.absoluteFill}
        onDisplay={() => pendingImage.current?.resolve()} onError={() => pendingImage.current?.reject(new Error('photo load failed'))} />}
      {cutout && viewport.width > 0 && <CutoutOverlay cutout={cutout} viewport={viewport} disabled={capturing}
        onChange={onCutoutChange} onLoad={() => setLoadedCutout(cutout.uri)}
        onError={() => { setLoadedCutout(null); setError('누끼를 불러오지 못했어요. 인터넷 연결을 확인하거나 누끼를 꺼 주세요.'); }} />}
      </View>
      <View style={styles.top}>
        {!active ? (
          <Txt typography="st13" color={adaptive.grey900} style={{ backgroundColor: adaptive.background }}>카메라가 잠시 멈췄어요. 이 화면을 눌러 계속하세요.</Txt>
        ) : mockCamera ? (
          <Txt typography="st13" color={adaptive.grey900} style={{ backgroundColor: adaptive.background }}>샘플 사진으로 촬영 연습 중</Txt>
        ) : available === false ? (
          <Txt typography="st13" color={adaptive.grey900}>이 기기에는 카메라가 없어요</Txt>
        ) : !permission?.granted ? (
          <Pressable onPress={enableCamera} accessibilityRole="button" style={[styles.permission, { backgroundColor: adaptive.background }]}>
            <Txt typography="t7" color={adaptive.grey900}>{permission?.canAskAgain === false ? '설정에서 카메라 허용' : '카메라 사용 허용'}</Txt>
          </Pressable>
        ) : null}
        {cutout && loadedCutout !== cutout.uri && !error && (
          <Txt typography="st13" color={adaptive.grey900} style={{ backgroundColor: adaptive.background }}>누끼를 불러오는 중이에요…</Txt>
        )}
        {error && <Txt typography="st13" color={adaptive.grey900} style={{ backgroundColor: adaptive.background }}>{error}</Txt>}
      </View>
      {!mockCamera && active && permission?.granted && available && (
        <View style={styles.lenses}>
          <ScrollView horizontal contentContainerStyle={styles.lensRow} showsHorizontalScrollIndicator={false}>
            {options.map((option) => (
              <Pressable key={option.id} accessibilityRole="button" accessibilityState={{ selected: Platform.OS !== 'ios' || lens === option.id }}
                disabled={busy.current} onPress={() => { if (Platform.OS === 'ios' && lens !== option.id) setLens(option.id); }}
                style={[styles.lens, { backgroundColor: adaptive.background, borderColor: Platform.OS !== 'ios' || lens === option.id ? token.accent.fillColor : adaptive.grey200 }]}>
                <Txt typography="st13" fontWeight="bold" color={adaptive.grey900}>{option.label}</Txt>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  camera: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
  composition: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  top: { position: 'absolute', top: 12, left: 12, right: 12, gap: 8, zIndex: 2 },
  permission: { minHeight: 44, padding: 12, justifyContent: 'center' },
  lenses: { position: 'absolute', bottom: 12, left: 12, right: 12, alignItems: 'center', zIndex: 2 },
  lensRow: { flexDirection: 'row', gap: 8 },
  lens: { borderWidth: 1, minHeight: 44, paddingHorizontal: 12, justifyContent: 'center' },
});
