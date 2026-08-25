---
title: 2026-08-26 Integration Open Items
type: plan
status: draft
owner: zoyoong124@gmail.com
last-updated: 2026-08-26
audience: internal
---

# 2026-08-26 — Integration Open Items

> Before switching the app off fixtures, its own mappers and queries were run against the emulator carrying the deployed rules, indexes, functions and seed. Everything that could be fixed without a decision has landed. This page is what is left: the questions this repo has to answer, and the ones the backend has to. Each item is written as background, where it stands, and a recommendation, so it can be decided without re-deriving it.

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
another repository, stands in front of.

## Decisions this repo owes

### 1. 홈's recommendations are the global top ten, then filtered

**Background.** `places.listRecommended` orders the whole collection by `ticketCount` and takes
the first ten; `useHomeData` then keeps the ones belonging to the selected 최애. The ranking is
global, the display is per-artist, and nothing guarantees the two intersect.

**Where it stands.** Harmless today — there are five seeded 촬영지, so the "top ten" is all of
them. It stops being harmless the moment the collection outgrows a page: an artist whose
촬영지 are all outside the global top ten gets an empty `{최애}의 촬영지` block, which reads as a
loading bug rather than as a ranking. Worth knowing separately: every seeded counter starts at
`0`, so until the first ticket is minted the order is arbitrary rather than meaningful.

**Recommendation.** Rank client-side from the full collection. 지도 already reads every place
for its pins and the result is cached, so the second query is the one that can be removed rather
than added — and per-artist ranking then costs nothing and needs no new index. The alternative,
querying `artistIds` with `array-contains` and ordering by `ticketCount`, is more correct in the
abstract but needs a composite index the backend would have to deploy, for a collection that is
not going to be large before the 공모전.

### 2. 글쓰기 offers the newest **public** ticket's place

**Background.** The pin 글쓰기 attaches comes from `ticketRepository.listMine()`, which is the
public collection only. 보관함 tickets are not considered.

**Where it stands.** This is the same shape as the 티켓 절취 bug that was fixed — there, the
preview disagreed with what the server actually spends, which made it wrong outright. Here
nothing disagrees: the server is not involved, and the screen simply has a policy. If the
newest ticket is private, the pin silently belongs to an older place.

**Recommendation.** Leave it public-only, and treat this as a decision rather than an oversight.
보관함 exists so a photo can be kept out of public view; surfacing the place it was taken at, on
a public post, gives away the part the user chose to withhold. If the answer is instead "most
recent means most recent", both lists have to feed it, the way `useRaffles` now does.

### 3. `clubGo` starts at 30

**Background.** The tier bands are ten wide. `club10` and `club20` are read off the prototype's
`TIER 10—19` label; `clubGo` is the band after them, extrapolated rather than observed.

**Where it stands.** The number now exists in exactly two places — `tierFor` in
`src/lib/domain/user.ts`, which the fixtures use, and the same function in the Cloud Functions,
which is authoritative. Changing it is one constant on each side and one redeploy.

**Recommendation.** Decide it now rather than later, even if the answer is "30". It is free
today and stops being free the first time an account crosses whatever number ships — at that
point changing it demotes someone. Nothing else is blocked by it.

### 4. Whether `followedArtistIds` is capped

**Background.** 홈 is keyed to one 최애 at a time, and the user document holds a list. The
contract has carried this as an open question since it was written: neither the cap nor the rule
for choosing the active artist is decided.

**Where it stands.** The app follows and unfollows without a limit, and 홈 opens on the first
entry of the list. That is a default nobody chose, not a design.

**Recommendation.** Decide the cap and the active-artist rule together, before 최애 찾기 is
refined — they are the same question asked twice. If the 공모전 build only ever demonstrates one
최애, say so explicitly and cap it at one; a cap of one is a much simpler screen than an
uncapped list with an implicit "first wins".

### 5. A review needs neither a visit nor a limit

**Background.** The app writes reviews with a generated document id and sends no `ticketId`.
Rules cannot run a query, so with no ticket reference on the document there is no expression
that can ask whether this user has ever verified at this place. The check is not weak; it is
unwritable as the document is shaped.

**Where it stands.** As deployed, anyone signed in can review any 촬영지, as many times as they
like, having never been there. The backend left the rule stubbed for the day the shape changes.

**Recommendation.** Accept it for the 공모전 and record it as accepted. Reviving it costs little
— the app writes the review at document id `ticketId` and sends `ticketId` as a field, and rules
gain two lines that confirm the caller owns that ticket and that it belongs to this place, which
also makes it one review per ticket for free. But it makes the demo harder to populate, and
nothing in the judging depends on review integrity.

### 6. `photoCount` counts photos the 갤러리 will not show

**Background.** `issueTicket` increments `places.photoCount` on every mint. The gallery entry
beside it is written only when the ticket is public. 장소/상세 labels the number 공개 사진.

**Where it stands.** The label and the number disagree by however many private tickets a place
has. Nobody has noticed because no ticket has been minted against the real project.

**Recommendation.** Change the label rather than the counter. `photoCount` as "how many photos
were taken here" is the more useful statistic and the one the increment already implements; the
word 공개 is what was never true. The alternative — asking the backend to increment only for
public mints — makes the number match the gallery but destroys the only record of how much
activity a place actually sees.

## Handed to the backend

Ordered by how much they matter, not by how hard they are.

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
rules that make the gallery trustworthy are the same rules that stop the client repairing it.

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

### 3. `places.verifyCount` is written by nothing

**Background.** `verifyLocation` never touches `places`, and `issueTicket` increments
`ticketCount` and `photoCount` beside this field without touching it either.

**Where it stands.** 장소/상세 renders it as an 인증 statistic and it will read `0` forever. The
contract now marks it dead, alongside `reviewCount`, which was already in that state.

**Recommendation.** Either `verifyLocation` increments it on an accepted reading, or the stat
comes off the screen. Both are fine; a number that is permanently zero is not, because it reads
as "nobody has ever verified here" rather than as "this is not measured".

### 4. `artists.memberCount` is written by nothing

**Background.** Following a 최애 is a write to the user's own `followedArtistIds`. No function
watches that field, and there is no trigger on `users`.

**Where it stands.** The 커뮤니티 board header shows `0` members regardless of how many people
follow the artist.

**Recommendation.** This one genuinely needs a decision before code: keeping it accurate means a
trigger on every profile write, which is a new deployment unit for a decorative number. Dropping
the field and the header line is the cheaper honest answer.

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

### 7. `askAssistant` is not deployed

**Background.** The app calls a callable of that name; the deployment has three functions and
this is not one of them. The request and response shapes are recorded in the Assistant
checklist.

**Where it stands.** The call fails with `not-found`, which the chat renders as an answer it
could not get rather than as a crash. The screen is built and works against fixtures.

**Recommendation.** Decide whether it is in scope for the 공모전 before building anything else
around it. If it is not, the fixture path is already the demo path and nothing needs to change.

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
- [backend-contract.md](../reference/backend-contract.md) — the referee for every field name argued about here
- [2026-08-22 backend handoff reconciliation](2026-08-22-backend-handoff-reconciliation.md) — the previous round, where the deployed backend and the contract were reconciled
- [ADR 0005](../decisions/0005-keep-firebase-behind-a-repository-boundary.md) — why an item lands in one list or the other
