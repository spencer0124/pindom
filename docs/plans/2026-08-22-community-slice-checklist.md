---
title: Community Slice Checklist
type: plan
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-08-26
audience: internal
---

# Community Slice Checklist

> The punch list for 커뮤니티 and 글쓰기 — per-최애 boards, a paged feed, and a post with a pin. Start here if you are picking either up.

## Summary

[screens.md](../reference/screens.md) groups these two because they share the board, the
feed page and the draft. The board is the 최애 — the contract made the feed per artist after
the Figma frames were drawn — and it travels to 글쓰기 as a route param, because a post always
belongs to one.

Sources, per [design/README.md](../../design/README.md): layout, copy and flow from block `1a`;
colour, type and corners from `2b`. Figma `33:1717`, `33:2922` and `33:1686` are the earlier
frames.

## Checklist

### 1 — 커뮤니티 (`app/(tabs)/community.tsx`)

- [x] 커뮤니티 · 글쓰기, the board chips, the `{최애} 게시판 · 멤버 n` block, the feed.
- [x] The board opens on the 최애 Discovery has selected; the chips switch it; a board that is
      no longer followed is never sat on.
- [x] A post row: avatar, nickname, time, the tier badge; the body; the pin with 지도에서 보기
      when the post carries a `placeId`; `♡ n` and `답글 n`.
- [x] The feed **pages on `cursor`** — `onEndReached` asks for the next page — and re-reads
      silently on focus, so a post made on 글쓰기 is at the top when the user comes back.

### 2 — 글쓰기 (`app/post/write.tsx`)

- [x] 취소 · 글쓰기 · 등록, the composer, the pin toggle, the note.
- [x] The pin attaches the most recently verified 촬영지 — the newest ticket — and the post
      carries its `placeId` and `ticketId`. The screen **opens with the pin on**, as `1a` does;
      it stays off only when there is no ticket, and then the toggle says so.
- [x] 등록 creates the post on the board that opened the screen, then goes back.

### 3 — Shared ground

- [x] `tierLabel` moves out of 촬영 팁's `ReviewList` into `src/features/shared/` — one author
      wears one badge on a tip and on a post.

### 4 — Close out

- [x] `yarn typecheck` and `yarn lint` clean.
- [x] [screens.md](../reference/screens.md) — both screens to `built`.
- [x] [docs/README.md](../README.md) — index this document.

## What the device run found

| Found | Fix |
| --- | --- |
| `useMemo(() => new Date(), [state])` to age the posts tripped `exhaustive-deps` | The instant is stamped by the feed hook when a page lands (`loadedAt`) — the honest place for it |

### Copy the prototype does not have

| Where | Line |
| --- | --- |
| 커뮤니티, the pinned first chip | 자유게시판 |
| 커뮤니티, no board followed | 팔로우한 최애의 게시판이 여기 열려요 |
| 커뮤니티, empty board | 아직 글이 없어요 |
| 커뮤니티, first load | 피드를 불러오는 중 |
| 커뮤니티, load failed | 피드를 불러오지 못했어요 |
| 글쓰기, no ticket to pin | 인증한 촬영지가 아직 없어요 |
| 글쓰기, no board in the route | 게시판을 찾을 수 없어요. |

## Where the sources disagree

| # | `1a` prototype | Contract / `2b` | Taken | Why |
| --- | --- | --- | --- | --- |
| 1 | A 전체 chip before the boards | `posts.feed(boardId)` — per board, **never global**; the wrong id silently shows another fandom | No 전체. **자유게시판 takes that slot instead** (2026-08-26) | A 전체 feed would have to fan out across boards and merge by time on the client. Left off rather than faked. 자유게시판 is one more board id, not a merge, so the feed, 글쓰기 and the repository all work unchanged — see the two rows at the end of this table |
| 2 | Rows are text, a pin and counts | `posts.imageUrls` — the feed is 인증샷 자랑 | `1a`'s row; no photo | Layout is `1a`'s axis. The field is there for the day the row grows a photo |
| 3 | The tier badge is pink on pink | `2b` | An acid hairline | Colour |
| 4 | `♡ n` | Nothing in the contract writes `likeCount` from the client | A figure, not a control | Same as 촬영 팁's 도움됐어요 |
| 5 | The title, chips and board block scroll with the feed (the root is `overflow-y:auto`) | — | Title, chips and board block stay pinned; only the feed scrolls | The title row doubles as the nav bar and the chips are the screen's primary control; the prototype's posts container clips rather than scrolls, so its one-page scroll is an artefact as much as an intent. Fidelity audit C-06 |
| 6 | 등록 is always enabled and an empty draft posts fixture filler; no `autoFocus`; no inline error | — | 등록 is disabled until the draft has text; the composer takes focus on open; a repository failure prints under the toggle | The always-on 등록 exists to demo the feed. An empty post is not a post. Fidelity audit C-10 |
| 7 | The pin block on a row is inert; 지도에서 보기 is a caption | — | The block opens 장소/상세 | The detail has the map hero and 길찾기, which is what "see on the map" promises; the 지도 tab has no focused-place state to land on. Fidelity decision 23 |
| 8 | 1a has no board that is not a 최애 | The contract calls `boardId` an `artists/{artistId}` | **자유게시판**, a reserved `boardId` of `board-free` with no `artists` document | Someone who follows nobody had an empty 커뮤니티. The deployed rules never validate `boardId` on create, reads are open to any signed-in user, and the deployed index is already `boardId + createdAt` — so this cost **zero backend work**. A separate collection would have needed a rules deploy; the ruleset ends in a catch-all deny. Verified against the live project 2026-08-26 |
| 9 | — | 커뮤니티 opened on the 최애 Discovery had selected (fidelity audit C-03) | **커뮤니티 opens on 자유게시판**; the Discovery link is retired | `boardId` now starts on a board that is always present, so the effect returns before it can read `selectedArtistId`. The trade buys a 커뮤니티 that is never empty. To restore it, the initial state becomes `selectedArtistId ?? FREE_BOARD.id` — one line in `app/(tabs)/community.tsx` |

## Still open

- **자유게시판 has no board header.** `BoardHeader` renders `{최애} 게시판 · 촬영지 n곳` from an
  `Artist`, and 자유게시판 is not one, so the block is hidden there — the same thing `1a` does
  on its 전체 chip. The selected chip is the only label. A one-line alternative is a fixed
  header for it; nobody has asked yet.
- **Posts have no detail screen.** `posts.getById` exists and a row's 답글 n goes nowhere; the
  prototype has no post screen either.
- **The photo field is unrendered** (disagreement 2). When the row grows a photo, the upload
  goes through the same Storage path rule as tickets — `posts/{uid}/…`.

## Related

- [Prototype fidelity checklist](2026-08-23-prototype-fidelity-checklist.md) — the 2026-08-23 pass
  that made the chips cross-fade, opened 글쓰기 pinned, and reloaded the boards on focus
- [screens.md](../reference/screens.md) — the slice table these two come from
- [backend-contract.md](../reference/backend-contract.md) — `posts`, the per-board feed, the Storage path
