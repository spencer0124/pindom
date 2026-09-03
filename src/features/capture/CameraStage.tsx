import { CameraView, useCameraPermissions } from 'expo-camera';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { Txt, useAdaptive } from '@/design-system';

export interface CameraStageHandle {
  /**
   * Take the picture. With no camera to take it with — the simulator, or a
   * refused permission — the stand-in view is rendered to a file instead, so
   * the chain stays walkable without hardware. Only this view: the cutout and
   * the caption are composed later, on 편집, and must not be baked in here.
   */
  capture: () => Promise<string | null>;
}

/**
 * The live view — `1a`'s LIVE CAMERA · 실시간 배경 stage.
 *
 * Three states and all of them render: the camera, a permission still being
 * asked, and no camera at all. The last is the web build actually reporting no
 * camera, where 1a's own gradient stand-in is replaced by the chrome ground and
 * the same label, the way 지도 draws a stand-in without a Naver client id. The
 * simulator no longer lands here: it draws the live view black and its shots
 * fall back to the stand-in capture. A screen state nobody can reach is a
 * screen state nobody checks.
 */
export const CameraStage = forwardRef<CameraStageHandle>(function CameraStage(_, ref) {
  const adaptive = useAdaptive();
  const camera = useRef<CameraView>(null);
  const root = useRef<View>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let live = true;
    CameraView.isAvailableAsync()
      .then((ok) => live && setAvailable(ok))
      // 웹 전용 API 다 — iOS·안드로이드 네이티브 모듈에는 이 메서드가 없어 항상
      // 던진다. 던졌다는 것 자체가 네이티브라는 뜻이고, 폰에는 카메라가 있다.
      // false 로 받으면 모든 실기기가 "카메라 없음" 이 된다 (실기기에서 실제로 났던 버그).
      .catch(() => live && setAvailable(true));
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (available && permission != null && !permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [available, permission, requestPermission]);

  const ready = available === true && permission?.granted === true;

  useImperativeHandle(ref, () => ({
    capture: async () => {
      if (ready && camera.current != null) {
        try {
          const shot = await camera.current.takePictureAsync({ quality: 0.85, shutterSound: false });
          if (shot?.uri) return shot.uri;
        } catch {
          // 시뮬레이터처럼 하드웨어 촬영이 실패하면 아래 스탠드인 캡처로 떨어진다.
        }
      }
      try {
        return root.current != null ? await captureRef(root, { format: 'jpg', quality: 0.9 }) : null;
      } catch {
        return null;
      }
    },
  }));

  return (
    // Painted, not transparent: `captureRef` renders this view's own layer, and
    // a transparent layer comes back as a white JPEG rather than the ground.
    <View
      ref={root}
      collapsable={false}
      style={[StyleSheet.absoluteFill, { backgroundColor: adaptive.greyBackground }]}
    >
      {ready ? (
        <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" mute />
      ) : null}
      <View style={styles.label} pointerEvents="none">
        <Txt typography="st13" fontWeight="medium" color={adaptive.grey500} style={styles.labelText}>
          LIVE CAMERA · 실시간 배경
        </Txt>
      </View>
      {available === false && (
        <View style={styles.unavailable} pointerEvents="none">
          <Txt typography="st13" color={adaptive.grey500}>
            이 기기에는 카메라가 없어요
          </Txt>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  label: {
    position: 'absolute',
    left: 10,
    top: 10,
  },
  labelText: {
    letterSpacing: 1,
  },
  // Under the LIVE label, not centred — the cutout sits in the middle.
  unavailable: {
    position: 'absolute',
    left: 10,
    top: 30,
  },
});
