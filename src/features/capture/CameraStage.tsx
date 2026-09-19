import { CameraView, useCameraPermissions } from 'expo-camera';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { Txt, useAdaptive, useTheme } from '@/design-system';
import { AppConfig } from '@/lib/config';
import { cameraLensOptions, preferredLens } from './camera-lenses';

export interface CameraStageHandle { capture: () => Promise<string | null> }
// Keep native-discovered names intact; see camera-lenses for the version-specific contract.

/** WideAngle is Apple's name for the normal 1× camera, not the 0.5× lens. */
export const CameraStage = forwardRef<CameraStageHandle>(function CameraStage(_, ref) {
  const adaptive = useAdaptive();
  const { token } = useTheme();
  const camera = useRef<CameraView>(null);
  const root = useRef<View>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [available, setAvailable] = useState<boolean | null>(Platform.OS === 'web' ? null : true);
  const [ready, setReady] = useState(false);
  const [lens, setLens] = useState<string | undefined>(undefined);
  const [lenses, setLenses] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const mockCamera = AppConfig.useMocks && !AppConfig.isProduction;

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
      setError(null);
      try {
        if (ready && camera.current) {
          const shot = await camera.current.takePictureAsync({ quality: 0.9, shutterSound: false });
          if (shot?.uri) return shot.uri;
        }
        if (mockCamera && root.current) return await captureRef(root, { format: 'jpg', quality: 0.9 });
        setError('카메라가 준비되지 않았어요. 권한을 확인하고 다시 시도해 주세요.');
      } catch {
        setError('사진을 촬영하지 못했어요. 다시 시도해 주세요.');
      } finally {
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
    if (normal !== lens) { setReady(false); setLens(normal); }
  };

  return (
    <View ref={root} collapsable={false} style={[StyleSheet.absoluteFill, { backgroundColor: adaptive.greyBackground }]}>
      {available && permission?.granted && (
        <CameraView key={lens} ref={camera} style={StyleSheet.absoluteFill} facing="back" mute zoom={0}
          selectedLens={Platform.OS === 'ios' ? lens : undefined} ratio="4:3"
          onCameraReady={() => { setReady(true); setError(null); }}
          onMountError={() => { setReady(false); setError('카메라를 열지 못했어요. 촬영 화면을 다시 열어 주세요.'); }}
          onAvailableLensesChanged={({ lenses: next }) => discoverLenses(next)} />
      )}
      <View style={styles.top}>
        {available === false ? (
          <Txt typography="st13" color={adaptive.grey900}>이 기기에는 카메라가 없어요</Txt>
        ) : !permission?.granted ? (
          <Pressable onPress={enableCamera} accessibilityRole="button" style={[styles.permission, { backgroundColor: adaptive.background }]}>
            <Txt typography="t7" color={adaptive.grey900}>{permission?.canAskAgain === false ? '설정에서 카메라 허용' : '카메라 사용 허용'}</Txt>
          </Pressable>
        ) : null}
        {error && <Txt typography="st13" color={adaptive.grey900} style={{ backgroundColor: adaptive.background }}>{error}</Txt>}
      </View>
      {permission?.granted && available && (
        <View style={styles.lenses}>
          <ScrollView horizontal contentContainerStyle={styles.lensRow} showsHorizontalScrollIndicator={false}>
            {options.map((option) => (
              <Pressable key={option.id} accessibilityRole="button" accessibilityState={{ selected: Platform.OS !== 'ios' || lens === option.id }}
                disabled={busy.current} onPress={() => { if (Platform.OS === 'ios' && lens !== option.id) { setReady(false); setLens(option.id); } }}
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
  top: { position: 'absolute', top: 12, left: 12, right: 12, gap: 8 },
  permission: { minHeight: 44, padding: 12, justifyContent: 'center' },
  lenses: { position: 'absolute', bottom: 12, left: 12, right: 12, alignItems: 'center' },
  lensRow: { flexDirection: 'row', gap: 8 },
  lens: { borderWidth: 1, minHeight: 44, paddingHorizontal: 12, justifyContent: 'center' },
});
