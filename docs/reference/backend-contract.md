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
> Status is `draft`. Fields are derived from what the Figma frames display — see
> [screens.md](screens.md) — not from an agreed backend. Everything here is proposed until the
> backend developer has reviewed it. Disagreements should be resolved by editing this page,
> not by working around it in one codebase.

## Conventions

| Rule | Value |
| --- | --- |
| Collection names | plural, `lowerCamelCase` — `places`, `raffleEntries` |
| Field names | `lowerCamelCase` |
| Dates | Firestore `Timestamp`. Never a string, never a number |
| Coordinates | Firestore `GeoPoint` |
| Absent values | omit the field. Firestore reads a missing field as `undefined`, never `null`, so the app types them `field?: T` |
| Money-like counters | written only by Cloud Functions, never by a client |

## Collections

### `places/{placeId}` — 촬영지

Seeded by the backend. Read by 지도, 홈, 장소/상세, and by `verifyLocation` — the authoritative
coordinate must come from here, never from the client.

| Field | Type | Notes |
| --- | --- | --- |
| `name` | `string` | 주문진 방파제 |
| `description` | `string` | Shown on 장소/상세 |
| `address` | `string` | |
| `workTitle` | `string` | The drama or music video it appeared in |
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
| `ticketBalance` | `number` | **Function-only.** Read by 홈 and the 잔여 티켓 충족 branch on 응모 |
| `ticketsIssued` | `number` | **Function-only.** 마이페이지 stat |
| `placesVisited` | `number` | **Function-only.** 마이페이지 stat |
| `createdAt` | `Timestamp` | |

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
| `visibility` | `'public' \| 'private'` | Set on 공개설정 |
| `issuedAt` | `Timestamp` | |
| `spent` | `boolean` | |
| `spentOnEntryId` | `string?` | Set when consumed by a raffle entry |

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
`photoPath` exists and is owned by the caller; then writes the ticket and increments
`users/{uid}.ticketBalance`. Consumes the grant so one verification mints one ticket.

Errors: `failed-precondition` with `details.errorCode` of `grant_expired` or `grant_consumed`;
`not-found` if the photo is missing.

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
| `places` | any signed-in user | never |
| `users` | own document; `nickname` and `avatarUrl` of others | own `nickname`, `avatarUrl` only. Never the counters |
| `tickets` | own tickets; others' only where `visibility == 'public'` | **never** — `issueTicket` only |
| `raffles` | any signed-in user | never |
| `raffleEntries` | own entries | **never** — `enterRaffle` only |
| `posts` | any signed-in user | create own; update and delete own. Never the counts |
| `verificationSessions` | never | **never** — `verifyLocation` only |

## Open questions

Unresolved. Each needs a decision before the matching screen is built.

| # | Question | Proposal |
| --- | --- | --- |
| 1 | Speed-check threshold and window | Reject above 150 km/h implied between two readings in a session, and above 300 km/h implied against the user's last issued ticket |
| 2 | Can one place be minted more than once per user? | Yes, with a cooldown. Otherwise 컬렉션 fills once and the loop ends |
| 3 | How is `serial` generated? | Any collision-free scheme; 티켓 발행 only renders it |
| 4 | Is EXIF stripped on upload? | Strip it. It is a location leak on a public feed, and the GeoPoint is already recorded |
| 5 | Accuracy gate | Reject readings above some `accuracy`, or the 50m check is meaningless when the device reports ±200m |

## Related

- [connect-the-app-to-firebase.md](../how-to/connect-the-app-to-firebase.md) — how the app joins the project, and what to do before it does
- [ADR 0005](../decisions/0005-keep-firebase-behind-a-repository-boundary.md) — why the app reaches Firebase only through `src/lib/repositories/`
- [architecture.md](../explanation/architecture.md) — the product loop and the trust boundary these functions enforce
- [screens.md](screens.md) — which screen consumes which of these shapes
