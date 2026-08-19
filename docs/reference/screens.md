---
title: Screen Inventory
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-08-19
audience: internal
---

# Screen Inventory

> Every Figma frame mapped to its node id, theme, route and build status, plus the order to build them in. The lookup table for any screen work.

## Summary

**The prototype is the inventory.** `design/2026-08-19-prototype.html` block `1a` contains the
screens PINDOM builds; see [`design/README.md`](../../design/README.md) and
[ADR 0006](../decisions/0006-adopt-the-prototype-as-the-design-source-of-truth.md). The Figma
file is kept for traceability only — its node ids remain the addressable names for frames that
predate the prototype, and the abandoned section below is still worth a warning.

Every screen is dark. The `2b` direction is a single dark surface applied throughout, so the
light/dark split the earlier frames had no longer exists — see
[../explanation/design-language.md](../explanation/design-language.md).

Count the screens in the table rather than repeating a total anywhere else.

Frame URLs follow this shape, with `:` in a node id written as `-`:

```text
https://www.figma.com/design/OZ8H9E7WDdruFIhQ7UBgcy/PINDOM?node-id=33-2617&m=dev
```

Status values: `skeleton` (route exists, placeholder body) · `missing` (no route yet) ·
`variant` (a state of another screen, not its own route) · `built` (implemented against the
prototype).

## Screens

`Screen` is the prototype's own identifier — the value it switches on — so it is the fastest
way to find a screen in the file. Routes marked *proposed* have no file yet; they follow the
existing rule that a non-tab flow must not share a URL namespace with a tab, which is why
profile, language and vault sit at the root rather than under `/my`.

| Screen | Frame | Node | Route | Status |
| --- | --- | --- | --- | --- |
| `onboard` | 온보딩 + 시작화면 | `33:2801` | `/onboarding` | skeleton — **absorbs 시작화면**; email sign-in is folded in |
| `artistSearch` | 최애 찾기 | — | `/artist/search` *(proposed)* | **missing** |
| `home` | 홈 | `33:2617` | `/(tabs)/index` | skeleton |
| `map` | 지도 | `33:2460` | `/(tabs)/map` | skeleton |
| `place` | 장소/상세 | `33:2381` | `/place/[id]` | skeleton — gains 갤러리 and 리뷰 |
| `verify` | GPS인증 | `33:2330`, `33:2856` | `/verify/gps` | skeleton — 레이더 interaction (`1b`-A) |
| `fail` | 인증 실패 | `33:2293` | `/verify/failed` | skeleton |
| `camera` | 카메라 | `33:2230` | `/capture/camera` | skeleton |
| `edit` | 편집 | `33:2166` | `/capture/edit` | skeleton |
| `publish` | 공개설정 | `33:2120` | `/capture/visibility` | skeleton |
| `issued` | 티켓 발행 | `33:2072` | `/capture/issued` | skeleton |
| `collection` | 컬렉션 | `33:1961` | `/(tabs)/tickets` | skeleton |
| `raffle` | 응모 | `33:1871` | `/raffle/[id]` | skeleton |
| `tear` | 티켓 절취 | — | `/raffle/tear` *(proposed)* | **missing** — the 반권 mechanic |
| `done` | 응모완료 | `33:1830` | `/raffle/done` | skeleton |
| `community` | 커뮤니티 | `33:1717`, `33:2922` | `/(tabs)/community` | skeleton — now **per-artist boards** |
| `write` | 글쓰기 | `33:1686` | `/post/write` | skeleton |
| `my` | 마이페이지 | `33:1597` | `/(tabs)/my` | skeleton |
| `profile` | 프로필 편집 | — | `/profile` *(proposed)* | **missing** |
| `language` | 언어 | — | `/language` *(proposed)* | **missing** |
| `vault` | 보관함 | — | `/vault` *(proposed)* | **missing** — private tickets |

### What changed against the Figma frames

- **`/login` is gone.** 시작화면 (`33:2801`) is absorbed into 온보딩; email sign-in happens
  there. Delete `app/login.tsx` when 온보딩 is built.
- **`/onboarding` is no longer undesigned.** It was previously a real gap — flowchart only,
  no frame. The prototype designs it.
- **Five screens are new**, with no frame behind them: `artistSearch`, `tear`, `profile`,
  `language`, `vault`.
- **장소/상세 grew** a photo gallery, a review list with tier badges and likes, and a stats
  row (인증 · 사진 · 거리).
- **커뮤니티 is now segmented by artist.** Posts carry a board id; the feed is per 최애, not
  global.

