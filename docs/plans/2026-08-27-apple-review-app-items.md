---
title: 2026-08-27 Apple Review — App-Side Items
type: plan
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-08-27
audience: internal
---

# 2026-08-27 — Apple Review, the App's Half

> The backend developer closed 신고 · 차단 · 콘텐츠 필터링 · 회원 탈퇴 and handed the app four
> screens' worth of work plus two copy items. This is what landed in this repo, the two
> judgment calls behind it, and the three sentences the App Review notes must and must not say.

## What this answers

The backend repo's [2026-08-27 checklist][server] lists four items as done and deployed, and
three as "앱 레포 소관 — 여기서 확인 못 함". Those three, plus the buttons the backend items
need in front of them, are this document.

| Item | Guideline | Where it landed |
| --- | --- | --- |
| 신고 버튼 | 1.2 | `src/features/moderation/` — a ⋯ on 게시글, 촬영 팁 and 갤러리 사진 |
| 사용자 차단 + 피드 필터링 | 1.2 | the same sheet, plus `hideBlocked` in three list hooks and `/blocked` |
| 콘텐츠 필터링 | 1.2 | **nothing to do** — the server's `moderatePost` / `moderateReview` triggers are the defence |
| 회원 탈퇴 | 5.1.1(v) | 마이페이지 → 회원 탈퇴, and `authRepository.deleteAccount` |
| 공식 규정 + Apple 비후원 문구 | 5.3.2 | `/raffle/rules`, linked from 응모 and 마이페이지 |
| 지원 페이지 문구 | 5.1.1(v) | the published Notion page — see below |

## The data layer came first

Nothing above could be built until the boundary existed, so the first change was
[the contract](../reference/backend-contract.md) and `src/lib/repositories/`: a `reports`
collection, `users.blockedUserIds`, and a `deleteAccount` callable. Three things about that
boundary are worth knowing before touching it.

**`reports` is write-only, and the repository says so.** `ReportRepository.create` resolves
`void` because there is no document to hand back — the deployed rules refuse `read`, `update`
and `delete` to everyone, the reporter included. A readable `reports` collection is a list of
who reported whom, queryable by the people named in it. The five fields are pinned by `hasOnly`,
so the payload is built in exactly one place.

**차단 is a client-side filter, and calling it anything else would be false.** Firestore rules
adjudicate a query; they do not subtract rows from its result, and there is no `not-in` to
express this with. So the server still returns a blocked author's posts and the client declines
to draw them. `hideBlocked` in `src/lib/domain/user.ts` is the one implementation, used by
`useFeed` and `usePlaceDetail`. **An answer to Apple must not say the backend enforces this.**

**`deleteAccount` deletes Auth last, and the client has to notice.** The function removes
Firestore documents, then Storage originals, then the Auth account — so a failure part-way
leaves a user who can call it again. But once it succeeds the SDK is still holding a token for
an account that no longer exists: `auth().currentUser` stays populated and every read comes back
`permission-denied`. `authRepository.deleteAccount` signs out locally before resolving, and
마이페이지 replaces the stack with 온보딩, so both halves of that are covered.

## Two judgment calls

**1. The 응모 is a real prize draw, not a demonstration.** Decided 2026-08-27. An earlier draft
of `/raffle/rules` carried a "시연을 위한 예시" banner, on the reasoning that 팬사인회 입장권 and
고척돔 지정석 are not prizes a 공모전 project can award. That was overruled: the draw is real and
PINDOM sponsors it. This settles guideline 5.3.4 — which requires the app's developer to be the
sponsor — and it means **the App Review notes must not describe the 응모 flow as
demonstration-only**, which
[the submission setup record](2026-08-26-app-store-submission-setup.md) had left as an option.

**2. Blocked users' nicknames are remembered on the device, not fetched.** The contract closes
`users` reads to everyone but the document's owner, so there is no query that turns a blocked
uid into a name — 차단한 사용자 would otherwise be a list of raw uids. The app caches the name
that was on the content at the moment of blocking. Consequences, all accepted: a nickname
changed since the block shows the old one; a block made on another device shows
`알 수 없는 사용자`; and a 갤러리 photo carries no nickname at all, so blocking from the grid
always produces that placeholder. Fixing this properly needs the `userProfiles/{uid}` collection
the contract's write-ownership note already describes, which is not worth a deployment for a
label.

## The 신고 / 차단 sheet

One component, three surfaces. `ModerationButton` owns its own sheet state so a call site costs
one element — which is the reason the ⋯ actually ended up on all three lists rather than on
whichever one was convenient.

Three shapes in it are deliberate:

- **신고 and 차단 are separate actions, not one button.** 신고 hands a document to a moderator;
  차단 changes what one user sees. Someone who wants a spammer out of their feed should not have
  to file a report to get it, and someone reporting something serious should not be forced to
  block the author.
- **The reason is a Korean label, not a code.** `reports` is triaged by a person in the Firebase
  console, and a person reads `스팸 또는 광고` faster than `reason: 'spam'`. 기타 is the only one
  that opens a text field, and its text replaces the label rather than being appended — a 기타
  with nothing typed is a report nobody can act on.
- **It is wrapped in a `Modal`.** 마이페이지's 로그아웃 confirm gets away with an absolutely
  positioned overlay because it is a child of the screen; this one opens from inside a list row,
  where `position: absolute` resolves against the row. The design system's `BottomSheet` has the
  same problem — the non-modal `@gorhom` sheet fills its container — and rounds its top corners
  20px, which `2b` does not do.

Two defects were found in review and fixed rather than shipped:

