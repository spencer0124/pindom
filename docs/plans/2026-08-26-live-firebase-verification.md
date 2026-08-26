---
title: 2026-08-26 Live Firebase Verification
type: plan
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-08-26
audience: internal
---

# 2026-08-26 — Live Firebase Verification

> `EXPO_PUBLIC_USE_MOCKS=false` against the deployed `pindom-1234`, walked on the iOS simulator.
> Every screen driven by hand, every write checked back against Firestore over REST, and the
> console read directly rather than trusted from documentation. The emulator run this follows
> ([integration open items](2026-08-26-integration-open-items.md)) proved the mappers; this
> proves the screens, and it found ten things the mapper check could not see.

## Why a second pass

The emulator check ran the app's mappers against emulator documents. It could not catch anything
above the mapper: a screen that never calls the repository, a promise made in copy that no
backend keeps, a control that exists in one direction only, or a gate whose deployed order
differs from the contract's table. Those only appear when the real app talks to the real
project.

Three sources were cross-checked against each other throughout — the app on screen, the
Firestore documents over REST as the signed-in user, and the Firebase console. Where they
disagreed, the disagreement is a finding.

## How it was run

One account was created through the app's own 회원가입 (`pindomtest0826@gmail.com`,
uid `fzmqBCJraeRffAGwVM4gaa0HxNf1`) and everything below was done as that user. The simulator's
location was moved to the seeded coordinates to drive GPS인증. A second throwaway account was
made to test one gate on a ticketless user and **deleted afterwards** — the console now shows
one user, which is the intended end state.

## Status values

