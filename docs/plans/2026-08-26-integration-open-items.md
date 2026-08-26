---
title: 2026-08-26 Integration Open Items
type: plan
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-08-26
audience: internal
---

# 2026-08-26 — Integration Open Items

> Before switching the app off fixtures, its own mappers and queries were run against the emulator carrying the deployed rules, indexes, functions and seed. Everything that could be fixed without a decision landed first. This page is what was left: the questions this repo had to answer — all six now decided and shipped — and the ones the backend still has. Each item is written as background, the decision, and what changed, so it can be re-read without re-deriving it.

## What the run settled

The check was deliberately not the backend's own test suite. That suite asks the backend about
itself, and it cannot see a field the app renamed — Firestore raises nothing for a wrong key, it
returns `undefined`. So the app's real document mappers were extracted from
`src/lib/repositories/firebase.ts` and run against emulator documents, with
`firebase-mapping.ts`'s missing-field warnings treated as failures. Reads, writes, all three
callables and a shape comparison against `src/mocks/` all pass.

The console agrees with the repo: the callables are in `asia-northeast3`, Email/Password
sign-in is on, every composite index the app needs is enabled, the deployed rules are identical
to the backend repository's, and the Storage bucket matches the one in the platform config
files. The runbook's [check section](../how-to/connect-the-app-to-firebase.md) records how to
repeat it and the two traps that cost a run each.

Eight app-side defects came out of it and are fixed. What follows is only what a decision, or
another repository, stood in front of.

## Decided in this repo

All six were decided on 2026-08-26 and are in the working tree. Field-level consequences are
written into [backend-contract.md](../reference/backend-contract.md), which stays the referee.

### 1. 홈's recommendations were the global top ten, then filtered

**Background.** `places.listRecommended` ordered the whole collection by `ticketCount` and took
the first ten; `useHomeData` then kept the ones belonging to the selected 최애. The ranking was
global, the display per-artist, and nothing guaranteed the two intersect.

**Decided.** Rank on the client out of the full collection, and delete the popularity query.
Reading the code settled it more cheaply than the abstract argument did: 홈 was already issuing
both reads in one `Promise.all` — the ranked ten *and* every place, the latter because the
per-최애 인증 count cannot be taken from a subset — and then re-sorting the ranked ten by
distance for the 거리순 label. The popularity order never reached the screen. It selected which
ten documents survived, and that was its only effect.

**What changed.** `useHomeData` reads `listAll` once and derives both the 촬영지 section and the
인증 count from it. `listRecommended` is gone from `PlaceRepository` and from both
implementations rather than left unused — a method that encodes a ranking no screen wants is a
trap for the next reader. The visible result today is identical (five seeded 촬영지 means the
top ten was all of them); what goes away is the empty `{최애}의 촬영지` block that arrives the
moment the collection outgrows a page, one query, and the app's only dependence on a
`ticketCount` index.

### 2. 글쓰기 offers the newest **public** ticket's place

**Background.** The pin 글쓰기 attaches comes from `ticketRepository.listMine()`, which is the
public collection only. 보관함 tickets were not considered, and the toggle's copy read
`탭하면 최근 인증한 촬영지를 첨부합니다`.

**Decided.** Keep it public-only, as a policy rather than an oversight. 보관함 exists so a photo
can be kept out of public view; surfacing the place it was taken at, on a public post, gives
away the part the user chose to withhold.

**What changed.** The policy is unchanged; the copy is, because it was the part that lied. A
user whose newest ticket is private was told the pin was 최근 인증한 — and, if every ticket they
own is private, that they had never verified anywhere. The toggle now reads
`탭하면 최근 공개 티켓의 촬영지를 첨부합니다`, and its empty state `공개한 티켓이 아직 없어요`.
`useWritePost` carries the reasoning so the next reader does not "fix" it by adding `listVault`.

### 3. `clubGo` starts at 30

**Background.** The tier bands are ten wide. `club10` and `club20` are read off the prototype's
`TIER 10—19` label; `clubGo` is the band after them, extrapolated rather than observed.

**Decided.** 30, confirmed rather than left open. The number lives in exactly two places —
`tierFor` in `src/lib/domain/user.ts` and the same function in the Cloud Functions, which is
authoritative — and it is free to change today. It stops being free the first time an account
crosses whatever number ships: at that point changing it demotes someone.

**What changed.** Only the note above `tierFor`, which had carried it as an open product
question, and the contract's tier row. No behaviour.

### 4. `followedArtistIds` is uncapped, and the active 최애 is now a decision

**Background.** 홈 is keyed to one 최애 at a time and the user document holds a list. The
contract carried both halves as open since it was written: the cap, and the rule for choosing
the active artist.

