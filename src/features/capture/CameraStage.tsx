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
 * asked, and no camera at all. The last is the simulator, where 1a's own
 * gradient stand-in is replaced by the chrome ground and the same label, the
 * way 지도 draws a stand-in without a Naver client id. A screen state nobody can
 * reach is a screen state nobody checks.
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
      .catch(() => live && setAvailable(false));
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
      try {
        if (ready && camera.current != null) {
          const shot = await camera.current.takePictureAsync({ quality: 0.85, shutterSound: false });
          return shot?.uri ?? null;
        }
        if (root.current != null) {
          return await captureRef(root, { format: 'jpg', quality: 0.9 });
        }
        return null;
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
