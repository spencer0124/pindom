---
title: 안드로이드 에뮬레이터에서 앱 실행하기
type: tutorial
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-09-06
audience: internal
---

# 안드로이드 에뮬레이터에서 앱 실행하기

> 아무것도 안 깔린 맥에서 시작해, 가상 Pixel 위에서 PINDOM이 돌아가고, 파일을 저장하면 1초 뒤 화면이 바뀌는 상태까지. 모바일 앱을 한 번도 만들어본 적 없는 사람 기준으로 썼습니다. macOS Apple Silicon(M1~M4) 전제입니다.

> [!NOTE]
> 이 문서는 [run-the-app-on-an-android-emulator.md](run-the-app-on-an-android-emulator.md)의 한국어판입니다.
> 두 문서가 어긋나면 **영문판이 기준**입니다 ([docs/README.md](../README.md) §6).

## 무엇을 만들게 되나

끝나고 나면 맥의 안드로이드 에뮬레이터 위에 PINDOM의 **development build**가 깔려 있게 됩니다.
이 repo에서 컴파일된 진짜 안드로이드 앱이고, TypeScript는 개발 서버에서 받아오기 때문에 파일을
저장하면 리빌드 없이 화면이 바뀝니다.

**Firebase 프로젝트도, 네이버 지도 키도, 애플 계정도 필요 없습니다.** 앱이 그것들이 없다는 걸
감지하고 `src/mocks/`의 픽스처 데이터를 대신 내보냅니다 — 진짜 화면에 가짜 내용물. 이건 정상적인
작업 방식이지, 반쪽짜리 상태가 아닙니다.

처음 한 번은 **90분** 정도 잡으세요. 대부분 다운로드 시간입니다.

> [!NOTE]
> 지금 치는 명령어를 이해하지 못해도 됩니다. 일단 돌아가게 만드는 게 먼저예요. 개념은
> [expo-and-native-builds.ko.md](../explanation/expo-and-native-builds.ko.md)에 있고,
> 직접 돌아가는 걸 본 다음에 읽으면 훨씬 잘 들어옵니다.

## 준비물

- Apple Silicon 맥, 그리고 **여유 공간 30GB 정도**. Android Studio, SDK, 에뮬레이터 이미지,
  Gradle 캐시가 각각 큽니다.
- 터미널 앱. 아래 명령어는 전부 여기에 칩니다.
- 이 저장소 읽기 권한.

그 외엔 없습니다. 특히 **유료 개발자 계정은 필요 없습니다.**

## 순서

### 1. Node 설치

Node 버전은 repo의 `.nvmrc`에 고정돼 있습니다. 버전 매니저인 **nvm**을 써서, 맥의 다른 작업을
건드리지 않고 이 프로젝트만 그 버전을 쓰게 합니다.

```bash
brew install nvm
```

설치가 끝나면 Homebrew가 `~/.zshrc`에 추가할 설정 줄을 출력해 줍니다. 그걸 추가하고, 터미널 창을
**새로 열어서** 확인하세요.

```bash
command -v nvm    # nvm 이라고 나오면 성공
```

나중에 repo 안에서 `nvm install`을 치면 `.nvmrc`를 읽어 고정된 버전을 설치합니다. 6단계에서 합니다.

Yarn도 설치하세요. 이 repo의 lockfile이 Yarn 기준으로 쓰여 있습니다.

```bash
npm install -g yarn
```

### 2. JDK 설치

안드로이드는 Gradle로 빌드하고, Gradle은 Java 위에서 돕니다. **버전이 중요합니다** — 여기서는
최신 JDK가 더 좋은 게 아니라, class file version 에러를 냅니다.

```bash
brew install openjdk@17
```

Homebrew가 이걸 자동으로 `PATH`에 넣어주지 않습니다. `~/.zshrc`에 추가하세요.

```bash
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
```

터미널을 새로 열고 확인합니다.

```bash
java -version     # openjdk version "17.x.x"
```

