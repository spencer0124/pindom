---
title: Profile Slice Checklist
type: plan
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-08-23
audience: internal
---

# Profile Slice Checklist

> The punch list for 마이페이지, 프로필 편집, 언어 and 보관함 — the user document's own screens, and the sign-out that closes the loop 온보딩 opened. Start here if you are picking one up.

## Summary

[screens.md](../reference/screens.md) groups these four because they share the user, the
followed artists and the vault. Three of them are the small screens the prototype added with
no Figma frame behind them; 마이페이지 has `33:1597`.

Sources, per [design/README.md](../../design/README.md): layout, copy and flow from block `1a`;
colour, type and corners from `2b`.

## Checklist

### 1 — 마이페이지 (`app/(tabs)/my.tsx`)

- [x] Avatar, nickname, the tier line, 프로필 편집; the three stats; the menu; 로그아웃; the
      `{nickname} · {email} · v{version}` line — the version read from the app config, never
      typed.
- [x] The menu: 프로필 설정 → 프로필 편집 · 응모 내역 / 당첨 확인 → 컬렉션 · 비공개 보관함 (`n장`) →
      보관함 · 내 커뮤니티 글 → 커뮤니티 · 위치·카메라 권한 (허용 when both are) → Settings ·
      언어 설정 (the locale) → 언어.
- [x] **No 화면 테마 row.** ADR 0004 and 0006: every screen is dark as a property of the build.
- [x] 로그아웃 asks first — 로그아웃할까요? with 1a's note — and on yes signs out and replaces
      to 온보딩. Walked on the simulator, and the tab gate then bounced a deep link back to
      온보딩 as it should.
- [x] Refreshes silently on focus, so 프로필 편집's save and 보관함's 공개 전환 show on return.

### 2 — 프로필 편집 (`app/profile.tsx`)

- [x] 취소 · 프로필 편집 · 저장; the avatar; 닉네임 with its `n/12` count and 1a's three hint
      lines; 한 줄 소개; 내 아티스트 with 추가 → 최애 찾기; 공개 범위; 변경사항 저장.
- [x] `updateProfile` takes exactly the draft — nickname, bio, avatarUrl, profileVisibility —
      which is the whole set of fields the contract lets the client write.
- [x] 내 인증컷에서 고르기 is a strip of the user's own ticket photos; a tap makes one the avatar.

### 3 — 언어 (`app/language.tsx`)

- [x] ‹ 마이 · 언어 설정, the note, two rows, the 촬영지 이름은 번역하지 않습니다 block.
- [x] Two rows, not 1a's four — ko and en are the shipped locales — and the pick is written to
      the user document with `setLocale`.

### 4 — 보관함 (`app/vault.tsx`)

- [x] ‹ 마이 · 비공개 보관함 · `n장`; 여기 있는 사진은 나만 봅니다 and its note; the three
      figures; the two-column grid of 3:4 tiles with the 비공개 chip on the photo, the place,
      `{serial} · {MM.DD}` — `1a`'s grid, restored by the
      [fidelity pass](2026-08-23-prototype-fidelity-checklist.md) (decision 26).
- [x] **공개 전환 is an action**, per tile, as a text button in the caption row.
      `setVisibility('public')` moves the ticket to 컬렉션 and the tile leaves the grid.

### 5 — Close out

- [x] `yarn typecheck` and `yarn lint` clean.
- [x] [screens.md](../reference/screens.md) — the four screens to `built`.
- [x] [docs/README.md](../README.md) — index this document.

## What the device run found

| Found | Fix |
| --- | --- |
| The simulator keyboard autocorrected a nickname (Domin → Domain) | `autoCorrect={false}` on the nickname field — a name is not a word |
| The radio rows on 언어, 프로필 편집 and 응모 were not addressable by automation | `accessibilityLabel` on each — better for VoiceOver too |

### Copy the prototype does not have

| Where | Line |
| --- | --- |
| 보관함, empty | 비공개로 저장한 컷이 아직 없어요 |
| 마이페이지 · 프로필 편집 · 보관함, loading | 불러오는 중 |
| 마이페이지, load failed | 마이페이지를 불러오지 못했어요 |
| 프로필 편집, load failed | 프로필을 불러오지 못했어요 |
| 보관함, load failed | 보관함을 불러오지 못했어요 |
| 언어, loading | No label — the loader alone, until the locale is read |

## Where the sources disagree

| # | `1a` prototype | Contract / `2b` | Taken | Why |
| --- | --- | --- | --- | --- |
| 1 | A 화면 테마 row with a light/dark toggle | ADR 0004, ADR 0006 | Not drawn | Dark is a property of the build |
| 2 | 인증 이의신청 in the menu | Nothing in the contract | Not drawn | A row that can go nowhere |
| 3 | Stats 방문 인증 · 지역 · 응모 내역 (n건) | No query for a user's entries; `raffleEntries` are written by `enterRaffle` and never listed | 방문 인증 · 지역 · 보유 티켓 | The third figure has no source; the balance is the one a user most wants here |
| 4 | 응모 내역 / 당첨 확인 (n건) and 내 커뮤니티 글 (n개) carry counts | No per-user entry or post query | The rows without counts, going to 컬렉션 and 커뮤니티 | |
| 5 | 사진 올리기 | No image picker in this build | 내 인증컷에서 고르기 only | The user's ticket photos are already uploaded and already theirs |
| 6 | Interest tags (드라마 OST · 예능) among 내 아티스트 | No field | The followed 최애 and 추가 | |
| 7 | Four locales | ko and en ship | Two rows | The 2026-08-21 review resolutions |
| 8 | The design-system Dialog for 로그아웃할까요? | `Dialog` paints `SdsColors.background` — a white card | A block on the screen | One of the twenty unconverted components |
| 9 | Five preset gradient avatars on 프로필 편집 | The contract's `users` write set is `avatarUrl` only | Not drawn; 내 인증컷에서 고르기 is the one avatar control | Fidelity decision 25 — a backend ask, either five hosted presets or an `avatarPreset` field |
| 10 | The dim behind 로그아웃할까요? has no handler | Platform convention: a tap outside a sheet dismisses it | The dim dismisses | A harmless affordance the prototype's web hover world never needed (audit P-07) |
| 11 | 위치·카메라 권한 prints 허용 only — the fixture is never denied | Copy is final; there is no string for a denied permission | The row prints nothing when a permission is missing and still opens Settings | Fidelity decision 27 — a denied-state line is the designer's to write |

## Still open

- **The UI does not switch language.** The locale is stored, as the contract asks, but this
  build's strings are Korean; 언어's note promises more than the app does today. An i18n layer
  is a decision for after the 공모전.
- **The permission row reads but cannot grant.** It opens Settings, which is the only place a
  revoked permission can be restored; it does not re-prompt.
- **The tier line uses 1a's thresholds** — same gap the Tickets checklist records.
- **The serial line is tabular, not monospaced.** `1a` sets it in `ui-monospace`; the typography
  map has no mono face, so 보관함 uses `fontVariant: ['tabular-nums']` as the ticket does. A mono
  face is a design-system ask.

## Related

- [Prototype fidelity checklist](2026-08-23-prototype-fidelity-checklist.md) — the motion and polish
  pass that followed this build; its § Profile rows are P-01 … P-17
- [screens.md](../reference/screens.md) — the slice table these four come from
- [2026-08-22-auth-slice-checklist.md](2026-08-22-auth-slice-checklist.md) — the gate 로그아웃 lands on
- [backend-contract.md](../reference/backend-contract.md) — `users`, the fields the client may write
