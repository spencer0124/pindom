---
title: Capture Slice Checklist
type: plan
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-08-22
audience: internal
---

# Capture Slice Checklist

> The punch list for the core loop: GPS인증 → 인증 실패 → 카메라 → 편집 → 공개설정 → 티켓 발행, built against the prototype and walked end to end on a simulator. Start here if you are picking a Capture screen up.

## Summary

[screens.md](../reference/screens.md) groups these six into one slice because they share
`placeId`, the verification session and grant, and the draft photo. Only `placeId` travels as
a route param — it is what makes GPS인증 deep-linkable from 장소/상세 — and everything after it
lives in `src/features/capture/state.ts`, because a grant token in a URL is a grant token in
the navigation history.

Sources, per [design/README.md](../../design/README.md): layout, copy and flow from block `1a`,
the radar from `1b`-A, the ticket's layout from `1c`-A; colour, type and corners from `2b`. The
Figma frames (`33:2330`, `33:2293`, `33:2230`, `33:2166`, `33:2120`, `33:2072`) predate the
radar, the cutout and the tightened 편집, and were not pulled.

The slice was taken ahead of Auth & entry, which
[screen-implementation.md](screen-implementation.md) orders first. Its reason for going first —
settling the artist shape — was met by the Discovery store, and this slice is the demo path.

## Checklist

### 1 — Repository and native ground

- [x] `tickets.uploadPhoto(localUri)` on the repository interface. The contract has the client
      upload to `tickets/{uid}/…` and pass the path to `issueTicket`; nothing in the layer did
      that. Firebase puts the file under the caller's prefix; the fixture returns the URI.
- [x] The mock `issue` reads the place **from the grant**, as the function does, and keeps the
      uploaded photo as `photoUrl`. It used to mint 주문진 with a picsum image regardless.
- [x] `expo-camera` and `react-native-view-shot`, with the camera plugin in `app.config.ts`.
      The dev client was rebuilt — Expo Go will not run this slice.

### 2 — Shared state

- [x] `src/features/capture/state.ts` — place, session, grant, the raw shot, the composed
      print, the cutout placement and the visibility. `begin` keeps the session when GPS인증 is
      reopened for the same place, so the server's speed check sees one series.
- [x] Cutout placement is stored as **fractions of the stage**, so the figure the user aligned
      over the live view lands on the same spot of the photo on 편집 and in 공개설정's thumbnail.

### 3 — GPS인증 (`app/verify/gps.tsx`)

- [x] Back to 장소 상세, the `1b`-A radar (three staggered rings, a sweep, the distance in the
      disc), the title and the place line, the three check rows, the CTA and the note.
- [x] The button produces **one reading** — `getCurrentPositionAsync`, accuracy and the
      Android mock flag included — and hands it to `submitReading`. The radius, accuracy gate,
      speed and mock checks are the server's; the file contains no `distance <= radius`.
- [x] Checks resolve from the verdict: accuracy as soon as there is a fix, 반경 and 이동속도 only
      when the server has spoken. A refusal routes to 인증 실패 with the figures.
- [x] CTA copy by phase: 현재 위치로 인증 · 인증 중… · 카메라 열기.

### 4 — 인증 실패 (`app/verify/failed.tsx`)

- [x] Glyph, title, body, the fact table, 다시 인증하기 / 검토 상태 확인, 지도로 돌아가기.
- [x] Four contract reasons onto `1a`'s two kinds: `out_of_radius` and `poor_accuracy` are
      "not yet", `implausible_speed` and `mock_location` are "not you". The fact table changes
      with the reason — 남은 거리 for range, 위치 정확도 for accuracy, 탐지 사유 · 조치 for spoof.
- [x] 다시 인증하기 replaces back to GPS인증 with the same `placeId`; the session is kept.

### 5 — 카메라 (`app/capture/camera.tsx`)

- [x] The GPS 인증 완료 · 원본 컷 열림 chip, the print frame with the live view, the draggable
      cutout, the 드래그해서 나와 겹치는 위치를 맞추세요 hint, the wordmark and date stamp.
