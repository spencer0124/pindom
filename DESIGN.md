---
name: Pindom
description: 연분홍 여백과 홀로그램 티켓을 사용하는 네이티브 팬 여행 앱
colors:
  brand50: "#FCECF2"
  brand200: "#F8AEBB"
  brand400: "#DC7899"
  brand500: "#B83265"
  brand600: "#A22656"
  brand700: "#861C46"
  grey50: "#FFFAFC"
  grey100: "#FCECF2"
  grey200: "#ECDCE3"
  grey300: "#D8BFCB"
  grey400: "#8A6878"
  grey500: "#795C6A"
  grey600: "#725564"
  grey700: "#604452"
  grey800: "#492C3B"
  grey900: "#321C29"
  background: "#FFFFFF"
  greyBackground: "#FFF7FA"
  ticketInk: "#3D1720"
  ticketPink: "#F8C8DB"
  ticketLilac: "#D9D0FA"
  ticketMint: "#C7EEE6"
  ticketPearl: "#FFF5DB"
  pink: "#F8AEBB"
typography:
  t1:
    fontFamily: "Wanted Sans"
    fontSize: "30px"
    lineHeight: "40px"
    fontWeight: 700
  t3:
    fontFamily: "Wanted Sans"
    fontSize: "22px"
    lineHeight: "31px"
    fontWeight: 700
  t4:
    fontFamily: "Wanted Sans"
    fontSize: "20px"
    lineHeight: "29px"
    fontWeight: 700
  t5:
    fontFamily: "Wanted Sans"
    fontSize: "17px"
    lineHeight: "25.5px"
    fontWeight: 400
  t6:
    fontFamily: "Wanted Sans"
    fontSize: "15px"
    lineHeight: "22.5px"
    fontWeight: 400
  t7:
    fontFamily: "Wanted Sans"
    fontSize: "13px"
    lineHeight: "19.5px"
    fontWeight: 400
rounded:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "14px"
  xl: "16px"
  full: "20px"
spacing:
  xxs: "2px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  base: "16px"
  lg: "20px"
  xl: "24px"
  xxl: "32px"
components:
  button-primary-large:
    backgroundColor: "{colors.brand500}"
    textColor: "{colors.background}"
    rounded: "{rounded.lg}"
    padding: "2px 16px"
  search-field:
    backgroundColor: "{colors.grey100}"
    textColor: "{colors.grey900}"
    rounded: "{rounded.md}"
    height: "44px"
  ticket:
    textColor: "{colors.ticketInk}"
    rounded: "{rounded.lg}"
  ticket-balance:
    backgroundColor: "{colors.grey100}"
    rounded: "{rounded.xl}"
    padding: "20px"
---
# Design System: Pindom

## Overview

**Creative North Star: "분홍빛 여행 티켓"**

연분홍 바탕과 흰 표면 위에 로즈색 액션을 놓고, 수집한 티켓에는 파스텔 홀로그램 포일을 사용한다. 팬이 좋아하는 장소를 찾아가고 방문 기록을 모으는 경험을 하트가 든 위치 핀으로 연결한다.

촘촘한 장부보다 읽기 편한 여백을 우선한다. 화면 전체에 장식을 늘리지 않고 티켓의 재질과 PindomMark에 개성을 모은다.

**Key Characteristics:**

- 연분홍·흰 표면과 읽기 쉬운 로즈 액션
- 본문 아래에서 반짝이는 파스텔 티켓
- 하트와 위치 핀을 합친 PindomMark
- 좁은 화면과 큰 글씨에서 한 열로 바뀌는 컬렉션

기준일: 2026-09-19. 이 문서는 현재 React Native 구현을 기록한다. 실행 토큰의 원본은 `src/design-system/tokens/`, 테마 연결은 `foundation/colors.ts`다. [ADR 0007](docs/decisions/0007-pink-holographic-design.md)이 이전 블랙·애시드 팔레트와 각진 형태 지침을 대체한다. YAML의 `px`는 도구 간 교환 표기이며 네이티브에서는 React Native의 논리 단위로 사용한다.

## Colors

### Primary

로즈 `brand500`을 주요 버튼·선택된 탭·핵심 액션에 사용한다. `brand600`과 `brand700`은 로즈 계열의 더 짙은 단계다. 밝은 `brand50`과 `brand200`은 배경과 장식에 사용한다.

### Secondary

`ticketPink`, `ticketLilac`, `ticketMint`, `ticketPearl`, `pink`는 티켓 포일의 색이다. 포일 위 글자는 짙은 `ticketInk`를 사용한다.

### Neutral

`greyBackground`는 연분홍 화면 바탕, `background`는 흰 표면이다. `grey900`은 본문, `grey500`·`grey600`은 보조 정보, `grey200`은 경계다. 사진 화면용 dark 매핑은 별도로 유지한다.

흰색/로즈 대비는 5.70:1, `grey500`/`greyBackground`는 5.61:1, 티켓 잉크/포일 색상 정지점은 최소 8.77:1이다. 이는 지정 색상 쌍의 계산 결과이며 화면 전체의 접근성 인증을 의미하지 않는다.

## Typography

Wanted Sans를 유지한다. YAML은 iOS의 기본 패밀리 이름을 기록한다. Android는 `WantedSans`, iOS의 medium은 별도 `Wanted Sans Medium` 패밀리로 연결한다. 프로토타입의 Pretendard 교체 제안은 적용되지 않았다.

`t1`은 큰 제목, `t3`은 화면 제목, `t4`는 섹션 제목, `t5`·`t6`는 본문, `t7`은 보조 정보다. 화면에서는 `Txt`의 typography 키를 사용한다. 홈 티켓 수량은 별도의 40/48 크기이며 이를 일반 제목 규칙으로 확대하지 않는다. 날짜·일련번호에는 tabular numerals를 사용한다.

