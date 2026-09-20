import { existsSync } from 'fs';

import { ExpoConfig, ConfigContext } from 'expo/config';

// EAS Build clones from git, and both Firebase files are gitignored, so on the
// build server they arrive as file-type environment variables instead — these
// hold the path EAS unpacked them to. Locally the variables are unset and the
// repo-root copies win. Without this an EAS build finds neither file, quietly
// drops Firebase, and ships fixtures to the store.
const ANDROID_FIREBASE_CONFIG = process.env.GOOGLE_SERVICES_JSON ?? './google-services.json';
const IOS_FIREBASE_CONFIG =
  process.env.GOOGLE_SERVICE_INFO_PLIST ?? './GoogleService-Info.plist';

// The @react-native-firebase/app config plugin aborts `expo prebuild` outright
// when `googleServicesFile` points at a file that is not there. Both files come
// from the backend developer and are gitignored, so a fresh clone never has
// them — gating the whole Firebase block on their presence keeps the native
// build working before that handoff has happened.
//
// Gated per platform, because a cloud build only ever carries the file for the
// platform it is building: an Android build on EAS has google-services.json and
// no plist. Requiring both — as this did until the Play submission — is what
// turned a release build into a fixture build without failing.
//
// See docs/how-to/connect-the-app-to-firebase.md.
const androidFirebaseConfigured = existsSync(ANDROID_FIREBASE_CONFIG);
const iosFirebaseConfigured = existsSync(IOS_FIREBASE_CONFIG);
const firebaseConfigured = androidFirebaseConfigured || iosFirebaseConfigured;

// An explicit EXPO_PUBLIC_USE_MOCKS always wins. Otherwise fixtures are on
// exactly when Firebase is unreachable, which is the only setting that works.
const useMocks = process.env.EXPO_PUBLIC_USE_MOCKS
  ? process.env.EXPO_PUBLIC_USE_MOCKS === 'true'
  : !firebaseConfigured;

