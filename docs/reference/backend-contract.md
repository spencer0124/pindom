---
title: Backend Contract
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-08-26
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
> **This page describes a system that is running.** It began as a prediction — field names read
> off what the prototype displays, see [`design/README.md`](../../design/README.md) — but the
> backend has since been built and deployed against it, and every divergence found in the process
> has been folded back in. Where this page and `pindom-1234` disagree now, assume this page is
> stale and say so, rather than working around it in one codebase.
>
> Two questions remain open; they are at the [bottom](#open-questions) and neither blocks the app.

> [!NOTE]
> **Two rounds have been folded in.** Each has its own changelog:
>
> | Round | Changelog | What it was |
> | --- | --- | --- |
> | 2026-08-21 | [review resolutions](../plans/2026-08-21-backend-contract-review-resolutions.md) | The backend developer read this page and argued with it |
> | 2026-08-22 | [handoff reconciliation](../plans/2026-08-22-backend-handoff-reconciliation.md) | They **built and deployed it**, and six things came back different |
>
> The second round matters more, because it is no longer a proposal: rules, three functions and
> seed data are live on `pindom-1234`. Where this page and the deployed backend disagreed, this
> page has been corrected — the running system is the evidence. Re-read `verifyLocation`
> (`capturedAt` is now gated), `issueTicket` and `enterRaffle` (both return more than they used
> to), the `users` and `posts` write-ownership rows, and 리뷰, which lost its one-per-place
> guarantee.

## Conventions

| Rule | Value |
| --- | --- |
| Collection names | plural, `lowerCamelCase` — `places`, `raffleEntries` |
| Field names | `lowerCamelCase` |
| Dates | Firestore `Timestamp`. Never a string, never a number |
| Client-written `createdAt` | `serverTimestamp()`, never a device clock. Rules compare it against `request.time` and reject a mismatch — a future timestamp would otherwise hold the top of the feed forever |
| Coordinates | Firestore `GeoPoint` |
| Absent values | omit the field. Firestore reads a missing field as `undefined`, never `null`, so the app types them `field?: T` |
| Money-like counters | written only by Cloud Functions, never by a client — **except on a create**, where the client writes literal `0` and rules pin it there. This applies to `users` at sign-up and to `likeCount` / `commentCount` on a new post or review. "Function-only" therefore means *never updated* by a client, not *never sent*: omitting a counter from a create is refused just as surely as sending a nonzero one |
| Localized strings | a map keyed by locale: `{ ko, en }` — the shipped set. The prototype's copy helper is `L(ko, en, ja, zh)` and still emits four; the two extra keys are not part of the contract and are read as absent. Any user-visible string that differs per language is a map, not a string |

## Collections

### `places/{placeId}` — 촬영지

Seeded by the backend, from TourAPI — the app never calls TourAPI itself, so this collection is
the only 촬영지 source the client has. Read by 지도, 홈, 장소/상세, and by `verifyLocation` — the
authoritative coordinate must come from here, never from the client.

| Field | Type | Notes |
| --- | --- | --- |
| `contentId` | `string` | TourAPI `contentid`. The dedupe key when the backend re-imports — same `contentId`, same document. Omitted for places registered by hand that TourAPI does not carry |
| `name` | `LocalizedString` | 주문진 방파제 / Jumunjin Breakwater / 注文津防波堤 |
| `roman` | `string` | Latin caption shown under the Korean name — `Jumunjin Breakwater` |
| `description` | `LocalizedString` | Shown on 장소/상세 |
| `address` | `string` | |
| `region` | `LocalizedString` | 강원 강릉 — rendered beside the work title |
| `workTitle` | `LocalizedString` | The drama or music video it appeared in |
| `workKind` | `'mv' \| 'drama' \| 'self'` | Drives the `MV / GANGNEUNG` caption and the map filter |
| `artistIds` | `string[]` | Which 최애 this place belongs to. The map and 홈 filter on it |
| `verifyCount` | `number` | **Dead field — nothing writes it.** `verifyLocation` never touches `places`, and `issueTicket` increments `ticketCount` and `photoCount` but not this. 장소/상세 renders it as `0` forever. Either `verifyLocation` increments it on an accepted reading, or the stat comes off the screen — the current state shows a number that is not one |
| `photoCount` | `number` | 사진 stat on 장소/상세. Incremented by `issueTicket` on **every** mint, 보관함 included, so it counts photos taken here rather than photos the 갤러리 shows. The screen was labelled 공개 사진 and now reads 촬영된 사진 — the counter is the more useful statistic and the word 공개 was the part that was never true (decided 2026-08-26) |
| `reviewCount` | `number` | **Dead field — nothing writes it.** Reviews are client-written and none of the three functions touch them, so this is `0` forever. 리뷰 counts the list it already loaded. Seeded at `0`; drop the field when the seed does |
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

**`tier` must be absent from that create.** It is a function-only field, and the deployed rules
refuse a create that carries it — otherwise a new account could hand itself a `clubGo` badge, and
every later author cross-check would then validate against the forged value. A user document with
no `tier` yet reads as `club10`, in the app's mappers and in the rules alike.

| Field | Type | Notes |
| --- | --- | --- |
| `email` | `string` | |
| `nickname` | `string` | Shown as post author |
| `avatarUrl` | `string?` | |
| `bio` | `string?` | Editable on 프로필 편집 |
| `followedArtistIds` | `string[]` | The 최애 set chosen at 최애 찾기 and edited on 프로필 편집. Keys the home screen and the community boards. **Uncapped**, and the active one is the user's last explicit chip tap, persisted on the device (decided 2026-08-26) |
| `ticketBalance` | `number` | **Function-only.** Read by 홈 and the 잔여 티켓 충족 branch on 응모 |
| `ticketsIssued` | `number` | **Function-only.** 마이페이지 stat |
| `placesVisited` | `number` | **Function-only.** 마이페이지 stat. Increments only on the caller's **first** ticket at a given place |
| `tier` | `'club10' \| 'club20' \| 'clubGo'` | **Function-only.** Recomputed from `ticketsIssued` inside `issueTicket` — `club10` 0–19, `club20` 20–29, `clubGo` 30+ (confirmed 2026-08-26), **global, not per-artist**. Rendered as a badge beside the nickname and on every post. Issued count, never balance: a balance-derived tier would demote the user every time they spend on a raffle |
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
| `placeCount` | `number` | Written by the **seed**, not by a function — it counts seeded 촬영지, which only the seed creates. Shown on 최애 찾기 and, since 2026-08-26, in the 커뮤니티 board header |
| `memberCount` | `number` | **Dead field, and the app no longer reads it.** Following an artist is a write to the *user's* `followedArtistIds`, and no function watches that, so this was `0` for every board. Reviving it needs a Firestore trigger on `users` — a fourth deployment unit for a decorative number. The 커뮤니티 header prints `촬영지 n곳` instead and `Artist` has dropped the field (decided 2026-08-26). Drop it from the seed when convenient |
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

A subcollection, because reviews are only ever read in the context of one place. Client-writable.

> [!WARNING]
> **Neither "one per place" nor "you must have been there" is enforced.** The app writes reviews
> with `addDoc`, so the document id is generated and carries no `ticketId`. Rules cannot run a
> query, so with no ticket reference on the document there is no expression that can ask whether
> this user has ever verified here — the check is not weak, it is unwritable. As deployed, a user
> can review a 촬영지 they have never visited, as many times as they like.
>
> The revival path is two changes and costs one app edit: write the review at document id
> `ticketId` and send `ticketId` as a field. Rules can then read `tickets/{ticketId}`, confirm the
> caller owns it and that it belongs to this place, and the id itself makes it one review per
> ticket. The backend has left the rule stubbed in `firestore.rules` for that day.

| Field | Type | Notes |
| --- | --- | --- |
| `authorId` | `string` | |
| `authorNickname` | `string` | Denormalised. **Written by the client, and rules reject it unless it equals the author's own `users` document value** |
| `authorTier` | `'club10' \| 'club20' \| 'clubGo'` | Denormalised, cross-checked the same way. Without that check anyone could post under someone else's name wearing a `clubGo` badge |
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
| `boardId` | `string` | The `artists/{artistId}` whose board this post belongs to. **The feed is per artist board, never global**, so every query filters on it |
| `authorId` | `string` | |
| `authorNickname` | `string` | Denormalised so the feed is one query. Cross-checked against the author's `users` document, as on 리뷰 |
| `authorTier` | `'club10' \| 'club20' \| 'clubGo'` | Denormalised, cross-checked the same way. Rendered as the badge on every card |
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

All three are deployed, 2nd gen, `minInstances: 0`. **A cold call takes 2–4 seconds**, which is a
UI requirement rather than a footnote: GPS인증 has to hold a believable loading state for that
long on the first verification of a session. `maxInstances: 10` caps the blast radius of a
scripted attack while App Check is out; `verifyLocation` gets a warm instance before launch.

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
  capturedAt: string;    // ISO 8601. Must be within ±5 minutes of server time
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

> [!IMPORTANT]
> **`distanceMeters` is the adjudicated distance, not the raw one.** The function subtracts the
> reported accuracy radius before judging, and returns that same reduced number — 60 m away with
> `accuracy: 15` is adjudicated, and reported, as 45 m. The two agree on purpose, so that 인증
> 실패's table cannot contradict the verdict printed beside it.
>
> The app computes its own raw haversine distance for 지도 and 홈. **Those two numbers are
> supposed to differ**, and the server's is always the smaller. Do not "fix" one to match the
> other, and do not feed a locally computed distance into a verification screen.

> [!WARNING]
> **A rejection is a successful call.** Being 66m away is a normal outcome, not an error, so
> resolve with `verified: false` rather than throwing. 인증 실패 renders `distanceMeters`,
> `requiredRadiusMeters` and `accuracyMeters` as a table, so a bare boolean is not enough.
> Throw only for genuine faults: `unauthenticated`, `not-found` for an unknown `placeId`,
> `invalid-argument` for a malformed reading.

> [!WARNING]
> **`capturedAt` outside server time ±5 minutes throws `invalid-argument`.** It is a throw and
> not a rejection because it is not a verdict about where the user is — it is a malformed
> reading, and the screen has nothing to render in its distance table.
>
> The reason it is checked at all: `capturedAt` is the denominator of every speed calculation and
> it comes from the device. Backdate it and any movement looks slow, which disables the speed
> gates entirely. Five minutes rather than seconds because device clocks genuinely drift.
>
> The app satisfies this by submitting a reading as soon as it is measured. The flow that would
> break it is holding a reading and re-sending it later — do not build one.

The `grant` is what actually unlocks the camera. Gating the shutter in the UI is an affordance
a patched build skips, so `issueTicket` requires the grant rather than trusting the client to
have passed through 카메라.

The `grant.token` **is** the session id. Ownership, expiry and single-use are read off the
session document — `userId`, `grantExpiresAt`, and `status` moving to `consumed` — so there is
no separate token record. Knowing someone else's session id gains nothing, because the `userId`
check still fails and clients cannot write the collection.

**The grant is valid for 10 minutes** — long enough to frame and take a photo, short enough that a
captured token is not a standing licence to mint.

#### What the function adjudicates

Four gates, in the order the deployed function applies them. Each is a rejection, not a throw —
the `capturedAt` check above is the only part of this function that throws.

| # | Gate | Rule | `reason` |
| --- | --- | --- | --- |
| 1 | Mock provider | `isMock` is `true` | `mock_location` |
| 2 | Accuracy | `accuracy` above **65** metres | `poor_accuracy` |
| 3 | Radius | Beyond the place's `radiusMeters` | `out_of_radius` |
| 4 | Speed | Implied speed above either threshold below | `implausible_speed` |

**Accuracy is gated before position, and at a global 65 m.** The device's `accuracy` is an error radius:
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
| Against the user's last issued ticket | Reject above **300 km/h** — covers KTX and domestic flights. Evaluated on the **first measurement of a session only**: arriving implausibly fast is a property of the arrival, and every measurement after it is covered by the in-session pairs above. Running it every ping costs two extra document reads for the same verdict |

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
{
  ticketId: string;
  serial: string;
  ticketBalance: number;
  tier: 'club10' | 'club20' | 'clubGo';
}
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

**`photoPath` must start with `tickets/{uid}/` for the calling uid.** The function checks the
prefix *and* that an object exists there; a path outside the caller's own folder is
`invalid-argument`, and a path with nothing at it is `not-found`. Without the prefix check a
caller could pass someone else's photo path and mint a ticket over their picture. The upload
therefore has to complete before the call — the function reads the object to build the download
URL it writes to `tickets.photoUrl`.

Errors: `failed-precondition` with `details.errorCode` of `grant_expired`, `grant_consumed`, or
`cooldown_active`; `not-found` if the photo is missing; `invalid-argument` for a `photoPath`
outside `tickets/{uid}/`. `cooldown_active` also carries `details.nextAvailableAt` (ISO 8601),
because 장소/상세 renders the date rather than a message.

`grant_expired` covers three cases that look the same from the client: expired, owned by someone
else, or never verified. `grant_consumed` is the retry case — one grant is one ticket, so a
re-sent `grantToken` never mints a second.

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
{ entryId: string; ticketBalance: number; ticketIds: string[]; ticketsSpent: number }
```

Must debit `ticketBalance`, mark the spent tickets, and create the entry in a **single
transaction**. The balance check is server-authoritative for the same reason the GPS check is —
tickets have real value attached.

`ticketIds` and `ticketsSpent` come back because 응모완료 names the tickets it consumed rather than
showing a count. **Tickets are spent oldest first** — no rule said which, and oldest-first is both
the friendlier choice and the one that needs no explanation in the UI.

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
| `tickets/{uid}/{filename}` | Client, directly | `uid` must match the caller; `contentType` must be an image; **under 10 MB** |
| `posts/{uid}/{filename}` | Client, directly | Same |

**Deleting your own file is allowed**, on both paths — a deleted post or replaced photo should not
leave an orphan in the bucket. This needed its own rule rather than falling out of the write rule:
a delete request carries no `request.resource`, so the image-type and size checks throw on it
unless delete is handled separately.

**Listing is closed on both paths.** In Storage rules `read` grants `get` and `list` together, and
a readable `list` would let anyone walk `tickets/{someone else}/` and pull down the photos behind
their `private` tickets — the one thing 보관함 promises not to expose. Reading a single object
still works for any signed-in user, which is what a download URL needs.

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
| `places/*/reviews` | any signed-in user | create, update (`text`, `tags`) and delete **own**. `likeCount` must be present and literal `0` on create, and is never written again by a client. `authorNickname` and `authorTier` **are** client-written, and rules reject them unless they match the author's `users` document. **Not** limited to one per place, and not limited to places the author verified — see the warning on 리뷰 |
| `places/*/gallery` | any signed-in user | **never** — written by `issueTicket` |
| `users` | **own document only** | **create** own document once, with `ticketBalance`, `ticketsIssued` and `placesVisited` at literal `0` and no `tier` — reject the create otherwise. **update** own `nickname`, `avatarUrl`, `bio`, `followedArtistIds`, `profileVisibility`, `locale` — all six, and nothing else in the same write. **Never** `tier` or the counters |
| `tickets` | **`get`** — own, or `visibility == 'public'`. **`list`** — only when the query itself carries `userId == request.auth.uid` (보관함 is that query plus `visibility == 'private'`) | **never** — `issueTicket` only, except toggling own `visibility` |
| `raffles` | any signed-in user | never |
| `raffleEntries` | own entries | **never** — `enterRaffle` only |
| `posts` | any signed-in user | create own; update (`body`, `imageUrls`) and delete own. `likeCount` and `commentCount` must be present and literal `0` on create, and are never written again by a client. `authorNickname` and `authorTier` are client-written and cross-checked, as on 리뷰 |
| `verificationSessions` | never | **never** — `verifyLocation` only |

> [!NOTE]
> **Reading another user's document is closed, and that is deliberate.** An earlier version of
> this table opened `nickname`, `avatarUrl` and `tier` to any signed-in user. Firestore rules
> cannot grant a subset of fields — `allow get` opens the whole document, `email` included — so
> the choice was the whole document or none of it.
>
> Nothing needs it. There is no other-user profile screen in the prototype, and the feed and 리뷰
> already carry denormalised author fields for exactly this reason. When such a screen is
> designed, the answer is a `userProfiles/{uid}` document holding only the three public fields,
> not a loosened rule here.

## Open questions

**None are open.** Answered questions do not stay here — speed, cooldown, `serial`, EXIF and
locales were settled in the
[2026-08-21 review resolutions](../plans/2026-08-21-backend-contract-review-resolutions.md);
tier thresholds and the review-visit question were settled by the 2026-08-22 deployment; and the
last two were decided on 2026-08-26. All of them now live in the sections above; this section is
kept as the record of where each answer came from.

The two this section carried last — whether `followedArtistIds` is capped, and whether `clubGo`
belongs at 30 — were decided in the
[2026-08-26 integration open items](../plans/2026-08-26-integration-open-items.md):

- **`followedArtistIds` is uncapped**, and the active 최애 is the user's last explicit chip tap,
  persisted on the device. A cap of one was considered and rejected: 커뮤니티's board chips and
  the 지도 filter are both built per followed artist, so capping the set at one would empty two
  screens' worth of affordance to remove an ambiguity that the persisted selection already
  removes. What was actually wrong was the *rule*, not the size — the store was in-memory, so
  every cold start fell back to `followedArtistIds[0]`, a default nobody chose
- **`clubGo` stays at 30.** Confirmed rather than left open because it is free today and stops
  being free the first time an account crosses whatever number ships — at that point changing it
  demotes someone

Two further questions were answered by the deployed backend rather than by a decision, and both
answers are already written into the sections above:

- **Tier thresholds** — `club10` 0–19, `club20` 20–29, `clubGo` 30+, on `ticketsIssued`, global.
  The band width of 10 comes from the prototype's `TIER 10—19` label
- **Can a user review a place they have not verified?** — the intended answer was no; the
  deployed answer is **yes**, because the app writes reviews with a generated id and no
  `ticketId`, which leaves rules with nothing to check against. **Accepted for the 공모전** on
  2026-08-26: nothing in the judging depends on review integrity, and requiring a ticket makes
  the demo materially harder to populate. Reviving it is not expensive — the app writes the
  review at document id `ticketId` and sends `ticketId` as a field, and rules gain two lines
  confirming the caller owns that ticket and that it belongs to this place, which also makes it
  one review per ticket for free. The 리뷰 warning above records the same recipe

## Related

- [2026-08-22 handoff reconciliation](../plans/2026-08-22-backend-handoff-reconciliation.md) — what the deployed backend does differently from what this page said, and what the app still owes. **The most recent changelog behind this page**
- [2026-08-21 review resolutions](../plans/2026-08-21-backend-contract-review-resolutions.md) — every finding from the backend developer's review and the decision taken on it. The round before that
- [`design/README.md`](../../design/README.md) — the prototype these shapes are read from
- [ADR 0006](../decisions/0006-adopt-the-prototype-as-the-design-source-of-truth.md) — why this document grew
- [connect-the-app-to-firebase.md](../how-to/connect-the-app-to-firebase.md) — how the app joins the project, and what to do before it does
- [ADR 0005](../decisions/0005-keep-firebase-behind-a-repository-boundary.md) — why the app reaches Firebase only through `src/lib/repositories/`
- [architecture.md](../explanation/architecture.md) — the product loop and the trust boundary these functions enforce
- [screens.md](screens.md) — which screen consumes which of these shapes