> [!WARNING]
> 예전에 Java를 깔아본 적이 있다면 지금 맥에 여러 개가 있을 수 있습니다. Gradle은 **가장 최신
> 버전이 아니라 `JAVA_HOME`이 가리키는 것**을 씁니다. Android Studio가 내장한 JDK도 아닙니다.
> 빌드가 `Unsupported class file major version`으로 실패하면 원인은 이겁니다.
> `/usr/libexec/java_home -V`로 맥에 깔린 JDK를 전부 볼 수 있습니다.

### 3. Android Studio 설치

[developer.android.com/studio](https://developer.android.com/studio)에서 받아 설치 마법사를
기본값 그대로 진행하세요. 마법사가 Android SDK, 에뮬레이터, 플랫폼 도구를 설치합니다. 여기가 가장
오래 걸립니다.

Android Studio를 편집기로 쓸 일은 거의 없습니다. 코드는 평소 쓰는 편집기에서 쓰고 빌드는 터미널에서
합니다. 이걸 까는 이유는 **SDK와 에뮬레이터를 이 프로그램이 관리하기 때문**입니다.

마법사가 끝나면 **Settings → Languages & Frameworks → Android SDK**를 열고,
**SDK Tools** 탭에서 아래가 체크돼 있는지 확인하세요.

- Android SDK Build-Tools
- Android SDK Command-line Tools (latest)
- Android Emulator
- Android SDK Platform-Tools

**SDK Platforms** 탭은 마법사가 이미 최신 안정 버전을 깔아뒀을 겁니다. 나중에 Gradle이 다른 API
레벨을 요구하면 에러 메시지에 그 숫자가 그대로 찍히니, 그때 돌아와 그 번호를 체크하면 됩니다.

### 4. SDK 위치를 셸에 알려주기

빌드가 SDK를 알아서 찾아주지 않습니다. 환경변수를 읽습니다. `~/.zshrc`에 추가하세요.

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin"
```

터미널을 새로 열고 셋 다 되는지 확인합니다.

```bash
adb --version
emulator -version
sdkmanager --version
```

`sdkmanager`가 없다면 command-line tools가 안 깔린 겁니다. 3단계로 돌아가세요.

### 5. 에뮬레이터 만들기

**AVD**(Android Virtual Device)가 가상 폰입니다. Android Studio에서 만듭니다:
**Tools → Device Manager → `+` (Create Virtual Device)**.

| 항목 | 선택 | 이유 |
| --- | --- | --- |
| Device | **Pixel 7** | 평범한 요즘 화면 크기와 비율 |
| System image | **arm64-v8a** 이미지 | Apple Silicon은 arm 이미지를 네이티브로 돌립니다. x86 이미지는 못 쓸 만큼 느리거나 아예 안 뜹니다 |
| Services | **Google APIs** | Firebase가 필요로 하는 Google Play *services*가 들어 있습니다. "Google Play" 쪽은 Play *스토어*까지 넣고 기기를 잠그는데, 그건 필요 없습니다 |

나머지는 기본값 그대로 둬도 됩니다. 알아볼 수 있는 이름을 지어주세요.

> [!NOTE]
> 규칙이 아니라 근거로 적어둡니다: 이 앱이 지금까지 개발된 AVD는 Pixel 7 / API 35 / Google APIs /
> `arm64-v8a`입니다. 더 높은 API 레벨도 괜찮습니다. 뭔가 이상하게 동작해서 에뮬레이터를 용의선상에서
> 빼고 싶을 때 이 조합으로 맞추면 안전합니다.

Device Manager에서 ▶ 버튼으로 한 번 부팅해 홈 화면까지 뜨는 걸 확인하세요. 빌드가 에뮬레이터에
의존하기 **전에** 에뮬레이터가 멀쩡한지 알아두는 게 낫습니다. 그다음 터미널이 이걸 보는지 확인합니다.

```bash
adb devices     # emulator-5554   device
```

오른쪽이 `device`면 준비된 겁니다. `offline`이면 아직 부팅 중이니 기다리세요.

### 6. repo 세팅

```bash
git clone <저장소 주소> pindom
cd pindom
nvm install            # .nvmrc를 읽습니다
yarn install           # 의존성 설치, 몇 분 걸립니다
cp .env.example .env
```

`.env`를 열어 주석을 읽어보세요. 이 앱이 받는 모든 키가 뭔지 문서화된 계약서입니다. 첫 실행에서는
**아무것도 바꾸지 마세요.** `EXPO_PUBLIC_USE_MOCKS=true`가 이미 들어 있고, 그게 지금 원하는 상태입니다.

그다음 도구 체인이 서로 아귀가 맞는지 확인합니다.

```bash
npx expo-doctor
```

버전 불일치 경고는 참고용이라 그냥 둬도 됩니다. SDK나 JDK가 없다는 메시지는 아니니, 그건 고치고
넘어가세요.

### 7. 첫 빌드

```bash
yarn android
```

그리고 그냥 두세요. 요즘 Apple Silicon 맥에서 **대략 10~20분**, 처음 몇 분은 아무 일도 안 일어나는
것처럼 보입니다. 멈춘 게 아닙니다. 순서대로 이렇게 돕니다.

1. `expo prebuild`를 돌려 `android/` 디렉터리를 생성합니다 — 새로 clone한 상태엔 이 폴더가 아예
   없는 게 정상입니다
   ([CNG](../explanation/expo-and-native-builds.ko.md#continuous-native-generation-cng))
2. Gradle, 안드로이드 빌드 도구, 모든 네이티브 의존성을 내려받습니다 — 네이버 지도 SDK 포함이고,
   이건 네이버 자체 Maven 저장소에서 받습니다
3. 앱을 컴파일합니다
4. 실행 중인 에뮬레이터에 APK를 설치합니다
5. JavaScript 개발 서버인 **Metro**를 띄우고, 터미널에 계속 띄워둡니다

보게 되지만 걱정 안 해도 되는 것 두 가지:

- Firebase 설정 파일을 못 찾았고 화면이 픽스처를 읽을 거라는 노란 경고. Firebase 프로젝트에
  초대되기 전까지는 이게 정상입니다. **일부러 크게 찍습니다** — 진짜처럼 보이는데 사실은 픽스처인
  빌드가 조용히 나가는 게 이 경고가 막으려는 사고입니다.
- 엄청난 양의 Gradle 출력. 마지막 몇 줄만 의미가 있습니다.

### 8. 잘 됐는지 확인

PINDOM이 에뮬레이터에서 알아서 뜹니다. 화면 몇 개 눌러보세요.

디자인 시스템 컴포넌트를 한 화면에 전부 그리는 화면도 있습니다. 폰트·색·테마가 제대로 로드됐는지
확인하는 가장 빠른 방법입니다. 두 번째 터미널에서 이렇게 열 수 있습니다.

```bash
adb shell am start -a android.intent.action.VIEW -d "pindom://sds-preview"
```

`pindom://`은 이 앱의 URL scheme이고 `app.config.ts`의 `scheme`에 선언돼 있습니다. `app/` 아래의
모든 라우트를 이 방식으로 바로 열 수 있어서, 작업 중인 화면까지 플로우를 눌러가며 도달하는 것보다
훨씬 빠릅니다.

### 9. 파일을 고치고 바뀌는 걸 보기

하루 종일 쓰게 될 부분입니다.

Metro는 켜둔 채로, 홈 화면인 `app/(tabs)/index.tsx`를 열어 눈에 보이는 텍스트를 하나 바꾸고
저장하세요.

1초쯤 뒤 에뮬레이터가 바뀝니다. 리빌드도 없고, 앱에서 어디까지 들어와 있었는지도 안 잃습니다.
이게 **Fast Refresh**입니다. Metro가 건드린 모듈만 보내주는 거예요.

Metro 터미널은 대화형입니다. 자주 쓰는 키:

| 키 | 하는 일 |
| --- | --- |
| `r` | 앱을 처음부터 다시 로드. 변경이 반영이 안 되거나 상태가 꼬였을 때 |
| `a` | 안드로이드 에뮬레이터에서 앱 열기 |
| `m` | 앱 안의 개발자 메뉴 토글 |
| `j` | JavaScript 디버거 열기 |
| `?` | 전체 키 목록 |

Metro는 `Ctrl+C`로 끄고, `yarn start`로 다시 켭니다.

> [!NOTE]
> 에뮬레이터에 뜨는 빨간 에러 화면은 앱이 죽은 게 아니라 Metro가 뭐가 깨졌는지 알려주는 겁니다.
> 맨 윗줄 읽고, 파일 고치고, 저장하세요. 알아서 사라집니다.

### 10. 두 번째부터의 실행

**`yarn android`를 다시 돌리지 마세요.** 그게 10분짜리 단계였고, 두 번 할 일은 거의 없습니다.

평소:

```bash
yarn start     # 그다음 `a`를 누르면 에뮬레이터에서 열립니다
```

앱은 이미 깔려 있습니다. Metro에 다시 붙고, 바로 작업하면 됩니다.

리빌드가 필요한 건 앱의 *네이티브* 쪽이 바뀌었을 때뿐입니다 — 새 의존성이 들어왔거나,
`app.config.ts`가 바뀌었거나. 어떤 변경에 뭐가 필요한지는
[리빌드 판단표](../explanation/expo-and-native-builds.ko.md#언제-리빌드해야-하나)에 정리돼 있고,
지금 한 번 읽어둘 값어치가 있습니다.

```bash
# package.json을 건드린 브랜치를 pull 한 뒤
yarn install && yarn android

# app.config.ts의 plugins / permissions / 아이콘이 바뀐 뒤
npx expo prebuild -p android --clean && yarn android
```

작업을 끝냈다고 하기 전에 게이트 두 개를 돌리세요. CI와 릴리스 스크립트가 돌리는 것과 같은 명령입니다.

```bash
yarn typecheck
yarn lint
```

## GPS와 카메라 테스트하기

PINDOM은 위치 인증 앱입니다. 핵심 루프가 *맞는 장소에 가서, 사진을 찍고, 티켓을 받는 것*이에요.
가상 폰은 아무 데도 있지 않고 카메라도 없으니, 이 두 가지는 에뮬레이터에서 따로 세팅해야 합니다.

### 에뮬레이터 위치 지정

에뮬레이터 툴바의 **⋯** 버튼 → **Location**에서 위도·경도를 넣고 **SET LOCATION**을 누릅니다.

터미널에서 하는 게 더 빠르고, 스크립트로 만들 수도 있습니다.

```bash
# 주의: 경도가 먼저, 위도가 나중입니다 — 보통 쓰는 순서와 반대예요
adb emu geo fix 126.9780 37.5665
```

촬영지 좌표로 맞추면 GPS 인증이 통과합니다. 엉뚱한 곳으로 맞추면 실패 경로를 볼 수 있는데, 그것도
똑같이 중요한 테스트입니다.

> [!WARNING]
> 에뮬레이터에서 GPS 인증이 통과했다는 건 화면이 동작한다는 것까지만 증명합니다. **인증 통과 여부는
> 클라이언트가 절대 결정하지 않습니다** — 반경, 이동 속도, 정확도, mock provider 검사는 위치 위조
> 방지 장치이고 전부 서버에서 판정합니다. 화면에 뜨는 거리는 피드백이지 검사가 아닙니다.
> [backend-contract.md](../reference/backend-contract.md)를 보세요.

### 카메라

에뮬레이터의 후면 카메라는 가상 3D 방을 그려줄 수 있습니다. 촬영 플로우가 도는지, 프리뷰가 뜨는지,
사진이 돌아오는지 확인하기엔 충분합니다. Device Manager → AVD 편집 →
**Show Advanced Settings → Camera → Back: VirtualScene**에서 설정합니다.

> [!WARNING]
> 카메라 관련 변경은 반드시 실기기에서 확인한 다음 내보내세요. 이 앱은 이미 그 틈으로 빌드 하나를
> 날린 적이 있습니다. 카메라 사용 가능 여부 체크가 실기기에서만 다르게 동작해서, 실기기에서 발행된
> 티켓이 전부 사진 대신 회색 대체 이미지를 달고 나갔습니다. **어떤 시뮬레이터 실행으로도 잡을 수
> 없었습니다.** 자세한 경위는 `app.config.ts`의 `ios.buildNumber` 주석 build 11 항목에 있습니다.

### 지도

`.env`에 `EXPO_PUBLIC_NAVER_MAP_CLIENT_ID`가 없으면 지도는 회색 빈 사각형으로 뜹니다. 새로
clone한 상태에서는 정상입니다 — SDK가 조용히 실패하기 때문에, 앱이 빌드 시점에 키 유무를 확인해서
화면에 그렇게 말해줍니다. 안 그러면 고장난 것과 구분이 안 되니까요. 지도 작업을 해야 할 때 키를
요청하세요. 그리고 이 키는 네이티브에 구워지기 때문에, 넣은 뒤에는 reload가 아니라 prebuild가
필요합니다.

## 문제 해결

| 증상 | 원인 | 해결 |
| --- | --- | --- |
| `SDK location not found` | 이 셸에 `ANDROID_HOME`이 없음 | 4단계, 그리고 터미널을 **새로** 열기 |
| `Unsupported class file major version` | Gradle이 엉뚱한 JDK를 쓰는 중 | `java -version`이 17이어야 합니다. 2단계 |
| `Failed to install ... some licences have not been accepted` | SDK 라이선스 미동의 | `sdkmanager --licenses` 후 전부 동의 |
| `error: no devices/emulators found` | 에뮬레이터가 안 떠 있음 | Device Manager에서 켜고, `adb devices`가 `device`라고 할 때까지 대기 |
| Metro는 뜨는데 앱이 안 열림 | 이 AVD에 앱이 안 깔려 있음 | 그 AVD에 대해 `yarn android`를 한 번 |
| `Unable to resolve module ...` | 브랜치와 의존성이 어긋남 | `yarn install` 후 `yarn start --clear` |
| `8081` 포트 사용 중 | 예전 Metro가 아직 살아 있음 | `lsof -ti:8081 \| xargs kill` 또는 `yarn start --port 8082` |
| `git pull` 직후 앱이 실행하자마자 죽음 | 그 브랜치가 네이티브 코드를 추가했는데 설치된 껍데기엔 없음 | `yarn install && yarn android` |
| 수정이 반영 안 됨 | Metro가 낡은 캐시를 주는 중 | `yarn start --clear` |
| `app.config.ts` 수정이 무시되는 것 같음 | JS가 아니라 네이티브 설정이라서 | `npx expo prebuild -p android --clean && yarn android` |
| `.env` 수정이 무시되는 것 같음 | env 값은 바이너리에 구워집니다. Metro가 주는 게 아닙니다 | `yarn android`. Metro 재시작으로는 **절대** 반영되지 않습니다 — [리빌드 판단표](../explanation/expo-and-native-builds.ko.md#언제-리빌드해야-하나) 참고 |
| 지도가 회색 빈 화면 | 네이버 client id 없음 | 키가 없으면 정상입니다 — 위 참고 |
| 에뮬레이터가 극도로 느림 | Apple Silicon에 x86 시스템 이미지 | `arm64-v8a` 이미지로 AVD를 다시 만드세요 |
| 인터넷 튜토리얼이 Expo Go를 쓰라고 함 | 다른 종류의 프로젝트를 설명하는 글입니다 | 무시하세요. 이 repo는 development build가 필요합니다. [이유](../explanation/expo-and-native-builds.ko.md#이-앱이-expo-go를-쓸-수-없는-이유) |

여기 없는 방식으로 빌드가 실패하면, 제일 먼저 네이티브 프로젝트를 다시 생성해 보세요. 어차피 버리는
물건이고, 아쉬울 만한 게 들어 있을 수 없습니다.

```bash
npx expo prebuild -p android --clean && yarn android
```

### 표에 없는 에러를 만났을 때

1. **첫 번째 에러가 아니라 마지막 에러를 읽으세요.** Gradle은 화면 몇 개 분량을 토해내는데 맨 위는
   원인인 경우가 드뭅니다. 끝까지 내려서 마지막 `FAILURE:` 블록을 보세요.
2. **에러 문구를 큰따옴표로 감싸서 그대로 검색하세요.** 뒤에 `expo android`를 붙이면 좋습니다.
   그 에러 문구는 십중팔구 나만 겪는 게 아닙니다.
3. 에러에 패키지 이름이 나오면 **그 패키지 저장소의 GitHub Issues를 검색하세요.** 닫힌 이슈도
   포함해서요 — 대부분 스레드 안에 해결책이 적힌 채로 닫힙니다.
4. **그 답이 어떤 종류의 프로젝트를 전제하는지 확인하세요.** 다들 건너뛰고, 가장 비싸게 치르는
   단계입니다. 판별표는
   [찾아보는 법](../explanation/expo-and-native-builds.ko.md#그-답이-여기-적용되지-않는다는-신호)에
   있습니다. 요약하면 Expo Go, `react-native init`, `react-native link`, `expo eject`,
   `android/` 직접 수정을 언급하는 글은 전부 다른 설정을 말하고 있는 겁니다.

Claude에게 물어볼 때는 질문 앞에 이걸 붙여넣으세요. 답이 엉뚱한 데로 안 갑니다.

```text
PINDOM: Expo React Native 앱, macOS/Apple Silicon, 안드로이드 에뮬레이터.
Expo Go가 아니라 development build. CNG — android/ 는 gitignore 되어 있고
app.config.ts 에서 expo prebuild 로 생성됨. New Architecture 켜져 있음.
버전은 package.json 참고. 실행한 명령: <명령어>. 에러 마지막 줄: <붙여넣기>.
```

이 전제를 안 주면 손으로 관리하는 `react-native init` 프로젝트용 조언이 돌아오고, 그게 그럴듯해
보입니다.

## 다음 단계

1. [expo-and-native-builds.ko.md](../explanation/expo-and-native-builds.ko.md)를 읽으세요. 직접
   돌아가는 걸 본 다음이라 모델이 훨씬 잘 붙습니다. 특히 리빌드 판단표와 키워드 목록 — 이 스택에
   대해 Claude에게 제대로 질문하기 위해 쓴 부분입니다.
2. [architecture.md](../explanation/architecture.md) — 앱이 무엇을 하는지, 그리고 `app/`,
   `src/features/`, `src/components/`, `src/design-system/`이 어떤 관계인지.
3. [design-system.md](../reference/design-system.md) — **컴포넌트를 만들기 전에 반드시.**
   새로 만드는 것보다 재사용이 우선이고, 이 repo는 그 말을 진심으로 합니다.
4. [`design/README.md`](../../design/README.md) — 인터랙티브 프로토타입. 디자인 권위이고 Figma보다
   우선합니다.
5. [CLAUDE.md](../../CLAUDE.md)를 훑어보세요. 위 문서들이 뒷받침하는 규칙들의 짧은 목록이고,
   Claude의 컨텍스트에 자동으로 로드됩니다 — 그래서 두 분이 같은 지침을 보고 일하게 됩니다.

## 관련 문서

- [expo-and-native-builds.ko.md](../explanation/expo-and-native-builds.ko.md) — 개념과 용어
- [run-the-app-on-an-android-emulator.md](run-the-app-on-an-android-emulator.md) — 이 문서의 영문 원본
- [../../README.md](../../README.md) — repo 세팅과 명령어 표
- [connect-the-app-to-firebase.md](../how-to/connect-the-app-to-firebase.md) — 프로젝트 권한을 받은 뒤 픽스처 끄기
- [ship-a-testflight-build.md](../how-to/ship-a-testflight-build.md) — 릴리스 빌드는 방금 돌린 것과 뭐가 다른지
