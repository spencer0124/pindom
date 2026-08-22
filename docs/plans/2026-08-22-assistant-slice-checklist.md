---
title: Assistant Slice Checklist
type: plan
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-08-22
audience: internal
---

# Assistant Slice Checklist

> The punch list for Pindom AI and 추천 코스 — built against a canned fixture because the function behind them does not exist yet, and the only slice that ends with a request to the backend developer rather than a screen. Start here if you are picking either up, or writing the function.

## Summary

[screens.md](../reference/screens.md) groups these two because they share the selected 최애,
the conversation, and the course an answer produced. [screen-implementation.md](screen-implementation.md)
put the slice last for the reason that still holds: the answers are a backend capability that
is not in [backend-contract.md](../reference/backend-contract.md). The screens are buildable
against fixtures, and were.

Sources, per [design/README.md](../../design/README.md): layout, copy and flow from block `1a`
(the 2026-08-20 drop, which added both screens); colour, type and corners from `2b`. Neither has
a Figma frame.

## Checklist

### 1 — Repository ground

- [x] `AssistantRepository.ask(input)` on the interface, with `AssistantAsk` / `AssistantReply`
      in the domain. The fixture answers from the four chips' own words; the Firebase
      implementation calls `askAssistant` and fails as `not-found` until it exists.
- [x] **Nothing in this repo calls a model API.** The screen holds no key, builds no prompt and
      names no provider, per [external-apis.md](../reference/external-apis.md) §6 and the note
      in screens.md. The prototype's own `window.claude.complete` is scaffolding, and was not
      ported.

### 2 — Pindom AI (`app/chat.tsx`)

- [x] ‹ · Pindom AI · ⋯; the empty state — PINDOM AI, 무엇을 도와드릴까요?, the four chips — the
      transcript, the 지도에서 코스 보기 card, 답변을 찾고 있어요, the composer.
- [x] The chips ask `1a`'s own questions, phrased for the selected 최애 and their nearest 촬영지.
- [x] The ⋯ menu: 초기화 · 답변 언어 바꾸기 (→ 언어) · 답변 신고하기. The last closes the menu, as
      `1a`'s does; its flow is the backend's.
- [x] The transcript survives leaving the chat — closing from the FAB and reopening does not
      lose the route that was drawn. It is not persisted across launches.
- [x] A failed ask is rendered in the transcript as an answer the assistant could not get.

### 3 — 추천 코스 (`app/course.tsx`)

- [x] ‹ · `{최애} 성지순례 코스` · `n곳 · {course name}`; the map with the stops as pins; the
      description; the stops in walk order with `↓ next`.
- [x] The map is 지도's own `MapCanvas` with the course's stops as its places — one map, not two.
- [x] Reached from the chat's card and from 홈's 지역 코스 cards, which now carry the `courseId`
      they lacked. design/README.md's open question 5 asked whether 코스 should be reachable
      from anywhere but the assistant; 홈 already was, and now opens the right one.

### 4 — The floating button

- [x] `AssistantFab` is mounted once over the tab navigator, so it sits in the same place on all
      five tabbed screens — the only way into `chat`, as the 2026-08-20 drop specified.

### 5 — Close out

- [x] `yarn typecheck` and `yarn lint` clean.
- [x] [screens.md](../reference/screens.md) — both screens to `built`; the routes no longer proposed.
- [x] [docs/README.md](../README.md) — index this document.

## What the backend needs to provide

The client is written against this. Names are proposals until
[backend-contract.md](../reference/backend-contract.md) records them.

```ts
// callable: askAssistant
// request
{
  message: string;
  history: { role: 'user' | 'assistant'; text: string }[];   // recent turns, oldest first
  artistId?: string;                                        // the 최애 the conversation is keyed to
}

// response
{
  text: string;        // plain text, no markdown — a list is lines starting with "· "
  courseId?: string;   // when the answer drew a route: a `courses` document the client can read
}
```

A route answer that produces a course should write it as a `courses` document for the
artist so 홈's 지역 코스 block and 추천 코스 read the same thing. The legs the prototype
annotates (travel time, shooting window, nearby food) are the route and local APIs' figures —
if they are to be shown, they belong on that document, not on the reply.

## What the device run found

| Found | Fix |
| --- | --- |
| `courses` has no `getById` | 추천 코스 reads the artist's list (the selected 최애 first, then the followed) and finds the id. A `getById` would be cleaner; recorded rather than added to the contract from here |

### Copy the prototype does not have

| Where | Line |
| --- | --- |
| Pindom AI, the send button | 보내기 — `1a` uses an icon |
| Pindom AI, the chips' fallbacks when no 최애 is followed | 최애 · 촬영지 in place of names |

## Where the sources disagree

| # | `1a` prototype | Contract / `2b` | Taken | Why |
| --- | --- | --- | --- | --- |
| 1 | Each leg carries 자동차 n분 이동 · 촬영 추천 07:00–08:30 · 근처 해장국·카페 3곳, and a 길안내 button | `courses` is an ordered `placeIds` and a description; the legs' figures are the route and local APIs', which the backend calls | The stops, in order, with the artist and region; no figures, no 길안내, no note about how they were computed | Numbers the client does not have are not drawn |
| 2 | The header prints `n곳 · 이동 h시간 m분` | No travel time | `n곳 · {course name}` | Same |
| 3 | The chips and the menu use icons | — | Text | `2b` spends nothing on ornament |
| 4 | The empty state has the Pindom AI glyph | — | The wordmark in the accent | |

## Still open

- **No function exists.** The fixture answers four questions; the Firebase path fails until
  `askAssistant` is deployed. The shape above is what the client sends.
- **답변 신고하기 goes nowhere.** The flow is the backend's; the row closes the menu.
- **The map has still never drawn a tile.** Same as 지도 — `EXPO_PUBLIC_NAVER_MAP_CLIENT_ID`.

## Related

- [screens.md](../reference/screens.md) — the slice table these two come from
- [external-apis.md](../reference/external-apis.md) — the handover that names the assistant as the backend's
- [backend-contract.md](../reference/backend-contract.md) — `courses`, and where `askAssistant` should land
