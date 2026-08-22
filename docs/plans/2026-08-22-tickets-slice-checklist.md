---
title: Tickets & Raffle Slice Checklist
type: plan
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-08-22
audience: internal
---

# Tickets & Raffle Slice Checklist

> The punch list for 컬렉션 → 응모 → 티켓 절취 → 응모완료, built against the prototype on the ticket Capture mints, and walked on a simulator. Start here if you are picking one of these four up.

## Summary

[screens.md](../reference/screens.md) groups these four into one slice because they share the
ticket balance, the tier, and `raffleId`. Only `raffleId` travels as a route param — 홈's
마감 임박 cards and 컬렉션's button both arrive with one — and the rest lives in
`src/features/tickets/state.ts`: the chosen raffle, the ticket being torn, the idempotency key
and the entry.

Sources, per [design/README.md](../../design/README.md): layout, copy and flow from block `1a`,
the ticket from `1c`-A's layout on `2b`'s surface (decided in the
[Capture checklist](2026-08-22-capture-slice-checklist.md)); colour, type and corners from
`2b`. The Figma frames (`33:1961`, `33:1871`, `33:1830`) predate the tear entirely; 티켓 절취 has
no frame.

## Checklist

### 1 — Shared ground

- [x] `TicketCard` gains `size="tile"` — 컬렉션's grid cell is the same object at a quarter of
      the area, so a ticket looks like itself everywhere. The stub width is exported; 티켓 절취
      tears along it.
- [x] `src/features/tickets/state.ts` — the raffle, the ticket to tear, the key, the entry.
      The key is minted **once, when 응모 opens**, and kept when 응모 reopens on the same raffle:
      that is the retry the key exists for.
- [x] `tier.ts` — 1a's three tier lines and the gauge, read from `ticketsIssued`.

### 2 — 컬렉션 (`app/(tabs)/tickets.tsx`)

- [x] 보유 티켓 · n장, 응모하러 가기, the tier gauge with its two marks, the two-column grid.
- [x] 응모하러 가기 needs a raffle, because 응모 is keyed to one: it opens the soonest-closing
      open raffle and is not offered when none is.
- [x] Spent tickets keep their place in the grid, the stub reading USED.

### 3 — 응모 (`app/raffle/[id].tsx`)

- [x] ‹ 컬렉션 · 응모 · the balance, the reward rows, the selected reward's summary, the CTA,
      취소하고 컬렉션으로.
- [x] Every open raffle is listed with the one in the URL selected; the first stands in when
      that one has closed since the link was made.
- [x] A row the balance cannot cover is dimmed with `{n}장 필요`, and the CTA reads
      `{n}장을 모아야 응모할 수 있어요` and does not submit. The check that counts is the server's.

### 4 — 티켓 절취 (`app/raffle/tear.tsx`)

- [x] The route screens.md proposed. ‹ 응모 · the reward, the ticket as two halves, the title
      and hint at 1a's thresholds, the progress bar, 한 번에 뜯기.
- [x] The drag is the whole screen; progress is distance over the card's height. Release
      before 82% heals the ticket, after finishes it.
- [x] The ticket under the finger is the **oldest unspent one** — what the server spends first.
- [x] One `enterRaffle` at the end of the tear, with the key 응모 minted. `insufficient_tickets`
      heals the ticket and goes back to 컬렉션 (the flowchart's No edge); any other failure
      heals it and says why.

### 5 — 응모완료 (`app/raffle/done.tsx`)

- [x] The torn halves held apart with the stub reading USED, the 응모 완료 stamp,
      응모가 확정됐어요, the entry number and the balance, 커뮤니티에 자랑하기 / 컬렉션으로.
- [x] The entry number is the server's entry id; the balance is read back, not computed.

### 6 — Close out

- [x] `yarn typecheck` and `yarn lint` clean.
- [x] [screens.md](../reference/screens.md) — the four screens to `built`; `tear` is no longer
      proposed.
- [x] [docs/README.md](../README.md) — index this document.

## What the device run found

| Found | Fix |
| --- | --- |
| The odd last tile stretched to the full width | `flexGrow` gone; a cell is a cell |
| PINDOM TICKET wrapped inside a tile | Tighter tracking at tile size, one line |
| On 티켓 절취 the serial ran into the stub | The stamp row wraps, and the card is no longer capped at 1a's 300px |
| At full tear the panel swung off the left edge | The card leaves `TEAR_SWING` on either side — the 9° rotation about the perforation's foot carries the far corner outward |
| Reanimated warned that a layout animation would overwrite the stamp's `rotate` | The entering animation and the tilt are on different views |

### Copy the prototype does not have

| Where | Line |
| --- | --- |
| 컬렉션, no tickets yet | 아직 발행한 티켓이 없어요 |
| 응모, no open raffle | 진행 중인 응모가 없어요 |

## Where the sources disagree

| # | `1a` prototype | Contract / `2b` | Taken | Why |
| --- | --- | --- | --- | --- |
| 1 | The tier gauge is marked at 10 and 20 and reads the balance | `tier` is `club10` 0–19 · `club20` 20–29 · `clubGo` 30+, recomputed from **`ticketsIssued`** — issued count, never balance | 1a's marks and copy, read from `ticketsIssued` | The copy names 10 and 20, and copy is 1a's; the source of the number is the contract's, and a balance-driven gauge would drop every time a raffle is entered. The thresholds disagree and the designer should know |
| 2 | Rewards are gated on a tier minimum **and** a cost, with `{n}장 필요` for the minimum | `raffles` has `ticketCost` only; the only refusal is `insufficient_tickets` | The cost is the gate, and `{n}장 필요` names the cost | There is no minimum to compare against |
| 3 | Each reward has a glyph tile and a 구간 · 추첨 line | No field for either | Title and `prizeDescription` | Recorded, not invented |
| 4 | 응모완료 names a fixed draw date, 8월 30일 | No draw date on `raffles` | The raffle's `closesAt` | The closest real date; a draw date belongs on the document if the line is to be exact |
| 5 | The tear line has zig-zag teeth; the halves carry a hologram | Polygon clipping is not in React Native; colour is 2b's | The dashed perforation and the print surface | |
| 6 | Every tile has a hologram kind — RAINBOW · BASIC · GALAXY | `2b` | Not drawn | Colour, and 2b has one surface |

## Still open

- **The server's `insufficient_tickets` path is unexercised.** The CTA does not submit when the
  balance is short, so the only way to see it is a balance that moves underneath an open
  응모 — which the fixtures cannot stage.
- **The tile truncates the serial** to its first two groups. The full serial is on the ticket
  itself; a tile that showed the last group instead would identify a ticket better.
- **컬렉션 has no 보관함 entry.** Private tickets are reached from 마이페이지, which is the
  Profile slice.

## Related

- [screens.md](../reference/screens.md) — the slice table these four come from
- [2026-08-22-capture-slice-checklist.md](2026-08-22-capture-slice-checklist.md) — where the ticket and `TicketCard` come from
- [backend-contract.md](../reference/backend-contract.md) — `raffles`, `raffleEntries`, `enterRaffle`, the idempotency key
