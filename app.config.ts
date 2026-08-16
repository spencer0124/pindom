import { ExpoConfig, ConfigContext } from 'expo/config';

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
  // src/lib/api/config.ts is the only consumer — everything else should read
  // through ApiConfig rather than touching `extra` directly.
  extra: {
    baseUrl: process.env.EXPO_PUBLIC_BASE_URL,
    env: process.env.EXPO_PUBLIC_ENV,
  },

  ios: {
    bundleIdentifier: 'com.zoyoong.pindom',
    supportsTablet: false,
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
        supportedLocales: ['ko', 'en'],
      },
    ],
    [
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
