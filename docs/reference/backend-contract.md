---
title: Backend Contract
type: reference
status: draft
owner: zoyoong124@gmail.com
last-updated: 2026-08-21
audience: internal
---

# Backend Contract

> The Firestore collections, Cloud Function signatures and write permissions the PINDOM app expects. The app developer and the backend developer both implement against this page; when the two codebases disagree, this document is the referee.

## Summary

Firestore does not enforce a schema. If the backend writes `place_name` and the app reads
`placeName`, nothing throws on either side — the screen renders `undefined` and the bug looks
like a UI problem. A REST server would have returned a 400 and named the field.

**So this document is the type system.** It is the only place the two codebases agree, which
makes it the first thing to change when a shape changes, and the last word in an argument
about what a field is called.

> [!WARNING]
> Status is `draft`. Fields were derived from what the prototype displays — see
> [`design/README.md`](../../design/README.md) — and the backend developer's first review has
> been folded in, but the questions below are still open. Disagreements should be resolved by
> editing this page, not by working around it in one codebase.

> [!NOTE]
> **The backend developer's first review has been applied, on 2026-08-21.** Every finding and
> the decision taken on it is recorded in the
> [review resolutions](../plans/2026-08-21-backend-contract-review-resolutions.md), which is the
> changelog for this page. If you read an earlier version, re-read `verifyLocation`,
> `issueTicket`, `enterRaffle` and the write-ownership table — `places.geohash` is gone, the
> shipped locales narrowed, and the ticket read rule now splits `get` from `list`.

## Conventions

| Rule | Value |
| --- | --- |
| Collection names | plural, `lowerCamelCase` — `places`, `raffleEntries` |
| Field names | `lowerCamelCase` |
| Dates | Firestore `Timestamp`. Never a string, never a number |
| Coordinates | Firestore `GeoPoint` |
| Absent values | omit the field. Firestore reads a missing field as `undefined`, never `null`, so the app types them `field?: T` |
| Money-like counters | written only by Cloud Functions, never by a client — except the one-time `users/{uid}` create at sign-up, where the client writes literal zeros and rules pin them there |
| Localized strings | a map keyed by locale: `{ ko, en }` — the shipped set. The prototype's copy helper is `L(ko, en, ja, zh)` and still emits four; the two extra keys are not part of the contract and are read as absent. Any user-visible string that differs per language is a map, not a string |

## Collections

### `places/{placeId}` — 촬영지

Seeded by the backend. Read by 지도, 홈, 장소/상세, and by `verifyLocation` — the authoritative
coordinate must come from here, never from the client.

| Field | Type | Notes |
| --- | --- | --- |
| `name` | `LocalizedString` | 주문진 방파제 / Jumunjin Breakwater / 注文津防波堤 |
| `roman` | `string` | Latin caption shown under the Korean name — `Jumunjin Breakwater` |
| `description` | `LocalizedString` | Shown on 장소/상세 |
| `address` | `string` | |
| `region` | `LocalizedString` | 강원 강릉 — rendered beside the work title |
| `workTitle` | `LocalizedString` | The drama or music video it appeared in |
| `workKind` | `'mv' \| 'drama' \| 'self'` | Drives the `MV / GANGNEUNG` caption and the map filter |
| `artistIds` | `string[]` | Which 최애 this place belongs to. The map and 홈 filter on it |
| `verifyCount` | `number` | 인증 stat on 장소/상세 |
| `photoCount` | `number` | 사진 stat on 장소/상세 |
| `reviewCount` | `number` | **Function-only.** Denormalised count for the 리뷰 header |
| `location` | `GeoPoint` | |
| `radiusMeters` | `number` | Verification radius. Defaults to 50; per-place so it stays tunable without a deploy |
| `coverImageUrl` | `string` | |
| `ticketCount` | `number` | **Function-only.** How many tickets have been minted here. Feeds 홈 recommendations |
| `createdAt` | `Timestamp` | |

### `users/{uid}` — 마이페이지

