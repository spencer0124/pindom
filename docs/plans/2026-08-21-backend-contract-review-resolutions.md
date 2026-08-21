---
title: 2026-08-21 Backend Contract Review — Resolutions
type: plan
status: draft
owner: zoyoong124@gmail.com
last-updated: 2026-08-21
audience: internal
---

# 2026-08-21 — Backend Contract Review Resolutions

> Every item in the backend developer's first review of the backend contract, the decision taken on it, and what is still open. Read this before editing [`backend-contract.md`](../reference/backend-contract.md) — this page is the changelog that edit is based on.

## Summary

The backend developer reviewed [`backend-contract.md`](../reference/backend-contract.md) and
answered the first five of its Open questions, then added findings of their own labelled `A`
through `H`. The review lives in the backend repository at
`pindom-server/docs/backend-contract-review.md`, and it says it will keep growing as more
items settle — so this page records **one round**, dated, rather than the whole negotiation.

Three of the review's findings (`A`, `D`, `F`) were **rejections**: the contract as written did
not let a Cloud Function be implemented at all. The rest were cost, notation, or simplification.
Every finding was resolved **without adding a Cloud Function** — the count stays as the contract
already lists it.

> [!NOTE]
> Nothing here has been applied yet. [`backend-contract.md`](../reference/backend-contract.md)
> is still `status: draft` and still carries its pre-review text. The edits this page implies are
> listed under [What changes in the contract](#what-changes-in-the-contract).

## Decisions taken on the app side

Three decisions were made in this round that the review was waiting on or did not cover.

| # | Decision | Effect |
| --- | --- | --- |
| 1 | **Launch locales are `ko` and `en`.** Korean is the default | Closes the contract's own Open question on locales. `ja` and `zh` are dropped from the shipped set |
| 2 | **Firebase App Check is not in the initial release** | Declines the review's proposed first tier of spoofing defence. Accepted risk is recorded below |
| 3 | **Every other review conclusion is accepted** | Listed item by item below |

### 1 — Launch locales: `ko` + `en`

The prototype writes copy in four locales and its helper is `L(ko, en, ja, zh)`, so the contract
proposed a four-key `LocalizedString`. Only two ship.

This was never a config flag. Every seeded 촬영지, 최애 and 코스 needs copy in each shipped
locale, so each locale is a content cost paid by whoever seeds the data. Two is what the initial
release carries.

Consequences:

- `LocalizedString` becomes a two-key map. The prototype still emits four; the extra two are
  read as absent.
- The `locale` union on the user document narrows to the shipped set.
- `LOCALES` in `src/lib/domain/locale.ts` narrows to match. The fallback chain in
  `src/lib/repositories/firebase-mapping.ts` already degrades to Korean and then to any
  populated value, so a document that still carries `ja` or `zh` renders rather than blanks.

Adding a locale later is a content job, not a schema change — the map takes new keys without a
migration.

### 2 — App Check deferred, and what that costs

The review proposed three tiers of anti-spoofing defence and argued the first is a precondition
for the other two:

| Tier | Mechanism | Blocks |
| --- | --- | --- |
| 1 | Firebase App Check (Play Integrity / App Attest) | Patched APKs, emulators, rooted devices, calling the function without the app |
| 2 | The OS mock-location flag | Fake GPS apps running via developer options — no root needed, the most common case |
| 3 | Radius and speed checks | Whatever gets past the first two |

Tier 1 is out of the initial release. The other two ship.

> [!WARNING]
> **Accepted risk.** Without tier 1, a patched build can send `isMock: false` regardless of what
> the device reports, which turns tier 2 into an honest-client signal rather than a control.
> On iOS there is no mock-location API at all, so tier 2 never had teeth there and the review's
> plan was for App Check to cover it — on iOS the initial release therefore rests on the radius
> and speed checks alone.

Tier 2 is still worth shipping without tier 1. The attack it blocks — a Fake GPS app driven from
developer options — does not involve patching the app, so a client-reported flag is enough to
catch it, and the review calls that the most common case. Keeping `isMock` in the contract now
also means turning App Check on later needs no schema change.

The review's own framing applies: the goal is not total prevention but making the break cost more
than the reward. That judgement should be revisited if ticket rewards get more valuable.

**Re-entry point:** when App Check is adopted, nothing in the contract changes. The app installs
and initialises the client SDK; the backend enables it in the console.

### 3 — Everything else accepted

Item by item below.

## Open questions the review answered

These are the contract's own Open questions. The review answered the first five.

### Q1 — Speed-check threshold

**Accepted, including the change of shape.** The contract proposed rejecting above 150 km/h
between two readings in a session and above 300 km/h against the last issued ticket. The
thresholds stand; the *trigger condition* was replaced.

The contract had considered skipping the speed calculation when two readings are less than 30
seconds apart, to stop GPS jitter from reading as 100 km/h. The review rejected that: moving the
coordinate every 28 seconds evades the check permanently, so a time condition is itself the hole.

| Item | Value |
| --- | --- |
| Trigger | Only pairs that moved **200 m or more** are evaluated — regardless of the interval |
| Within a session | Reject above **150 km/h** |
| Against the user's last issued ticket | Reject above **300 km/h** — covers KTX and domestic flights |
| Distance | Computed after subtracting the reported accuracy radius |
| Rejection | `verified: false`, `reason: 'implausible_speed'`. Not a throw |

Contract changes accepted:

```ts
// verifyLocation request — one field added
isMock: boolean;   // whether the device reported a mock location

// reason union — one member added
'out_of_radius' | 'implausible_speed' | 'poor_accuracy' | 'mock_location'
```

`isMock: true` resolves as `verified: false` with `reason: 'mock_location'`. How 인증 실패
presents it is the app's call.

App work: read the mock flag from the location reading — Android reports it, iOS has no
equivalent and sends `false`. App Check integration is **deferred**, per the decision above.

### Q2 — Re-issue cooldown for one place

**Accepted. 30 days**, per user per place.

The reasoning is that the cooldown exists to stop one trip producing two tickets at the same
place. A daily window reopens inside the same trip; a once-per-place lock removes any reason to
return. 30 days makes it a next-season rhythm.

| Item | Value |
| --- | --- |
| Cooldown | **30 days**, same user + same place |
| Enforced in | **`issueTicket` only** |
| Measured from | That user's last `issuedAt` for that place |

`verifyLocation` does **not** check the cooldown. Two copies of one rule diverge, and then the
cause is hard to find; the authority to mint sits in one function.

Contract change accepted — a new failure on `issueTicket`, shaped like the existing ones:

```ts
failed-precondition
  details.errorCode: 'cooldown_active'
  details.nextAvailableAt: string   // ISO 8601, for the "available in n days" line
```

**App work — show it before the trip, not after.** With a 30-day window the wasted-journey cost
is real: revisit a place after two weeks, pass GPS, take the photo, and get refused at the last
step. 장소/상세 will read the signed-in user's own tickets for that place and render the next
available date.

The review notes this is not a trust-boundary violation, and it is worth being precise about
why. The server remains the only enforcer; the client's display is guidance, not adjudication.
The client also computes it from the same data the server uses — the user's own ticket
documents, which rules already permit them to read — so the two cannot disagree. On that basis
the 인증 entry point on 장소/상세 is disabled while the cooldown is active, with the date shown,
rather than merely annotated.

### Q3 — `serial` generation

**Accepted.** Server-generated, prefix `PD-`.

```text
PD-7K2M-9QX4-B3TZ
```

| Item | Value |
| --- | --- |
| Format | `PD-XXXX-XXXX-XXXX`, fixed length |
| Alphabet | Crockford Base32 — uppercase and digits, excluding `I` `L` `O` `U` |
| Entropy | 8 random bytes |
| Generated in | `issueTicket`, server-side only |
| Collision check | None |

The excluded letters are the ones that read as `1` and `0`, because the number is meant to be
read aloud and typed. The collision check is skipped because at 64 bits the probability stays
negligible far beyond any plausible ticket volume, while checking adds a read to every mint and
complicates the transaction.

A Firestore auto-id would have cost nothing to produce, but 티켓 발행 is designed as a physical
ticket down to the barcode, and a database-internal value printed there reads as one.

**Our answer to the review's question: Code128.** No barcode symbology had been chosen — the app
has no barcode library yet — so the alphabet above is adopted as-is rather than constraining the
serial to digits for a numeric-only symbology.

### Q4 — EXIF stripping

**Accepted, including the transfer of ownership to the app.** Applies to ticket photos **and**
community post photos.

The backend cannot do this under the current contract. The app uploads to Storage directly and
`issueTicket` receives only a path string, so there is no point at which the server holds the
file:

```text
app ──photo──▶ Storage        ← EXIF already stored
app ──path───▶ issueTicket    ← server first involved here
```

Stripping after the fact would mean a Storage-triggered function that re-reads and re-writes
every upload, plus a timing window where `issueTicket` can reference the original.

On the app side it is close to free: re-encoding an image drops EXIF as a side effect, so one
resize or compress pass through `expo-image-manipulator` covers it, with no dedicated library.

This is consistent with the trust boundary rather than an exception to it. GPS adjudication
cannot trust the client because a ticket has real value and therefore an attacker. EXIF is the
user's own privacy in the user's own photo — patching the app to keep it harms only the person
who did it, so there is no adversary to design against. The coordinate is recorded server-side in
the verification session regardless, so stripping loses no data.

**Our answer to the review's question: yes, both upload paths re-encode** — 편집 before a ticket
photo is uploaded, and 글쓰기 before a post image is uploaded.

Storage rules are unchanged: the size cap and `contentType` check stay where they are.

### Q5 — GPS accuracy gate

**Accepted. A global 65 m.** No schema change and no new field — `reason: 'poor_accuracy'` is
already in the contract.

```ts
accuracy > 65  →  verified: false, reason: 'poor_accuracy'
```

The device's reported `accuracy` is an error radius. At `accuracy: 200` the user is somewhere
within 200 m of the reported point, which makes a 50 m verdict meaningless; without a gate,
loitering nearby earns a ticket.

| Threshold | Outcome |
| --- | --- |
| 50 m — same as the radius | Logically tidy, but Android in a city centre reports 40–60 m routinely and legitimate users would bounce |
| **65 m** | Absorbs most urban false rejections. Worst case admits someone 115 m away |
| 100 m | Almost never bounces, but the 50 m check stops meaning anything |

A per-place `maxAccuracyMeters` alongside `radiusMeters` was considered and dropped: it becomes a
value nobody can maintain by hand as places multiply, and in practice most rows would keep the
default. One global constant now; split per place only if a specific location proves it needs one.

**Side rule accepted:** a reading rejected for poor accuracy is **not appended** to the session's
readings. A 200 m-error sample in that array would poison the speed calculation and could get a
legitimate user judged a spoofer.

**App work:** 인증 실패 gains guidance for this case — it is a failure the user can act on, and
the screen already renders distance, radius and accuracy as a table, so the room exists.

## Schema findings raised by the review

Findings the review raised on its own, outside the contract's Open questions. `A`, `D` and `F`
were rejections — the contract as written did not permit the function to be implemented.

### A — Nowhere to store the grant token · rejection

`verifyLocation` returns `grant: { token, expiresAt }` and `issueTicket` must verify the grant is
unexpired, unused, and owned by the caller. The session document carried only `grantExpiresAt?` —
**neither the token value nor its used state was stored anywhere**, so two of those three checks
could not be written.

**Accepted resolution — no new field.** `grant.token` is *defined as* the `sessionId`:

| Check | Reads |
| --- | --- |
| Ownership | The session's `userId` against the caller — already present |
| Expiry | `grantExpiresAt` — already present |
| Used | `status`, which gains one union member |

```ts
// verificationSessions.status
'active' | 'verified' | 'consumed' | 'expired'
```

A separate unguessable token adds no defence: knowing someone else's session id fails the
`userId` check, and clients cannot write the collection, so forging one is not available either.

The request field on `issueTicket` keeps the name `grantToken`. **No app change** — the token
received in the response is passed through unchanged.

### B — `readings` grows without bound · accepted

Firestore rewrites the whole document to append one array element, so a user retrying outside the
radius grows both the document and the write cost, against a 1 MB ceiling.

**Resolution: keep the most recent five**, discarding the oldest beyond that. The speed check
needs only the previous reading; the remainder is headroom for diagnosing a failure. Document
size becomes constant, and no new field or error code appears.

No app change — the client neither reads nor writes this collection.

### C — Expired sessions live forever · accepted

Failed sessions and sessions that never reached a ticket are never removed.

**Resolution: a `expiresAt: Timestamp` field (`startedAt` + 24 hours) and Firestore's built-in TTL
policy.** No cleanup function and no scheduled job. `grantExpiresAt` cannot be reused for this
because it is optional — a failed session never has one, so it would never expire.

No app change.

### D — Nothing creates the user document · rejection

The contract said `users/{uid}` is "created on sign-up", but its three counters are
function-only and none of the three Cloud Functions creates the document. Immediately after
sign-up, no user document exists.

**Accepted resolution — no new function.** The client creates its own document and rules pin the
counters to zero:

```text
users create rule:
  - document id == caller uid
  - ticketBalance == 0, ticketsIssued == 0, placesVisited == 0
  - reject the create if any of these is violated
```

An Auth `onCreate` trigger was rejected because it makes a fourth function and one more
deployment unit; three lines of rules give the same guarantee. A user who authenticates and
leaves without a document is not a problem either — `issueTicket` increments with `merge`, so the
document appears at that point.

> [!WARNING]
> **One correction is being sent back on this item.** The review's proposed `allow update`
> permits `nickname` and `avatarUrl` only. The contract's write-ownership table permits `bio`,
> `followedArtistIds`, `profileVisibility` and `locale` as well. Written as proposed, 프로필 편집,
> 언어 and 최애 찾기 all fail with `permission-denied`.
>
> **The correct set is every field the contract lists.** What must stay closed is the three
> counters and `tier`. This is the one item where the review's text and the contract disagree,
> and the review said it will write the rules unless it hears an objection — so this reply is
> time-sensitive.

**App work:** create `users/{uid}` immediately after a successful sign-up, with the nickname from
the form and all three counters explicitly `0`.

### E — Rules are not filters · accepted

The write-ownership table described ticket reads as "own tickets, plus others' where
`visibility == 'public'`". That phrasing invites a specific and expensive misunderstanding:
**Firestore security rules do not filter results.** They judge whether the query itself is safe.
A ticket list query without a matching condition is not silently narrowed to public tickets — the
**entire query is refused** with `permission-denied`, and the symptom does not distinguish a
rules problem from a query problem.

**Accepted resolution — no schema change**, but the rule splits by operation:

| Operation | Allowed when |
| --- | --- |
| `get` — one document | It is the caller's own, or `visibility == 'public'` |
| `list` — a query | The query itself contains `userId == request.auth.uid` |

The review checked [`screens.md`](../reference/screens.md) and found no screen that lists other
people's tickets: 컬렉션 is the caller's own, and nothing currently queries public tickets as a
list. Keeping `list` closed while no screen consumes it reduces the number of places a failure can
come from. Opening it later is one added condition. `get` stays open to public tickets, so a
share link would work unchanged if one is designed.

**No app change — the requirement is already met.** The ticket queries already carry
`where('userId', '==', uid)`. This is being confirmed back to the review so the rules can be
written with that known.

### F — Nowhere to store the idempotency key · rejection

`enterRaffle` takes an `idempotencyKey` that **appears in no collection**. Unstored, the server
cannot recognise a repeat, and a single network retry debits tickets twice.

**Accepted resolution — no new field.** The entry document's **id** is the key:

```text
raffleEntries document id = {uid}_{raffleId}_{idempotencyKey}
```

Inside the transaction, an existing document at that id means returning the existing `entryId`
without debiting; otherwise the entry is created. Firestore guarantees id uniqueness within a
collection, so no lookup and no separate idempotency collection is needed.

Format constraint accepted, since a document id cannot contain `/`:

```text
idempotencyKey: letters, digits, `-` and `_` only, 1–64 characters
violations → invalid-argument
```

**App work:** a UUID satisfies the constraint. It must be generated **once when 응모 opens** and
reused across retries — a key regenerated per call defeats the mechanism entirely.

### G — `places.ticketCount` missing its notation · accepted

`ticketCount` is written by `issueTicket` but carried no **Function-only** marking. Without it,
rules could be written leaving client writes open, and 홈 recommendation ranking becomes
user-editable.

**Resolution: add the notation.** Accepted alongside a related gap the review closed — the
condition under which `users.placesVisited` increments was never stated. The cooldown check
already queries "this user's last ticket at this place", so **an empty result means a first
visit**; one query serves both.

What `issueTicket` increments, in one transaction:

| Target | Condition |
| --- | --- |
| `users.ticketBalance` | Always +1 |
| `users.ticketsIssued` | Always +1 |
| `users.placesVisited` | Only on the first issue at that place |
| `places.ticketCount` | Always +1 |

### H — Remove `places.geohash` · accepted

`geohash` was specified as "required for the 지도 nearby query", with neither the precision nor
the query strategy decided. Deciding them pulls in a lot: a geohash range query splits into
several range queries at cell boundaries, whose results must be merged, deduplicated and then
re-filtered by true distance, with composite indexes and a geo library behind it.

The review's argument is that the requirement never matched. 지도 opens at a scale showing the
whole country and zooms in; nearby pins may be clustered, but **a pin must not disappear because
it is far away**. The map therefore has to know every 촬영지 at all times, and a device for
"fetch only what is near me" has no role in a screen that needs all of them. Distance is not
needed on the client either — it is used once, at verification, and computed server-side.

**Resolution: delete the field.** 지도 reads all places and renders coordinates as pins. No
composite index, no geo library; clustering is a rendering concern.

Seeded 촬영지 do not grow like user data, and the app already has an MMKV cache. The review
records the reversal point: past roughly a thousand places, a full read becomes heavy — and the
answer then is still not geohash but a lightweight map-only projection or an `updatedAt`
incremental fetch, because the nationwide requirement does not go away.

> [!NOTE]
> **App follow-up, not a contract question.** `placeRepository.listNearby(lat, lng, radiusMeters)`
> currently filters places against a radius, which contradicts the nationwide reading above.
> Deleting `geohash` is correct either way — nothing reads it — but the repository method's shape
> needs to be settled against the prototype before 지도 is built. The prototype's own README does
> not state the map's zoom scope, so this is unresolved here.

## Still open

The contract's remaining Open questions were not addressed by this review.

| Question | What is undecided | State |
| --- | --- | --- |
| Tier thresholds | The keys are `club10` / `club20` / `clubGo` and the prototype shows a 0–10–20 gauge. Confirm the boundaries, and whether tier is per-artist or global | **Blocking.** `issueTicket` already recomputes `tier` inside its transaction, so the function cannot be written without this. Being re-raised |
| Review without a visit | Whether a place must be verified before it can be reviewed. The contract proposes yes | Open. Needed before 리뷰 is built |
| `followedArtistIds` cap | Whether the set is capped, and how the active 최애 is chosen | Open. Needed before 최애 찾기 is built |
| Launch locales | Which locales ship, and the seeded-content cost each one carries | **Closed this round.** `ko` and `en`; see above |

## What changes in the contract

Edits [`backend-contract.md`](../reference/backend-contract.md) needs. None have been applied.

| Target | Change |
| --- | --- |
| Conventions — `LocalizedString` | Two-key map for the shipped locales |
| `users.locale` | Union narrows to the shipped locales |
| `places.geohash` | **Delete** |
| `places.ticketCount` | Mark **Function-only** |
| `verificationSessions.status` | Add `'consumed'` |
| `verificationSessions` | Add `expiresAt: Timestamp`; note the TTL policy |
| `verificationSessions.readings` | Note the five-element cap |
| `verifyLocation` request | Add `isMock: boolean` |
| `verifyLocation` reason union | Add `'mock_location'` |
| `verifyLocation` | Record the 65 m accuracy gate and that rejected readings are not appended |
| `verifyLocation` | Record the 200 m trigger and the 150 / 300 km/h thresholds |
| `issueTicket` errors | Add `'cooldown_active'` with `nextAvailableAt` |
| `issueTicket` | Record the 30-day cooldown and the `placesVisited` first-visit condition |
| `issueTicket` | Record the serial format |
| `enterRaffle` | Record the entry document id scheme and the key format constraint |
| Write ownership — `users` | Client creates own document with counters at zero; keep every field the table already lists updatable |
| Write ownership — `tickets` | Split `get` from `list`; state that a list query must carry `userId == uid` |
| Open questions | Close the answered ones; keep the rest with their state |

`status` stays `draft` until the review's remaining answers arrive.

## What changes in the app

Work this round creates in this repository. Sequencing belongs to
[`screen-implementation.md`](screen-implementation.md), not here.

| Area | Change |
| --- | --- |
| Locales | Narrow `LOCALES` in `src/lib/domain/locale.ts` to the shipped set |
| Sign-up | Create `users/{uid}` at the caller's own uid with the three counters at `0` |
| 응모 | Generate the idempotency key once on entry and reuse it across retries |
| GPS인증 | Send `isMock` from the reading; Android reports it, iOS sends `false` |
| Verification types | Add `'mock_location'` to the failure reason union |
| Failure plumbing | Lift `details.nextAvailableAt` alongside `details.errorCode` |
| 인증 실패 | Copy for `poor_accuracy` and `mock_location` |
| 장소/상세 | Read the caller's own tickets for the place; show the next available date and disable the 인증 entry point during the cooldown |
| 편집 · 글쓰기 | Re-encode images before upload, which drops EXIF. Adds an image-manipulation dependency |
| 지도 | Settle the query shape against the prototype; `geohash` is gone either way |
| App Check | **Deferred.** Not in the initial release |

## Related

- [`backend-contract.md`](../reference/backend-contract.md) — the document under review; the referee when the two codebases disagree
- [`architecture.md`](../explanation/architecture.md) — the trust boundary these resolutions keep appealing to
- [`screens.md`](../reference/screens.md) — which screen consumes which shape; the review used it to check whether any screen lists other people's tickets
- [`connect-the-app-to-firebase.md`](../how-to/connect-the-app-to-firebase.md) — how the app joins the project
- [ADR 0005](../decisions/0005-keep-firebase-behind-a-repository-boundary.md) — why the app reaches Firebase through one directory
