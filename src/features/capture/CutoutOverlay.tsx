import { Image } from 'expo-image';
import { useRef } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { cutoutRect, moveCutout, type CutoutDraft, type CutoutPose, type Viewport } from './cutout-model';

/** The same native image is used for the live preview and the saved composition. */
export function CutoutOverlay({ cutout, viewport, disabled, onChange, onLoad, onError }: {
  cutout: CutoutDraft; viewport: Viewport; disabled: boolean;
  onChange: (pose: CutoutPose) => void; onLoad: () => void; onError: () => void;
}) {
  const start = useRef(cutout.pose);
  const rect = cutoutRect(cutout.pose, cutout.aspectRatio, viewport);
  const pan = Gesture.Pan().enabled(!disabled).minDistance(2).runOnJS(true)
    .onStart(() => { start.current = cutout.pose; })
    .onUpdate((event) => onChange(moveCutout(start.current, cutout.aspectRatio, viewport, event.translationX, event.translationY)))
    .onEnd((event) => onChange(moveCutout(start.current, cutout.aspectRatio, viewport, event.translationX, event.translationY)));
  return (
    <GestureDetector gesture={pan}>
      <View accessible accessibilityRole="image" accessibilityLabel="함께 찍을 인물 누끼"
        accessibilityHint="드래그로 옮기고 아래 크기 조절로 확대하거나 축소합니다"
        accessibilityActions={[{ name: 'left', label: '왼쪽으로' }, { name: 'right', label: '오른쪽으로' }, { name: 'up', label: '위로' }, { name: 'down', label: '아래로' }]}
        onAccessibilityAction={({ nativeEvent }) => {
          if (disabled) return;
          const { actionName } = nativeEvent;
          onChange(moveCutout(cutout.pose, cutout.aspectRatio, viewport,
            actionName === 'left' ? -20 : actionName === 'right' ? 20 : 0,
            actionName === 'up' ? -20 : actionName === 'down' ? 20 : 0));
        }}
        style={{ position: 'absolute', left: rect.x, top: rect.y, width: rect.width, height: rect.height }}>
        <Image key={cutout.uri} source={cutout.uri} contentFit="fill" transition={0}
          onDisplay={onLoad} onError={onError}
          style={{ width: '100%', height: '100%', transform: [{ scaleX: cutout.pose.mirrored ? -1 : 1 }] }} />
      </View>
    </GestureDetector>
  );
}