if (!firebaseConfigured) {
  // Loud, because the alternative is a silent fixture build that looks real.
  console.warn(
    '[pindom] Firebase config files not found — building without Firebase.\n' +
      `         Expected ${ANDROID_FIREBASE_CONFIG} or ${IOS_FIREBASE_CONFIG}.\n` +
      '         Screens will read fixtures from src/mocks/.\n' +
      '         See docs/how-to/connect-the-app-to-firebase.md',
  );
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'PINDOM',
  slug: 'pindom',
  // The EAS account the project belongs to. `slug` and `owner` together resolve
  // to @seungyongcho/pindom, which is what `eas build` uploads against.
  owner: 'seungyongcho',
  // CFBundleShortVersionString. ios/Info.plist carries a literal copy of this
  // and ship-testflight.sh rewrites only CFBundleVersion, so a version bump has
  // to be written to both — the same trap as ios.buildNumber below. A new
  // version string also opens a fresh TestFlight version train, which is a
  // fresh Beta App Review.
  version: '1.0.2',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'pindom',
  userInterfaceStyle: 'light',
  newArchEnabled: true,

  // Values here are readable at runtime via `Constants.expoConfig.extra`.
  // src/lib/config.ts is the only consumer — everything else reads through
  // AppConfig rather than touching `extra` directly.
  extra: {
    // Written by hand because `eas init` cannot edit a dynamic config. Losing it
    // makes every `eas build` create a second project rather than fail.
    eas: { projectId: 'd5addc3b-2d13-40ba-ac49-54a09e73d50f' },
    env: process.env.EXPO_PUBLIC_ENV,
    useMocks,
    firebaseConfigured,
    // The client defaults to us-central1. A Korean deployment is likely
    // asia-northeast3, and a mismatch surfaces as `not-found` on every call.
    functionsRegion: process.env.EXPO_PUBLIC_FUNCTIONS_REGION,
    // Whether a Naver Maps client id was present at build time. The SDK does
    // not fail loudly without one — it renders an empty grey rectangle — so
    // 지도 has to know, and say so, rather than look broken.
    naverMapConfigured: Boolean(process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID),
  },

  ios: {
    bundleIdentifier: 'com.zoyoong.pindom',
    supportsTablet: false,
    // App Store Connect refuses a build number it has already seen for this
    // `version`, so this has to move every upload. Build 1 of 1.0.0 went up on
    // 2026-08-25, build 2 on 2026-08-26. Build 3 carries the real app icon —
    // 1 and 2 shipped the Expo template placeholder. Build 4 (2026-08-27)
    // carries the App Store review items: 신고, 차단, 회원 탈퇴 and the 응모
    // 공식 규정 screen. Build 5 (2026-08-30) brings the assistant map into the
    // chat thread and the real-road course line (PR #1). Build 6 (2026-08-31)
    // adds the answer cards under that map — the drive order as a numbered
    // list and the recommendations as rows opening 카카오맵 (PR #2). Build 7
    // (2026-09-01) adds the assistant place cards and active boards, the chat
    // retry and answer reporting, and the verification mail sent at signup
    // (PR #3 and the fix that followed it). Build 8 (2026-09-02) redraws the
    // map pin as a 압정 anchored at its needle tip — the default box-bottom
    // anchor slid it off its coordinate at every zoom — switches the map to
    // Navi night mode, and adds the 응모 내역 / 당첨 확인 entry points to
    // 컬렉션. Build 9 (2026-09-02) asks for the camera permission on the 인증
    // screen: asking only in CameraStage meant a reviewer who never cleared GPS
    // never triggered the request, and iOS grows the Settings toggle only after
    // the first one — so 설정 had no 카메라 row at all. It also carries the beta
    // feedback round: the 최애 찾기 start CTA, a full-screen gallery viewer,
    // 촬영 팁 restricted to people who verified, and pin choice when writing.
    // Build 10 (2026-09-02) adds the 이용약관 agreement in front of 가입 — the one
    // guideline 1.2 precaution that was never on the 2026-08-27 checklist, and
    // the only thing the 09-02 rejection of build 4 named. 신고, 차단 and the
    // filtering it asks about all shipped in build 4 already.
    // Build 11 (2026-09-03) gets the camera back on real hardware: expo-camera's
    // isAvailableAsync is a web-only method, so every phone threw
    // UnavailabilityError and the catch read that as "no camera" — every ticket
    // issued on a device carried the grey stand-in instead of a live photo, and
    // no simulator run could show it. It also has 로그인 rewrite the users
    // document for an account whose signup wrote Auth but not Firestore — that
    // account could not re-register and could not read anything — and resend the
    // verification mail on every unverified sign-in.
    // Build 12 (2026-09-03) is the first build of the 1.0.1 train and carries the
    // team's round from main: the Skia 홀로그램 티켓 card, 비공개 보관함 widened
    // into a 사진 보관함 that collects every cut and toggles public both ways,
    // 모자이크 placed by dragging, the 약관 보기 row that Checkbox.Line pushed off
    // screen, and the ticket row whose long place name shoved its date out of
    // view. @shopify/react-native-skia is the first native dependency added
    // since the Naver map — a merge that touches package.json now means
    // yarn install and pod install before any archive, or the JS references a
    // module the binary does not have and 티켓 crashes on a device only.
    // Build 13 (2026-09-06) carries the next round from main: 프로필 사진을
    // 앨범에서 고르는 expo-image-picker 흐름, 마이페이지 헤더 상단 여백과 아바타
    // 탭 안내, 그리고 개인정보처리방침·문의하기를 앱 밖으로 내보내지 않고 인앱
    // 브라우저 시트로 여는 변경. Build 12's warning about package.json held —
    // yarn install and pod install were both needed again — but it named only
    // half the trap. `ios.infoPlist` keys are materialised into
    // ios/PINDOM/Info.plist at prebuild, so the NSPhotoLibraryUsageDescription
    // this round added here alone never reached the binary. Nothing catches
    // that: typecheck passes, the archive succeeds, the upload is accepted, and
    // iOS kills the app the first time a tester opens the picker. A merge that
    // adds an infoPlist key means `npx expo prebuild -p ios`, and the check is
    // `plutil -p ios/PINDOM/Info.plist`, not a green build.
    // Build 14 (2026-09-07) carries: no new commits from main.
    // Build 15 (2026-09-08) carries: no new commits from main.
    // Build 16 (2026-09-19) carries: the photo editor (crop, mosaic, stickers)
    // and the pink holographic redesign (ADR 0007). First build of 1.0.2, so a
    // fresh TestFlight train and therefore a fresh Beta App Review.
    // Build 17 (2026-09-20) carries: the cutout camera and photo pins, plus
    // server-controlled camera testing — a capture path the backend can open
    // that skips the GPS gate, marks the capture as a test, and keeps that
    // label on the ticket through 마이 and 프로필 so test issuances never
    // inflate real counts. Same 1.0.2 train as build 16.
    // Build 18 (2026-09-21) carries: selfie camera switching — the capture
    // screen can flip to the front camera, which needs no new entitlement
    // because NSCameraUsageDescription already covers both — and two cutout
    // fixes: the overlay no longer drifts or vanishes mid-capture, and its
    // toggle is renamed. Same 1.0.2 train as build 17.
    // It lives here rather than in Info.plist because `ios/` is gitignored — a
    // number kept only there is lost at the next prebuild, and the next
    // uploader finds out from a rejected upload.
    buildNumber: '18',
    ...(iosFirebaseConfigured && { googleServicesFile: IOS_FIREBASE_CONFIG }),
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      // GPS verification: PINDOM only ever checks location while the user is
      // actively verifying a filming location, so foreground-only is the
      // correct (and least invasive) permission to request.
      NSLocationWhenInUseUsageDescription:
        '촬영지에 도착했는지 확인하기 위해 현재 위치를 사용합니다.',
      NSCameraUsageDescription:
        '촬영지에서 사진을 찍어 티켓을 발행하기 위해 카메라를 사용합니다.',
      NSPhotoLibraryUsageDescription:
        '프로필 사진으로 쓸 이미지를 앨범에서 고르기 위해 접근합니다.',
    },
  },

  android: {
    package: 'com.zoyoong.pindom',
    // Google Play refuses a versionCode it has already accepted, so this has to
    // move every upload — the Android counterpart to `ios.buildNumber` above.
    // Version 1 of 1.0.0 is the first Play submission (2026-08-31). It lives
    // here rather than in android/app/build.gradle because `android/` is
    // gitignored: a number kept only there is reset to 1 by the next prebuild,
    // and the next uploader finds out from a rejected upload.
    // Version 2 (2026-09-18) is 1.0.1 — the first Android build since 1.0.0, so
    // it carries everything from iOS builds 11–15 at once: the on-device camera,
    // the Skia hologram ticket, the photo vault, drag mosaic, album profile
    // photos and the in-app browser.
    versionCode: 2,
    ...(androidFirebaseConfigured && { googleServicesFile: ANDROID_FIREBASE_CONFIG }),
    adaptiveIcon: {
      // Matches the generated rose heart-pin launcher artwork.
      backgroundColor: '#F8AEBB',
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
        // Match the light blush screen before React mounts.
        backgroundColor: '#FFF7FA',
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
      'expo-camera',
      {
        cameraPermission: '촬영지에서 사진을 찍어 티켓을 발행하기 위해 카메라를 사용합니다.',
        // 티켓 발행 never records audio; leaving this undeclared keeps the
        // microphone prompt out of the flow entirely.
        recordAudioAndroid: false,
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
