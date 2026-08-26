---
title: 2026-08-26 Backend Fix Requests
type: plan
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-08-26
audience: internal
---

# 2026-08-26 — Backend Fix Requests

> One page for the backend developer, written after the app was driven end to end against the
> deployed `pindom-1234`. Everything here was reproduced against the running project, not read
> off a contract. Ordered by what it costs a user. **Start at the top; the first two are the
> only ones that change what a person sees.**

## How to read this

Each item says what was observed, how to reproduce it, and what would close it. Where the
backend repository's source is already correct, that is said outright — because then the fix is
a deploy, not an edit.

The evidence behind every line is in
[2026-08-26 live firebase verification](2026-08-26-live-firebase-verification.md). The field
names are the contract's ([backend-contract.md](../reference/backend-contract.md)), which stays
the referee for both repositories.

> [!NOTE]
> **Two items from the previous list are already done**, and were confirmed against the
> deployment rather than taken on trust: `places.verifyCount` is now incremented on an accepted
> reading, and `askAssistant` is deployed and answering. They are struck through in
> [integration open items](2026-08-26-integration-open-items.md); nothing is owed on either.

## 1. `verifyLocation` judges speed before it judges accuracy and radius

**The deployed function does not match its own source.** `functions/src/index.ts` at `main`
applies the gates in the documented order — accuracy, then radius, then speed, with
`jumpedFromLastTicket` last. The deployed build answers from `jumpedFromLastTicket` first.

**Reproduce.** Mint a ticket, then within the hour send a reading from far enough away that the
implied speed clears 300 km/h. From Jeju, roughly 530 km from `place-jumunjin`, one hour after
minting there:

| Reading | The contract says | The deployment answers |
| --- | --- | --- |
| `accuracy: 30` | `out_of_radius` | `implausible_speed` |
| `accuracy: 9999` | `poor_accuracy` | `implausible_speed` |

The control cases behave correctly, which is what narrows this to one branch: the same
`accuracy: 9999` sent from **at** the place answers `poor_accuracy`, and so does a reading from
an account with no ticket to compare against.

**Why it matters beyond the wording.** Two things, and the second is the reason the ordering was
specified in the first place.

A fan who mints a ticket in 강릉, travels, and opens 인증 in another city before reaching the
next 촬영지 is simply not there yet — `out_of_radius`. They are told `implausible_speed`, which
the app renders as 위치 조작이 의심되어… That is an accusation, not a distance.

And the accuracy-rejected reading reaches the speed maths. In the `accuracy: 9999` row the
response came back with `distanceMeters: 519514`, which is the raw 529,483 m **minus the
9,999 m accuracy radius** — so a sample with ten kilometres of error was adjudicated rather than
discarded. The contract is explicit that this must not happen:

> A reading rejected for accuracy **is not appended to `readings`** … a sample with 200 m of
> error in that array would poison the speed calculation below and could get a legitimate user
> judged a spoofer.

In the code that distinction is exactly the `append` argument — `poor_accuracy` rejects with
`false`, `implausible_speed` with `true`. Whichever gate answers first decides whether the
garbage sample is kept. It is currently being kept; a session document was read in the console
holding a `readings` entry with `accuracy: 9999`.

**What would close it.** Because `main` already has the order right, **redeploy first and
re-run the table above** — that may be the whole fix. If it reproduces on a fresh deploy, move
`jumpedFromLastTicket` back below the accuracy gate.

## 2. Nothing syncs `places/{id}/gallery` when a ticket's visibility changes

Carried over from [integration open items](2026-08-26-integration-open-items.md) item 1, still
reproducing, and now with a second reason to do it.

**Reproduce.** Take a public ticket, set `visibility` to `private` as its owner, and read
`places/{placeId}/gallery`. The entry is still there — checked at twelve seconds and again at
just under a minute. Setting it back to `public` writes nothing either, so the reverse direction
is only invisible because the entry never left.

**Why it matters more than it did.** The app has **no 공개 → 비공개 control at all** —
`setVisibility` is only ever called with `'public'`, from 보관함. So today a published photo
cannot be withdrawn from inside the app, and 보관함's own header, 여기 있는 사진은 나만 봅니다,
cannot be honoured for any ticket that was ever public.

The app can add that control in an afternoon. **It is deliberately not being added until this
trigger exists**, because a button that reports a withdrawal the backend does not perform is
worse than no button: it would turn a missing feature into a false promise about privacy.

**What would close it.** A trigger on `tickets` update — create the gallery entry when
`visibility` becomes `public`, delete it when it becomes `private`. It cannot be done from the
app: the rules that make the gallery trustworthy are the same rules that stop the client
repairing it.

## 3. Cold start, now including `askAssistant`

Item 9 from the previous list, unchanged in substance and with one addition.

All three original callables still run at `minInstances: 0`. `verifyLocation`'s first call in a
session measured 1.3 s against 0.4 s warm — better than the 2–4 s recorded before, though not
enough on its own to tell a configured warm instance from a lucky one.

The newly deployed `askAssistant` is the clearest cold start in the project now: **4.2 s** on
first call, against 0.8–1.9 s warm. Pindom AI is the screen a judge is most likely to open out
of curiosity, and four seconds of silence reads as broken.

**What would close it.** A warm instance on `verifyLocation` before the demo, and the same
consideration for `askAssistant`.

## 4. Smaller items, unchanged

None of these are user-visible; they cost a reader or a newcomer rather than a fan.

| Item | Where it stands |
| --- | --- |
| The README's function-test command omits `--project`, so most tests fail with `functions/not-found` | Previous list, item 2 — the failure mode is worth a line of its own, because `not-found` from a callable almost always means the address is wrong rather than the function missing |
| `artists.memberCount` is written by nothing | Previous list, item 4 — the app has stopped reading it and prints `placeCount` instead. Dropping it from the seed is tidying, but leaving it invites the next person to render it |
| `issueTicket` denormalises `placeName` from `ko` only | Previous list, item 5 — confirmed live on both a ticket and a post. The app now matches this deliberately; please confirm it is intended and leave it |
| Nothing moves a raffle to `closed` | Previous list, item 6 — the app checks `closesAt` as well as `status`, so this is optional |
| The README names a JDK formula rather than a version | Previous list, item 8 |
| `places.reviewCount` is written by nothing | Still `0` with a review present. The same shape as `verifyCount` was; 리뷰 counts the list it already loaded, so the honest fix is to drop the field from the seed |
| `askAssistant` returned a transient GFE `401` once, then succeeded on retry | Observed once during verification and not reproduced. Recorded to watch, not to act on |

## Related

- [2026-08-26 live firebase verification](2026-08-26-live-firebase-verification.md) — the run this page summarises, with the probes and the app-side findings
- [2026-08-26 integration open items](2026-08-26-integration-open-items.md) — the previous list, with the two resolved items struck through
- [backend-contract.md](../reference/backend-contract.md) — the referee for every field named here
- [ADR 0005](../decisions/0005-keep-firebase-behind-a-repository-boundary.md) — why an item lands on this page rather than in the app