Document id is the Firebase Auth uid. **Created by the client** immediately after sign-up, with
`ticketBalance`, `ticketsIssued` and `placesVisited` written as literal `0`; rules reject the
create if any is nonzero. There is no Auth `onCreate` trigger — a fourth function would be one
more deployment unit, and three lines of rules give the same guarantee.

| Field | Type | Notes |
| --- | --- | --- |
| `email` | `string` | |
| `nickname` | `string` | Shown as post author |
| `avatarUrl` | `string?` | |
| `bio` | `string?` | Editable on 프로필 편집 |
| `followedArtistIds` | `string[]` | The 최애 set chosen at 최애 찾기 and edited on 프로필 편집. Keys the home screen and the community boards |
| `ticketBalance` | `number` | **Function-only.** Read by 홈 and the 잔여 티켓 충족 branch on 응모 |
| `ticketsIssued` | `number` | **Function-only.** 마이페이지 stat |
| `placesVisited` | `number` | **Function-only.** 마이페이지 stat. Increments only on the caller's **first** ticket at a given place |
| `tier` | `'club10' \| 'club20' \| 'clubGo'` | **Function-only.** Derived from `ticketsIssued`; rendered as a badge beside the nickname and on every post |
| `profileVisibility` | `'public' \| 'private'` | Set on 프로필 편집 |
| `locale` | `'ko' \| 'en'` | Set on 언어. `ko` is the default |
| `createdAt` | `Timestamp` | |

### `artists/{artistId}` — 최애

**Structural, not additive.** Onboarding, the home screen, the map filter and the community
boards are all keyed to this. Seeded by the backend.

| Field | Type | Notes |
| --- | --- | --- |
| `name` | `LocalizedString` | |
| `initial` | `string` | One or two characters, used as the avatar fallback throughout |
| `imageUrl` | `string?` | |
| `placeCount` | `number` | **Function-only.** 촬영지 count, shown on 최애 찾기 |
| `memberCount` | `number` | **Function-only.** Board members, shown in the 커뮤니티 header |
| `accentColor` | `string?` | Per-artist tint for the board header |

### `courses/{courseId}` — 코스

Curated itineraries of places, shown on 홈 under 코스. Seeded by the backend; read-only to the
client.

| Field | Type | Notes |
| --- | --- | --- |
| `artistId` | `string` | |
| `name` | `LocalizedString` | |
| `description` | `LocalizedString` | |
| `placeIds` | `string[]` | Ordered — the walk order is the point |
| `placeCount` | `number` | Denormalised, rendered on the card |

### `places/{placeId}/reviews/{reviewId}` — 리뷰

A subcollection, because reviews are only ever read in the context of one place and the parent
carries the count. Client-writable, one per user per place.

| Field | Type | Notes |
| --- | --- | --- |
| `authorId` | `string` | |
| `authorNickname` | `string` | Denormalised |
| `authorTier` | `'club10' \| 'club20' \| 'clubGo'` | Denormalised. Rendered as a badge |
| `text` | `string` | |
| `tags` | `string[]` | Chips under the review body |
| `likeCount` | `number` | **Function-only** |
| `createdAt` | `Timestamp` | |

### `places/{placeId}/gallery/{photoId}` — 갤러리

Photos from issued tickets whose `visibility` is `public`, surfaced on 장소/상세.

| Field | Type | Notes |
| --- | --- | --- |
| `ticketId` | `string` | |
| `authorId` | `string` | |
| `photoUrl` | `string` | |
| `createdAt` | `Timestamp` | |

> [!NOTE]
> Write this from `issueTicket` rather than letting the client post to it, so a gallery entry
> cannot exist without a verified ticket behind it. That is the whole value of the gallery — it
> is a wall of proven presence, not an upload feed.

### `tickets/{ticketId}`