**Decided.** No cap, and the active 최애 is the user's last explicit chip tap, persisted on the
device. A cap of one was considered and rejected on the evidence in the app: 커뮤니티's board
chips and the 지도 filter are both built one-per-followed-artist, so capping at one would empty
two screens' worth of affordance in order to remove an ambiguity that persistence removes
anyway.

**What changed.** The size was never the real problem — the rule was. `useDiscoveryStore` was
in-memory, so every cold start came back empty and fell to `followedArtistIds[0]`: a user
following more than one 최애 found the app back on the first of them at every launch, which is a
default nobody chose. The store now persists through `mmkvStateStorage`, whose first consumer
this is. MMKV is synchronous, so rehydration lands during the first render and no screen paints
the wrong 최애 first; `reconcile` already handled a selection that is no longer followed, which
is exactly what a restored id can be.

### 5. A review needs neither a visit nor a limit

**Background.** The app writes reviews with a generated document id and sends no `ticketId`.
Rules cannot run a query, so with no ticket reference on the document there is no expression
that can ask whether this user has ever verified at this place. The check is not weak; it is
unwritable as the document is shaped.

**Decided.** Accepted for the 공모전, and recorded as accepted rather than left as a silent gap.
As deployed, anyone signed in can review any 촬영지, as many times as they like, having never
been there. Nothing in the judging depends on review integrity, and requiring a ticket makes the
demo materially harder to populate.

**What changed.** The contract's record of it, from "this is a gap" to "this is accepted, and
here is the recipe": the app writes the review at document id `ticketId` and sends `ticketId` as
a field, and rules gain two lines confirming the caller owns that ticket and that it belongs to
this place — which also makes it one review per ticket for free. Doing the app half early was
considered and rejected: it would require a ticket to write a review from the day it lands, so
it buys nothing and costs the demo now.

### 6. `photoCount` counts photos the 갤러리 will not show

**Background.** `issueTicket` increments `places.photoCount` on every mint. The gallery entry
beside it is written only when the ticket is public. 장소/상세 labelled the number 공개 사진, so
label and number disagreed by however many private tickets a place has.

**Decided.** Change the label, not the counter. `photoCount` as "how many photos were taken
here" is the more useful statistic and the one the increment already implements; 공개 was the
word that was never true. Asking the backend to increment only for public mints would make the
number match the gallery by destroying the only record of how much traffic a place actually
sees.

**What changed.** `PlaceStats` reads 촬영된 사진. This is a deliberate deviation from prototype
block `1a`, which is why it is written down twice — in the component and in the fidelity audit's
already-decided list — so a later fidelity pass does not restore the prototype's word and with
it the disagreement.

## Handed to the backend

Ordered by how much they matter, not by how hard they are. Items 3 and 4 changed shape when the
app-side decisions above landed.

### 1. The 갤러리 does not follow a visibility flip

**Background.** `places/{placeId}/gallery` is written once, inside `issueTicket`'s transaction,
and only when the ticket is minted public. Rules close the collection to every client write, and
the deployment has three callables and no Firestore triggers.

**Where it stands.** Both directions are broken, and one of them is a privacy problem.
공개 → 비공개 leaves the gallery document in place, so a photo the user just made private stays
on 장소/상세 for every signed-in user — the one thing 보관함 is for. 보관함 → 공개 writes
nothing, so a photo made public never appears there at all. `useVault`'s comment claimed the
server handled this; the comment has been corrected to say it does not.

**Recommendation.** A trigger on `tickets` update: create the gallery entry when `visibility`
becomes `public`, delete it when it becomes `private`. This cannot be done from the app — the
rules that make the gallery trustworthy are the same rules that stop the client repairing it,
and the app hiding its own private photos from its own screen would fix nothing for the other
viewers who can still see them.

### 2. The function-test command in the README does not work as written

**Background.** `functions/test/functions.test.mjs` initialises its client against a fixed
project id. The documented `firebase emulators:exec` command does not pass `--project`, so the
emulator comes up under the id in `.firebaserc` instead.

**Where it stands.** Run as documented, twelve of the thirteen tests fail. They all fail with
`functions/not-found`, because a callable's emulator URL contains the project id — which is
exactly how a missing region fails too. Passing the matching project id makes all thirteen pass,
so nothing is wrong with the functions themselves.

**Recommendation.** Put `--project` in the README command. The failure mode is worth a line of
its own somewhere: `not-found` from a callable almost never means the function is missing, it
means the address is wrong, and there are two ways to get the address wrong.

### 3. ~~`places.verifyCount` is written by nothing~~ — fixed 2026-08-26

