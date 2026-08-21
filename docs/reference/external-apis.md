---
title: External API Integration Spec
type: reference
status: draft
owner: zoyoong124@gmail.com
last-updated: 2026-08-21
audience: internal
---

# Pindom — API 연동 명세

> Which third-party services PINDOM is expected to call, what each one is for, and which
> capabilities the backend developer must own instead. Read it before scoping any screen that
> shows a map, a route, a place detail or the assistant.

> [!NOTE]
> **Provenance.** The body below is the design team's handover document, kept verbatim,
> delivered alongside
> [`design/2026-08-20-prototype.html`](../../design/2026-08-20-prototype.html). Read every row
> as *someone has to choose this*, not as *this is chosen*.

> [!IMPORTANT]
> **The assistant is not this repo's to wire.** §6's chat provider, the prompt behind it, and
> the 답변 신고하기 flow the document does not cover are all the backend developer's, on the
> same boundary as Firebase
> ([ADR 0005](../decisions/0005-keep-firebase-behind-a-repository-boundary.md)). The `chat`
> screen submits a message through `src/lib/repositories/` and renders the reply; it holds no
> key and builds no prompt. The prototype makes its own model call — that is scaffolding, and
> porting it would put a provider choice and a credential inside the client. Do not.
>
> §7's GPS row restates a constraint this repo already treats as non-negotiable; see
> [architecture.md](../explanation/architecture.md) for where the trust boundary sits. What is
> genuinely open **for the client** is §3 — which renderer draws the map, since that one runs
> in the app.
>
> **Two §7 rows have since been settled elsewhere, and the contract wins.** The GPS row's
> 하루 1회 is not the cooldown that was agreed — it is **30 days**, per user per place, enforced
> only in `issueTicket`. And 다국어 UI 문구's `ko / en / ja / zh` is wider than what ships: the
> launch set is **`ko` and `en`**. Both rows are left verbatim above because this is a handover
> document; read them against
> [backend-contract.md](backend-contract.md) and the
> [review resolutions](../plans/2026-08-21-backend-contract-review-resolutions.md), which are
> authoritative.

작성 기준: 2026-08 · 프로토타입은 목업 데이터로 동작하며 실제 호출은 붙어 있지 않습니다.

---

## 0. 한눈에 보기

| # | 영역 | 제공처 | 상태 | 비용 |
| --- | --- | --- | --- | --- |
| 1 | 촬영지 정보 (6개 오퍼레이션) | 한국관광공사 TourAPI 4.0 | 필수 | 무료 (일 트래픽 제한) |
| 2 | 코스 경로 계산 | 카카오모빌리티 / TMAP / ODsay | 필수 | 카카오모빌리티 무료 쿼터 후 종량 |
| 3 | 지도 렌더링 | 카카오맵·네이버 SDK 또는 MapLibre 직접 구현 | 필수 (택1) | SDK 무료 / MapLibre 무료 |
| 4 | 맛집·카페 | 카카오 로컬 | 권장 | 무료 쿼터 |
| 5 | 촬영 시간대 | 기상청 · 한국천문연구원 | 권장 | 무료 |
| 6 | 로그인 | 카카오 · 애플 · 구글 | 필수 | 무료 |
| 7 | AI 챗봇 | Claude Messages API | 필수 | 토큰 종량 |
| 8 | GPS·티켓·응모·커뮤니티 | **자체 백엔드** | 필수 | 자체 |

---

## 1. 한국관광공사 TourAPI 4.0 — 촬영지 데이터

**Base URL** `https://apis.data.go.kr/B551011/KorService2`
**다국어** 언어별 서비스로 교체 — `EngService2`(영어) / `JpnService2`(일본어) / `ChsService2`(중국어 간체)
**인증** `serviceKey` (공공데이터포털 발급)
**공통 파라미터** `MobileOS`, `MobileApp=Pindom`, `_type=json`, `numOfRows`, `pageNo`