> [!NOTE]
> The prototype's 마이페이지 has a global light/dark toggle. It is **not** adopted — see
> [ADR 0006](../decisions/0006-adopt-the-prototype-as-the-design-source-of-truth.md). Do not
> build a theme setting.

## Section 1 — abandoned

> [!WARNING]
> Figma's `Ready for dev` tag is applied to **Section 1**, which is wrong. Section 1 holds
> six crude wireframes, three of them completely empty. Any tooling or prompt that selects
> frames by that tag will pull the wrong ones. Ignore the tag, or retag Section 2.

| Frame | Node | Note |
| --- | --- | --- |
| 시작화면 | `1:2` | Superseded by `33:2801` |
| 1 | `2:2` | Rough |
| 2 | `2:3` | Rough; carries an obsolete nav draft (`HOME/PINMAP/COMMU/COLLECTION/MYPAGE`) |
| 3 | `2:4` | Empty |
| 4 | `2:5` | Empty |
| 5 | `2:6` | Empty |

## Flow slices

Build one slice per session. Screens inside a slice **share state and navigation params**;
building them apart is how three incompatible route signatures happen.

| Slice | Screens | Shared state |
| --- | --- | --- |
| Auth & entry | 온보딩, 최애 찾기 | auth session, followed artists |
| Discovery | 홈, 지도, 장소/상세 | place list and detail, geo position, selected artist |
| Capture | GPS인증, 인증 실패, 카메라, 편집, 공개설정, 티켓 발행 | `placeId`, verification session and grant, draft photo |
| Tickets & raffle | 컬렉션, 응모, 티켓 절취, 응모완료 | ticket balance, tier, `raffleId` |
| Community | 커뮤니티, 글쓰기 | board (artist), feed page, draft post |
| Profile | 마이페이지, 프로필 편집, 언어, 보관함 | user, followed artists, vault |

> [!NOTE]
> Slice membership follows the flow, not the visual grouping. 공개설정 belongs to Capture
> because it sits between 편집 and 티켓 발행, even though it looks like a settings screen.
> 편집 and 카메라 are Capture for the same reason. 최애 찾기 belongs to Auth & entry because
> picking an artist is part of first run — the rest of the app is keyed to that choice.

## The navigation graph

Taken from the prototype. The 플로우차트 frame (`30:2`) is the earlier version of the same
graph; where they differ, the prototype is right. Two decision points, both with designed
failure paths.

```mermaid
flowchart TD
  ONB[온보딩] -->|이메일로 로그인| ART[최애 찾기]
  ART -->|최애 선택| HOME[홈]
  HOME -->|탭| MAP[지도]
  HOME -->|탭| COLL[컬렉션]
  HOME -->|탭| COMM[커뮤니티]
  HOME -->|탭| MY[마이페이지]

  MAP -->|촬영지 핀 선택| PLACE[장소/상세]
  PLACE -->|GPS 인증하기| GPS[GPS인증]
  GPS --> CHK{반경 50m / 속도 검증}
  CHK -->|Yes| CAM[LIVE 카메라]
  CHK -->|No| FAIL[인증 실패]
  FAIL -->|다시 인증| GPS
  FAIL -->|지도로 돌아가기| MAP

  CAM -->|촬영완료| EDIT[편집]
  EDIT -->|다음| VIS[공개설정]
  VIS -->|티켓 발행하기| ISSUED[티켓 발행]
  ISSUED -->|컬렉션에서 보기| COLL

  COLL -->|응모하기| RAFFLE[응모]
  RAFFLE --> BAL{잔여 티켓 충족?}
  BAL -->|No| COLL
  BAL -->|Yes| TEAR[티켓 절취]
  TEAR -->|반권 분리| DONE[응모완료]
  DONE -->|커뮤니티에 자랑하기| COMM

  COMM -->|글쓰기| WRITE[글쓰기]
  WRITE -->|등록| COMM

  MY -->|프로필 편집| PROF[프로필 편집]
  MY -->|언어| LANG[언어]
  MY -->|보관함| VAULT[보관함]
  MY -->|최애 추가| ART
```

## Related

- [`design/README.md`](../../design/README.md) — the prototype these screens come from
- [ADR 0006](../decisions/0006-adopt-the-prototype-as-the-design-source-of-truth.md) — why the prototype outranks Figma
- [design-tokens.md](design-tokens.md) — the `2b` surface these are drawn on
- [design-system.md](design-system.md) — the components to build these with
- [figma-workflow.md](figma-workflow.md) — how to pull an older frame without getting burned
- [../plans/screen-implementation.md](../plans/screen-implementation.md) — the build order
- [../explanation/design-language.md](../explanation/design-language.md) — why the theme column looks like that
