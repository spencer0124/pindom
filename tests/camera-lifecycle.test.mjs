import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const host = ({ children }) => React.createElement('div', null, children);
const adaptive = new Proxy({}, { get: () => '#ffffff' });
const design = {
  Txt: host, Button: host, SdsSpacing: {},
  useAdaptive: () => adaptive,
  useTheme: () => ({ token: { accent: {} } }),
};
const native = {
  View: host, Pressable: host, ScrollView: host,
  StyleSheet: { create: (styles) => styles, absoluteFill: {}, absoluteFillObject: {} },
  PixelRatio: { get: () => 1 }, Platform: { OS: 'ios' },
};
function load(file, stubs) {
  const source = readFileSync(new URL(file, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', outputText)(
    (name) => name in stubs ? stubs[name] : require(name), module, module.exports,
  );
  return module.exports;
}

const viewport = { width: 300, height: 400 };
const cutout = { uri: 'https://example.test/cutout.png', aspectRatio: 0.5, pose: { x: 0.5, y: 0.5, height: 0.7, mirrored: true } };
for (const active of [true, false]) {
  test(`native camera ${active ? 'active' : 'paused'} retains the measured cutout composition`, () => {
    const cameraProps = [], cutoutProps = [];
    const { CameraStage } = load('../src/features/capture/CameraStage.tsx', {
      'react-native': native,
      'expo-camera': {
        CameraView: (props) => { cameraProps.push(props); return null; },
        useCameraPermissions: () => [{ granted: true }, () => {}],
      },
      'expo-image': { Image: host },
      'react-native-view-shot': { captureRef: () => { throw Error('Do not capture in render'); } },
      '@/design-system': design,
      '@/lib/config': { AppConfig: { useMocks: false, isProduction: true } },
      './camera-lenses': { cameraLensOptions: () => [], preferredLens: () => undefined },
      './CutoutOverlay': { CutoutOverlay: (props) => { cutoutProps.push(props); return null; } },
    });
    const html = renderToStaticMarkup(React.createElement(CameraStage, { active, viewport, cutout, onCutoutChange: () => {} }));
    assert.equal(cameraProps.length, active ? 1 : 0);
    assert.equal(cutoutProps.length, 1, 'PNG must render even before native layout events and while camera is paused');
    assert.deepEqual(cutoutProps[0].viewport, viewport);
    assert.equal(cutoutProps[0].cutout, cutout);
    if (!active) assert.match(html, /카메라가 잠시 멈췄어요/);
  });
}

test('inactive Mac window keeps the camera composition mounted and disables the shutter', () => {
  const stages = [], buttons = [];
  const place = { id: 'place', name: '장소', cutoutImageUrl: cutout.uri, cutoutAspectRatio: 0.5 };
  const capture = { place, grant: { expiresAt: new Date(Date.now() + 600000) }, setPhoto: () => {} };
  const animation = { duration: () => animation, easing: () => animation, withInitialValues: () => animation };
  const { default: CameraScreen } = load('../app/capture/camera.tsx', {
    'react-native': { ...native, AppState: { currentState: 'inactive' }, Pressable: (props) => { buttons.push(props); return host(props); } },
    '@react-navigation/native': { useIsFocused: () => true },
    'expo-router': { router: {}, useFocusEffect: () => {} },
    'react-native-reanimated': { __esModule: true, default: { View: host }, Easing: { bezier: () => {} }, FadeInDown: animation },
    'react-native-safe-area-context': { SafeAreaView: host },
    '@/design-system': design,
    '@/features/capture': {
      useCaptureStore: (select) => select(capture),
      PhotoFrame: ({ children }) => children(viewport),
      CameraStage: (props) => { stages.push(props); return null; },
    },
    '@/features/shared': { Shape: {} },
    '@/features/capture/cutout-model': { DEFAULT_CUTOUT_POSE: cutout.pose },
    '@/features/capture/Slider': { Slider: host },
  });
  renderToStaticMarkup(React.createElement(CameraScreen));
  assert.equal(stages.length, 1);
  assert.equal(stages[0].active, false);
  assert.deepEqual(stages[0].viewport, viewport);
  assert.equal(stages[0].cutout.uri, cutout.uri);
  assert.equal(buttons.find((props) => props.accessibilityLabel === '촬영').disabled, true);
});

test('selfie switching clears rear lens selection and preserves the cutout', () => {
  const slots = [];
  let cursor = 0;
  const cameras = [], overlays = [], buttons = [];
  const hooks = {
    ...React,
    useEffect: () => {},
    useImperativeHandle: () => {},
    useRef: (initial) => {
      const index = cursor++;
      slots[index] ??= { current: initial };
      return slots[index];
    },
    useState: (initial) => {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], (value) => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
  };
  const { CameraStage } = load('../src/features/capture/CameraStage.tsx', {
    react: hooks,
    'react-native': { ...native, Pressable: (props) => { buttons.push(props); return host(props); } },
    'expo-camera': {
      CameraView: (props) => { cameras.push(props); return null; },
      useCameraPermissions: () => [{ granted: true }, () => {}],
    },
    'expo-image': { Image: host },
    'react-native-view-shot': { captureRef: () => {} },
    '@/design-system': design,
    '@/lib/config': { AppConfig: { useMocks: false, isProduction: true } },
    './camera-lenses': {
      cameraLensOptions: (names) => names.map((id) => ({ id, label: '일반 1×' })),
      preferredLens: (names) => names[0],
    },
    './CutoutOverlay': { CutoutOverlay: (props) => { overlays.push(props); return null; } },
  });
  const render = () => {
    cursor = 0;
    cameras.length = overlays.length = buttons.length = 0;
    return renderToStaticMarkup(React.createElement(CameraStage, { active: true, viewport, cutout, onCutoutChange: () => {} }));
  };
  render();
  cameras[0].onAvailableLensesChanged({ lenses: ['rear camera'] });
  render();
  assert.equal(cameras[0].selectedLens, 'rear camera');
  buttons.find((button) => button.accessibilityLabel === '전면 카메라로 전환').onPress();
  const selfie = render();
  assert.equal(cameras[0].facing, 'front');
  assert.equal(cameras[0].mirror, true);
  assert.equal(cameras[0].selectedLens, undefined);
  assert.doesNotMatch(selfie, /일반 1×/);
  assert.equal(overlays[0].cutout, cutout);
  buttons.find((button) => button.accessibilityLabel === '후면 카메라로 전환').onPress();
  render();
  assert.equal(cameras[0].facing, 'back');
  assert.equal(cameras[0].mirror, false);
  assert.equal(cameras[0].selectedLens, undefined);
  assert.equal(overlays[0].cutout, cutout);
});