### 사용하는 6개 오퍼레이션

| 오퍼레이션 | 한글명 | 화면 | 주요 요청 파라미터 | 화면에 그리는 응답 필드 |
| --- | --- | --- | --- | --- |
| `locationBasedList2` | 위치기반 관광정보 조회 | 지도 핀, 내 주변 촬영지 | `mapX`, `mapY`, `radius`, `arrange=E`(거리순) | `title`, `mapx`/`mapy`, `dist`, `firstimage`, `contentid` |
| `searchKeyword2` | 키워드 검색 조회 | 통합 검색바, 아티스트 찾기 | `keyword`, `arrange`, `contentTypeId` | `title`, `addr1`, `firstimage`, `contentid` |
| `areaBasedList2` | 지역기반 관광정보 조회 | 홈 지역 코스, 지역별 추천 | `areaCode`, `sigunguCode`, `arrange=P`(인기순) | `title`, `addr1`, `firstimage`, `contentid` |
| `detailCommon2` | 공통정보 조회 | 장소 상세, **GPS 인증 기준 좌표** | `contentId`, `overviewYN=Y`, `mapinfoYN=Y`, `addrinfoYN=Y` | `overview`, `addr1`/`addr2`, `mapx`/`mapy`, `firstimage` |
| `detailImage2` | 이미지정보 조회 | 장소 갤러리 슬라이드 | `contentId`, `imageYN=Y`, `subImageYN=Y` | `originimgurl`, `smallimageurl` |
| `detailIntro2` + `detailInfo2` | 소개정보 · 반복정보 조회 | 이용 안내, 인증 가능 시간대 | `contentId`, `contentTypeId` | `usetime`, `restdate`, `parking`, `infocenter`, `infoname`/`infotext` |

### TourAPI의 한계

| 못 하는 것 | 대안 |
| --- | --- |
| 두 지점 사이 경로·소요 시간 | 2번 길찾기 API |
| 실제 로컬 맛집 (등록 관광 업소만 있음) | 4번 카카오 로컬 |
| 아티스트 ↔ 촬영지 매핑 | 자체 DB |
| 촬영지 원본 컷 이미지 | 자체 CDN |

---

## 2. 코스 경로 — 길찾기 API

AI가 짠 동선을 지도에 선으로 그리려면 **도로 좌표열(polyline)** 이 필요합니다. TourAPI는 좌표만 주고 경로는 계산해주지 않습니다.

| API | 엔드포인트 | 용도 | 핵심 |
| --- | --- | --- | --- |
| 카카오모빌리티 길찾기 | `apis-navi.kakaomobility.com/v1/directions` | 자차 코스 (주력) | 경유지 최대 30개, 응답 `vertexes`에 도로 좌표열 + 소요시간·거리 |
| 카카오모빌리티 다중 경유지 최적화 | `/v1/waypoints/directions` | **"동선 짜기" 순서 최적화** | 방문 순서를 최소 이동시간으로 재배열 |
| TMAP 보행자 경로 | `apis.openapi.sk.com/tmap/routes/pedestrian` | 골목·계단 촬영지 도보 안내 (동피랑, 남산 회현 계단) | 계단·경사 반영 |
| ODsay 대중교통 | `api.odsay.com/v1/api/searchPubTransPathT` | 차 없는 해외 팬 | 환승 경로, 버스·기차 시간 |

---

## 3. 지도 렌더링 — 두 가지 선택지

| 방식 | 장점 | 단점 |
| --- | --- | --- |
| **카카오맵 JS SDK** (`Polyline`, `CustomOverlay`) | 카카오모빌리티 경로와 좌표계 일치, 국내 상호 표기 정확 | 지도 스타일·로고 강제, 브랜드 톤 통일 불가 |
| **네이버 지도 SDK** | 국내 지형·상호 품질 최상 | 위와 동일 |
| **MapLibre GL + OSM/Protomaps 타일 (직접 구현)** | 지도 스타일을 Pindom 톤으로 완전 커스텀, SDK 종속 없음, 무료 | 타일 서버 운영, 상호 표기는 별도 API로 보강 필요 |

