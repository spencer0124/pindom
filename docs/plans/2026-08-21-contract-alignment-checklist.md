---
title: 2026-08-21 Contract Alignment Checklist
type: plan
status: draft
owner: zoyoong124@gmail.com
last-updated: 2026-08-21
audience: internal
---

# 2026-08-21 — Contract Alignment Checklist

> What was landed on `main` from the backend contract review, what the backend developer can now build against, and what is still owed on each side. Start here if you are the backend developer picking this branch up.

## Summary

The backend developer's review of [`backend-contract.md`](../reference/backend-contract.md) has
been folded into that document, and the app code that encoded the old shapes has been changed to
match. `main` is now the app-side reference: the contract states what the app expects, and the
repository layer under `src/lib/repositories/` implements it.

The decisions behind every item are in the
[review resolutions](2026-08-21-backend-contract-review-resolutions.md). This page is the
tracking view — what is done, what is blocked, and on whom.

> [!IMPORTANT]
> **One item needs a reply before security rules are written.** The review's proposed
> `users` update rule allows `nickname` and `avatarUrl` only; the contract needs all six fields
> it lists. Written as proposed, 프로필 편집, 언어 and 최애 찾기 fail with `permission-denied`.
> See [Owed by the app side](#owed-by-the-app-side).

## Landed — the contract now says this

Everything in this table is written into
[`backend-contract.md`](../reference/backend-contract.md) and is safe to implement against.

| Area | What changed |
| --- | --- |
| `verifyLocation` request | Gains `isMock: boolean` |
| `verifyLocation` reason | Gains `'mock_location'` |
| Accuracy gate | Global 65 m; rejected readings are **not** appended to the session |
| Speed check | Only pairs 200 m or more apart are evaluated; 150 km/h in-session, 300 km/h against the last ticket |
| `grant.token` | Defined as the session id — no separate token record |
| `verificationSessions.status` | Gains `'consumed'` |
| `verificationSessions.expiresAt` | New field, `startedAt` + 24h, for a TTL policy |
| `verificationSessions.readings` | Capped at the 5 most recent |
| `issueTicket` cooldown | 30 days per user per place, enforced only here |
| `issueTicket` errors | Gains `'cooldown_active'` with `details.nextAvailableAt` |
| `issueTicket` transaction | `placesVisited` increments only on a first visit |
| `serial` | `PD-XXXX-XXXX-XXXX`, Crockford Base32 without `I` `L` `O` `U`, Code128 barcode |
| `raffleEntries` id | `{uid}_{raffleId}_{idempotencyKey}`; key is `[A-Za-z0-9_-]{1,64}` |
| `places.geohash` | **Deleted** |
| `places.ticketCount` | Marked Function-only |
| `users` creation | Client creates its own document with the three counters at `0` |
| `tickets` reads | `get` and `list` split; a list query must carry `userId == uid` |
| Storage | EXIF stripping is the app's job, on both upload paths |
| Locales | Shipped set is `ko` and `en` |
| App Check | **Not** in the initial release |

## Landed — the app code now does this

| Change | Where |
| --- | --- |
| `LOCALES` narrowed to the shipped set | `src/lib/domain/locale.ts` |
| `isMock` added to the reading, and sent on the callable | `src/lib/domain/verification.ts`, `src/lib/repositories/firebase.ts` |
| `'mock_location'` added to the reason union **and** to the runtime validator | `src/lib/domain/verification.ts`, `src/lib/repositories/firebase.ts` |
| `nextAvailableAt` lifted out of `HttpsError.details` and typed on the failure | `src/lib/repositories/firebase.ts`, `src/lib/api/types.ts` |
| Sign-up writes `users/{uid}` at the caller's uid with counters at `0` | `src/lib/repositories/firebase.ts` |
| `enterRaffle` takes a caller-supplied idempotency key | `src/lib/repositories/types.ts`, both repository implementations |
| `listNearby` became `listAll`; the radius filter is gone | `src/lib/repositories/types.ts`, both repository implementations |
| Fixture serials and the fixture generator match the new format | `src/mocks/tickets.ts`, `src/lib/repositories/mock.ts` |
| Fixture accuracy failure raised above the 65 m gate | `src/mocks/verification.ts` |

Three of these were live defects rather than notation:

- **Sign-up wrote the user document with a generated id** (`addDoc`), storing the uid as a field.
  The agreed rule matches on the document id, so every sign-up would have been refused.
- **The idempotency key embedded a timestamp**, so it changed on every call. One retried
  `enterRaffle` would have debited the user's tickets twice.
- **The reason validator did not list `'mock_location'`**, so that rejection would have silently
  rendered as `out_of_radius` — the wrong explanation, with no error anywhere.

## Owed by the app side

| # | Item | Why it is blocking |
| --- | --- | --- |
| 1 | **Reply on the `users` update rule** — all six fields, not two | The review said it will write rules unless it hears otherwise, and this one reverses `allow create` if it goes the other way |
| 2 | **Re-raise Tier thresholds** | `issueTicket` recomputes `tier` in its transaction; the function cannot be finished without the boundaries and the per-artist/global answer |
| 3 | Confirm the remaining answers | Code128 for the barcode; both upload paths re-encode; no objection to the speed thresholds; `tickets` list queries already carry `userId == uid` |

## Owed by the app side, not blocking anyone

Work this repository still has to do. None of it blocks the backend.

| Item | Note |
| --- | --- |
| Generate the raffle idempotency key once when 응모 opens | The repository takes it now; no screen supplies it yet — 응모 is still a placeholder |
| Read the device mock-location flag on GPS인증 | The field exists on the reading; nothing populates it yet |
| 인증 실패 copy for `poor_accuracy` and `mock_location` | Both are recoverable failures worth explaining |
| 장소/상세 cooldown display | Read own tickets for the place; show the next available date and disable the 인증 entry point |
| Re-encode images before upload | Needs an image-manipulation dependency; no upload code exists yet |
| Settle the 지도 query scope | `listAll` returns everything; whether the screen filters for display is a rendering decision |

## Still open on the contract

| Question | Blocking |
| --- | --- |
| Tier thresholds, and per-artist vs global | **Yes** — see above |
| Can a user review a place they have not verified? | Before 리뷰 is built |
| Is `followedArtistIds` capped, and how is the active 최애 chosen? | Before 최애 찾기 is built |

## Verification

Both gates pass on this branch:

```bash
yarn typecheck   # tsc --noEmit
yarn lint        # ESLint + markdownlint
```

No screen consumes the repository layer yet — every route is still a placeholder — so these are
type and lint guarantees, not behavioural ones. The changed repository code has not been run
against a live Firebase project.

## Related

- [2026-08-21 review resolutions](2026-08-21-backend-contract-review-resolutions.md) — the reasoning behind every row above
- [`backend-contract.md`](../reference/backend-contract.md) — the contract itself, now updated
- [`connect-the-app-to-firebase.md`](../how-to/connect-the-app-to-firebase.md) — how the app joins the project
- [`architecture.md`](../explanation/architecture.md) — the trust boundary these decisions keep appealing to
- [`screen-implementation.md`](screen-implementation.md) — the order screens get built in
