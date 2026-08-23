---
title: Discovery Slice Checklist
type: plan
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-08-23
audience: internal
---

# Discovery Slice Checklist

> The punch list for the second flow slice: 지도 and 장소/상세 built against the prototype, on the state 홈 already reads. Start here if you are picking the Discovery screens up.

## Summary

[screens.md](../reference/screens.md) groups 홈, 지도 and 장소/상세 into one slice because they
**share state** — the selected 최애, the geo position, and the place list. 홈 landed first as the
golden screen, owning that state privately with its 최애 chips wired to nothing. This slice
finished the other two screens and lifted the shared state to where all three read it.

Sources, per [design/README.md](../../design/README.md): layout, copy and flow from block `1a`;
colour, type and corners from `2b`. The Figma frames (`33:2460`, `33:2381`) were pulled for
cross-reference only — where they disagree with the prototype they are wrong, and three places
they do are recorded under [Where the sources disagree](#where-the-sources-disagree).

## Checklist

### 1 — Shared ground

- [x] `src/features/shared/` — the pieces both built screens and the two new ones need:
      the `2b` shape rules, `SectionHeader`, the block `Rule`, `formatDistance`, and `PlaceList`
      moved out of `src/features/home/`.
- [x] `PlaceList` gains `showState` — 지도 prints 방문 완료 · 티켓 발행됨 under the meta line,
      홈 does not.
- [x] `src/features/discovery/state.ts` — the selected 최애, in one store both 홈 and 지도 write.
- [x] `src/features/discovery/usePosition.ts` — one location permission request per launch,
      cached at module scope, shared by all three screens.
- [x] Rewire 홈's `ArtistChips` `onSelect` to the store. It is a `TODO` no-op today.

### 2 — Config

- [x] `naverMapConfigured` in `app.config.ts` → `extra`, read through `AppConfig`.
      `EXPO_PUBLIC_NAVER_MAP_CLIENT_ID` is empty in this repo, and without it the Naver SDK
      renders an empty grey rectangle with no error.
- [x] 지도 renders a legible stand-in in that case, not a blank map.

### 3 — 지도 (`app/(tabs)/map.tsx`)

- [x] Full-bleed `NaverMapView`, one marker per 촬영지 from `places.listAll`.
- [x] Marker state: verified places in the accent, the rest muted. Verified is derived from
      `tickets.listMine()`, not stored on the place.
- [x] Floating search field over the map, filtering the loaded list by 촬영지 · 작품 · 지역.
- [x] Artist filter chips = the 최애 the user follows, writing the shared selection.
- [x] Bottom panel: `{최애}의 촬영지 {n}` · 거리순, then the place rows.
- [x] Tapping a marker or a row → `/place/[id]`.

### 4 — 장소/상세 (`app/place/[id].tsx`)

- [x] Hero: cover image, back, 최애 and 지역 badges.
- [x] Title block: 이름, roman caption, work line.
- [x] Stats: 방문 인증 · 공개 사진 · 현재 거리, the distance in the accent.
- [x] 공개 사진 갤러리 — three-column grid from `places.gallery`.
- [x] 촬영 팁 — `places.reviews`, with the inline 팁 남기기 form posting through `addReview`.
- [x] 인증 조건 note, radius read from `place.radiusMeters`.
- [x] Fixed CTA `GPS 인증하기` → `/verify/gps?placeId=…`.

### 5 — Close out

- [x] `yarn typecheck` and `yarn lint` clean.
- [x] [screens.md](../reference/screens.md) — 지도 and 장소/상세 to `built`.
- [x] [docs/README.md](../README.md) — index this document.

## What the device run found

Everything below is a defect the diff does not show. The screens were driven on a booted
simulator with an injected coordinate — 강릉 for the near case, 제주 for the far one, which is
also how the 미방문 row was made to sort to the top.

| Found | Fix |
| --- | --- |
| The 인증 완료 stamp wrapped to two lines and spilled off the thumbnail | Thumbnail to `1a`'s own 56px and the stamp to a bar across its foot. Four glyphs do not fit in a corner at a legible size |
| The accent appeared six times on 지도 — section label, distance, three stamps, three state lines | 방문 완료 · 티켓 발행됨 is no longer painted. The stamp already says it in colour, and `2b` spends the acid on section labels and one number |
| 촬영 팁 0 sat above 아직 팁이 없어요 | `SectionHeader` drops a zero count |
| Every 촬영지 read 인증 완료 | A fixture problem, below |
| `yarn lint` had been passing on a stale ESLint cache | Below |
| 공개 사진 갤러리 2 sat under a 공개 사진 962 stat | The gallery header prints no count. `photoCount` is the counter the function increments; `places.gallery` is a page of photos, and the prototype prints `t.gallery` bare. 촬영 팁 keeps `reviews.length` — the contract names `reviewCount` a dead field and says to count the loaded list |

### What the second run confirmed

- **The 촬영 팁 composer, end to end.** Typing enables 등록, a tag chip selects, posting bumps the
  header 2 → 3 and prepends the tip as `도민 · 10장 클럽 · 방금` with its tag. The scroll-view swipe
  in the runtime snapshot reaches UIScrollView where synthetic drag events did not.
- **The shared 최애 store, both directions.** 에코라인 on 지도 re-keys the panel to 에코라인의 촬영지 1;
  홈 then opens on 에코라인의 자리로, 보유 티켓 · 에코라인 1곳, 에코라인 지역 코스 with its empty state.
  루미나 on 홈 sends 지도 back to 루미나의 촬영지 5 — the same accessibility tree, hash for hash, as a
  fresh launch.
- **A second pass against `33:2460` and `33:2381`** after the build found nothing beyond the three
  disagreements below. The sheet grip in `33:2460` is the one `1a` also draws, and
  `NearbyPanel` records why `2b` drops it with the radius.

### Two problems that were not in this slice

- **The fixtures made half of 지도 unreachable.** The demo user held a ticket at all five
  촬영지, so 미방문 · 인증 가능, the muted pin, and 장소/상세's empty 갤러리 and 촬영 팁 could not
  be rendered at all. `place-hyeopjae` was added with every counter at zero and no ticket
  against it. A screen state nobody can reach is a screen state nobody checks. 에코라인's
  `placeCount` also read 2 against one 촬영지, and 홈 prints that number.
- **`yarn lint` was green only because of its cache.** `src/design-system/index.ts` re-exports
  both `./tokens` and `./foundation` with `export *`, and `foundation/typography.ts` passed
  `FONT_FAMILY` through from the token layer — so the barrel carried the name twice and
  `import/export` failed. The cache had never re-linted the file. The pass-through is gone and
  `Txt` imports the constant from the token layer directly.

## Where the sources disagree

Three, all resolved by the two-axis rule.

| # | `1a` prototype | Figma `33:2460` / `33:2381` | Taken | Why |
| --- | --- | --- | --- | --- |
| 1 | Map filter chips are the **followed 최애** | Filter chips are **작품 종류** — 전체 / MV / 드라마 / 자체 콘텐츠 | Prototype | Which entity a filter filters on is flow, and flow is `1a`'s axis. It also matches 홈, which is keyed to one 최애 at a time |
| 2 | Search placeholder 아티스트 · 촬영지 · 지역 검색 | 촬영지 · 작품 · 지역 검색 | Prototype | Copy is `1a`'s axis, and Korean UI copy is final |
| 3 | Hero badges are **최애 name** + 지역 | `MV 촬영지` + 지역 | Prototype | Same axis. The work kind is already in the line under the title |

The Figma frames also predate the 촬영 팁 section entirely — `33:2381` ends at 인증 조건. That is
the growth [screens.md](../reference/screens.md) records, not a disagreement.

## What the prototype asks for and the contract cannot serve

Recorded rather than invented, per `CLAUDE.md`: field names come from
[backend-contract.md](../reference/backend-contract.md).

| Prototype | Problem | Built as |
| --- | --- | --- |
| Review badge 인증 방문 | No field says the review's author verified *this* place. The review document carries `authorTier` and the contract calls it "rendered as a badge" | The tier badge, in the prototype's own tier copy — 10장 클럽 / 20장 클럽 / 수집 중 |
| 도움됐어요 N, tappable | `reviews.likeCount` is **function-only** and no repository method writes it | The count, rendered as a static figure. It becomes a control when a function backs it |
| Gallery gated on `placeVisited` | The flag is hardcoded `true` in the prototype, so the gate is never exercised, and the contract describes the gallery as public photos at the place with no viewer condition | Shown whenever there are photos |
| Distance always present | There may be no fix — refused permission, or none yet | Hidden, as on 홈. An unknown distance is not a distance of zero |
| Short names — chips read `a.short` (`BTS`, `리센느`), pin captions `p.short` (`강릉`) | Neither `Artist.shortName` nor `Place.shortRegion` is in the contract | Chips print `artist.name`; pin captions print `place.region` (fidelity decision 11). Both fields are an ask for the backend developer; when they land, `shortName ?? name` in `ArtistChips` and `MapFilters`, `shortRegion ?? region` in `MapPin` |

### Copy the prototype does not have

`1a` reaches no loading, error or empty state on these three screens — its fixtures are never
empty, and `촬영 팁 0` is the only "empty" it draws. These lines are the build's, and need the
designer's word (fidelity audit D-23):

| Where | Line |
| --- | --- |
| 홈 · 지도 · 장소/상세, loading | 촬영지를 불러오는 중 |
| 홈, failed | 홈을 불러오지 못했어요 |
| 지도, failed | 지도를 불러오지 못했어요 |
| 장소/상세, failed | 촬영지를 불러오지 못했어요 |
| 홈, no 최애 selected | 최애의 자리로 |
| 홈, 마감 임박 응모 empty | 지금 진행 중인 응모가 없어요 |
| 홈, 지역 코스 empty | 아직 준비된 코스가 없어요 |
| 지도, search finds nothing | 검색과 맞는 촬영지가 없어요 |
| 지도, 최애 has no 촬영지 | 아직 등록된 촬영지가 없어요 |
| 장소/상세, 촬영 팁 empty | 아직 팁이 없어요. 첫 번째로 남겨보세요. |
| 지도, built without a client id — one line at the foot of the stand-in | 네이버 지도 클라이언트 ID 없이 빌드됐습니다 · EXPO_PUBLIC_NAVER_MAP_CLIENT_ID |

## Still open

- **지도 has never rendered a real tile.** `EXPO_PUBLIC_NAVER_MAP_CLIENT_ID` is unset, so every
  run so far has drawn the stand-in. The `MapPin` marker child, its `isHidden` reveal after the
  drop, the `mapPadding` inset and the country-frame camera are written against the SDK's
  documented props and remain unverified. Set the key and look.
- **The stand-in is now a map, not a notice.** Since the fidelity pass it draws every pin at its
  normalised coordinate and plays `1a`'s `pinDrop` on entry and on a 최애 switch; pins are
  `src/features/discovery/MapPin.tsx`, promoted to the design system when a third screen draws
  one (fidelity decision 8).
- **Buttons are still pills.** `Button` hardcodes its radius, which is change 4 in
  [design-tokens.md](../reference/design-tokens.md) — not started, and per-component. 지도 and
  장소/상세 inherit the same gap 홈 has.
- **`TextField` renders light-mode ink.** It hardcodes `SdsColors.grey900`, so 촬영 팁's composer
  is a raw `TextInput` instead. One of the twenty components that document lists.

## Related

- [screens.md](../reference/screens.md) — the slice table these three screens come from
- [design/README.md](../../design/README.md) — the prototype, and the two-axis rule
- [2026-08-22-phase-2-3-checklist.md](2026-08-22-phase-2-3-checklist.md) — the run that put 홈 on the device
- [backend-contract.md](../reference/backend-contract.md) — `places`, `reviews`, `gallery`
