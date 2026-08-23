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

- [ ] **D-01 high · 지도** — the stand-in canvas draws one pin per place (normalised lat/lng) with `pinDrop` 500 ms on mount and on 최애 switch; tiles reveal markers after the same duration
- [ ] **D-02 med · 지도** — `MapPin`: visited = accent fill + `✓`, unvisited = surface + rule; caption chip with the region
- [ ] **D-03 med · 지도** — whole-country frame on entry
- [ ] **D-04 low · 지도** — chip select cross-fades 300 ms
- [-] **D-05 low** — short names (decision 11)
- [ ] **D-06 high · 홈** — three-way tier note: `10장이면 첫 응모가 열려요` / `20장이면 팬사인회·굿즈가 열려요` / `팬사인회·굿즈까지 모두 열렸어요`
- [ ] **D-07 med · 홈** — 응모하러 가기 → soonest open raffle
- [ ] **D-08 med · 홈** — 마감 임박 응모 as a horizontal scroller of every open raffle, 186 px cells
- [ ] **D-09 med · 홈** — 38 px avatar at the right of the greeting
- [ ] **D-10 low · 홈** — artist chip selection eases 250 ms
- [ ] **D-11 low · 홈** — selection drawn as a 3 px accent ring outside the chip
- [ ] **D-12 low · 홈** — courses clear and skeleton while a switched 최애 loads
- [ ] **D-13 low · 홈** — 인증 count is the visited ∩ this 최애's places
- [ ] **D-14 low · 홈** — scroll bottom padding clears the FAB
- [ ] **D-15 med · 장소/상세** — line under the title is `{최애} · {work kind} · {region}`
- [ ] **D-16 med · 장소/상세** — the tip composer always has one tag selected, starting 포즈; a submit keeps it
- [ ] **D-17 low · 장소/상세** — label stays 팁 남기기 when open; the chip's selected treatment signals the state
- [ ] **D-18 low · 장소/상세** — like count leads with ♡
- [ ] **D-19 low · 장소/상세** — the description block folds into the title block
- [ ] **D-20 high · FAB** — the ring spins once per 7 s
- [ ] **D-21 med · FAB** — 56 px surface disc, accent ring, sparkle glyph, no `AI` text
- [ ] **D-22 low · 탭바** — active tab is the bold weight, not a permanent fill; label size from a token
- [-] **D-23 low** — states `1a` never reaches; their strings go to the Discovery checklist's copy table

### 2 — Capture (`app/verify/*`, `app/capture/*`, `src/features/capture`, `src/features/shared/TicketCard.tsx`)

- [ ] **D-01 high · GPS인증** — rings pulse from mount (2.6 s, 0/.9/1.8 s offsets), never gated on a reading
- [ ] **D-02 med · GPS인증** — the sweep is a filled fading sector turning 3.4 s, from mount
- [ ] **D-03 high · GPS인증** — the verdict's rows reveal 900 ms apart; title and CTA stay on "checking" until the last; refused rows never tick
- [ ] **D-04 high · GPS인증** — 카메라 opens 900 ms after the last tick (decision 1)
- [ ] **D-05 med · GPS인증** — the CTA reads `인증 중…` instead of hiding the label under loader dots
- [-] **D-06 low** — 반경까지 arithmetic (decision 4)
- [ ] **D-07 low · 인증 실패** — not-yet kinds in `warning`, spoof in `danger`
- [-] **D-08 low** — `implausible_speed` wording (decision 6); recorded in the Capture checklist's copy table
- [ ] **D-09 high · 카메라** — the 인증 완료 chip enters with `fadeUp` 400 ms
- [ ] **D-10 high · 카메라** — the pan covers the whole print, not just the figure
- [ ] **D-11 med · 카메라** — 초기화, the slider and a release ease 160 ms; no snap-back on release
- [ ] **D-12 low · 편집** — the tool slider starts at 62
- [ ] **D-13 low · 편집** — the `%` readout goes
- [ ] **D-14 med · 공개설정** — `1a`'s block order (decision 3)
- [ ] **D-15 med · 티켓 발행** — the card drops in from −90 px with a −6° twist, 700 ms overshoot
- [ ] **D-16 high · 티켓 발행** — `HoloTilt`: hold to tilt ±20° in perspective at 1.04, 60 ms follow, 500 ms overshoot return; white shine and glare follow the finger (decision 2)
- [ ] **D-17 high · 티켓 발행** — three-way tier note (same strings as Discovery D-06)
- [ ] **D-18 low · 티켓 발행** — the two `fadeUp` blocks start 14 px below with `ease`

