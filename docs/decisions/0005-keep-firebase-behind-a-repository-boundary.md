---
title: Keep Firebase Behind a Repository Boundary
type: adr
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-08-19
audience: internal
---

# 0005 — Keep Firebase Behind a Repository Boundary

> The backend is Firebase, owned entirely by the backend developer. The app reaches it through one directory, and the vendored axios layer that assumed a REST server is superseded.

## Status

Accepted and implemented. `src/lib/domain/`, `src/mocks/` and `src/lib/repositories/` exist,
with both implementations behind the boundary. No screen consumes them yet — the route
skeletons are still placeholders.

## Context

The backend was deferred at scaffold time. `architecture.md` said so plainly rather than
describing an intention, and left three things half-shaped: an idle axios layer in
`src/lib/api/`, a provisional endpoint list in `endpoints.ts`, and a commented Firebase block
in `.env.example`.

The decision has now been made under two constraints that matter more than architectural
preference:

- **Firebase, and the backend developer owns all of it** — project, schema, rules, functions,
  billing. The app developer writes no server code.
- **A 공모전 deadline under a month.** Work that does not produce a screen has to justify
  itself.

Three properties of Firebase shape what follows.

**It is an SDK, not an API.** The normal way to use Firestore is to call it directly from the
client, with security rules as the authorisation layer. There is a REST API, but its wire
format is typed JSON (`{"fields":{"name":{"stringValue":"…"}}}`) with no realtime and no
offline cache, and nobody calls it from a mobile app. So the axios client, the interceptor
chain and `endpoints.ts` describe a server that will not exist.

**Rules cannot compute.** The rules language has no `sqrt` and no trigonometry, so the 50m
haversine check required by the [trust boundary](../explanation/architecture.md#trust-boundary)
is not expressible in them. Verification, ticket minting and raffle entry must be Cloud
Functions. Everything else — places, posts, feed, profile — is direct Firestore access.

**Firestore has no schema enforcement.** A field-name mismatch between the two codebases
throws nothing on either side; the screen renders `undefined`. There is no compiler and no 400
to catch it.

## Decision

**Firebase is reached only through `src/lib/repositories/`.** No file under `app/` imports
`@react-native-firebase/*`.

Each repository function returns the existing `Result<T>` and dispatches on one environment
flag:

```text
  screens (app/)
        │  import repositories only
        ▼
  src/lib/repositories/
        ├── EXPO_PUBLIC_USE_MOCKS=true   ──▶  src/mocks/     typed fixtures
        └── EXPO_PUBLIC_USE_MOCKS=false  ──▶  Firebase
```

Four consequences of that boundary, decided together:

1. **`src/lib/api/` is superseded**, except `types.ts`. `Result<T>`, `AppFailure` and the
   `Failure` factories survive as the error convention repositories return. The axios client,
   the four interceptors, `safe-request.ts` and `endpoints.ts` describe a REST backend that is
   not being built.
2. **The schema contract lives in this repo**, at
   [backend-contract.md](../reference/backend-contract.md), and is the referee when the two
   codebases disagree. Firestore will not adjudicate; a document has to.
3. **Domain types are duplicated by hand** between this repo and the backend repo. Publishing
   a shared npm package is the correct answer at scale and the wrong answer for two people and
   four weeks — the Firebase CLI refuses to deploy anything outside `functions/`, so sharing a
   directory is not the easy path it looks like.
4. **The app developer does not run the Local Emulator Suite.** It is the right tool for
   whoever writes rules and functions, and that is not this side of the split. The app goes
   from fixtures to a seeded shared project directly.

## Consequences

**Good.**

- Screens can be built now, against fixtures, with no Firebase installed and no dependency on
  the backend developer's progress. The build order in
  [screen-implementation.md](../plans/screen-implementation.md) is unblocked today.
- Swapping fixtures for Firebase touches one directory. Nothing under `app/` changes.
- The fixture path survives integration and stays useful: offline development, screens whose
  Cloud Function is not deployed, and a demo that works when venue wifi does not.
- Firestore's shape stays out of the screens. Screens never see a `Timestamp`, a
  `DocumentSnapshot`, or a `permission-denied`.

**Costs, accepted.**

- Eight files under `src/lib/api/` become dead code rather than being deleted. Removing them
  is a tidying pass, not a blocker, and deleting code that a future REST-shaped need might want
  is not worth the churn this month. This ADR is why they are still there.
- Every repository function has an `if`. That is the price of the switch.
- Wrapping Firestore in promise-returning functions gives up realtime `onSnapshot` listeners.
  Nothing in the designs is realtime — no chat, no live counters — so this costs nothing today.
  If the community feed later wants live updates, add a `subscribe`-shaped method alongside
  rather than reshaping the layer.
- Duplicated types will drift. The contract document is the mitigation, and it only works if
  a schema gap found while building a screen becomes an edit to that document rather than a
  message.

**Superseded by this ADR.**

- The `EXPO_PUBLIC_BASE_URL` env key and the non-resolving placeholder in
  `src/lib/api/config.ts`. Firebase carries its project identity in the platform config files,
  not in a URL.
- The endpoint list in `src/lib/api/endpoints.ts`, which was already marked provisional.

## Related

- [connect-the-app-to-firebase.md](../how-to/connect-the-app-to-firebase.md) — the runbook this decision produces
- [backend-contract.md](../reference/backend-contract.md) — the schema and function signatures
- [architecture.md](../explanation/architecture.md) — the trust boundary that forces functions over rules
- [ADR 0002](0002-vendor-sds-instead-of-dependency.md) — the other place this repo chose a copy over a dependency