## Layout

공통 좌우 여백은 `spacing.xl`이다. 홈 티켓 요약은 내부 여백 `spacing.lg`와 줄바꿈 가능한 액션 행을 사용한다. 일반 표면은 내용의 길이를 받아들이며 고정 높이를 늘리지 않는다.

컬렉션은 화면 너비 380 이상에서 두 열, 그 미만 또는 fontScale 1.25 초과에서 한 열이다. 열 간격은 14, 각 타일 최소 높이는 160이다. 전체 티켓 비율은 300:200이며 너비 290 미만에서는 짧은 브랜드 표기·작은 제목·축소 여백을 사용하고 부제와 GPS 보조 표기를 생략한다. 장소·날짜·일련번호와 사용 상태는 유지한다.

## Elevation & Depth

주요 구분은 연분홍 바탕과 흰 표면의 명도 차이로 만든다. 기존 card·elevated·bottomSheet·segmentedIndicator 그림자 토큰은 보조 수단이다. 티켓의 깊이는 그림자를 더 쌓기보다 포일과 터치 반사로 표현한다. 정확한 그림자와 모션 값은 `.impeccable/design.json`에 기록한다.

## Shapes

티켓 모서리는 `rounded.lg`, 홈 티켓 요약 표면은 `rounded.xl`, 최애 칩과 검색 필드는 `rounded.md`다. 티켓은 양끝 노치와 점선 절취선을 유지한다. 전체 티켓 반권 너비는 94, 컬렉션 타일의 반권은 28이며 실제 절취 화면도 전체 티켓의 같은 94 경계를 사용한다.

## Components

### Buttons

기본 액션은 로즈 채움과 흰 글자다. 보조 액션은 weak, 낮은 강조는 outline을 사용한다. medium 최소 높이는 44, large는 52, big는 56이다. tiny는 기존 32 크기이므로 주 액션의 기준으로 삼지 않는다. 눌림·비활성·로딩 상태는 공통 Button 구현을 따른다.

### Inputs / Fields

검색 필드는 연분홍 채움, 검색 아이콘, 입력값이 있을 때 선택적으로 나타나는 지우기를 사용한다. 높이와 모서리는 YAML에 기록된 값이다. 네이티브 입력 동작을 유지한다.

### Chips

최애 선택은 56 크기의 둥근 사각형과 로즈 선택 테두리를 사용한다. 원래부터 테두리 공간을 확보해 선택할 때 레이아웃이 움직이지 않는다. 사진이 없으면 기존 이니셜을 표시한다. Badge는 별도의 작은 상태 라벨이다.

### Navigation

지도·커뮤니티·홈·티켓·마이의 다섯 목적지를 유지한다. 활성 탭은 로즈색과 채워진 아이콘, 비활성 탭은 보조 텍스트색과 윤곽 아이콘을 쓴다. 지도 탭·티켓·빈 상태의 PindomMark는 위치 핀 안에 하트를 넣는다. 다른 아이콘은 기존 Phosphor 체계를 따른다.

### Launcher / Splash

앱 런처·스플래시·favicon도 같은 하트 위치 핀을 사용한다. 공통 벡터는 `src/features/shared/pindom-mark.ts`, SVG 표현은 `assets/images/pindom-mark.svg`이며, `scripts/generate-brand-icons.mjs`가 기존 CanvasKit 런타임으로 PNG를 생성한다. 사진이나 생성형 이미지가 아니다. Android adaptive icon 바탕은 `pink`, 스플래시 바탕은 `greyBackground`다.

JS 화면 변경은 개발 환경에서 reload로 확인할 수 있다. 런처·스플래시 변경은 네이티브 리소스 재생성과 새 빌드·설치가 필요하다. 이미 `ios/`·`android/` 디렉터리가 있는 경우에도 설정과 이미지를 prebuild 또는 해당 프로젝트의 리소스 동기화 절차로 반영한 뒤 빌드한다. PNG 생성만으로 설치된 앱의 아이콘이 바뀌지는 않는다.

### Tickets

TicketCard·TicketFoil·HoloTilt를 공유한다. 포일은 본문 아래에 놓고 자동 반사는 7초 동안 천천히 왕복한다. 전체 발행 카드와 컬렉션 첫 타일만 자동 반사를 허용하며 사용 완료 카드는 정적이다. 절취 양쪽 조각의 독립 반사도 끈다.

`useMotionEnabled`는 OS 모션 감소, 화면 포커스, AppState를 확인한다. 설정을 아직 읽지 못했거나 접근성 API가 실패하면 정적 표시를 유지한다. 컬렉션 기울이기는 120ms의 짧은 hold로 시작해 스크롤을 보호한다.

사이드카의 HTML/CSS는 이 네이티브 컴포넌트의 시각적 문서 미리보기다. RNweb 캡처와 마찬가지로 Simulator·실기기의 터치, 폰트, 성능 검증을 대체하지 않는다.

## Do's and Don'ts

### Do

- **Do** 공통 색상·간격을 기존 토큰에서 읽고 액션은 theme의 accent를 사용한다.
- **Do** 티켓의 장소명·날짜·일련번호·사용 상태를 장식보다 먼저 읽히게 한다.
- **Do** 작은 화면, 큰 글씨, 모션 감소, 비활성 화면을 함께 확인한다.

### Don't

- **Don't** 블랙·애시드 장부 스타일을 앱 전체의 기본값으로 되돌린다.
- **Don't** 컬렉션의 모든 티켓에 자동 반짝임을 추가한다.
- **Don't** HTML 미리보기나 번들 내보내기 성공을 네이티브 실기기 검증으로 기록한다.