> 권장: **지도 렌더링은 MapLibre로 직접, 경로 계산만 카카오모빌리티에서 빌리는** 조합. 성지순례 앱에서 지도가 앱의 얼굴이라 브랜드 통일 가치가 큽니다. 단 도로 정확도가 서비스 신뢰와 직결되므로 경로 계산은 절대 자체 구현하지 않습니다.
>
> 현재 프로토타입은 OSM 타일 이미지 + SVG 경로선으로 이 방식을 미리 흉내낸 상태입니다.

---

## 4. 맛집·카페 — 카카오 로컬

| API | 엔드포인트 | 용도 |
| --- | --- | --- |
| 카테고리 검색 | `dapi.kakao.com/v2/local/search/category` | `FD6`(음식점) `CE7`(카페) + 좌표 반경 |
| 키워드 검색 | `dapi.kakao.com/v2/local/search/keyword` | "○○ 근처 해장국" 같은 자연어 질의 |
| 네이버 지역검색 | `openapi.naver.com/v1/search/local` | 리뷰·영업시간 보강 |

---

## 5. 촬영 추천 시간대

| API | 용도 |
| --- | --- |
| 기상청 단기예보 (공공데이터포털) | 방문 당일 날씨·일조 |
| 한국천문연구원 일출일몰 정보 | 촬영지 좌표의 일출·일몰·골든아워 |

---

## 6. 로그인 · AI · 디바이스

| API | 용도 |
| --- | --- |
| 카카오 로그인 | 국내 주력 |
| 애플 · 구글 로그인 | 해외 팬 |
| Claude Messages API | Pindom AI 챗봇. 길찾기·로컬검색을 tool로 호출해 코스로 렌더링 |
| iOS CoreLocation / Android FusedLocationProvider | 반경 판정, 이동속도·정확도 수집 |

---

## 7. 자체 백엔드 담당 영역 (외부 API 없음)

| 기능 | 내용 |
| --- | --- |
| 아티스트 ↔ 촬영지 매핑 | `artist_id` × `content_id`, 작품 유형, 원본 컷 에셋 |
| AR 원본 컷 이미지 | 누끼 PNG CDN, 장소당 1컷, 라이선스 관리 |
| GPS 인증 판정 | 반경 50m, 이동속도 이상치, 하루 1회, 위조 신호 → **서버 검증 필수** |
| 티켓 발행·시리얼·홀로그램 등급 | 서버 서명으로 위조 방지 |
| 응모·추첨 | 구간별 자격(10장/20장), 차감 트랜잭션, 추첨 로그 |
| 팬덤 게시판 | `board = artist_id`, 글·댓글·신고 |
| 촬영 팁 (장소별 리뷰) | `content_id` 기준, **인증 방문자만 작성**, 태그: 포즈/각도/시간대 |
| 비공개 보관함 | 촬영 후 비공개 선택 사진, 티켓 자격은 동일 |
| 다국어 UI 문구 | ko / en / ja / zh 문자열 테이블 |

---

## 8. 호출 최적화

| 대상 | 정책 |
| --- | --- |
| `locationBasedList2` | 지도 중심 300m 이상 이동 + 500ms 디바운스에서만 재호출 |
| `detailCommon2` / `detailImage2` / `detailIntro2` | `contentId` 단위 1일 캐시 (촬영지 정보는 자주 안 바뀜) |
| GPS 인증 기준 좌표 | 최초 1회 받아 자체 DB 저장 — 현장 네트워크가 약해도 판정 가능하게 |
| 길찾기 | 코스 확정 시 1회만 호출, 경로 좌표열을 코스 레코드에 저장해 재사용 |
| 맛집 검색 | 코스 지점당 1회, 결과 6시간 캐시 |
