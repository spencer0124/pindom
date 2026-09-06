---
title: App Development Onboarding
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-09-06
audience: internal
---

# 앱 개발 시작하기 / App Development Onboarding

> 링크 하나. 어떤 문서를 어떤 순서로 열지, 막혔을 때 뭘 볼지. 앱 개발이 처음인 분이 이 저장소에서 일을 시작할 때 여기서 출발하세요. **One link: which document to open, in what order, and where to go when you are stuck.**

## 한국어

### 문서는 두 개, 언어는 두 벌

읽어야 할 문서는 실질적으로 **두 개**입니다. 각각 한국어판과 영문판이 있어서 파일은 네 개입니다.
**영문판이 기준**이고 한국어판은 번역본입니다 — 두 문서가 어긋나면 영문판이 맞습니다.

| 문서 | 한국어 | English |
| --- | --- | --- |
| **① 실행 가이드** — 손으로 따라 하는 첫 실행 | [run-the-app-on-an-android-emulator.ko.md](tutorials/run-the-app-on-an-android-emulator.ko.md) | [run-the-app-on-an-android-emulator.md](tutorials/run-the-app-on-an-android-emulator.md) |
| **② 개념 가이드** — 왜 그렇게 되는지, 그리고 용어 | [expo-and-native-builds.ko.md](explanation/expo-and-native-builds.ko.md) | [expo-and-native-builds.md](explanation/expo-and-native-builds.md) |

### 순서

1. **①을 위에서부터 따라 하세요.** 90분 정도 걸리고 대부분 다운로드 대기입니다. 끝나면 에뮬레이터에
   앱이 떠 있고, 파일을 저장하면 화면이 바뀝니다.
2. **그다음 ②를 읽으세요.** 먼저 읽지 마세요 — 직접 돌아가는 걸 본 뒤에 읽어야 붙습니다.
3. 그다음은 ②의 마지막에 있는 다음 단계 목록을 따라가면 됩니다.

> [!NOTE]
> ①을 하는 데 **Firebase 권한도, 네이버 지도 키도, 애플 계정도 필요 없습니다.** 그것들이 없으면
> 앱이 알아서 `src/mocks/`의 가짜 데이터로 돕니다. 권한 받느라 기다리지 말고 그냥 시작하세요.

### 각 문서에 뭐가 들었나

**① 실행 가이드** — 빈 맥에서 앱이 돌아갈 때까지 10단계.
Node·JDK 17·Android Studio 설치, 환경변수, 에뮬레이터(AVD) 만들기, 첫 빌드, Fast Refresh로
수정 반영 확인, **둘째 날부터는 뭘 치는지**. 뒤에 에뮬레이터에서 GPS·카메라·지도를 테스트하는 법과
14줄짜리 문제 해결 표가 붙어 있습니다.

**② 개념 가이드** — 앱이 왜 그렇게 동작하는지.
앱은 *껍데기(네이티브 바이너리)* 와 *내용물(JS 번들)* 두 개라는 모델, `android/` 폴더가 왜 git에
없는지(CNG·prebuild), config plugin, **언제 리빌드해야 하는지 판단표**, Expo Go를 왜 못 쓰는지,
**키워드 용어집**, 그리고 **인터넷·Claude 답변이 이 프로젝트에 맞는지 걸러내는 법**.

### 헷갈릴 때 뭘 보나

