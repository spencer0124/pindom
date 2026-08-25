---
title: Prototype Fidelity Checklist
type: plan
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-08-23
audience: internal
---

# Prototype Fidelity Checklist

> Every screen was built; this is the pass that makes them move and read like the prototype. One row per divergence found by the [fidelity audit](2026-08-23-prototype-fidelity-audit.md), the decision taken for each, the order they land in, and what the simulator run confirmed. Start here if you are picking up motion or polish work.

## Summary

The seven slice builds of 2026-08-22 took layout and copy from `design/2026-08-20-prototype.html`
but treated most of its **motion and interaction** as optional, and a few layout and copy
details drifted. Seven auditors re-read every `1a` screen against the built one under the
two-axis rule in [design/README.md](../../design/README.md) and filed the findings in the
[audit](2026-08-23-prototype-fidelity-audit.md). The counts by severity are in that document's
per-slice summaries; the shape is: every prototype animation that was missing or inverted,
three hold-and-drag interactions that were dropped with the hologram, a handful of flow
targets, and copy that was paraphrased or missed a branch.

This checklist fixes them **toward the prototype**. Where the audit asked for a decision, the
decision is in [§ Decisions](#decisions) and was taken under the rule rather than escalated,
because none changes what the product is — they change how it feels.

## Method

- Each finding keeps the audit's ID, prefixed by its slice. The audit row has the prototype
  value, the app value, and the proposed fix; this list has only the gist and the status.
- **Severity** is the audit's: high = a visible animation, interaction, flow or copy the
  prototype has and the app lacks; med = a noticeable layout or visual difference; low = subtle.
- **Order**: slices whose files do not overlap land in parallel (Discovery, Capture, Community,
  Profile, Auth), then the two that depend on them (Tickets on the card tilt Capture adds;
  Assistant on the map path Discovery adds). One commit per slice — the one-screen-per-commit
  rule is for building screens; this pass touches every screen in a slice with one theme.
- Motion is [Reanimated](https://docs.swmansion.com/react-native-reanimated/) (the version
  pinned in `package.json`). The prototype's CSS easings map directly: `ease` is
  `Easing.bezier(.25,.1,.25,1)`; a `cubic-bezier(...)` is the same four numbers; Reanimated's
  `Easing.bezier` accepts a `y > 1` control point, so the prototype's overshoots carry.
  `FadeInDown` is the preset that **starts below** (positive `translateY`), which is what the
  prototype's `fadeUp` keyframe is; `FadeInUp` starts above.
- The 2b rule stands on colour: a prototype pink becomes `useTheme().token.accent`, and a
  prototype amber/red becomes the `warning`/`danger` seed. Nothing in this pass introduces a
  hex.

## Decisions

Each was raised by an auditor as needing a word. Taken here under the two-axis rule, recorded
so the next audit does not re-raise them.

| # | Question | Decision | Why |
| --- | --- | --- | --- |
| 1 | Open 카메라 by itself after the last check ticks? (capture D-04) | **Yes**, 900 ms after the third tick; 카메라 열기 stays as the manual path | Flow is `1a`'s axis. The client still decides nothing — the server's verdict is what ticks the rows |
| 2 | Keep the ticket's hold-and-tilt without the rainbow? (capture D-16, tickets T-01) | **Yes** — a `HoloTilt` wrapper with the prototype's own white `basic` shine, on 티켓 발행 and 컬렉션's tiles. Not on 티켓 절취, whose drag is the tear | Interaction is `1a`'s axis; the rainbow was colour. The prototype ships the gesture without the rainbow on a third of 컬렉션's tickets, so this is not an invention |
| 3 | 공개설정 block order after the caption was dropped (capture D-14) | Restore `1a`'s order: thumb row → toggle → 발행될 티켓 → CTA | Layout is `1a`'s |
| 4 | What 반경까지 N prints (capture D-06) | Keep the app's distance-minus-radius | The prototype fixture is internally inconsistent; the device-run row in the Capture checklist already leaned on this |
| 5 | 인증 실패 glyph colour for the not-yet kinds (capture D-07) | `colorSeeds.warning`; spoof stays `danger` | Semantic colour survives the `2b` swap as a token |
| 6 | `implausible_speed` wording (capture D-08) | Unchanged; recorded in the Capture checklist's copy table | The server reports no speed; the prototype's line prints one. Needs the designer's phrasing |
| 7 | `pinDrop` on real tiles (discovery D-01) | The stand-in canvas draws real pins and plays the drop; on tiles, markers mount hidden and are shown after the drop's duration | The SDK rasterises marker children on iOS, so nothing can animate inside a marker. An overlay layer that projects coordinates is more than this pass should spend |
| 8 | Where the map pin component lives (discovery D-02) | `src/features/discovery/MapPin.tsx`; promote when a third screen draws pins | The design-system gap stays open until then |
| 9 | Are 마감 임박 응모 per-최애? (discovery D-08) | Global, as the contract's `list()` is; shown as `1a`'s horizontal scroller | No artist key exists on raffles |
| 10 | 홈's 응모하러 가기 target (discovery D-07) | The soonest open raffle; `/tickets` when there is none | The same rule the Tickets slice chose for 컬렉션's button |
| 11 | Short names (discovery D-05) | Pin captions use `place.region`; artist chips keep `artist.name`. `Artist.shortName` / `Place.shortRegion` go to the backend as an ask | Not in the contract |
| 12 | Map framing with a fix (discovery D-03) | Whole-country on entry, as `1a`; the location button stays | Layout is `1a`'s. Worth revisiting once a tile has actually rendered |
| 13 | The FAB's pink identity (discovery D-20/21) | Acid accent ring and sparkle on a `2b` surface; no `AI` text | Colour is `2b`'s; the text was invented copy |
| 14 | 장소/상세's line under the title (discovery D-15) | `1a`'s `{최애} · {work kind} · {region}`. `workTitle` leaves that line; whether it gets a line of its own is open | Copy is `1a`'s |
| 15 | Which `1d` motion `1a` uses (tickets) | **Closed**: A's tear made interactive on 티켓 절취, B's `stampIn` on 응모완료 — what the app already does. `design/README.md` open question 2 is closed | The auditor traced every `1d` keyframe; `seamFlash`, `tearApartL/R` and C's `dropIn` appear nowhere in `1a` |
| 16 | 응모's two 컬렉션-labelled exits (tickets T-05) | Navigate to the 컬렉션 tab | Copy is final and it is a promise |
| 17 | Stamp ink (tickets) | Accent | `2b` |
| 18 | The chat's pink aurora (assistant) | Out | `2b` spends nothing on ornament; it is pure colour |
| 19 | The inert mic button (assistant A-12) | Out, recorded | A disabled control for a capability the backend lacks |
| 20 | Route path as straight segments (assistant A-14) | Yes, until the backend returns a geometry | Client geometry from coordinates the client already holds; not a figure the server owns |
| 21 | Chat header (assistant A-07) | `1a`'s: close glyph, no title | Layout is `1a`'s |
| 22 | Course card sub-line reads the course document (assistant A-08) | Yes, `n곳 · {course name}` | One cheap read; the same string the course header uses |
| 23 | 지도에서 보기 destination (community C-11) | 장소/상세 stays | The prototype's block is inert; the detail has the map hero and 길찾기 |
| 24 | 글쓰기 opens with the pin attached (community C-02) | Yes | Flow is `1a`'s |
| 25 | Preset avatars (profile P-10) | Not drawn; recorded | The contract writes `avatarUrl` only — a backend ask |
| 26 | 보관함 as a photo grid (profile P-15) | `1a`'s two-column 3:4 grid; the decided 공개 전환 action becomes a text button in the tile's caption row | Layout is `1a`'s; the action was decided on 2026-08-22 |
| 27 | A string for a denied 위치·카메라 권한 (profile) | None; the row prints nothing, recorded | Copy is final and the prototype has no such line |
| 28 | Pressed-state convention (profile P-06, assistant A-13) | Rows dim to `.6` opacity while pressed, app-wide where this pass touches a row | The prototype's hover has no touch equivalent; pressed is the mapping |
| 29 | An outlined `Button` (auth A-01) | Add `style="outline"` to the design-system `Button` | A third style on an existing primitive, not a new one; it is also the `2b` answer (rules, not cards) |
| 30 | `바뜁니다` (auth A-08) | The app's `바뀝니다` stands | A prototype typo, same class as `FINDOM` |
| 31 | Per-pin glow on 온보딩 (auth A-04) | Out | Covered by the Auth checklist's "no glow" |

## Checklist

Status: `[x]` landed · `[ ]` open · `[-]` decided out (see [§ Decisions](#decisions)) or record-only.

### 1 — Discovery (`app/(tabs)/index.tsx`, `map.tsx`, `place/[id].tsx`, `(tabs)/_layout.tsx`, `src/features/{discovery,home,assistant}`)

- [x] **D-01 high · 지도** — the stand-in canvas draws one pin per place (normalised lat/lng) with `pinDrop` 500 ms on mount and on 최애 switch; tiles reveal markers after the same duration
- [x] **D-02 med · 지도** — `MapPin`: visited = accent fill + `✓`, unvisited = surface + rule; caption chip with the region
- [x] **D-03 med · 지도** — whole-country frame on entry
- [x] **D-04 low · 지도** — chip select cross-fades 300 ms
- [-] **D-05 low** — short names (decision 11)
- [x] **D-06 high · 홈** — three-way tier note: `10장이면 첫 응모가 열려요` / `20장이면 팬사인회·굿즈가 열려요` / `팬사인회·굿즈까지 모두 열렸어요`
- [x] **D-07 med · 홈** — 응모하러 가기 → soonest open raffle
- [x] **D-08 med · 홈** — 마감 임박 응모 as a horizontal scroller of every open raffle, 186 px cells
- [x] **D-09 med · 홈** — 38 px avatar at the right of the greeting
- [x] **D-10 low · 홈** — artist chip selection eases 250 ms
- [x] **D-11 low · 홈** — selection drawn as a 3 px accent ring outside the chip
- [x] **D-12 low · 홈** — courses clear and skeleton while a switched 최애 loads
- [x] **D-13 low · 홈** — 인증 count is the visited ∩ this 최애's places
- [x] **D-14 low · 홈** — scroll bottom padding clears the FAB
- [x] **D-15 med · 장소/상세** — line under the title is `{최애} · {work kind} · {region}`
- [x] **D-16 med · 장소/상세** — the tip composer always has one tag selected, starting 포즈; a submit keeps it
- [x] **D-17 low · 장소/상세** — label stays 팁 남기기 when open; the chip's selected treatment signals the state
- [x] **D-18 low · 장소/상세** — like count leads with ♡
- [x] **D-19 low · 장소/상세** — the description block folds into the title block
- [x] **D-20 high · FAB** — the ring spins once per 7 s
- [x] **D-21 med · FAB** — 56 px surface disc, accent ring, sparkle glyph, no `AI` text
- [x] **D-22 low · 탭바** — active tab is the bold weight, not a permanent fill; label size from a token
- [-] **D-23 low** — states `1a` never reaches; their strings go to the Discovery checklist's copy table

### 2 — Capture (`app/verify/*`, `app/capture/*`, `src/features/capture`, `src/features/shared/TicketCard.tsx`)

- [x] **D-01 high · GPS인증** — rings pulse from mount (2.6 s, 0/.9/1.8 s offsets), never gated on a reading
- [x] **D-02 med · GPS인증** — the sweep is a filled fading sector turning 3.4 s, from mount
- [x] **D-03 high · GPS인증** — the verdict's rows reveal 900 ms apart; title and CTA stay on "checking" until the last; refused rows never tick
- [x] **D-04 high · GPS인증** — 카메라 opens 900 ms after the last tick (decision 1)
- [x] **D-05 med · GPS인증** — the CTA reads `인증 중…` instead of hiding the label under loader dots
- [-] **D-06 low** — 반경까지 arithmetic (decision 4)
- [x] **D-07 low · 인증 실패** — not-yet kinds in `warning`, spoof in `danger`
- [-] **D-08 low** — `implausible_speed` wording (decision 6); recorded in the Capture checklist's copy table
- [x] **D-09 high · 카메라** — the 인증 완료 chip enters with `fadeUp` 400 ms
- [x] **D-10 high · 카메라** — the pan covers the whole print, not just the figure
- [x] **D-11 med · 카메라** — 초기화, the slider and a release ease 160 ms; no snap-back on release
- [x] **D-12 low · 편집** — the tool slider starts at 62
- [x] **D-13 low · 편집** — the `%` readout goes
- [x] **D-14 med · 공개설정** — `1a`'s block order (decision 3)
- [x] **D-15 med · 티켓 발행** — the card drops in from −90 px with a −6° twist, 700 ms overshoot
- [x] **D-16 high · 티켓 발행** — `HoloTilt`: hold to tilt ±20° in perspective at 1.04, 60 ms follow, 500 ms overshoot return; white shine and glare follow the finger (decision 2)
- [x] **D-17 high · 티켓 발행** — three-way tier note (same strings as Discovery D-06)
- [x] **D-18 low · 티켓 발행** — the two `fadeUp` blocks start 14 px below with `ease`

### 3 — Tickets & raffle (`app/(tabs)/tickets.tsx`, `app/raffle/*`, `src/features/tickets`)

- [x] **T-01 high · 컬렉션** — every tile tilts under the finger via `HoloTilt` (decision 2); the scroll survives
- [x] **T-04 low · 응모** — short rows are `disabled` with the reason in `accessibilityState`
- [x] **T-05 med · 응모** — both 컬렉션 exits navigate to the 컬렉션 tab (decision 16)
- [x] **T-06 low** — the two full-width confirms use the big size
- [x] **T-07 high · 티켓 절취** — the grip pulses and twinkles idle (1.8 s), shrinks 30 → 26 px on touch, stops while dragging
- [x] **T-08 high · 티켓 절취** — two sparks fly off the tear front past 6 % progress
- [x] **T-09 med · 티켓 절취** — heal is a 420 ms overshoot snap, not a default spring
- [x] **T-10 low · 티켓 절취** — the commit uses the same easing
- [x] **T-11 low · 티켓 절취** — reaching 100 % mid-drag commits without waiting for release
- [x] **T-12 low · 티켓 절취** — the subtitle is `{region} · {work kind}` from the place
- [x] **T-14 high · 응모완료** — the stamp slams from 2.4× and −18° to −9°, overshooting .92
- [x] **T-15 med · 응모완료** — both `fadeUp` blocks rise 14 px from below
- [x] **T-16 low · 응모완료** — the balance the server returns is carried into the store so the note is whole on the first frame

### 4 — Auth (`app/onboarding.tsx`, `app/artist/search.tsx`, `src/features/auth`, `src/design-system/components/button`)

- [x] **A-01 med · 온보딩** — 이메일로 로그인 is the new `outline` button (decision 29)
- [x] **A-02 med · 최애 찾기** — a sequence guard on the search; `listMine` once, not per keystroke
- [x] **A-03 low · 온보딩** — the pin scatter is the six map pins in a 300 px band at 96 px
- [-] **A-04 low** — per-pin glow (decision 31)
- [x] **A-05 low · 온보딩** — copy gap 18, actions 14 above, note 6 above
- [x] **A-06 low · 온보딩** — wordmark tracking `.28em`, shared with 홈/마이
- [-] **A-07 low** — radius flattening is a design-system item, tracked in design-tokens.md
- [-] **A-08 low** — `바뀝니다` stands (decision 30); recorded in the Auth checklist
- [x] **A-09 low · 최애 찾기** — note `t7`, meta and chip label `st12`, back and initial `st11`
- [x] **A-10 low · 최애 찾기** — no rule above the list
- [-] **A-11 low** — pinned search stays; recorded
- [-] **A-12 low** — the field's clear affordance stays; recorded
- [-] **A-13 low** — two app-only strings go to the Auth checklist's copy table
- [-] **A-14 low** — matches in effect

### 5 — Community (`app/(tabs)/community.tsx`, `app/post/write.tsx`, `src/features/community`)

- [x] **C-01 high · 커뮤니티** — board chips cross-fade fill and label 300 ms
- [x] **C-02 high · 글쓰기** — opens with the newest ticket pinned (decision 24)
- [x] **C-03 med · 커뮤니티** — boards reload on focus, like 홈's chips
- [x] **C-04 med · 커뮤니티** — the pin glyph is `MapPinIcon`, not `⌖`
- [x] **C-05 med · 글쓰기** — same, 18 px, accent when on / grey400 when off
- [-] **C-06 low** — pinned chips stay; recorded
- [x] **C-07 low · 커뮤니티** — avatars take the chip radius
- [x] **C-08 low · 글쓰기** — composer type from the typography map, no magic numbers
- [-] **C-09 low** — three app-only strings go to the Community checklist's copy table
- [-] **C-10 low** — 등록 gating stays; recorded
- [-] **C-11 low** — 지도에서 보기 (decision 23)

### 6 — Profile (`app/(tabs)/my.tsx`, `app/profile.tsx`, `app/language.tsx`, `app/vault.tsx`, `src/features/profile`)

- [x] **P-01 high · 마이페이지** — the 로그아웃 sheet rises 14 px over 280 ms
- [x] **P-02 med · 마이페이지** — 로그아웃 in the alert colour
- [x] **P-03 low · 마이페이지** — 로그아웃 row spacing, no rule under it
- [x] **P-04 low · 마이페이지** — the tier badge is the design-system `Badge`
- [x] **P-05 low · 마이페이지 · 보관함** — stat cells left-aligned
- [x] **P-06 low · 마이페이지** — rows dim while pressed (decision 28)
- [-] **P-07 low** — platform affordance stays
- [x] **P-08 low** — avatar sizes 62 / 96
- [x] **P-09 med · 프로필 편집** — over-limit count, rule and hint in the alert colour, not the accent
- [-] **P-10 low** — preset avatars (decision 25)
- [x] **P-11 low · 프로필 편집** — camera badge on the avatar
- [x] **P-12 low · 프로필 편집** — avatar hairline
- [x] **P-13 low · 프로필 편집** — 추가 as its own label
- [x] **P-14 low · 프로필 편집 · 언어** — the radio is a 20 px disc, filled when on
- [x] **P-15 med · 보관함** — two-column 3:4 grid, 비공개 chip on the photo, monospaced serial (decision 26)
- [x] **P-16 low · 보관함** — 공개 전환 stat in the accent
- [-] **P-17 low** — four loading/error strings go to the Profile checklist's copy table

### 7 — Assistant (`app/chat.tsx`, `app/course.tsx`, `src/features/assistant`, `src/features/discovery/MapCanvas.tsx`)

- [x] **A-01 high · Pindom AI** — loading is a spinning star (1.5 s) beside a breathing `답변을 찾고 있어요` (1.6 s), not a bubble
- [x] **A-02 high · Pindom AI** — the ⋯ sheet rises 14 px over 260 ms
- [x] **A-03 med · Pindom AI** — the empty hero sits at the bottom above the composer
- [x] **A-04 med · Pindom AI** — the four questions are a full-width list, not wrapped chips
- [x] **A-05 med · Pindom AI** — 답변 신고하기 in the alert colour
- [x] **A-06 low · Pindom AI** — 취소 is a full-width filled row
- [x] **A-07 low · Pindom AI** — close glyph, no title (decision 21)
- [x] **A-08 low · Pindom AI** — the course card reads `n곳 · {course name}` (decision 22)
- [-] **A-09 low** — the route tile is ornament; out under `2b`
- [x] **A-10 low · Pindom AI** — the course card stays mounted while a new answer loads
- [x] **A-11 low · Pindom AI** — return key sends
- [-] **A-12 low** — mic (decision 19)
- [x] **A-13 low · Pindom AI** — pressed states on rows and the card (decision 28)
- [x] **A-14 high · 추천 코스** — a dashed accent route with a surface halo through the stops, on tiles and on the stand-in
- [x] **A-15 med · 추천 코스** — numbered stops, the first in the accent fill, the rest in the soft accent
- [x] **A-16 low · 추천 코스** — the map is inset by the gutter, 262 tall
- [-] **A-17 low** — the description is the backend's field; recorded in the Assistant checklist's copy table

### 8 — Close out

- [x] `yarn typecheck` and `yarn lint` green on every commit
- [x] Each slice verified on the simulator — table below
- [x] `design/README.md`: open question 2 closed (decision 15); the README points at this pass
- [x] The slice checklists' copy tables gain the rows the audit found unrecorded
- [ ] [build status memory](../../CLAUDE.md) — what is still unverified after this pass

## What the simulator run confirmed

iPhone 17 Pro simulator, the dev client, the mock fixture, 2026-08-23. Motion was read from
20 fps recordings tiled into frames, not from single screenshots. One row per screen that moved.

| Screen | Checked | Result |
| --- | --- | --- |
| 홈 | Avatar, chip ring, three-way tier note (`10장이면 첫 응모가 열려요` at 4), 마감 임박 scroller, FAB ring + sparkle | Pass |
| 지도 | Pin field on the stand-in (visited accent + ✓, unvisited outline, region captions), drop on entry and on a 최애 switch, chip cross-fade, one-line notice | Pass. Three Seoul places pile up at country scale — the projection is honest, the fixture is dense; see Still open |
| 지도 (real tiles, 2026-08-25) | Naver tiles render; all five pins clear the floating chrome; a 최애 switch re-frames (200 km → 5 km for the one-place artist, roads and place names at that scale) | Pass, after the camera was refitted — see Still open |
| 추천 코스 (real tiles, 2026-08-25) | Numbered stops (1 in the accent fill, 2 in the soft accent) with full captions, joined by the accent route over its surface halo | Pass, after the pins were given their room in points and the SDK's zoom panel was turned off |
| 장소/상세 | `{최애} · {work kind} · {region}`, description under the title | Pass |
| GPS인증 | Rings and fan turning from mount; rows reveal 900 ms apart under `위치를 확인하는 중`; `인증 완료 · 원본 컷이 열립니다`; 카메라 opens by itself; three refusals then the pass | Pass |
| 인증 실패 | Amber glyph for the not-yet kinds | Pass |
| 카메라 | Chip enters; a drag on the empty background moves the figure; 초기화 eases it back | Pass |
| 편집 · 공개설정 | Slider at 62 with no `%`; thumb row → toggle → 발행될 티켓 → CTA | Pass |
| 티켓 발행 | Card drops from above with a twist, title and buttons rise after; hold → scale and a white band follow the finger, release springs back; tier note | Pass. `컬렉션에서 보기` landed on the origin tab — fixed (the chain's guards now redirect only while focused) and re-checked below |
| 컬렉션 | Last tile clears the FAB; a held tile lifts with the glare; a quick swipe scrolls | Pass. The tilt angle itself could not be driven — the tool can only press a tile's centre, which is 0° by definition |
| 응모 | `‹ 컬렉션` lands on 컬렉션 | Pass |
| 티켓 절취 | Grip halo pulses and twinkles at rest; sparks past ~5 %; early release snaps back with the 420 ms overshoot; a full drag commits on its own | Pass |
| 응모완료 | Stamp lands large and over-rotated, bounces, rests at −9°; title and buttons rise; `응모번호 … · 남은 티켓 n장` on the first frame | Pass |
| 커뮤니티 · 글쓰기 | Chip cross-fade; map-pin icon; chip-radius avatars; 글쓰기 opens pinned, toggles off | Pass |
| 마이 · 프로필 편집 · 언어 · 보관함 | Badge; orange 로그아웃; sheet rises; camera badge; orange over-limit count, rule and hint; disc radios; 3:4 tile grid with chip, serial and 공개 전환 | Pass. The serial wrapped at tile width — fixed (one line, shrinks to fit) and re-checked below |
| Pindom AI · 추천 코스 | ✕ / ⋯ header, hero at the bottom, full-width questions; spinning star + breathing label (~330 ms on the fixture); `2곳 · 강릉 바다 코스` on the card; ⋯ sheet rises with orange 답변 신고하기 and a filled 취소; numbered discs and the dashed route, inset map | Pass |
| 온보딩 · 최애 찾기 | Six pins in the band; outlined 이메일로 로그인 with the hold wash; sign-in; no rule under the note; no stale results at 80 ms between keys | Pass |

Found by the run and fixed in the same pass: GPS인증 printed a far place's remaining distance
in raw metres (`반경까지 221847m`) — it now uses the same formatter as the headline.

Seen, not failures: 컬렉션's gauge reads `ticketsIssued` beside a balance (by design, recorded in
the Tickets checklist); 응모완료 prints the fixture's raw entry id; the assistant FAB sits above
the 로그아웃 sheet, as it does in the prototype's own layer order; the course card's sub-line
arrives a beat after the card.

## Still open after this pass

- ~~The Naver client id is still unset~~ **Set 2026-08-25**, and the tile path is verified:
  markers, their reveal, the numbered stops and the route all draw. Two things the first run
  against real tiles settled, both in `MapCanvas`: the camera is fitted to the places' bounds
  rather than opened at a fixed zoom — a zoom cannot know how tall the canvas is, and zoom 6
  pushed 지도's northern pins off the top — and the room around the pins is worked in points,
  because a pin's size and the floating chrome are pixel figures. `mapPadding` cannot carry
  that room: the SDK applies it to a camera, not to a region fit. Where honouring all of it
  would zoom out past the country, the chrome is allowed to overlap the outermost pin instead
  (`MAX_ROOM`). The SDK's own zoom panel and scale bar are off — `1a` has neither, and the
  panel sat on 추천 코스's first stop.
- The pinned SDK drops `NaverMapPolylineOverlay`'s `pattern` before the native view, so on
  tiles the route draws solid over its halo rather than dashed, until a release forwards it.
- The stand-in map piles up places that share a city at country scale. A collision nudge, or
  the real tiles, would separate them.
- `Artist.shortName`, `Place.shortRegion`, a preset avatar field and a figure-less
  `implausible_speed` line are asks for the backend developer and the designer respectively.
- Whether `workTitle` deserves a line of its own on 장소/상세 (decision 14).

## Related

- [Prototype fidelity audit](2026-08-23-prototype-fidelity-audit.md) — the evidence, one row per ID
- [Design source](../../design/README.md) — the two-axis rule this pass applies
- The seven `2026-08-22-*-slice-checklist.md` files — what was decided before this pass
- [Design tokens](../reference/design-tokens.md) — the `2b` values every colour here resolves to
