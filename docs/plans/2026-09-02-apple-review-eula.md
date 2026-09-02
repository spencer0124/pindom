---
title: 2026-09-02 Apple Review — the EULA guideline 1.2 asked for
type: plan
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-09-02
audience: internal
---

# 2026-09-02 — the one 1.2 item that was missing

> 1.0.0 (4) was rejected on 2026-09-02 under guideline 1.2. Three of the four precautions were
> already shipped; the terms agreement was never on the list. This is what was added, why it is
> a route rather than a URL, and what Apple still needs from a person.

## What Apple said

Reviewed on an iPad Air 11-inch (M3), version 1.0.0 (4), submission
`2a2a5e42-da1a-45f1-afd8-830a831de91a`. Guideline 1.2 — Safety — User-Generated Content:

> revise the app to implement the following precautions: require that users agree to terms
> (EULA) and these terms must make it clear that there is no tolerance for objectionable content
> or abusive users.

They then ask for a screen recording, captured on a physical device, showing three things: the
agreement before registering or logging in, the way to flag content, and the way to block a user.

## Why only one item was missing

[The 2026-08-27 checklist](2026-08-27-apple-review-app-items.md) built 신고, 차단, content
filtering and 회원 탈퇴 for this same guideline. Its table has no EULA row — the item was absent
from the list rather than deferred, which is why build 4 could look complete and still fail. 1.2
is scored as a set: flagging and blocking without an agreement is an unmet 1.2, not a partial one.

| 1.2 precaution | Where it was |
| --- | --- |
| Terms agreement | **missing** — this document |
| Flag objectionable content | `src/features/moderation/` — the ⋯ sheet, built 2026-08-27 |
| Block abusive users | the same sheet, plus `/blocked` |
| Act on reports | the support page's 24-hour commitment, an operator promise |

## What landed

**`/terms` is a route, not a published page.** 개인정보처리방침 and 문의하기 are Notion pages
because the App Store Connect version record links to them and a reviewer opens them from there.
The agreement is different: it has to be in front of someone who has no account yet, and
마이페이지 — where every other link lives — does not exist for that person. Same reasoning that
put 응모 공식 규정 in the app for 5.3.2.

**The no-tolerance sentence is a constant.** `NO_TOLERANCE` in `app/terms.tsx` sits next to
`APPLE_DISCLAIMER` in `app/raffle/rules.tsx` as a named export-shaped value for one reason: a
sentence Apple checks for should not be reachable by an edit to the layout that renders it. The
docstring names the three hedges that would turn it into tolerance.

**The checkbox gates 시작하기, not 이메일로 로그인.** Consent belongs at the moment the account is
created; someone signing in agreed when they registered. But 1.2 says the terms must be presented
before registering *or* logging in, so the 계속하면 이용약관에 동의하는 것으로 봅니다 row sits
outside the sign-up branch and is on screen either way.

## What is not done, and cannot be done here

- **The screen recording.** Apple wants it captured on a physical device and attached to the
  Resolution Center reply and the Notes field. Nothing in this repo can produce it.
- **The review notes still describe build 4's feature map.** They should gain a line naming where
  the agreement is before the next submission.

## Related

- [2026-08-27 Apple review, the app's half](2026-08-27-apple-review-app-items.md) — the three 1.2
  precautions that were built, and the review-notes coordinate that had to be corrected
- [screen inventory](../reference/screens.md) — `/terms` alongside `/blocked` and `/raffle/rules`