| 지금 상황 | 볼 곳 |
| --- | --- |
| 아무것도 안 깔려 있다 | ① [순서](tutorials/run-the-app-on-an-android-emulator.ko.md#순서) 1~7단계 |
| 빌드가 에러를 내고 죽는다 | ① [문제 해결](tutorials/run-the-app-on-an-android-emulator.ko.md#문제-해결) 표에서 에러 문구 찾기 |
| 표에 없는 에러다 | ① [표에 없는 에러를 만났을 때](tutorials/run-the-app-on-an-android-emulator.ko.md#표에-없는-에러를-만났을-때) |
| 앱은 뜨는데 **내 수정이 반영이 안 된다** | ② [언제 리빌드해야 하나](explanation/expo-and-native-builds.ko.md#언제-리빌드해야-하나) — 가장 많이 보게 될 표 |
| `.env`를 바꿨는데 아무 일도 안 일어난다 | 같은 표. 답은 "Metro 재시작이 아니라 리빌드"입니다 |
| 무슨 단어인지 모르겠다 (prebuild? CNG? Metro?) | ② [키워드](explanation/expo-and-native-builds.ko.md#키워드) |
| GPS나 카메라를 테스트하고 싶다 | ① [GPS와 카메라 테스트하기](tutorials/run-the-app-on-an-android-emulator.ko.md#gps와-카메라-테스트하기) |
| 지도가 회색 빈 화면이다 | ① 같은 섹션의 지도 항목 (키가 없으면 정상) |
| **검색해서 찾은 답이 맞는 답인지 모르겠다** | ② [그 답이 여기 적용되지 않는다는 신호](explanation/expo-and-native-builds.ko.md#그-답이-여기-적용되지-않는다는-신호) |
| 뭘 어디서 검색해야 할지 모르겠다 | ② [찾아보는 법](explanation/expo-and-native-builds.ko.md#찾아보는-법) |
| 화면이나 컴포넌트를 새로 만들어야 한다 | [design-system.md](reference/design-system.md)를 **먼저**, 그다음 [design/README.md](../design/README.md) |
| 앱이 뭘 하는 앱인지, 폴더 구조가 궁금하다 | [architecture.md](explanation/architecture.md) |
| 가짜 데이터 말고 진짜 Firebase를 붙여야 한다 | [connect-the-app-to-firebase.md](how-to/connect-the-app-to-firebase.md) |
| 서버가 뭘 주고받는지 알아야 한다 | [backend-contract.md](reference/backend-contract.md) |
| 빌드를 테스터에게 보내야 한다 | [ship-a-testflight-build.md](how-to/ship-a-testflight-build.md) |
| 문서를 새로 쓴다 | [docs/README.md](README.md) — 규칙과 전체 목차 |

### 막혔을 때 3단계

1. **마지막 에러를 읽으세요.** 첫 번째가 아니라. Gradle은 화면 몇 개를 토해내고, 진짜 원인은 맨
   아래 `FAILURE:` 블록에 있습니다.
2. **① 문제 해결 표에서 그 문구를 찾으세요.** 흔한 것 14개가 들어 있습니다.
3. **그래도 없으면 검색하되, 답을 먼저 걸러내세요.** Expo Go·`react-native init`·
   `react-native link`·`expo eject`·`android/` 직접 수정을 말하는 글은 전부 다른 프로젝트 얘기입니다.

### Claude에게 물어볼 때

이 저장소는 Claude로 개발하는 걸 전제로 쓰여 있습니다. 질문 앞에 맥락을 붙이는 것만으로 답의 질이
크게 달라집니다.

```text
PINDOM: Expo React Native 앱, macOS/Apple Silicon, 안드로이드 에뮬레이터.
Expo Go가 아니라 development build. CNG — android/ 는 gitignore 되어 있고
app.config.ts 에서 expo prebuild 로 생성됨. New Architecture 켜져 있음.
버전은 package.json 참고.
```

[CLAUDE.md](../CLAUDE.md)는 Claude의 컨텍스트에 자동으로 로드됩니다. 즉 이 저장소의 규칙은 이미
Claude가 알고 있고, 위 문장은 **환경**을 알려주는 부분입니다. 왜 이게 필요한지는 ②의
[키워드](explanation/expo-and-native-builds.ko.md#키워드)에 있습니다.

## English

### Two documents, two languages

There are effectively **two** documents to read. Each exists in Korean and English, so there
are four files. **The English file is the source of truth**; the Korean one is a translation.

| Document | Read it for |
| --- | --- |
| **① [run-the-app-on-an-android-emulator.md](tutorials/run-the-app-on-an-android-emulator.md)** | The guided first run: Node, JDK, Android Studio, the AVD, the first build, Fast Refresh, the daily loop, testing GPS and the camera, and a troubleshooting table |
| **② [expo-and-native-builds.md](explanation/expo-and-native-builds.md)** | The model: native shell vs JS bundle, CNG and prebuild, config plugins, **when a change needs a rebuild**, why Expo Go cannot host this app, the keyword glossary, and how to filter search results that do not apply |

Korean editions: [①.ko](tutorials/run-the-app-on-an-android-emulator.ko.md) ·
[②.ko](explanation/expo-and-native-builds.ko.md)

Do ① first, in order, then read ②. Not the other way round — the model only sticks once you
have watched the pieces move. ① needs **no** Firebase access, Naver key or Apple account:
the app falls back to fixtures in `src/mocks/` on its own.

### Where to go when you are stuck

| Situation | Go to |
| --- | --- |
| Nothing installed yet | ① [Steps](tutorials/run-the-app-on-an-android-emulator.md#steps) 1–7 |
| The build fails with an error | ① [Troubleshooting](tutorials/run-the-app-on-an-android-emulator.md#troubleshooting) |
| The error is not in that table | ① [When the table does not have your error](tutorials/run-the-app-on-an-android-emulator.md#when-the-table-does-not-have-your-error) |
| App runs, but **your edit does not appear** | ② [When do I need to rebuild?](explanation/expo-and-native-builds.md#when-do-i-need-to-rebuild) — the table you will use most |
| Changed `.env`, nothing happened | Same table. The answer is rebuild, not restart Metro |
| A word you do not recognise | ② [Keywords](explanation/expo-and-native-builds.md#keywords) |
| Testing GPS or the camera | ① [Testing GPS and the camera](tutorials/run-the-app-on-an-android-emulator.md#testing-gps-and-the-camera) |
| **Not sure a search result applies here** | ② [How to tell an answer does not apply](explanation/expo-and-native-builds.md#how-to-tell-an-answer-does-not-apply) |
| Not sure where to search at all | ② [Looking things up](explanation/expo-and-native-builds.md#looking-things-up) |
| Building a screen or component | [design-system.md](reference/design-system.md) **first**, then [design/README.md](../design/README.md) |
| What the app does, how folders relate | [architecture.md](explanation/architecture.md) |
| Turning fixtures off | [connect-the-app-to-firebase.md](how-to/connect-the-app-to-firebase.md) |
| What the server sends and expects | [backend-contract.md](reference/backend-contract.md) |
| Getting a build to testers | [ship-a-testflight-build.md](how-to/ship-a-testflight-build.md) |
| Writing a document | [docs/README.md](README.md) — the rules and the full index |

## Related

- [docs/README.md](README.md) — the complete documentation index and the writing rules
- [../README.md](../README.md) — repo setup and the command table
- [../CLAUDE.md](../CLAUDE.md) — the build rules, loaded into Claude's context automatically
