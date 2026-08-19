---
title: Backend Contract
type: reference
status: draft
owner: zoyoong124@gmail.com
last-updated: 2026-08-19
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
> Status is `draft`. Fields are derived from what the prototype displays — see
> [`design/README.md`](../../design/README.md) — not from an agreed backend. Everything here is
> proposed until the backend developer has reviewed it. Disagreements should be resolved by
> editing this page, not by working around it in one codebase.

> [!NOTE]
> **This document grew substantially on 2026-08-19.** The prototype
> ([ADR 0006](../decisions/0006-adopt-the-prototype-as-the-design-source-of-truth.md)) added
> Artist, Review, Course, Tier and Vault, and made the community feed per-artist. If you read
> an earlier version, re-read `artists`, `reviews`, `courses`, and the changed fields on
> `users`, `places`, `posts` and `tickets`.

## Conventions

| Rule | Value |
| --- | --- |
| Collection names | plural, `lowerCamelCase` — `places`, `raffleEntries` |
| Field names | `lowerCamelCase` |
| Dates | Firestore `Timestamp`. Never a string, never a number |
| Coordinates | Firestore `GeoPoint` |
| Absent values | omit the field. Firestore reads a missing field as `undefined`, never `null`, so the app types them `field?: T` |
| Money-like counters | written only by Cloud Functions, never by a client |
| Localized strings | a map keyed by locale: `{ ko, en, ja, zh }`. The prototype's copy helper is `L(ko, en, ja, zh)`, so any user-visible string that differs per language is a map, not a string |

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
| `geohash` | `string` | Required for the 지도 nearby query |
| `radiusMeters` | `number` | Verification radius. Defaults to 50; per-place so it stays tunable without a deploy |
| `coverImageUrl` | `string` | |
| `ticketCount` | `number` | How many tickets have been minted here. Feeds 홈 recommendations |
| `createdAt` | `Timestamp` | |

### `users/{uid}` — 마이페이지

Document id is the Firebase Auth uid. Created on sign-up.

| Field | Type | Notes |
| --- | --- | --- |
| `email` | `string` | |
| `nickname` | `string` | Shown as post author |
| `avatarUrl` | `string?` | |
| `bio` | `string?` | Editable on 프로필 편집 |
| `followedArtistIds` | `string[]` | The 최애 set chosen at 최애 찾기 and edited on 프로필 편집. Keys the home screen and the community boards |
| `ticketBalance` | `number` | **Function-only.** Read by 홈 and the 잔여 티켓 충족 branch on 응모 |
| `ticketsIssued` | `number` | **Function-only.** 마이페이지 stat |
| `placesVisited` | `number` | **Function-only.** 마이페이지 stat |
| `tier` | `'club10' \| 'club20' \| 'clubGo'` | **Function-only.** Derived from `ticketsIssued`; rendered as a badge beside the nickname and on every post |
| `profileVisibility` | `'public' \| 'private'` | Set on 프로필 편집 |
| `locale` | `'ko' \| 'en' \| 'ja' \| 'zh'` | Set on 언어 |
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
| `serial` | `string` | Rendered as the barcode on 티켓 발행 |
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
| `readings` | `array` | `{ location: GeoPoint, accuracy: number, capturedAt: Timestamp, distanceMeters: number }` |
| `status` | `'active' \| 'verified' \| 'expired'` | |
| `grantExpiresAt` | `Timestamp?` | Set when a reading is accepted |
| `startedAt` | `Timestamp` | |

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
  sessionId?: string;    // omitted on the first call of a session
}