1. **A slow `me()` could un-block someone.** The background blocklist load and a 차단 write both
   called `adopt`, last-write-wins — and the losing order is the common one, since a block is one
   `arrayUnion` and the read is a full document. The store now carries a `revision` the read
   compares before and after its round trip, and the load runs once per session rather than on
   every mount of a ⋯.
2. **The sheet's error banner bled across stages.** A failed 신고 followed by 뒤로 → 차단하기
   opened the block confirmation already showing an error for something the user had not tried.
   Every stage change goes through one helper that clears it.

## 회원 탈퇴 is quiet, and findable

The row sits directly under 로그아웃 on 마이페이지, set in the metadata tone rather than the
alert one. 5.1.1(v) asks that account deletion be **findable** — burying it is the thing the
guideline exists to stop — but it does not ask that it compete with the action almost everyone
actually wants.

The confirm sheet prints the user's own numbers: 방문 인증 n회, 보유 티켓 n장, 비공개 보관함 n장.
That is the whole decision — 로그아웃 keeps these and 탈퇴 does not — and a generic
"모든 데이터가 삭제됩니다" makes the user guess what they have.

## 공식 규정 is linked from two places

Guideline 5.3.2 wants the official rules of a promotion presented **inside the app**, so this is
a route rather than a URL. It is reachable from the 응모 footer, where the decision to spend
tickets is made, and from 마이페이지 — because an App Review tester on a fresh account has no
tickets and cannot reach 응모 at all. A rules screen linked only from there is a rules screen
they will report as missing.

The Apple sentence is a named constant, `APPLE_DISCLAIMER`, so that it cannot be softened by an
edit to the layout around it and so that a search of this repo for it returns one hit.

## The support page

The published Notion page is the one registered as the App Store Connect support URL — see
[the submission setup record](2026-08-26-app-store-submission-setup.md), and
`src/lib/links.ts`, which is now the app's single copy of both public URLs.

Its 계정을 삭제하고 싶어요 entry said to **email a request**. That is exactly what 5.1.1(v)
rejects: deletion has to be initiated in the app. It now documents the in-app path, lists what
is deleted, and states the one thing that is not — a report survives with its `reporterId`
anonymised, so that deleting an account cannot erase the moderation record of everyone it
reported. A 신고 · 차단 entry was added beside it.

## Two false promises the rules pass caught

Writing rules that are *operative* — a real draw, not a demonstration — meant checking every
clause against what the app does, and two claims did not survive it.

**The app has no 응모 내역, and it cannot send a push.** A first draft of the rules said
당첨 결과는 컬렉션 화면의 응모 내역에서 확인할 수 있습니다. There is no such list: 컬렉션 draws
the balance, the tier gauge and the ticket tiles, and no repository method returns a user's past
entries. 응모완료 has said 당첨 발표는 …, 앱 알림으로 안내됩니다 since it was built from `1a`, and
that is not possible either — `ios/PINDOM/PINDOM.entitlements` is an empty dict, the app has no
push capability, and nothing registers for notifications. So the app carried two different
announcement mechanisms, neither of which existed.

Both now say the same thing, and it is the only channel that does exist: **the winner is emailed
at the address they signed up with.** That needs no app work — the operator has the addresses —
and it is a promise the build can keep. 응모완료's copy diverges from `1a` for this, which is a
deliberate exception to the rule that the prototype's Korean is final: `1a` was drawn before the
draw was real.

**Nothing here knows how the draw is weighted.** The same draft said 응모 횟수가 많을수록 당첨
확률이 높아집니다. Multiple entries per raffle are certainly possible — 응모 mints a fresh
idempotency key each time it opens — but whether the *draw* weights by entry count is a backend
fact this repo does not contain, and `raffles.status` records only `open | closed | drawn` with
no note on how a winner is picked. The clause now states only what the client can prove: that
repeat entries are allowed and each one costs the listed tickets. **Confirm the draw algorithm
with the backend developer**; if it is weighted, the stronger sentence can come back.

## Still open for the operator

- **마이페이지's 응모 내역 / 당첨 확인 row** navigates to 컬렉션, which shows no entries. Left
  alone — it is `1a`'s copy on a navigation label rather than a claim in the rules — but it is
  the same gap, and it closes properly only when `raffleEntries` gets a list query and a screen.
- **The 24-hour 신고 response** the support page now commits to is an operator commitment.
  Reports are read by hand in the Firebase console; nothing in the app enforces it.

## What is not done

- **`comment` is in `targetType` and has no screen.** The rule already accepts it and the app
  has no comments, so the value is carried and unused rather than dropped and re-added later.
- **Reports are triaged by hand in the Firebase console.** There is no moderation queue. At this
  volume that is the right amount of tooling; guideline 1.2's 24-hour expectation is a commitment
  the operator keeps, not something the app enforces.
- **A page mostly written by blocked authors arrives short**, because 커뮤니티 filters after
  fetching and pages off the raw cursor. A short page may not reach `onEndReached`. Acceptable
  while a blocklist holds a handful of people; the alternative skips posts.

## Related

- [the backend's half of the same checklist][server] — what was deployed on the server, and the
  seven security fixes that came with it
- [backend contract](../reference/backend-contract.md) — `reports`, `users.blockedUserIds` and
  `deleteAccount` are contract items now, not notes
- [2026-08-26 App Store submission setup](2026-08-26-app-store-submission-setup.md) — the store
  record these items unblock, and the review-notes wording this document corrects
- [screen inventory](../reference/screens.md) — `/blocked` and `/raffle/rules`

[server]: https://github.com/spencer0124/pindom-server/blob/main/docs/2026-08-27-apple-review-checklist.md