The integrity-critical collection. Written **only** by `issueTicket`, and only as the outcome
of an accepted verification — see the
[trust boundary](../explanation/architecture.md#trust-boundary).

| Field | Type | Notes |
| --- | --- | --- |
| `userId` | `string` | |
| `placeId` | `string` | |
| `placeName` | `string` | Denormalised — 티켓 발행 and 컬렉션 render it without a second read |
| `photoUrl` | `string` | Download URL for the uploaded photo |
| `serial` | `string` | `PD-XXXX-XXXX-XXXX`, Crockford Base32 — uppercase and digits without `I`, `L`, `O`, `U`. 8 random bytes, minted server-side, no collision check. Rendered as a **Code128** barcode on 티켓 발행 |
| `visibility` | `'public' \| 'private'` | Set on 공개설정. `private` puts it in 보관함 rather than the public collection |
| `issuedAt` | `Timestamp` | |
| `spent` | `boolean` | Rendered as the `USED` stub state on 티켓 절취 |
| `spentOnEntryId` | `string?` | Set when consumed by a raffle entry |
| `artistId` | `string?` | Inherited from the place. Lets 컬렉션 group by 최애 |

### `raffles/{raffleId}` — 응모

Seeded by the backend.

| Field | Type | Notes |
| --- | --- | --- |
| `title` | `string` | |
| `prizeDescription` | `string` | Concert tickets, signed albums, fansign entry |
| `imageUrl` | `string` | |
| `ticketCost` | `number` | What the 잔여 티켓 충족 branch compares against |
| `closesAt` | `Timestamp` | Drives 마감 임박 on 홈 |
| `entryCount` | `number` | **Function-only** |
| `capacity` | `number?` | Denominator for the progress bar on 홈 |
| `status` | `'open' \| 'closed' \| 'drawn'` | |

### `raffleEntries/{entryId}` — 응모완료

Written **only** by `enterRaffle`, which must debit the balance and create the entry in one
transaction.

The document id is `{uid}_{raffleId}_{idempotencyKey}`. **The id is the idempotency
mechanism** — a document already at that id means the entry happened, so the transaction returns
the existing `entryId` without debiting again. Firestore guarantees id uniqueness within a
collection, so no lookup and no separate idempotency collection is needed.

| Field | Type | Notes |
| --- | --- | --- |
| `userId` | `string` | |
| `raffleId` | `string` | |
| `ticketIds` | `string[]` | Which tickets were spent |
| `ticketsSpent` | `number` | |
| `createdAt` | `Timestamp` | |

### `posts/{postId}` — 커뮤니티

The only high-write, user-generated collection. Paginated on read; 커뮤니티 2 is the populated
feed.

| Field | Type | Notes |
| --- | --- | --- |
| `authorId` | `string` | |
| `authorNickname` | `string` | Denormalised so the feed is one query |
| `authorAvatarUrl` | `string?` | |
| `body` | `string` | |
| `imageUrls` | `string[]` | |
| `placeId` | `string?` | 커뮤니티 2 shows a location on each card |
| `placeName` | `string?` | Denormalised |
| `ticketId` | `string?` | Set when the post came from 「커뮤니티에 자랑하기」 |
| `likeCount` | `number` | Display-only for now — no like interaction is designed |
| `commentCount` | `number` | Display-only for now |
| `createdAt` | `Timestamp` | |

### `verificationSessions/{sessionId}`

The audit log the speed check computes against, and the reason the client submits repeatedly
rather than once. Location permission is foreground-only, so there is no continuous track — a
plausible-speed check needs a series of readings inside one session.

Managed entirely by `verifyLocation`. **The client never reads or writes this collection**; it
only passes the `sessionId` back on subsequent calls.

| Field | Type | Notes |
| --- | --- | --- |
| `userId` | `string` | |
| `placeId` | `string` | |
| `readings` | `array` | `{ location: GeoPoint, accuracy: number, capturedAt: Timestamp, distanceMeters: number }`. Capped at the **5 most recent** — appending past that drops the oldest, because Firestore rewrites the whole document per element |
| `status` | `'active' \| 'verified' \| 'consumed' \| 'expired'` | `consumed` is how a spent grant is recorded |
| `grantExpiresAt` | `Timestamp?` | Set when a reading is accepted |
| `startedAt` | `Timestamp` | |
| `expiresAt` | `Timestamp` | `startedAt` + 24h, for a Firestore TTL policy. `grantExpiresAt` cannot serve this — it is optional and a failed session never has one |

## Cloud Functions

All three are **callable** functions, not HTTP endpoints — the client invokes them through the
SDK, which attaches the auth token automatically.

> [!NOTE]
> **Region: `asia-northeast3` (Seoul)**, agreed with the backend developer. The client passes
> it explicitly, because `getFunctions(app)` would otherwise default to `us-central1` and every
> callable would fail with `not-found`. Deploying anywhere else means updating
> `EXPO_PUBLIC_FUNCTIONS_REGION` in the app — say so before you do it.

### `verifyLocation`

The 50m radius and speed checks. They live here rather than in security rules because rules
have no `sqrt` and no trigonometry — a haversine distance is not expressible in them.

```ts
// request
{
  placeId: string;
  lat: number;
  lng: number;
  accuracy: number;      // metres, from the device
  capturedAt: string;    // ISO 8601
  isMock: boolean;       // device reported a mock provider. Android reports it; iOS sends false
  sessionId?: string;    // omitted on the first call of a session
}

// response
{
  sessionId: string;
  verified: boolean;
  distanceMeters: number;
  requiredRadiusMeters: number;
  accuracyMeters: number;
  reason?: 'out_of_radius' | 'implausible_speed' | 'poor_accuracy' | 'mock_location';
  grant?: { token: string; expiresAt: string };  // present only when verified; token IS the sessionId
}
```

> [!WARNING]
> **A rejection is a successful call.** Being 66m away is a normal outcome, not an error, so
> resolve with `verified: false` rather than throwing. 인증 실패 renders `distanceMeters`,
> `requiredRadiusMeters` and `accuracyMeters` as a table, so a bare boolean is not enough.
> Throw only for genuine faults: `unauthenticated`, `not-found` for an unknown `placeId`,
> `invalid-argument` for a malformed reading.

The `grant` is what actually unlocks the camera. Gating the shutter in the UI is an affordance
a patched build skips, so `issueTicket` requires the grant rather than trusting the client to
have passed through 카메라.

The `grant.token` **is** the session id. Ownership, expiry and single-use are read off the
session document — `userId`, `grantExpiresAt`, and `status` moving to `consumed` — so there is
no separate token record. Knowing someone else's session id gains nothing, because the `userId`
check still fails and clients cannot write the collection.

#### What the function adjudicates

Three gates, applied in this order. Each is a rejection, not a throw.

| Gate | Rule | `reason` |
| --- | --- | --- |
| Mock provider | `isMock` is `true` | `mock_location` |
| Accuracy | `accuracy` above **65** metres | `poor_accuracy` |
| Radius | Beyond the place's `radiusMeters` | `out_of_radius` |
| Speed | Implied speed above the thresholds below | `implausible_speed` |

**Accuracy is gated first, and at a global 65 m.** The device's `accuracy` is an error radius:
at `accuracy: 200` the user is somewhere within 200 m of the reported point, which makes a 50 m
verdict meaningless. 65 m rather than 50 m because Android in a city centre reports 40–60 m
routinely and legitimate users would otherwise bounce; the worst case admits someone 115 m away.
It is global rather than a per-place field, which would become a value nobody maintains by hand
as places multiply.

**A reading rejected for accuracy is not appended to `readings`.** A sample with 200 m of error
in that array would poison the speed calculation below and could get a legitimate user judged a
spoofer.

**Speed is triggered by distance, not by elapsed time.** GPS jitter alone reads as 100 km/h over
a short interval, so only pairs that moved far enough are evaluated:

| Comparison | Rule |
| --- | --- |
| Between two readings in a session | Evaluated only when they are **200 m or more** apart. Reject above **150 km/h** |
| Against the user's last issued ticket | Reject above **300 km/h** — covers KTX and domestic flights |

Distance is computed after subtracting the reported accuracy radius. A time-based trigger was
rejected during review: "skip the check when the readings are under 30 seconds apart" is evaded
permanently by moving the coordinate every 28 seconds, so the condition itself was the hole.

> [!NOTE]
> **Firebase App Check is not in the initial release.** It was proposed as the first tier of
> anti-spoofing — the one that blocks patched builds, emulators and direct function calls — and
> deferring it means `isMock` is an honest-client signal rather than a control, and that iOS,
> which has no mock-location API at all, rests on the radius and speed checks alone. This is a
> recorded, accepted risk; see the
> [review resolutions](../plans/2026-08-21-backend-contract-review-resolutions.md). Turning App
> Check on later changes nothing on this page.

### `issueTicket`

```ts
// request
{
  grantToken: string;
  photoPath: string;                        // Storage path, not a URL
  visibility: 'public' | 'private';
}

// response
{ ticketId: string; serial: string; ticketBalance: number }
```

Validates the grant is unexpired, unused, and belongs to the caller; confirms the caller is not
inside the per-place cooldown; confirms the object at `photoPath` exists and is owned by the
caller; then, in one transaction:

1. writes the ticket,
2. increments `users/{uid}.ticketBalance` and `ticketsIssued`, and recomputes `tier`,
3. increments `users/{uid}.placesVisited` **only if this is the caller's first ticket at this
   place** — the cooldown check already queries for it, so an empty result is a first visit,
4. increments `places/{placeId}.ticketCount` and `photoCount`,
5. writes a `places/{placeId}/gallery` entry **if** `visibility` is `public`.

Consumes the grant, so one verification mints one ticket.

Errors: `failed-precondition` with `details.errorCode` of `grant_expired`, `grant_consumed`, or
`cooldown_active`; `not-found` if the photo is missing. `cooldown_active` also carries
`details.nextAvailableAt` (ISO 8601), because 장소/상세 renders the date rather than a message.

#### Cooldown

One place can be minted more than once by the same user, after **30 days**. A daily window
reopens inside a single trip; a once-per-place lock removes any reason to return at all.

| Item | Value |
| --- | --- |
| Window | 30 days, same user and same place |
| Enforced in | **`issueTicket` only** |
| Measured from | That user's last `issuedAt` for that place |

`verifyLocation` deliberately does **not** check it. Two copies of one rule diverge, and the
authority to mint belongs to one function.

The client may read its own tickets, so 장소/상세 shows the next available date up front and
disables the 인증 entry point while the cooldown is active. That is guidance rather than
adjudication — the server stays the only enforcer — and the two cannot disagree, because both
read the same ticket documents.

The response returns the recomputed `tier` as well, because 티켓 발행 shows the tier progress
note immediately after minting.

### `enterRaffle`

```ts
// request
{ raffleId: string; idempotencyKey: string }   // key: [A-Za-z0-9_-]{1,64}

// response
{ entryId: string; ticketBalance: number }
```

Must debit `ticketBalance`, mark the spent tickets, and create the entry in a **single
transaction**. The balance check is server-authoritative for the same reason the GPS check is —
tickets have real value attached.

> [!NOTE]
> 티켓 절취 (the 반권 tear) is **client-side only**. It is the animation between 응모 and
> 응모완료; the server sees one `enterRaffle` call at the end of it. There is no `tearTicket`
> function, and the `STUB` / `USED` states are rendered from `spent`.

`idempotencyKey` must be letters, digits, `-` and `_` only, 1–64 characters, because a document
id cannot contain `/`. A UUID satisfies it. **The app generates it once when 응모 opens and
reuses it for every retry of that entry** — a key minted per call makes each retry a fresh entry,
and one dropped response then costs the user their tickets twice.

Errors: `failed-precondition` with `details.errorCode` of `insufficient_tickets` — this is the
No branch of `잔여 티켓 충족?` on 응모, so the app needs the code, not just a message;
`deadline-exceeded` for a closed raffle; `invalid-argument` for a malformed `idempotencyKey`.

## Cloud Storage

| Path | Written by | Rules |
| --- | --- | --- |
| `tickets/{uid}/{filename}` | Client, directly | `uid` must match the caller; `contentType` must be an image; enforce a size cap |
| `posts/{uid}/{filename}` | Client, directly | Same |

The client uploads the photo itself and passes only the resulting path to `issueTicket`. Going
through a function would mean the image crosses the function boundary twice for no benefit.

**EXIF is stripped by the app, on both paths.** Because the upload goes straight to Storage,
there is no moment at which the server holds the file — so this cannot be a backend job without
adding a Storage-triggered function that re-reads and re-writes every upload. Re-encoding an
image drops EXIF as a side effect, so one resize or compress pass before upload covers it.

This is consistent with the trust boundary rather than an exception to it: GPS adjudication
cannot trust the client because a ticket has real value and therefore an attacker, whereas EXIF
is the user's own privacy in their own photo, and patching the app to keep it harms only the
person who did. The coordinate is recorded in `verificationSessions` regardless, so nothing is
lost. Rules are unchanged — the size cap and `contentType` check stay where they are.

## Write ownership

This table is the specification for `firestore.rules`.

> [!WARNING]
> **Rules are not filters.** They judge whether a *query* is safe, and refuse it whole if it is
> not. A ticket list query without a matching condition does not come back narrowed to public
> tickets — it comes back `permission-denied`, and the symptom does not distinguish a rules
> problem from a query problem. Read the `tickets` row below with that in mind.

| Collection | Client read | Client write |
| --- | --- | --- |
| `artists` | any signed-in user | never |
| `courses` | any signed-in user | never |
| `places` | any signed-in user | never |
| `places/*/reviews` | any signed-in user | create, update and delete **own**, one per place. Never `likeCount` or the denormalised author fields |
| `places/*/gallery` | any signed-in user | **never** — written by `issueTicket` |
| `users` | own document; `nickname`, `avatarUrl` and `tier` of others | **create** own document once, with `ticketBalance`, `ticketsIssued` and `placesVisited` at literal `0` — reject the create otherwise. **update** own `nickname`, `avatarUrl`, `bio`, `followedArtistIds`, `profileVisibility`, `locale` — all six. **Never** `tier` or the counters |
| `tickets` | **`get`** — own, or `visibility == 'public'`. **`list`** — only when the query itself carries `userId == request.auth.uid` (보관함 is that query plus `visibility == 'private'`) | **never** — `issueTicket` only, except toggling own `visibility` |
| `raffles` | any signed-in user | never |
| `raffleEntries` | own entries | **never** — `enterRaffle` only |
| `posts` | any signed-in user | create own; update and delete own. Never the counts, and never `authorTier` |
| `verificationSessions` | never | **never** — `verifyLocation` only |

## Open questions

Still unresolved. Each needs a decision before the matching screen is built. The questions this
page opened on speed, cooldown, `serial`, EXIF and locales were answered in the
[2026-08-21 review resolutions](../plans/2026-08-21-backend-contract-review-resolutions.md) and
now live in the sections above rather than here.

| Question | Proposal | Blocking |
| --- | --- | --- |
| **Tier thresholds** | The keys are `club10` / `club20` / `clubGo` and the prototype shows a `TIER 10—19` label with a 0–10–20 gauge, so 10 and 20 issued tickets are the likely boundaries. Confirm, and decide whether tier is per-artist or global | **Yes.** `issueTicket` recomputes `tier` inside its transaction, so the function cannot be written without this |
| **Can a user review a place they have not verified?** | No. Requiring a ticket keeps 리뷰 consistent with the rest of the product — everything is earned by being there | Before 리뷰 is built |
| **Is `followedArtistIds` capped?** | 홈 is keyed to one selected artist at a time. Decide whether the set is capped and how the active one is chosen | Before 최애 찾기 is built |

## Related

- [2026-08-21 review resolutions](../plans/2026-08-21-backend-contract-review-resolutions.md) — every finding from the backend developer's review and the decision taken on it. **The changelog behind this page's current state**
- [`design/README.md`](../../design/README.md) — the prototype these shapes are read from
- [ADR 0006](../decisions/0006-adopt-the-prototype-as-the-design-source-of-truth.md) — why this document grew
- [connect-the-app-to-firebase.md](../how-to/connect-the-app-to-firebase.md) — how the app joins the project, and what to do before it does
- [ADR 0005](../decisions/0005-keep-firebase-behind-a-repository-boundary.md) — why the app reaches Firebase only through `src/lib/repositories/`
- [architecture.md](../explanation/architecture.md) — the product loop and the trust boundary these functions enforce
- [screens.md](screens.md) — which screen consumes which of these shapes
