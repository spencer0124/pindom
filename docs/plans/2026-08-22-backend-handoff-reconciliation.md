---
title: 2026-08-22 Backend Handoff Reconciliation
type: plan
status: draft
owner: zoyoong124@gmail.com
last-updated: 2026-08-22
audience: internal
---

# 2026-08-22 — Backend Handoff Reconciliation

> The backend developer built and deployed everything this repo's contract described. Six things came back different from what the contract said. This page records each one, what the contract now says instead, and what the app still owes. Read it before switching off fixtures.

## Summary

The previous round, [2026-08-21](2026-08-21-backend-contract-review-resolutions.md), was an
argument about a document. This round is not — rules, three Cloud Functions, five composite
indexes, a TTL policy and seed data are running on `pindom-1234`, and the backend developer
reports no work in flight.

That changes who wins a disagreement. A contract clause the deployed system contradicts is not
a requirement the backend owes; it is a stale line in this repo. So every divergence below was
resolved **in favour of the deployed behaviour**, and
[`backend-contract.md`](../reference/backend-contract.md) has been corrected to match.

Two exceptions, both flagged in [Still owed](#still-owed): one is a real capability the product
wanted and the deployment cannot provide, and one is a product decision the backend is waiting
on rather than a divergence.

> [!NOTE]
> The backend's own account of how it got here is
> [`2026-08-22-worklog.md`](https://github.com/spencer0124/pindom-server/blob/main/docs/2026-08-22-worklog.md),
> and the integration brief it wrote for this repo is
> [`2026-08-22-app-handoff.md`](https://github.com/spencer0124/pindom-server/blob/main/docs/2026-08-22-app-handoff.md).
> Neither is vendored here — they live in the repo that owns the code they describe, per
> [ADR 0005](../decisions/0005-keep-firebase-behind-a-repository-boundary.md).

## What is deployed

| Item | State |
| --- | --- |
| Firestore rules · Storage rules | Deployed |
| `verifyLocation` · `issueTicket` · `enterRaffle` | Deployed to `asia-northeast3`, 2nd gen, `maxInstances: 10`, `minInstances: 0` |
| Composite indexes | 5 |
| `verificationSessions` TTL | Active on `expiresAt`, 24 h |
| Seed | 최애 3 · 촬영지 5 · 코스 2 · 응모 4. **All counters `0`**; `posts` not seeded |

## The six corrections

Each row is now written into [`backend-contract.md`](../reference/backend-contract.md). None of
them blocks the app; all six were documentation defects rather than behaviour defects.

### 1. `users` update takes six fields, not two

The review round proposed a rule allowing `nickname` and `avatarUrl`. The contract's table
already said all six, this repo said so during the review, and the backend deployed six. Had two
shipped, 프로필 편집, 언어 and 최애 찾기 would all have failed with `permission-denied`.

Nothing to change — this is the one divergence that was caught before it was deployed, which is
the whole reason the contract is written down.

### 2. Reading another user's document is closed

**Contract said:** `nickname`, `avatarUrl` and `tier` of others are readable.
**Deployed:** no other-user reads at all.

Firestore cannot grant a subset of fields. `allow get` opens the document, and the document
carries `email`. The backend chose the whole document or none of it, and picked none — correctly,
because nothing reads it: there is no other-user profile screen in the prototype, and the feed
and 리뷰 carry denormalised author fields precisely so that a second read is never needed.

The contract now says own-document-only, and records `userProfiles/{uid}` as the shape to add if
a public profile screen is ever designed.

### 3. 리뷰 lost its one-per-place guarantee

**Contract said:** one review per user per place, and the open question "can a user review a
place they have not verified?" was answered *no*.
**Deployed:** neither is enforced. A user can review a 촬영지 they have never been to, repeatedly.

This one is the app's doing, not the backend's. `addReview` writes with `addDoc` — a generated
document id — and sends no `ticketId`. Rules cannot run a query; they can only read a document
whose id they can construct. With no ticket reference anywhere on the review, there is no
expression that can ask whether this user has ever verified here. The check is not weak, it is
unwritable.

The backend first wrote the rule that would have enforced it, then reverted rather than silently
requiring an app change, and left the path stubbed in `firestore.rules`. Reviving it costs one
app edit and two rules lines — see [Still owed](#still-owed).

### 4. `posts` carries `boardId` and `authorTier`

**Contract said:** neither field exists.
**Deployed:** rules accept both, because the app writes both.

The app is right and the contract table was incomplete. 커뮤니티 is per artist board, never
global, so `boardId` is load-bearing on every feed query, and `authorTier` renders the badge on
every card. Both are now in the schema table.

### 5. `places.reviewCount` is a dead field

**Contract said:** Function-only, denormalised for the 리뷰 header.
**Deployed:** nothing writes it. Reviews are client-written and no function touches them.

It is seeded at `0` and stays `0` forever. No screen reads it today, so nothing is broken — but a
number that is always zero is worse than an absent field, because the first person to render it
will believe it. The contract now marks it dead and points 리뷰 at the length of the list it has
already loaded.

### 6. `enterRaffle` returns four fields

**Contract said:** `{ entryId, ticketBalance }`.
**Deployed:** `{ entryId, ticketBalance, ticketIds, ticketsSpent }`.

The two extra fields exist because the app was already reading them — `src/lib/repositories/firebase.ts`
builds a `RaffleEntry` out of `entryId`, `ticketIds` and `ticketsSpent`, so the function was
written to satisfy the code rather than the table. 응모완료 names the tickets it consumed rather
than showing a count, which is why they are needed.

**The app reads three of the four, not all four.** `ticketBalance` comes back and is dropped —
`RaffleEntry` has no field for it — so 응모완료 cannot show the new balance without a second read
of `users`. That is the same defect as `issueTicket`'s discarded `tier` one row over, and both are
in [Still owed](#still-owed).

`issueTicket` returning `tier` was never a divergence in behaviour, only in notation: the
contract's prose demanded it and its response block omitted it. Both blocks are now correct.

## Four blanks the backend filled

The contract left these unspecified. All four are constants inside the deployed functions, so
changing any of them costs one redeploy.

| Item | Value | Why that value |
| --- | --- | --- |
| Tier thresholds | `club10` 0–19 · `club20` 20–29 · `clubGo` 30+, on `ticketsIssued`, **global** | Band width 10 read off the prototype's `TIER 10—19`. Issued count and not balance, because a balance-derived tier demotes the user every time they enter a raffle |
| Grant lifetime | 10 minutes | The value the app's own `mock.ts` was already using |
| `capturedAt` tolerance | Server time ±5 minutes | New gate, see below |
| Raffle debit order | Oldest ticket first | No rule existed; oldest-first is friendlier and needs no UI explanation |

### The new gate: `capturedAt`

`verifyLocation` now **throws `invalid-argument`** when `capturedAt` is more than five minutes
from server time. This is the only addition that can fail a call the contract said would succeed,
so it is worth understanding rather than just obeying.

`capturedAt` is a client value and it is the denominator of every speed calculation. Backdate it
and any movement looks slow, which disables the in-session and last-ticket speed gates at once —
the two checks that carry the whole anti-spoofing story on iOS, where there is no mock-location
API and App Check is out of the initial release. Five minutes rather than seconds because device
clocks drift for ordinary reasons.

It throws rather than rejecting because it is not a verdict about location. 인증 실패 renders a
distance table, and a malformed reading has nothing to put in it.

The app satisfies this today: `submitReading` sends the reading as soon as it is measured. The
flow that would break it is capturing a reading and re-sending it later — do not build one.

## What the app already satisfies

Checked against the deployed rules while writing this page, so that nobody re-audits it:

- **Sign-up** writes `users/{uid}` at the caller's uid, three counters at literal `0`, no `tier`,
  `createdAt: serverTimestamp()` — `src/lib/repositories/firebase.ts`
- **Profile writes stay inside the six fields.** `updateProfile` takes four of them, `setLocale`
  writes `locale` alone, and `follow`/`unfollow` touch `followedArtistIds` alone via
  `arrayUnion`/`arrayRemove`. No write carries a stray `updatedAt`
- **Ticket lists** always carry `where('userId', '==', uid)` — `listTicketsByVisibility`
- **Posts and reviews** read the author's own `users` document and copy `nickname` and `tier`
  from it, and stamp `createdAt` with `serverTimestamp()`
- **A missing `tier`** reads as `club10` in `toUser`, `toPost` and `toReview`, which is the same
  default the deployed rules apply
- **`enterRaffle`** takes a caller-supplied idempotency key rather than minting one per call

## Still owed

Nothing here blocks the switch to live data.

### By the app

- [ ] **Stop discarding what the two callables return.** `tickets.issue` throws away the
      response's `tier` and re-reads the ticket document; `raffles.enter` throws away
      `ticketBalance`. 티켓 발행 needs the tier for its progress line and 응모완료 needs the
      balance, and both currently cost a second read of `users` to recover something the server
      already sent. This is an interface change, not a one-line fix: `TicketRepository.issue`
      returns `Result<Ticket>` and `Ticket` carries neither field, so
      `src/lib/repositories/types.ts`, `firebase.ts` and `mock.ts` all move together
- [ ] **Give GPS인증 a loading state that survives a cold start.** 2–4 seconds on the first call
      of a session, until `verifyLocation` gets a warm instance before launch. The screen is a
      skeleton today, so this is a build requirement rather than a fix
- [ ] **Handle `invalid-argument` on a verification distinctly.** It means a skewed device clock,
      not a failed verification, and 인증 실패 has no distance table to render for it
- [ ] **Re-encode before upload** on both photo paths when 편집 is built — that is what strips
      EXIF, and it is also what keeps the file under the 10 MB Storage cap
- [ ] **Decide whether 리뷰 needs the visit requirement.** If yes, `addReview` writes at document
      id `ticketId` and sends `ticketId` as a field; `NewReview` in `src/lib/domain/review.ts`
      gains it, and the rules the backend stubbed do the rest. If no, delete the proposal from
      the contract rather than leaving it as an unfulfilled intention

### By the backend, on this repo's word

- [ ] **Confirm `clubGo` at 30.** `club10` and `club20` were read off a real prototype label;
      30 was extrapolated to keep the band width consistent and has no evidence behind it. One
      constant, one redeploy — but it should be decided before anyone reaches 30 tickets
- [ ] **Confirm which seeded fields became `{ ko, en }` maps.** The seed converted strings to
      localized maps, and the contract types several of them as plain `string`: `raffles.title`,
      `raffles.prizeDescription`, `places.address`, `places.roman`. The app's `str()` accessor
      returns `''` for a map and warns only in development, so a mismatch here renders a **blank
      응모 title** rather than an error. Either the seed or the contract has to move; verify
      before trusting a live 응모 screen
- [ ] **Confirm which locale `issueTicket` copies into `tickets.placeName`.** Same question one
      step removed: `tickets.placeName` and `posts.placeName` are both typed `string` and both are
      denormalised copies of `places.name`, which *is* a map. A map written into either blanks the
      place name on 티켓 발행 and 컬렉션
- [ ] **Confirm the last-ticket speed check keys off the first *measurement*, not the first
      *accepted* one.** Only accuracy-rejected readings are excluded from `readings`, so an
      `out_of_radius` ping still lands in the array. If the check runs when `readings` is empty,
      one deliberate out-of-radius ping burns the 300 km/h gate for the whole session and the
      rest of it is unchecked. Cheap to confirm, and the fix is a flag on the session
- [ ] **Confirm the `tickets` read rule.** The contract says `get` succeeds for own tickets *or*
      any ticket with `visibility == 'public'` — that is what 갤러리 and the public 컬렉션 need.
      The handoff summarises the rule as own-tickets-only. Probably just a summary written from
      the app's point of view, but every other row was reconciled and this one was not

## Verify

The backend's test suite is in its own repo. From this side, the check is the app against the
deployed project:

```bash
yarn typecheck && yarn lint         # docs and types, always
```

Then, with `EXPO_PUBLIC_USE_MOCKS=false` and the config files in place:

1. Sign up. A `users/{uid}` document should appear with three zeros and no `tier`
2. Open 홈. 최애, 촬영지 and 코스 render from the seed; every counter reads `0`
3. Send a coordinate within 50 m of `place-jumunjin` (`37.8983, 128.8306`) from the simulator's
   location override. `verifyLocation` should return `verified: true` with a grant — provided the
   reading's `accuracy` is 65 m or better, and provided you are not on Android, where an override
   trips the mock-provider flag and earns `mock_location` instead
4. Watch the development console for `[pindom] Firestore field "…" missing` warnings. That
   warning is the localized-map mismatch above announcing itself

## Related

- [`backend-contract.md`](../reference/backend-contract.md) — corrected by this page; still the referee for field names
- [2026-08-21 review resolutions](2026-08-21-backend-contract-review-resolutions.md) — the previous round, when this was still a document review
- [connect-the-app-to-firebase.md](../how-to/connect-the-app-to-firebase.md) — the runbook, now carrying the seed ids and the `permission-denied` symptom table
- [ADR 0005](../decisions/0005-keep-firebase-behind-a-repository-boundary.md) — why the backend's repo owns its own documentation and this one only records the interface