// response
{
  sessionId: string;
  verified: boolean;
  distanceMeters: number;
  requiredRadiusMeters: number;
  accuracyMeters: number;
  reason?: 'out_of_radius' | 'implausible_speed' | 'poor_accuracy';
  grant?: { token: string; expiresAt: string };  // present only when verified
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

Validates the grant is unexpired, unused, and belongs to the caller; confirms the object at
`photoPath` exists and is owned by the caller; then, in one transaction:

1. writes the ticket,
2. increments `users/{uid}.ticketBalance` and `ticketsIssued`, and recomputes `tier`,
3. increments `places/{placeId}.ticketCount` and `photoCount`,
4. writes a `places/{placeId}/gallery` entry **if** `visibility` is `public`.

Consumes the grant, so one verification mints one ticket.

Errors: `failed-precondition` with `details.errorCode` of `grant_expired` or `grant_consumed`;
`not-found` if the photo is missing.

The response returns the recomputed `tier` as well, because 티켓 발행 shows the tier progress
note immediately after minting.

### `enterRaffle`

```ts
// request
{ raffleId: string; idempotencyKey: string }

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

Errors: `failed-precondition` with `details.errorCode` of `insufficient_tickets` — this is the
No branch of `잔여 티켓 충족?` on 응모, so the app needs the code, not just a message;
`deadline-exceeded` for a closed raffle.

## Cloud Storage

| Path | Written by | Rules |
| --- | --- | --- |
| `tickets/{uid}/{filename}` | Client, directly | `uid` must match the caller; `contentType` must be an image; enforce a size cap |
| `posts/{uid}/{filename}` | Client, directly | Same |

The client uploads the photo itself and passes only the resulting path to `issueTicket`. Going
through a function would mean the image crosses the function boundary twice for no benefit.

## Write ownership

This table is the specification for `firestore.rules`.

| Collection | Client read | Client write |
| --- | --- | --- |
| `artists` | any signed-in user | never |
| `courses` | any signed-in user | never |
| `places` | any signed-in user | never |
| `places/*/reviews` | any signed-in user | create, update and delete **own**, one per place. Never `likeCount` or the denormalised author fields |
| `places/*/gallery` | any signed-in user | **never** — written by `issueTicket` |
| `users` | own document; `nickname`, `avatarUrl` and `tier` of others | own `nickname`, `avatarUrl`, `bio`, `followedArtistIds`, `profileVisibility`, `locale`. **Never** `tier` or the counters |
| `tickets` | own tickets, public and private alike (보관함 is just `visibility == 'private'`); others' only where `visibility == 'public'` | **never** — `issueTicket` only, except toggling own `visibility` |
| `raffles` | any signed-in user | never |
| `raffleEntries` | own entries | **never** — `enterRaffle` only |
| `posts` | any signed-in user | create own; update and delete own. Never the counts, and never `authorTier` |
| `verificationSessions` | never | **never** — `verifyLocation` only |

## Open questions

Unresolved. Each needs a decision before the matching screen is built.

| # | Question | Proposal |
| --- | --- | --- |
| 1 | Speed-check threshold and window | Reject above 150 km/h implied between two readings in a session, and above 300 km/h implied against the user's last issued ticket |
| 2 | Can one place be minted more than once per user? | Yes, with a cooldown. Otherwise 컬렉션 fills once and the loop ends |
| 3 | How is `serial` generated? | Any collision-free scheme; the prototype renders `No.0417`-style numbers |
| 4 | Is EXIF stripped on upload? | Strip it. It is a location leak on a public feed, and the GeoPoint is already recorded |
| 5 | Accuracy gate | Reject readings above some `accuracy`, or the 50m check is meaningless when the device reports ±200m |
| 6 | **Tier thresholds** | The keys are `club10` / `club20` / `clubGo` and the prototype shows a `TIER 10—19` label with a 0–10–20 gauge, so 10 and 20 issued tickets are the likely boundaries. Confirm, and decide whether tier is per-artist or global |
| 7 | **Can a user review a place they have not verified?** | No. Requiring a ticket keeps 리뷰 consistent with the rest of the product — everything is earned by being there |
| 8 | **Which locales ship?** | The prototype writes copy in `ko`, `en`, `ja`, `zh`. Seeded content has to exist in each one shipped, so this is a content cost, not just a config flag |
| 9 | **Is `followedArtistIds` capped?** | 홈 is keyed to one selected artist at a time. Decide whether the set is capped and how the active one is chosen |

## Related

- [`design/README.md`](../../design/README.md) — the prototype these shapes are read from
- [ADR 0006](../decisions/0006-adopt-the-prototype-as-the-design-source-of-truth.md) — why this document grew
- [connect-the-app-to-firebase.md](../how-to/connect-the-app-to-firebase.md) — how the app joins the project, and what to do before it does
- [ADR 0005](../decisions/0005-keep-firebase-behind-a-repository-boundary.md) — why the app reaches Firebase only through `src/lib/repositories/`
- [architecture.md](../explanation/architecture.md) — the product loop and the trust boundary these functions enforce
- [screens.md](screens.md) — which screen consumes which of these shapes