### 3 — Tickets & raffle (`app/(tabs)/tickets.tsx`, `app/raffle/*`, `src/features/tickets`)

- [ ] **T-01 high · 컬렉션** — every tile tilts under the finger via `HoloTilt` (decision 2); the scroll survives
- [ ] **T-04 low · 응모** — short rows are `disabled` with the reason in `accessibilityState`
- [ ] **T-05 med · 응모** — both 컬렉션 exits navigate to the 컬렉션 tab (decision 16)
- [ ] **T-06 low** — the two full-width confirms use the big size
- [ ] **T-07 high · 티켓 절취** — the grip pulses and twinkles idle (1.8 s), shrinks 30 → 26 px on touch, stops while dragging
- [ ] **T-08 high · 티켓 절취** — two sparks fly off the tear front past 6 % progress
- [ ] **T-09 med · 티켓 절취** — heal is a 420 ms overshoot snap, not a default spring
- [ ] **T-10 low · 티켓 절취** — the commit uses the same easing
- [ ] **T-11 low · 티켓 절취** — reaching 100 % mid-drag commits without waiting for release
- [ ] **T-12 low · 티켓 절취** — the subtitle is `{region} · {work kind}` from the place
- [ ] **T-14 high · 응모완료** — the stamp slams from 2.4× and −18° to −9°, overshooting .92
- [ ] **T-15 med · 응모완료** — both `fadeUp` blocks rise 14 px from below
- [ ] **T-16 low · 응모완료** — the balance the server returns is carried into the store so the note is whole on the first frame

### 4 — Auth (`app/onboarding.tsx`, `app/artist/search.tsx`, `src/features/auth`, `src/design-system/components/button`)

- [ ] **A-01 med · 온보딩** — 이메일로 로그인 is the new `outline` button (decision 29)
- [ ] **A-02 med · 최애 찾기** — a sequence guard on the search; `listMine` once, not per keystroke
- [ ] **A-03 low · 온보딩** — the pin scatter is the six map pins in a 300 px band at 96 px
- [-] **A-04 low** — per-pin glow (decision 31)
- [ ] **A-05 low · 온보딩** — copy gap 18, actions 14 above, note 6 above
- [ ] **A-06 low · 온보딩** — wordmark tracking `.28em`, shared with 홈/마이
- [-] **A-07 low** — radius flattening is a design-system item, tracked in design-tokens.md
- [-] **A-08 low** — `바뀝니다` stands (decision 30); recorded in the Auth checklist
- [ ] **A-09 low · 최애 찾기** — note `t7`, meta and chip label `st12`, back and initial `st11`
- [ ] **A-10 low · 최애 찾기** — no rule above the list
- [-] **A-11 low** — pinned search stays; recorded
- [-] **A-12 low** — the field's clear affordance stays; recorded
- [-] **A-13 low** — two app-only strings go to the Auth checklist's copy table
- [-] **A-14 low** — matches in effect

### 5 — Community (`app/(tabs)/community.tsx`, `app/post/write.tsx`, `src/features/community`)

- [ ] **C-01 high · 커뮤니티** — board chips cross-fade fill and label 300 ms
- [ ] **C-02 high · 글쓰기** — opens with the newest ticket pinned (decision 24)
- [ ] **C-03 med · 커뮤니티** — boards reload on focus, like 홈's chips
- [ ] **C-04 med · 커뮤니티** — the pin glyph is `MapPinIcon`, not `⌖`
- [ ] **C-05 med · 글쓰기** — same, 18 px, accent when on / grey400 when off
- [-] **C-06 low** — pinned chips stay; recorded
- [ ] **C-07 low · 커뮤니티** — avatars take the chip radius
- [ ] **C-08 low · 글쓰기** — composer type from the typography map, no magic numbers
- [-] **C-09 low** — three app-only strings go to the Community checklist's copy table
- [-] **C-10 low** — 등록 gating stays; recorded
- [-] **C-11 low** — 지도에서 보기 (decision 23)

### 6 — Profile (`app/(tabs)/my.tsx`, `app/profile.tsx`, `app/language.tsx`, `app/vault.tsx`, `src/features/profile`)