`pass` — walked on the simulator and confirmed server-side ·
`fail` — defect, numbered under [Findings](#findings) ·
`blocked` — cannot be reached here, with the reason · `not run` — out of time, not attempted

## Checklist

### A — Foundation

| # | Check | Status |
| --- | --- | --- |
| A1 | App launches with `useMocks: false`, no crash | pass — Metro bundled `firebase.ts` (753 modules) |
| A2 | `firebaseConfigured: true`, both config files linked | pass — bundle carries `pindom-1234`, correct bucket |
| A3 | Firestore reachable — real documents render | pass |
| A4 | Callables resolve in `asia-northeast3` | pass — console shows all three there; `us-central1` returns 404 |

### B — Auth · 온보딩

| # | Check | Status |
| --- | --- | --- |
| B1 | 회원가입 creates the Auth user | pass — console lists exactly one user |
| B2 | Writes `users/{uid}` — id is the uid, counters literal `0`, no `tier` | pass — exactly as the contract specifies |
| B3 | 로그인 with the same credentials | pass — see [finding 10](#10-온보딩s-nickname-field-is-missing-the-fix-프로필-편집-already-has) |
| B4 | Session survives a cold start | pass |
| B5 | 로그아웃 returns to 온보딩 | pass — confirm sheet reads the live ticket count |
| B6 | Tabs redirect to 온보딩 without a session | pass |

### C — 최애 · artists

| # | Check | Status |
| --- | --- | --- |
| C1 | 최애 찾기 lists the three seeded artists | pass |
| C2 | Follow writes `followedArtistIds` | pass |
| C3 | Active 최애 persists across a cold start | pass — MMKV rehydration, decision 4 holds |
| C4 | Unfollow removes it, `reconcile` picks another | not run |

### D — 홈

| # | Check | Status |
| --- | --- | --- |
| D1 | 보유 티켓 summary reads the live `users` document | pass — updated 0장 → 1장 after the mint |
| D2 | 마감 임박 응모 lists open raffles only | pass — 17시간/D-4 match the seeded `closesAt` |
| D3 | `{최애}의 촬영지` ranked client-side | pass — `slice(0, 3)`, farthest correctly dropped |
| D4 | `{최애} 지역 코스` from `courses` | pass |
| D5 | 인증 count derived from the full collection | pass — 0곳 → 1곳 인증 |

### E — 지도

| # | Check | Status |
| --- | --- | --- |
| E1 | Naver tiles draw | pass — real tiles, NAVER attribution |
| E2 | Pins for the seeded 촬영지 | pass |
| E3 | 촬영지 목록 ordered by distance | pass — uncapped here, unlike 홈 |
| E4 | Artist filter chip | pass |

### F — 장소/상세

| # | Check | Status |
| --- | --- | --- |
| F1 | `getById` renders name, description, 촬영 팁 | pass |
| F2 | Stats row reads 촬영된 사진 | pass — decision 6 confirmed on screen |
| F3 | 갤러리 subcollection reads | pass — section appears once a photo exists |
| F4 | 리뷰 subcollection reads | pass |
| F5 | 리뷰 write succeeds under the deployed rules | pass — and carries no `ticketId`, per decision 5 |

### G — Capture · the core loop

| # | Check | Status |
| --- | --- | --- |
| G1 | `verifyLocation` accepts at `place-jumunjin` | pass — see [finding 2](#2-the-runbooks-gps-test-coordinate-is-2093-m-off) |
| G2 | Rejection renders 인증 실패 with its table | pass — speed gate fired on a real 166 km jump |
| G3 | A rejection resolves rather than throws | pass |
| G4 | Grant unlocks 카메라 | pass |
| G5 | 편집 composes the print | pass — screen reached; 88–112 % range not measured |
| G6 | 공개설정 chooses visibility | pass |
| G7 | Photo uploads to `tickets/{uid}/…` | pass — real 103 KB JPEG, **no GPS EXIF** |
| G8 | `issueTicket` mints and increments counters | pass — `tier` appears on first mint, as the rules predict |
| G9 | 티켓 발행 renders a real Code 128 | pass — serial matches the document |
| G10 | Cold start on the first callable is survivable | pass — all three still `minInstances: 0` |

### H — 컬렉션 · 보관함

| # | Check | Status |
| --- | --- | --- |
| H1 | `listMine` returns the minted ticket | pass |
| H2 | Balance and tier gauge from the live user document | pass — but see [finding 8](#8-the-tier-gauge-contradicts-what-a-raffle-costs) |
| H3 | `listVault` returns private tickets only | pass |
| H4 | 공개 전환 flips `visibility` | pass — private → public only, [finding 5](#5-a-published-photo-cannot-be-withdrawn) |
| H5 | 갤러리 does **not** follow the flip | pass (gap confirmed) — backend item 1, both directions |

### I — 응모 · raffles

| # | Check | Status |
| --- | --- | --- |
| I1 | Raffle list excludes the closed one | pass — 3 of 4 shown |
| I2 | Raffle detail renders, CTA disabled below cost | pass |
| I3 | 티켓 절취 → `enterRaffle` | blocked — needs ≥2 unspent tickets |
| I4 | Ticket balance decrements | blocked — same |
| I5 | 응모완료 shows the entry number | blocked — same |

> The callable itself was proven reachable out of band: `asia-northeast3` returns
> `FAILED_PRECONDITION` with `details.errorCode: insufficient_tickets`, exactly the shape the
> contract specifies. Only the happy path is unreached. Minting more tickets in one session is
> prevented by the per-place daily cooldown and by the speed gate between distant 촬영지.

### J — 커뮤니티

| # | Check | Status |
| --- | --- | --- |
| J1 | Per-artist boards, no 전체 | pass **as the app stood during this run**. `c0c7406`, committed later the same day, adds 자유게시판 on the reserved `board-free` id — so the tab now opens on a board that is not an artist's. The finding is unaffected; the row just no longer describes the current build |
| J2 | Header prints `촬영지 n곳` from `placeCount` | pass — decision 4; `placeCount` verified consistent |
| J3 | Feed reads `posts` | pass — empty before the write, as seeded |
| J4 | 글쓰기 writes under the deployed rules | pass — author identity and literal `0` counters accepted |
| J5 | Pin attaches the newest **public** ticket's place | pass — decision 2 confirmed |
| J6 | 자유게시판 is the first chip, and the board the tab opens on | pass — chip row is `자유게시판 · Lumina`, opened selected; no board header, as intended |
| J7 | A post written on 자유게시판 is accepted — the rules never validate `boardId` | pass — `자유게시판 테스트` accepted with `boardId: board-free`, no `artists` document behind it |
| J8 | Its feed reads back on the deployed `boardId + createdAt` index | pass — row rendered on return, pin (주문진 방파제) and literal `0` counters included |
| J9 | 자유게시판 posts stay off the 최애 boards, and vice versa | pass — Lumina board shows its own post and its `촬영지 4곳` header; the 자유게시판 post is absent |

> J1–J5 were run before 자유게시판 existed, and stand as recorded. J6–J9 are the rows it added;
> they are the live proof that it needed **no** backend deploy — **nothing in the Firebase project
> changed between the two runs**: same three functions, same five indexes, same ruleset. Run
> 2026-08-26 against `pindom-1234` on the iOS simulator. See the community slice checklist,
> disagreement rows 8 and 9.

### K — 마이페이지

| # | Check | Status |
| --- | --- | --- |
| K1 | Profile reads the live user document | pass |
| K2 | 프로필 편집 saves the permitted fields | pass — `bio`, `avatarUrl`, `profileVisibility`; counters untouched |
| K3 | 언어 ko · en writes `locale` | pass for the write — [finding 7](#7-촬영지-이름-is-translated-against-the-screens-own-note) for the effect |
| K4 | No theme toggle | pass — ADR 0004 / 0006 hold |

### L — Assistant

| # | Check | Status |
| --- | --- | --- |
| L1 | Pindom AI answers | pass at the time of the run — `askAssistant` was **not deployed** and the chat degraded to 잠시 후 다시 시도해 주세요 rather than crashing. The backend deployed it later the same day, so the screen now has a real answer to render; re-checked in-app under [R11](#backend--verify-what-was-fixed) |
| L2 | 추천 코스 renders | not run |

## Findings

Ten, ordered by what they cost a user or a reader. The first two cost a developer an afternoon;
the rest are in the product.

### 1. Flipping the switch needs a rebuild, not a Metro restart

`src/lib/config.ts` reads `Constants.expoConfig.extra`, and in this dev build that object is
**baked into the app bundle at build time** as `EXConstants.bundle/app.config`. Metro's served
manifest carries `extra: null`. So editing `.env` and restarting Metro changes the inlined
`process.env.EXPO_PUBLIC_*` strings in the JS bundle but **not** the `extra` block `AppConfig`
actually reads — the app keeps serving fixtures while every file on disk says otherwise.

This cost a full cycle to diagnose. The runbook's step 4 should say the switch requires a
rebuild, and the fastest confirmation is Metro's own log: it prints either
`src/lib/repositories/mock.ts` or `src/lib/repositories/firebase.ts` on first use.

### 2. The runbook's GPS test coordinate is 2,093 m off

The runbook says to send `37.8983, 128.8306` to be "within 50 m of `place-jumunjin`". The
seeded document is at `37.8796220881, 128.8335906768` with `radiusMeters: 50`. The two are
**2,093 m apart** — 42× the radius. Followed as written, the happy path returns
`out_of_radius` and reads as a broken verification. Use the seeded coordinate.

### 3. The deployed `verifyLocation` hoists the last-ticket speed check above two gates

The contract's table is explicit: gate 1 mock, **gate 2 accuracy**, gate 3 radius, gate 4 speed.
`functions/src/index.ts` at HEAD implements exactly that — accuracy at line 149, radius at 151,
the in-session speed check at 157, and `jumpedFromLastTicket` last at 165. No commit in the
backend repo has ever moved them.

The **deployed** function evaluates `jumpedFromLastTicket` **first**, ahead of both accuracy and
radius. Controlled probe, with the account's last ticket 45 minutes old at 주문진 and the reading
sent from 부산 — 301 km away, an implied 401 km/h, over the 300 km/h ticket threshold:

| Reading | Source order says | Deployed answers |
| --- | --- | --- |
| `accuracy: 30`, 301 km away | `out_of_radius` | **`implausible_speed`** |
| `accuracy: 9999`, 301 km away | `poor_accuracy` | **`implausible_speed`** |
| `accuracy: 9999`, in-session (2nd reading) | `poor_accuracy` | `poor_accuracy` ✓ |
| `accuracy: 9999`, account with no ticket | `poor_accuracy` | `poor_accuracy` ✓ |

The last two rows matter: the **in-session** speed check sits correctly after accuracy, and with
no ticket to compare against the hoisted check returns false and the documented order resumes.
So the defect is narrow — one branch, `jumpedFromLastTicket`, and only when it fires.

**It is not a spoofing hole.** Passing still requires `accuracy ≤ 65` *and* effective distance
≤ 50, i.e. genuinely within about 115 m. Two things do go wrong.

**It returns the wrong verdict to an ordinary user.** Row 1 is a fan who minted a ticket in
강릉, travelled, and opened 인증 in 부산 before reaching the place. The honest answer is
`out_of_radius` — they are 301 km away. They are told `implausible_speed`, which
[finding 4](#4-인증-실패-promises-a-review-system-that-does-not-exist) renders as
위치 조작이 의심되어 … 계정에 검토 플래그가 등록됐습니다.

**It defeats the safety property the ordering exists for.** The contract says a reading rejected
for accuracy "is not appended to `readings`", because "a sample with 200 m of error in that array
would poison the speed calculation below and could get a legitimate user judged a spoofer" — and
in the code `poor_accuracy` rejects with `append: false` while `implausible_speed` rejects with
`append: true`. Because the hoisted check answers first, the garbage sample is appended. Verified
in the console on session `0eSD7bbc13DAel1i1biM`: `readings` holds one entry with
`accuracy: 9999` and `distanceMeters: 291007`. Every later in-session comparison is measured
against it.

Moving `jumpedFromLastTicket` back below the accuracy gate — where the repo already has it —
fixes both. **The repo source is already correct, so this most likely means the deployed build
is not HEAD**; a redeploy is worth trying before anything is edited.

### 4. 인증 실패 promises a review system that does not exist

On an `implausible_speed` or `mock_location` verdict the screen says
`계정에 검토 플래그가 등록됐습니다. 관리자 검토는 보통 24시간 안에 끝납니다`, lists
`조치: 검토 대기 (24h)`, and offers a `검토 상태 확인` button.

Nothing writes a flag — there is no such field in the functions, no review queue, and no admin
surface. The `검토 상태 확인` button simply navigates to 마이페이지. A user who trips the speed
gate on a genuinely fast train is told their account is under investigation, and given a button
that shows them nothing. Either build the flag or write copy that describes what actually
happens.

### 5. A published photo cannot be withdrawn

`ticketRepository.setVisibility` has exactly one caller — `useVault.makePublic` — and it
hard-codes `'public'`. 보관함 lists only private tickets and only offers 공개 전환. There is no
public → private control anywhere in the app.

This compounds the backend's known gallery gap. That item worries that 공개 → 비공개 leaves a
stale gallery entry; in fact the app cannot trigger that direction at all, which is worse for
the user. Verified live: setting `visibility: private` directly leaves the gallery entry in
place, so 보관함's header — **여기 있는 사진은 나만 봅니다** — is not true for any ticket that was
ever public. The trigger the backend already owes fixes the second half; the first half is a
missing control in this repo.

### 6. `ListRow` never sets an accessibility role

`ListRow` spreads `accessibilityLabel` through but never sets `accessibilityRole="button"`, and
React Native's `Pressable` does not add one implicitly. Every row built on it — the 촬영지 lists
on 홈 and 지도, the 언어 options, the 마이페이지 rows — reports as `other` with no action, so
VoiceOver announces text that cannot be activated. `app/vault.tsx:42` sets the role correctly on
a bare `Pressable`, so the codebase knows the idiom; the primitive just omits it. One line in
`ListRow` fixes every screen at once.

### 7. 촬영지 이름 is translated, against the screen's own note

> [!NOTE]
> The **first half of this — that the UI does not switch language — is already recorded** in the
> [profile slice checklist](2026-08-22-profile-slice-checklist.md) under "Still open", where an
> i18n layer is deferred until after the 공모전. Only the place-name half below is new.

The screen says `앱 전체 UI 언어를 바꿉니다` and `촬영지 이름은 번역하지 않습니다 … 로마자 표기를
함께 보여줍니다`. Both are false.

`locale` feeds only `setActiveLocale` in `firebase-mapping.ts`, which picks the `ko`/`en` key of
**Firestore content**. There is no i18n layer for the app's own strings — they are hardcoded
Korean, which is what [CLAUDE.md](../../CLAUDE.md) intends. Meanwhile place names *are* swapped
to their `en` values (`Gwangtonggyo Bridge`, `Eurwangni Beach`) with no roman subtitle. The
result is hybrid strings: **`Lumina의 촬영지 4`**, `Lumina · 드라마 촬영 · Jongno, Seoul`.

The setting works; the copy describes a different feature. Rewrite it to say it changes 촬영지
and 코스 content, not the interface.

### 8. The tier gauge contradicts what a raffle costs

> [!NOTE]
> **Already on record**, twice, in the
> [tickets slice checklist](2026-08-22-tickets-slice-checklist.md) — the 10/20 marks disagreeing
> with the contract's tier bands is flagged for the designer, and "rewards are gated on a tier
> minimum **and** a cost" was already decided the other way: the cost is the gate, because there
> is no minimum to compare against. Kept here only as live confirmation.

컬렉션 shows `수집 중 · 10장부터 응모 가능`, `9장 남음`, and a gauge labelled
`10 · 앨범/콘서트` and `20 · 팬사인회/굿즈`. 응모 prices the same raffles at 앨범 2장,
팬사인회 3장, 콘서트 8장. The raffle documents carry **no tier field at all**, and `enterRaffle`
enforces only the cost and the balance.

So the gauge's thresholds correspond to nothing in the data or the server, and they contradict
the prices on the very next screen. The 10장 gate is client-side only and is not mentioned in
the contract's `enterRaffle` section. Decide which number is real and write it down.

### 9. The nickname field autocapitalises

Typing `pindomtester` stored `Pindomtester`. Rules compare `authorNickname` to the user document
exactly, so nothing breaks — both sides carry the altered value. But the field silently changes
what the user typed, and a nickname is an identity, not a sentence. `autoCapitalize="none"` and
`autoCorrect={false}` belong on it.

### 10. 온보딩's nickname field is missing the fix 프로필 편집 already has

`app/profile.tsx:179-180` sets `autoCorrect={false}` and `autoCapitalize="none"` on the nickname
field — the fix the
[profile slice checklist](2026-08-22-profile-slice-checklist.md) recorded after a device run
autocorrected `Domin` into `Domain`. `app/onboarding.tsx:111` sets **neither**, so the nickname
typed at 회원가입 is capitalised before it is stored: `pindomtester` became `Pindomtester`.

Nothing breaks — rules compare `authorNickname` to the user document and both carry the altered
value — but it is the same decided fix, applied to one of the two screens that needed it.

> [!NOTE]
> **Retracted from an earlier draft of this page.** It also claimed a failed sign-in silently
> falls through to sign-up. That was not observed: the two buttons unfold their own mode on
> first tap and submit on the second, which the
> [auth slice checklist](2026-08-22-auth-slice-checklist.md) already documents as the design,
> and what actually happened is that this run drove the sign-up button while expecting sign-in.
> No failed sign-in was ever exercised, so no claim is made about one.

## What this run confirmed about the backend's list

The items handed to the backend on 2026-08-26 were checked against the live project rather than
re-argued. Confirmed still true:

| Item | Confirmed |
| --- | --- |
| 1 — 갤러리 does not follow a visibility flip | Yes, both directions. See [finding 5](#5-a-published-photo-cannot-be-withdrawn) |
| 3 — `places.verifyCount` is written by nothing | **No longer true.** It was, during this run; the backend shipped the increment the same day and it now moves `0 → 1` |
| 5 — `issueTicket` denormalises Korean only | Yes — the ticket and the post both carry `주문진 방파제` under `locale: 'en'` |
| 7 — `askAssistant` is not deployed | **No longer true.** The console listed three functions during this run; the backend deployed the fourth the same day |
| 9 — cold start on the first verification | Yes — all three are `minInstances: 0` in the console |

Also observed: `reviewCount` is dead exactly as `verifyCount` is, `memberCount` is still `0` in
the seed and correctly unread by the app, and App Check is still unconfigured — the console
prompts to set it up, which matches the recorded accepted risk.

## Test data left behind

One account, `pindomtest0826@gmail.com`, holding one ticket at `place-jumunjin`, one post on the
Lumina board and one review, plus the gallery entry and the counters those writes moved. It is
the evidence for the rows above; delete it whenever the project wants a clean seed.

## Related

- [2026-08-26 integration open items](2026-08-26-integration-open-items.md) — the emulator run this follows
- [connect-the-app-to-firebase.md](../how-to/connect-the-app-to-firebase.md) — the runbook findings 1 and 2 correct
- [backend-contract.md](../reference/backend-contract.md) — the referee, and what finding 3 disagrees with

## Remediation checklist

Worked in this order: code before docs, and within code, breadth of impact first. Each row was
re-checked before moving on. `verify` names the check that was actually run, not an intention.

### App — no decision needed

| # | Fix | File | Status | Verify |
| --- | --- | --- | --- | --- |
| R1 | `ListRow` sets `accessibilityRole="button"` when pressable | `src/design-system/components/list-row/ListRow.tsx` | done | rows report `tap\|button` in a runtime snapshot |
| R2 | 온보딩 nickname gets `autoCapitalize`/`autoCorrect` | `app/onboarding.tsx` | done | typed nickname stored verbatim |
| R3 | 인증 실패 stops promising a review that does not exist | `app/verify/failed.tsx` | done | copy no longer claims a flag; no dead button |
| R4 | Runbook says the switch needs a rebuild | `docs/how-to/connect-the-app-to-firebase.md` | done | markdownlint green |
| R5 | Runbook's GPS coordinate corrected in both docs | runbook + `2026-08-22-backend-handoff-reconciliation.md` | done | now `37.8796220881, 128.8335906768`, matching the seed |

### App — decision first

| # | Fix | Decision | Status |
| --- | --- | --- | --- |
| R6 | 촬영지 이름 is never translated | **Behaviour follows the copy** (2026-08-26) — 언어 states the rule outright, and a name that disagrees with the signage is worse than a foreign one when you are standing in front of the spot | done |
| R7 | Add a 공개 → 비공개 control | Waits on the backend's gallery trigger — shipping it first would let the app claim a withdrawal it cannot perform | blocked |

**R6, what changed.** `toPlace` resolves `name` with `DEFAULT_LOCALE`, so every screen shows
`청계천 광통교` rather than the seed's `name.en` of `Gwangtonggyo Bridge`. 장소/상세 already
prints the `roman` caption under the title, so that screen now reads exactly as 언어 promises.

**R6, what did not change.** The 촬영지 **list rows** on 홈 and 지도 stay two lines — name and
meta — so they do not gain a roman caption. Adding a third line would change the row for Korean
readers too, and that layout is one the
[fidelity audit](2026-08-23-prototype-fidelity-audit.md) locked against `1a`. Worth doing as its
own change if the roman caption is wanted in lists; it is not needed to make 언어 truthful.

### Backend — verify what was fixed

The backend repository has no commits after `72f0a89` (2026-08-25), so these are checked against
the **deployed project** rather than against source.

| # | Item | Status |
| --- | --- | --- |
| R8 | `verifyLocation` hoists the last-ticket check above accuracy/radius ([finding 3](#3-the-deployed-verifylocation-hoists-the-last-ticket-speed-check-above-two-gates)) | **still present** — re-probed from Jeju (529 km, 567 km/h): `accuracy: 30` answered `implausible_speed` where the contract says `out_of_radius`, and `accuracy: 9999` answered `implausible_speed` where it says `poor_accuracy` |
| R9 | Gallery follows a visibility flip (open item 1) | **still present** — flipped to `private`, entry survived at 12 s and 57 s; restored to `public`, no duplicate written |
| R10 | `places.verifyCount` is incremented (open item 3) | **fixed** — `0 → 1` on an accepted reading, `ticketCount`/`photoCount` untouched |
| R11 | `askAssistant` deployed (open item 7) | **fixed** — answers in `asia-northeast3` with `{ reply, suggestions, route }` |
| R12 | `verifyLocation` has a warm instance (open item 9) | inconclusive — first call 1.28 s vs 0.36–0.43 s warm, too fast to call cold but not proof of `minInstances`. `askAssistant` cold-started at 4.2 s, so cold starts do still happen here |
