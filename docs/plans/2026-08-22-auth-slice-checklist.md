---
title: Auth & Entry Slice Checklist
type: plan
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-08-23
audience: internal
---

# Auth & Entry Slice Checklist

> The punch list for 온보딩 and 최애 찾기 — the first run, and the screen that keys the rest of the app to a 최애. Start here if you are picking either up.

## Summary

[screens.md](../reference/screens.md) groups these two because they share the auth session
and the followed artists. [screen-implementation.md](screen-implementation.md) ordered this
slice first; it was built fourth, after Discovery, Capture and Tickets, because its reason for
going first — settling the artist shape — had been met by the Discovery store. What it adds is
the session gate and the follow action that store was waiting for.

Sources, per [design/README.md](../../design/README.md): layout, copy and flow from block `1a`;
colour, type and corners from `2b`. Figma `33:2801` is the 시작화면 that 온보딩 absorbs; 최애 찾기
has no frame.

## Checklist

### 1 — 온보딩 (`app/onboarding.tsx`)

- [x] The landing: the scatter of pins, PINDOM, 최애와 함께한 그 순간을 pin, the line under it,
      시작하기 · Start collecting, 이메일로 로그인, the permission note.
- [x] **시작화면 is absorbed.** `app/login.tsx` is deleted and its `Stack.Screen` with it, as
      screens.md said to do when this screen was built.
- [x] The form is folded in: 시작하기 unfolds it in sign-up mode (email · password · nickname),
      이메일로 로그인 in sign-in mode. The same button submits once the fields are filled.
- [x] After sign-in the **location permission is requested here**, where `1a`'s note says it
      is, rather than on the first screen that needs a distance. `position.ts` carried a TODO
      to that effect.
- [x] Destination follows the flowchart: 최애 찾기 when the account follows nobody, 홈 when
      it does.

### 2 — The session gate (`app/(tabs)/_layout.tsx`)

- [x] The tab layout asks `auth.currentSession()` and `Redirect`s to 온보딩 on null. Every
      tabbed screen assumes a signed-in user; the fixture path signs one in by default, so the
      app still opens on 홈.

### 3 — 최애 찾기 (`app/artist/search.tsx`)

- [x] The route screens.md proposed. ‹ 홈 · 아티스트 찾기, the search field, the note, the roster
      with an initial, a name, `{n}곳` and a 팔로우 / 팔로우 중 chip.
- [x] A follow **selects the artist** in the Discovery store, as `1a` does — the note promises
      홈·지도·응모 re-key to them, and a follow that changed nothing would look like it failed.
- [x] Reached from 온보딩, 홈's 최애 추가 chip, and (when Profile lands) 마이페이지's.

### 4 — What 홈 needed for this to hold

- [x] 홈 **refreshes silently on focus** — `useHomeData` gained `refresh`, a load that does not
      flip the screen to its loader. Without it the chips were the list loaded at mount, and a
      follow made on 최애 찾기 was not on 홈 when the user came back.
- [x] The Discovery store gained `reconcile`: unfollowing the very artist 홈 is keyed to
      dropped the selection onto nobody; it now falls to the first followed artist.

### 5 — Close out

- [x] `yarn typecheck` and `yarn lint` clean.
- [x] [screens.md](../reference/screens.md) — both screens to `built`; `/login` gone.
- [x] [docs/README.md](../README.md) — index this document.

### 6 — The fidelity pass

What the [fidelity checklist](2026-08-23-prototype-fidelity-checklist.md) §4 changed here; the
evidence is the [audit](2026-08-23-prototype-fidelity-audit.md)'s Auth rows.

- [x] 이메일로 로그인 is the design-system `Button`'s new `style="outline"` — transparent, a
      hairline rule, the secondary ink — rather than a tinted block (decision 29).
- [x] The pin scatter is the first 최애's six map pins in a 300 px band 96 px from the top of
      the screen at `.9` opacity — a Korea silhouette, as `1a` draws it.