- [ ] **P-01 high · 마이페이지** — the 로그아웃 sheet rises 14 px over 280 ms
- [ ] **P-02 med · 마이페이지** — 로그아웃 in the alert colour
- [ ] **P-03 low · 마이페이지** — 로그아웃 row spacing, no rule under it
- [ ] **P-04 low · 마이페이지** — the tier badge is the design-system `Badge`
- [ ] **P-05 low · 마이페이지 · 보관함** — stat cells left-aligned
- [ ] **P-06 low · 마이페이지** — rows dim while pressed (decision 28)
- [-] **P-07 low** — platform affordance stays
- [ ] **P-08 low** — avatar sizes 62 / 96
- [ ] **P-09 med · 프로필 편집** — over-limit count, rule and hint in the alert colour, not the accent
- [-] **P-10 low** — preset avatars (decision 25)
- [ ] **P-11 low · 프로필 편집** — camera badge on the avatar
- [ ] **P-12 low · 프로필 편집** — avatar hairline
- [ ] **P-13 low · 프로필 편집** — 추가 as its own label
- [ ] **P-14 low · 프로필 편집 · 언어** — the radio is a 20 px disc, filled when on
- [ ] **P-15 med · 보관함** — two-column 3:4 grid, 비공개 chip on the photo, monospaced serial (decision 26)
- [ ] **P-16 low · 보관함** — 공개 전환 stat in the accent
- [-] **P-17 low** — four loading/error strings go to the Profile checklist's copy table

### 7 — Assistant (`app/chat.tsx`, `app/course.tsx`, `src/features/assistant`, `src/features/discovery/MapCanvas.tsx`)

- [ ] **A-01 high · Pindom AI** — loading is a spinning star (1.5 s) beside a breathing `답변을 찾고 있어요` (1.6 s), not a bubble
- [ ] **A-02 high · Pindom AI** — the ⋯ sheet rises 14 px over 260 ms
- [ ] **A-03 med · Pindom AI** — the empty hero sits at the bottom above the composer
- [ ] **A-04 med · Pindom AI** — the four questions are a full-width list, not wrapped chips
- [ ] **A-05 med · Pindom AI** — 답변 신고하기 in the alert colour
- [ ] **A-06 low · Pindom AI** — 취소 is a full-width filled row
- [ ] **A-07 low · Pindom AI** — close glyph, no title (decision 21)
- [ ] **A-08 low · Pindom AI** — the course card reads `n곳 · {course name}` (decision 22)
- [-] **A-09 low** — the route tile is ornament; out under `2b`
- [ ] **A-10 low · Pindom AI** — the course card stays mounted while a new answer loads
- [ ] **A-11 low · Pindom AI** — return key sends
- [-] **A-12 low** — mic (decision 19)
- [ ] **A-13 low · Pindom AI** — pressed states on rows and the card (decision 28)
- [ ] **A-14 high · 추천 코스** — a dashed accent route with a surface halo through the stops, on tiles and on the stand-in
- [ ] **A-15 med · 추천 코스** — numbered stops, the first in the accent fill, the rest in the soft accent
- [ ] **A-16 low · 추천 코스** — the map is inset by the gutter, 262 tall
- [-] **A-17 low** — the description is the backend's field; recorded in the Assistant checklist's copy table

### 8 — Close out

- [ ] `yarn typecheck` and `yarn lint` green on every commit
- [ ] Each slice verified on the simulator — table below
- [ ] `design/README.md`: open question 2 closed (decision 15); the README points at this pass
- [ ] The slice checklists' copy tables gain the rows the audit found unrecorded
- [ ] [build status memory](../../CLAUDE.md) — what is still unverified after this pass

## What the simulator run confirmed

Filled in as each slice lands. One row per screen that moved.

| Screen | Checked | Result |
| --- | --- | --- |

## Still open after this pass

- The Naver client id is still unset, so `pinDrop` on tiles, the route overlay and the numbered
  markers are written against the SDK's documented props but have never drawn.
- `Artist.shortName`, `Place.shortRegion`, a preset avatar field and a figure-less
  `implausible_speed` line are asks for the backend developer and the designer respectively.
- Whether `workTitle` deserves a line of its own on 장소/상세 (decision 14).

## Related

- [Prototype fidelity audit](2026-08-23-prototype-fidelity-audit.md) — the evidence, one row per ID
- [Design source](../../design/README.md) — the two-axis rule this pass applies
- The seven `2026-08-22-*-slice-checklist.md` files — what was decided before this pass
- [Design tokens](../reference/design-tokens.md) — the `2b` values every colour here resolves to
