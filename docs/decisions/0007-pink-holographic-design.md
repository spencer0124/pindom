---
title: Adopt the Pink Holographic Native Design
type: adr
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-09-19
audience: internal
---

# 0007 — Pink Holographic Native Design

> 연분홍 여백, 로즈 액션, 반짝이는 티켓, 하트 위치 핀을 Pindom 네이티브 앱의 현재 시각 기준으로 채택한다.

## Context

사용자가 제공한 `Pindom-일단최종.html`에서 유용한 디자인을 반영하되, 특히 반짝이는 티켓·덜 답답한 배치·전체 핑크 톤·Pindom에 맞는 아이콘을 요청했다. 브라우저 마크업은 시각 참고이며 실제 결과는 React Native 컴포넌트로 구현한다.

## Decision

- 연분홍·흰 표면에 짙은 로즈 액션을 사용한다. 팔레트와 형태에 관한 [ADR 0006](0006-adopt-the-prototype-as-the-design-source-of-truth.md)의 블랙·애시드 및 전역 dark·각진 장부 지침을 대체한다. 사용자 테마 토글을 추가하는 결정은 아니다.
- 공통 여백을 넓히고 둥근 표면을 사용한다. 티켓은 파스텔 포일, 짙은 잉크, 점선 절취선과 반권을 공유하며, 작은 화면·큰 글씨에서 컬렉션을 한 열로 전환한다.
- 하트가 든 위치 핀 `PindomMark`를 지도·티켓·빈 상태에 사용한다. 기타 아이콘은 기존 Phosphor 체계를 유지한다.
- 런처·스플래시·favicon도 같은 하트 위치 핀 벡터에서 생성한다. 기존 CanvasKit으로 래스터화하며 별도 사진이나 생성형 이미지를 사용하지 않는다.
- Wanted Sans와 기존 기능·데이터 흐름을 유지한다. HTML의 내용이나 예시 수치를 새 제품 사실로 옮기지 않는다.
- 자동 포일 반사는 전체 발행 카드와 첫 컬렉션 타일에 제한한다. 사용 완료·모션 감소·화면 비활성·앱 백그라운드에서는 정적으로 표시한다.

## Consequences

[DESIGN.md](../../DESIGN.md)가 현재 토큰과 적용 규칙을 기록하고, `.impeccable/design.json`은 그림자·모션·반응형 조건과 문서용 시각 미리보기를 제공한다. 기존 [디자인 기록](../../design/README.md)과 [토큰 기록](../reference/design-tokens.md)은 과거 결정의 근거로 보존한다.

런처·스플래시 리소스는 JS reload만으로 반영되지 않는다. 기존 `ios/`·`android/`가 있어도 prebuild 또는 리소스 동기화 후 새 네이티브 빌드·설치가 필요하다.

타입 검사·lint·기존 테스트와 iOS/Android Hermes 번들 내보내기를 통과했다. `.impeccable/review/`의 RNweb 컴포넌트 캡처는 좁은 폭과 티켓 외형 검토의 보조 자료다. Simulator·실기기 렌더링, 네이티브 터치 동작, 설치·배포는 이 검증에 포함되지 않았다.
