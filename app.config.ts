import { existsSync } from 'fs';

import { ExpoConfig, ConfigContext } from 'expo/config';

const ANDROID_FIREBASE_CONFIG = './google-services.json';
const IOS_FIREBASE_CONFIG = './GoogleService-Info.plist';

// The @react-native-firebase/app config plugin aborts `expo prebuild` outright
// when `googleServicesFile` points at a file that is not there. Both files come
// from the backend developer and are gitignored, so a fresh clone never has
// them — gating the whole Firebase block on their presence keeps the native
// build working before that handoff has happened.
//
// See docs/how-to/connect-the-app-to-firebase.md.
const firebaseConfigured =
  existsSync(ANDROID_FIREBASE_CONFIG) && existsSync(IOS_FIREBASE_CONFIG);

// An explicit EXPO_PUBLIC_USE_MOCKS always wins. Otherwise fixtures are on
// exactly when Firebase is unreachable, which is the only setting that works.
const useMocks = process.env.EXPO_PUBLIC_USE_MOCKS
  ? process.env.EXPO_PUBLIC_USE_MOCKS === 'true'
  : !firebaseConfigured;

if (!firebaseConfigured) {
  // Loud, because the alternative is a silent fixture build that looks real.
  console.warn(
    '[pindom] Firebase config files not found — building without Firebase.\n' +
      `         Expected ${ANDROID_FIREBASE_CONFIG} and ${IOS_FIREBASE_CONFIG}.\n` +
      '         Screens will read fixtures from src/mocks/.\n' +
      '         See docs/how-to/connect-the-app-to-firebase.md',
  );
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'PINDOM',
  slug: 'pindom',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'pindom',
  userInterfaceStyle: 'light',
  newArchEnabled: true,

  // Values here are readable at runtime via `Constants.expoConfig.extra`.
  // src/lib/config.ts is the only consumer — everything else reads through
  // AppConfig rather than touching `extra` directly.
  extra: {
    env: process.env.EXPO_PUBLIC_ENV,
    useMocks,
    firebaseConfigured,
    // The client defaults to us-central1. A Korean deployment is likely
    // asia-northeast3, and a mismatch surfaces as `not-found` on every call.
    functionsRegion: process.env.EXPO_PUBLIC_FUNCTIONS_REGION,
  },

  ios: {
    bundleIdentifier: 'com.zoyoong.pindom',
    supportsTablet: false,
    ...(firebaseConfigured && { googleServicesFile: IOS_FIREBASE_CONFIG }),
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      // GPS verification: PINDOM only ever checks location while the user is
      // actively verifying a filming location, so foreground-only is the
      // correct (and least invasive) permission to request.
      NSLocationWhenInUseUsageDescription:
        '촬영지에 도착했는지 확인하기 위해 현재 위치를 사용합니다.',
      NSCameraUsageDescription:
        '촬영지에서 사진을 찍어 티켓을 발행하기 위해 카메라를 사용합니다.',
    },
  },

  android: {
    package: 'com.zoyoong.pindom',
    ...(firebaseConfigured && { googleServicesFile: ANDROID_FIREBASE_CONFIG }),
    adaptiveIcon: {
      backgroundColor: '#6541F2',
      foregroundImage: './assets/images/android-icon-foreground.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    permissions: [
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.CAMERA',
    ],
  },

  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },

  plugins: [
    'expo-router',
    'expo-secure-store',
    // Added only when the config files exist; see the note at the top.
    ...(firebaseConfigured
      ? [
          // `disableSPM` is not optional here, it is what makes this build link.
          // firebase-ios-sdk's Swift Package products are automatic libraries, so
          // every react-native-firebase pod that resolves Firebase through SPM
          // embeds its own copy. Under the static linkage the Naver Map SDK
          // requires (see expo-build-properties below) those copies collide as
          // duplicate symbols and `pod install` refuses outright. Opting out of
          // SPM routes Firebase through CocoaPods, which handles static frameworks.
          ['@react-native-firebase/app', { ios: { disableSPM: true } }] as [
            string,
            Record<string, unknown>,
          ],
          '@react-native-firebase/auth',
        ]
      : []),
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
      },
    ],
    [
      'expo-localization',
      {
        // The prototype writes copy in four languages — its helper is `L(ko, en, ja, zh)`.
        // Declaring a locale here only makes the OS offer it; the seeded content has to exist
        // in each one, which is the actual cost. See docs/reference/backend-contract.md.
        supportedLocales: ['ko', 'en', 'ja', 'zh'],
      },
    ],
    [
      // TODO(design): direction `2b` sets everything in Pretendard Variable and the prototype
      // contains no Wanted Sans at all (ADR 0006). Swapping means new font files, deleting the
      // platform-split `fontFamilyByWeight` map, and re-checking every screen — so it is left
      // until the token work in docs/reference/design-tokens.md is picked up.
      'expo-font',
      {
        // Registered per platform because the two resolve font names differently.
        //
        // Android takes an explicit family with weights, so `fontFamily: 'WantedSans'`
        // plus a numeric weight resolves to the right face.
        //
        // iOS only accepts paths and resolves by the name embedded in the file. Those
        // names are `Wanted Sans` and — for Medium, which ships as its own family —
        // `Wanted Sans Medium`. `foundation/typography.ts` maps weight to family
        // accordingly; see assets/fonts/NOTICE.md.
        android: {
          fonts: [
            {
              fontFamily: 'WantedSans',
              fontDefinitions: [
                { path: './assets/fonts/WantedSans-Regular.otf', weight: 400 },
                { path: './assets/fonts/WantedSans-Medium.otf', weight: 500 },
                { path: './assets/fonts/WantedSans-Bold.otf', weight: 700 },
              ],
            },
          ],
        },
        ios: {
          fonts: [
            './assets/fonts/WantedSans-Regular.otf',
            './assets/fonts/WantedSans-Medium.otf',
            './assets/fonts/WantedSans-Bold.otf',
          ],
        },
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          '촬영지에 도착했는지 확인하기 위해 현재 위치를 사용합니다.',
      },
    ],
    [
      '@mj-studio/react-native-naver-map',
      {
        client_id: process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID ?? '',
      },
    ],
    [
      'expo-build-properties',
      {
        ios: {
          // Naver Map's iOS SDK ships as a static framework.
          useFrameworks: 'static',
        },
        android: {
          // Naver hosts its Android SDK on its own Maven repo, not Central.
          extraMavenRepos: ['https://repository.map.naver.com/archive/maven'],
        },
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
