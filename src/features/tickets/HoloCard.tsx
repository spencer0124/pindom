import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  Image,
  LinearGradient,
  RadialGradient,
  Rect,
  useImage,
  vec,
} from '@shopify/react-native-skia';
import { Txt, useAdaptive } from '@/design-system';

/**
 * 홀로그램 티켓 카드 — 팀원이 보낸 HoloCardSkia 원본을 레포 규약(TS·named export·
 * 디자인 토큰)에 맞춰 옮긴 것. 로직은 원본 그대로다: 손가락 위치를 따라 카드가
 * 기울고(perspective), colorDodge 광선과 overlay 글레어가 그 지점을 따라간다.
 *
 * 터치는 Skia 의 자체 터치 API 대신 맨 RN 리스폰더 레이어로 받는다 — 원본 주석대로
 * Skia 쪽 API 가 버전마다 흔들려서다.
 */

const HOLO_STYLES = {
  basic: {
    shine: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.9)', 'rgba(255,255,255,0)'],
    glare: ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0)'],
  },
  rainbow: {
    shine: ['#ff003c', '#ffb300', '#caff00', '#00ffa2', '#00c3ff', '#7000ff', '#ff003c'],
    glare: ['rgba(255,255,255,0.85)', 'rgba(255,255,255,0)'],
  },
  galaxy: {
    shine: ['#7b2ff7', '#3fa9ff', '#ff3fd8', '#7b2ff7'],
    glare: ['rgba(200,220,255,0.9)', 'rgba(200,220,255,0)'],
  },
} as const;

export type HoloStyle = keyof typeof HOLO_STYLES;

/** galaxy 스타일의 별가루. 고정 시드라 렌더마다 같은 자리에 뜬다. */
const STAR_DOTS = new Array(24).fill(0).map((_, i) => ({
  x: (i * 53) % 100,
  y: (i * 37) % 100,
  r: 0.6 + (i % 3) * 0.4,
}));

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

interface HoloCardProps {
  /** 티켓 사진 URL — photoUrl 을 그대로 넣는다. */
  uri: string;
  holoStyle?: HoloStyle;
  width?: number;
  /** 0~1. 낮출수록 반짝임이 은은해진다. */
  intensity?: number;
  /** 최대 기울기(도). 낮출수록 덜 급격하다. */
  maxTilt?: number;
}

export function HoloCard({
  uri,
  holoStyle = 'rainbow',
  width = 260,
  intensity = 0.45,
  maxTilt = 20,
}: HoloCardProps) {
  const adaptive = useAdaptive();
  // 원본의 0.718 비율 — 실물 카드(포토카드) 규격이다.
  const height = width / 0.718;
  const image = useImage(uri);
  const styleDef = HOLO_STYLES[holoStyle];

  const [pointer, setPointer] = useState({ x: width / 2, y: height / 2, active: 0 });

  if (!image) {
    return (
      <View style={[styles.loading, { width, height, backgroundColor: adaptive.grey200 }]}>
        <Txt typography="st13" color={adaptive.grey600}>
          이미지 로딩중...
        </Txt>
      </View>
    );
  }

  const percentX = pointer.x / width;
  const percentY = pointer.y / height;
  const tiltX = (percentY - 0.5) * maxTilt;
  const tiltY = -(percentX - 0.5) * maxTilt;

  return (
    <View style={[styles.card, { width, height }]}>
      <View
        style={[
          styles.tilt,
          { transform: [{ perspective: 800 }, { rotateX: `${tiltX}deg` }, { rotateY: `${tiltY}deg` }] },
        ]}
      >
        <Canvas style={styles.canvas}>
          <Image image={image} x={0} y={0} width={width} height={height} fit="cover" />

          <Group blendMode="colorDodge" opacity={pointer.active * intensity}>
            <Rect x={0} y={0} width={width} height={height}>
              <LinearGradient
                start={vec(pointer.x - width * 0.6, pointer.y - height * 0.6)}
                end={vec(pointer.x + width * 0.6, pointer.y + height * 0.6)}
                colors={[...styleDef.shine]}
              />
            </Rect>
          </Group>

          <Group blendMode="overlay" opacity={pointer.active * intensity}>
            <Rect x={0} y={0} width={width} height={height}>
              <RadialGradient c={vec(pointer.x, pointer.y)} r={width * 0.7} colors={[...styleDef.glare]} />
            </Rect>
          </Group>

          {holoStyle === 'galaxy' &&
            STAR_DOTS.map((dot, i) => (
              <Circle
                key={i}
                cx={(dot.x / 100) * width}
                cy={(dot.y / 100) * height}
                r={dot.r}
                color="white"
                opacity={0.7}
              />
            ))}
        </Canvas>
      </View>

      {/* 맨 RN 터치 레이어. 캔버스 위에 얹혀 손가락 위치만 받는다. */}
      <View
        style={StyleSheet.absoluteFill}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderMove={(e) => {
          const { locationX, locationY } = e.nativeEvent;
          setPointer({ x: clamp(locationX, 0, width), y: clamp(locationY, 0, height), active: 1 });
        }}
        onResponderRelease={() => setPointer((p) => ({ ...p, active: 0 }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  tilt: {
    flex: 1,
  },
  canvas: {
    flex: 1,
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
});