**Resolved by the backend**, and verified against the deployed project rather than taken on
trust: an accepted `verifyLocation` moved `place-jumunjin`'s `verifyCount` from `0` to `1`,
while `ticketCount` and `photoCount` stayed where they were. The recommendation below was taken
as written — the counter is incremented rather than the stat being dropped from 장소/상세 — so
방문 인증 now shows a real number instead of a permanent `0`.

The contract's [`verifyCount` row](../reference/backend-contract.md) has been moved from
"dead field" to "function-only" to match.

### 4. `artists.memberCount` is written by nothing — the app has stopped reading it

**Background.** Following a 최애 is a write to the user's own `followedArtistIds`. No function
watches that field, and there is no trigger on `users`.

**Where it stands.** Resolved on the app side, which was the cheaper honest answer: keeping the
number accurate needs a trigger on every profile write — a fourth deployment unit for a
decorative figure. The 커뮤니티 board header now prints `촬영지 n곳` from `placeCount`, which the
seed writes and 홈 already renders, and `memberCount` is gone from `Artist` and from the mapper
rather than mapped and ignored.

**Recommendation.** Drop the field from the seed whenever convenient. Nothing reads it, so this
is tidying rather than work — but leaving it invites the next person to render it.

### 5. `issueTicket` denormalises `placeName` from Korean only

**Background.** The mint transaction reads the place's `name` map and stores its `ko` value on
the ticket.

**Where it stands.** A user reading the app in English sees a Korean place name on their own
ticket. The app now matches this deliberately — a post's pin label is denormalised the same way
— so at least the same 촬영지 does not appear under two different names in one feed.

**Recommendation.** Confirm it is intended and leave it. The alternative is storing the map and
resolving at read time, which is more correct and means changing the field's type on a
collection that already has documents. Not worth it before the 공모전; worth knowing it is a
choice rather than an oversight.

### 6. Nothing moves a raffle to `closed`

**Background.** `raffles.status` is written by the seed. `enterRaffle` refuses a raffle whose
`closesAt` has passed regardless of what `status` says, so the document and the behaviour drift
apart the moment a deadline passes.

**Where it stands.** The app now checks both, so a closed raffle stops being offered — the user
no longer picks one, watches 티켓 절취 to the end, and is then told it closed. The stale
`status` value itself remains.

**Recommendation.** Optional. A scheduled function would make the stored state honest, which
matters if anything ever reads `status` without also reading `closesAt` — an admin view, an
export, a second client. If nothing will, leaving it is defensible.

### 7. ~~`askAssistant` is not deployed~~ — deployed 2026-08-26

**Resolved by the backend.** The callable answers in `asia-northeast3` and returns real Korean
copy in the shape the Assistant checklist recorded — `{ reply, suggestions, route }`. Checked
that this is a real deployment and not a routing accident: an unknown function name returns
Google's own HTML `404`, while `askAssistant` without an auth header returns the *function's*
`{"error":{"message":"로그인이 필요하다","status":"UNAUTHENTICATED"}}`, identical in shape to
`issueTicket`.

Two things to carry forward. Its first call cost **4.2 s** against 0.8–1.9 s warm, so it is the
clearest cold start in the project now that it exists — the same argument as item 9 applies to
it. And one call in this check came back as a transient GFE `401` before three retries
succeeded; worth watching rather than acting on.

### 8. The JDK line in the README

**Background.** The README suggests `brew install openjdk` for the emulator.

**Where it stands.** The current `firebase-tools` refuses to start the emulators below JDK 21
and says so plainly, so this costs one confused minute rather than an afternoon.

**Recommendation.** Say which JDK version, or say "21 or newer", rather than naming a formula
whose version moves.

### 9. Cold start on the first verification

**Background.** All three callables run at `minInstances: 0`, so the first invocation pays
container startup.

**Where it stands.** Two to four seconds, on the screen where the user is standing outside
waiting to be told they are in the right place. The backend has already recorded the intent to
give `verifyLocation` a warm instance before launch.

**Recommendation.** Do it before the demo rather than before launch. A judge watching the core
loop for the first time is exactly the cold-start case.

## Related

- [connect-the-app-to-firebase.md](../how-to/connect-the-app-to-firebase.md) — the runbook, including how to repeat the check this page reports on
- [backend-contract.md](../reference/backend-contract.md) — the referee for every field name argued about here, and where the six decisions above are written at field level
- [2026-08-23 prototype fidelity audit](2026-08-23-prototype-fidelity-audit.md) — carries the two copy deviations decisions 2 and 6 introduced, so a later pass does not undo them
- [2026-08-22 backend handoff reconciliation](2026-08-22-backend-handoff-reconciliation.md) — the previous round, where the deployed backend and the contract were reconciled
- [ADR 0005](../decisions/0005-keep-firebase-behind-a-repository-boundary.md) — why an item lands in one list or the other