- [x] Copy gap 18, the buttons 14 below the line, the note 6 below the buttons; the wordmark
      tracks at `.28em` through `wordmark` in `src/features/shared/shape.ts`.
- [x] 최애 찾기 searches behind a sequence counter, so a slow earlier keystroke can never paint
      over a later one, and reads the followed set once on mount and after a follow — not per
      keystroke. Keystrokes wait 150 ms; an emptied field searches at once.
- [x] 최애 찾기 type: note `t7`, `{n}곳` and the chip label `st12`, ‹ 홈 and the initial `st11`.
      No rule above the roster; rows carry only their bottom rule.

## What the device run found

| Found | Fix |
| --- | --- |
| 홈's 최애 추가 chip did nothing after the route file was added | Not a bug: expo-router's route map is built at bundle time, and a new file needs the app reloaded, not hot-refreshed |
| Back on 홈 after a follow, the new chip was missing and the header read 최애의 자리로 | The focus refresh and `reconcile`, above |
| A fresh `refresh` closure per render would have re-fired the focus effect on every render | `reload` and `refresh` are memoised in the hook |

### Copy the prototype does not have

`1a` has no form — both of its buttons go straight home. These are the build's:

| Where | Line |
| --- | --- |
| 온보딩 form placeholders | 이메일 · 비밀번호 · 닉네임 |
| 최애 찾기, no match | 검색 결과가 없어요 |
| 최애 찾기, loading | 아티스트를 불러오는 중 |
| 최애 찾기, the roster failed to load | 아티스트를 불러오지 못했어요 |

## Where the sources disagree

| # | `1a` prototype | Contract / `2b` | Taken | Why |
| --- | --- | --- | --- | --- |
| 1 | Both buttons go home | `auth.signIn` / `signUp` exist, and the flowchart's first edge is 이메일로 로그인 → 최애 찾기 | The form, folded in; the flowchart's destination | screens.md says email sign-in is folded into this screen |
| 2 | The permission note names location **and** camera | — | Location is requested here; the camera asks on 카메라 | A camera prompt on the landing page, before the user has seen a 촬영지, is a prompt most people refuse |
| 3 | A pink-and-cyan radial glow behind the pins, and an 18 px halo on each pin | `2b` | The pins in the accent, no glow of either kind | Colour — fidelity decision 31 confirms the per-pin halo is covered |
| 4 | The artist's avatar is a coloured disc with the initial | `Artist` has `initial`, `accentColor?`, `imageUrl?` | The initial in a hairline disc, acid when followed | Matches 홈's chips |
| 5 | `팔로우하면 홈·지도·응모가 그 아티스트 기준으로 바뜁니다` | — | `바뀝니다` | `바뜁니다` is not a word — a prototype typo, the same class as the `FINDOM` wordmark (fidelity decision 30) |
| 6 | 최애 찾기 scrolls as one page — header, field and note scroll away with the roster | — | Header, `SearchField` and note stay pinned; only the roster scrolls | The field stays reachable with the keyboard up, and the roster is long enough to scroll on its own |
| 7 | A plain input with no clear affordance | `SearchField` ships `hasClearButton` | The × clear button stays | The component's standard affordance; the prototype has nothing against it |

## Still open

- **Sign-out has no screen yet.** The gate's other direction — a signed-in user ending up on
  온보딩 — needs 마이페이지's 로그아웃, which is the Profile slice.
- **Sign-up validation is the server's.** The form enables on non-empty fields only; password
  rules and the 12-character nickname limit (`nameTooLong` in `1a`) are not checked client-side
  beyond `maxLength`.

## Related

- [screens.md](../reference/screens.md) — the slice table these two come from
- [2026-08-22-discovery-slice-checklist.md](2026-08-22-discovery-slice-checklist.md) — the store a follow writes to
- [backend-contract.md](../reference/backend-contract.md) — `users.followedArtistIds`, the create rule