- [x] Scale slider 88–112, 원본 비율 at exactly 100, 초기화. No 좌우반전, no pinch — the
      narrowing reads as anti-fake (design/README.md #4) and a pinch would reopen it.
- [x] Opens only on a grant; otherwise back to GPS인증. The grant — not the navigation — is
      what `issueTicket` checks, so this is an affordance, not the gate.
- [x] No camera (the simulator, a refusal): the stage renders a stand-in and the shutter
      renders **that view** to a file, so the chain stays walkable without hardware.

### 6 — 편집 (`app/capture/edit.tsx`)

- [x] 재촬영 · 편집 · 다음, the photo with the cutout composed at the camera's placement, the
      four tools, the `{tool} 강도` slider.
- [x] Only 모자이크 has an effect, as in `1a`; its strength drives the patch's opacity. The
      other three are the affordances `1a` draws and leaves inert.
- [x] 다음 renders the canvas to a file with `captureRef`. That file is the ticket photo, and
      the render is the single re-encode the contract asks for — it drops the raw shot's EXIF.

### 7 — 공개설정 (`app/capture/visibility.tsx`)

- [x] ‹ 편집 · 공개 설정, the composed print as thumbnail, the 발행될 티켓 note, the
      공개로 게시 / 비공개 저장만 toggle with its two descriptions, 티켓 발행하기.
- [x] 티켓 발행하기 is two calls in the contract's order — upload, then mint with the grant —
      and replaces to 티켓 발행 with the new `ticketId`.

### 8 — 티켓 발행 (`app/capture/issued.tsx`)

- [x] `TicketCard`, dropped in; 티켓이 발행됐어요; 보유 n장 · 지도의 핀이 유색으로 바뀝니다 and the
      reward line 홈 already prints; 컬렉션에서 보기 / 다음 촬영지 찾기.
- [x] Read back by `ticketId` — the balance on screen is the server's, not a client `+ 1`.
- [x] `src/features/shared/TicketCard.tsx` + `Code128.tsx`: the serial is a real Code 128,
      run along the stub because 17 characters are ~220 modules and the stub is 94px wide. The
      table was checked — 107 symbols, every one summing to its module count.
- [x] Both buttons clear the Capture store and `navigate` to a tab, which pops the chain and
      switches the tab in one move.

### 9 — Close out

- [x] `yarn typecheck` and `yarn lint` clean.
- [x] [screens.md](../reference/screens.md) — the six screens to `built`.
- [x] [docs/README.md](../README.md) — index this document.

## What the device run found

The chain was walked on a booted simulator with the location at 주문진, against the fixture
script 84m → 66m → 32m ±72m → verified.

| Found | Fix |
| --- | --- |
| After 다시 인증하기 the ring showed the client's 790m, not the 84m the server had just said | The store keeps the server's last distance; GPS인증 reopens on it. The title then reads 반경까지 34m · 거의 다 왔어요 — the near line `1a` writes |
| `poor_accuracy` rendered 아직 반경 밖입니다 over a 32m distance inside a 50m radius | Its own title and body (below). The fact table already showed 위치 정확도 ±72m |
| Inside the radius but refused, the title read 반경까지 0m · 거의 다 왔어요 | 반경 안에 있어요 when there is nothing left to cover |
| The simulator shutter captured the whole frame, so 편집 drew a second cutout and a second caption over the baked-in ones | The stand-in renders only its own view; the cutout and caption are composed on 편집, once |
| That capture came back **white** | `captureRef` renders the view's own layer, and a transparent layer becomes a white JPEG. The stage paints its ground |
| The 모자이크 hatch rendered as glyph fragments | `react-native-svg`'s `<Pattern>` tiles unreliably under a rotate; the stripes are explicit lines |
| The ticket's perforation did not draw | React Native honours `borderStyle: 'dashed'` only with all four borders set; a lone dashed edge vanishes. It is an SVG dashed line |
| 컬렉션에서 보기 landed on 지도 | `dismissAll()` then `navigate()` loses the tab switch. `navigate` alone pops the chain and switches |

### Copy the prototype does not have

`1a` writes the range and spoof failures. The contract added a third kind after it — the
accuracy gate — and two states of GPS인증 it never reaches. These lines are the build's, marked
in the code, and need the designer's word:

| Where | Line |
| --- | --- |
| 인증 실패, `poor_accuracy` title | 위치가 아직 흐릿해요 |
| 인증 실패, `poor_accuracy` body | 위치 오차가 ±{n}m라 반경 {r}m 판정을 내릴 수 없어요. 하늘이 트인 곳에서 잠시 기다렸다가 다시 인증해 주세요. |
| 인증 실패, `mock_location` 탐지 사유 | 위치 조작 앱 감지 |
| GPS인증, inside the radius and refused | 반경 안에 있어요 |
| 카메라, no camera on the device | 이 기기에는 카메라가 없어요 — a stand-in note, like 지도's |

## Where the sources disagree

| # | `1a` prototype | Contract / `2b` | Taken | Why |
| --- | --- | --- | --- | --- |
| 1 | The ticket is `1c`-A, 홀로그램 무지개, tilting under the finger | `2b` is one black ground and one acid | `1c`-A's **layout** on `2b`'s **surface** | The hologram is colour, and colour is `2b`'s axis. This answers most of design/README.md open question 1: what was open was the surface, and the direction had decided it. 티켓 절취's 반권 mechanic builds on the same perforation |
| 2 | 공개설정 has a caption field, 이 컷에 대한 한 줄 | `tickets` has no caption field and `issueTicket` takes none | Not built | A field that is silently dropped is worse than no field. Recorded, not invented |
| 3 | 발행될 티켓 prints the next serial, No.0417 | The serial is minted inside `issueTicket` | The place line without a number | It does not exist until the button is pressed |
| 4 | 이동속도 검증 passes as 4.1km/h 정상 | The verdict carries no speed | 정상 | The server does not report the figure, and the client must not compute one |
| 5 | The cutout is drawn smaller on 편집 than on the camera | — | One size on every stage, half the stage's height | What the user aligned is what the ticket carries; a figure that shrinks between screens is not the same composition |
| 6 | The sheet, the check rows and the tool buttons are rounded, filled cards | `2b`: rules, not cards; chips only | Hairlines and rules; the acid on the ticked dot, the selected tool's edge and the shutter | The radius rule |

## Still open

- **No real camera has run.** Every shot so far is the simulator stand-in. `CameraView`,
  `takePictureAsync` and the permission prompt are written against the SDK's documentation and
  are unverified on a device.
- **The Firebase upload is unexercised.** `uploadPhoto` puts to `tickets/{uid}/…` with
  `putFile`; the fixture path never touches Storage. First device run with
  `EXPO_PUBLIC_USE_MOCKS` off should watch for `permission-denied` here, per the
  [runbook](../how-to/connect-the-app-to-firebase.md).
- **The spoof branch is unreachable from fixtures.** The script never returns
  `implausible_speed` or `mock_location`, so 인증 실패's spoof copy, its facts and 검토 상태 확인
  (which goes to 마이페이지 — there is no review-status screen) have only been read, not seen.
- **`Slider` is capture-local.** A continuous drag exists in neither the design system nor
  the prototype's 2b components. Two screens use it here; a third makes it a candidate for
  promotion per [design-system.md](../reference/design-system.md).
- **`Switch` still reads light-mode greys.** The 공개설정 toggle is the design-system `Switch`,
  which hardcodes `SdsColors.grey300` for its track — one of the twenty components
  [design-tokens.md](../reference/design-tokens.md) lists.
- **Buttons are still pills.** Unchanged from the Discovery slice.

## Related

- [screens.md](../reference/screens.md) — the slice table these six screens come from
- [2026-08-22-discovery-slice-checklist.md](2026-08-22-discovery-slice-checklist.md) — the slice before this one, and the 장소/상세 CTA this chain starts from
- [backend-contract.md](../reference/backend-contract.md) — `submitReading`, `issueTicket`, the Storage path rule
- [design/README.md](../../design/README.md) — the prototype, `1b`-A, `1c`-A, and open questions 1 and 4
