---
title: Ship a TestFlight Build
type: how-to
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-09-01
audience: internal
---

# Ship a TestFlight Build

> How to cut an iOS build of PINDOM and get it in front of testers, using the one script that does it. Open this page when you are asked to ship, release, or upload a build.

## Overview

Shipping is one command:

```bash
./scripts/ship-testflight.sh
```

It runs nine phases in order and stops at the first one that fails:

| Phase | What it does |
| --- | --- |
| `preflight` | Free disk, signing identity, provisioning profile expiry, `USE_MOCKS` |
| `sync` | Fetches, moves local `main` to `origin/main`, merges `origin/main` into `dev` |
| `bump` | Raises the build number in **both** places it lives |
| `gates` | `yarn typecheck` and `yarn lint` |
| `archive` | `xcodebuild archive` — the slow phase |
| `verify` | Opens the archive and reads what actually got baked into it |
| `upload` | `xcodebuild -exportArchive`, signed for distribution, uploaded |
| `wait` | Polls App Store Connect until the build is `VALID` |
| `submit` | Sets What to Test, attaches the external groups, submits for Beta App Review |

The whole run takes roughly a quarter of an hour, nearly all of it `archive`. There is also
a `ship-testflight` skill that does nothing but point at this script.

**The script is the reference, not this page.** Its header explains why each guard exists,
and the constants — team, bundle, app id, TestFlight group ids, key paths — are declared at
the top of it. This page exists so you know the script is there and how to drive it.

## Prerequisites

You need all of these before the first phase will pass; `preflight` checks each one and
names whichever is missing.

| Requirement | Notes |
| --- | --- |
| ~15 GB free disk | Static frameworks plus gRPC-Core make the intermediates enormous |
| An Apple Distribution identity in the keychain | Pick the certificate marked **"For use in Xcode 11 or later"**; the legacy "iOS Distribution" entry has no private key here |
| The `PINDOM App Store` provisioning profile | Installed under `~/Library/Developer/Xcode/UserData/Provisioning Profiles/` |
| The App Store Connect API key `.p8` | Path is declared in the script; never copy the file around |
| `EXPO_PUBLIC_USE_MOCKS=false` in `.env` | See [the trap below](#a-fixture-build-looks-identical-from-the-outside) |
| A clean working tree | `sync` refuses to merge over uncommitted work |

## Steps

### 1. Run it

```bash
./scripts/ship-testflight.sh
```

Useful flags:

| Need | Flag |
| --- | --- |
| Pin the build number instead of auto-bumping | `--build <n>` |
| Write What to Test yourself | `--whats-new '…'` — defaults to the last commit subject |
| Resume after a failure | `--from <phase>` |
| Run one phase | `--only <phase>` |
| List the phase names | `--list` |

Because `archive` costs minutes and everything after it costs seconds, a failure late in the
run should be resumed, not restarted: `--from verify` re-uses the archive already on disk.

### 2. Extend the build-number comment

The script bumps `ios.buildNumber` in `app.config.ts` but deliberately leaves the comment
above it alone. That comment is the running history of what each build carried, and it is
worth a sentence from a human. Add yours.

### 3. Commit

One commit, on `dev`:

```text
build(ios): build <n> — <what it carries>
```

The script prints this line when it finishes.

## Troubleshooting

Failures are a sentence naming what was found. Two of them need a decision rather than a fix.

### The build number already exists

App Store Connect refuses a build number it has already accepted, so `bump` asks before the
archive rather than letting you find out at upload. Pick another with `--build`.

### The beta review slot is taken

Only one build per version train may sit in beta review at a time, and
`betaAppReviewSubmissions` allows no `DELETE`. Withdraw the build holding the slot with the
red **'심사 대상에서 삭제'** on its TestFlight detail page.

> [!WARNING]
> Do not click **'빌드 무효화하기'** next to it. That expires the build instead of
> withdrawing its submission, and the build cannot be recovered.

### A fixture build looks identical from the outside

`extra.useMocks` is read when the JS bundles and baked into
`EXConstants.bundle/app.config` inside the binary. Nothing in the Xcode output mentions it,
and a fixture build installs and launches exactly like a real one. This is why `verify` is
its own phase: it opens the archive and reads that file before anything is uploaded.

### Signing fails during export

Two mistakes produce it, and both are already designed out of the script:

- A provisioning profile passed on the `xcodebuild` command line applies to *every* target
  in the workspace, and the Pods static libraries reject it — after compiling everything.
  Manual signing belongs in `scripts/ExportOptions.plist`.
- `-allowProvisioningUpdates` fails because the API key's role can upload builds but cannot
  *create* a distribution profile. The archive step quietly succeeds signed with Apple
  Development, and export dies with `Cloud signing permission error`.

If you see either anyway, the certificate or the profile has probably expired. `preflight`
prints the profile's expiry date on every run.

### dSYM warnings on upload

Warnings about missing dSYMs for `hermes`, `React` or `NMapsMap` are normal for React Native
and block nothing.

## Related

- `scripts/ship-testflight.sh` — the script, and the reference for every constant and guard
- `scripts/asc.mjs` — the App Store Connect API client the script calls; usable on its own
- [../plans/2026-08-26-app-store-submission-setup.md](../plans/2026-08-26-app-store-submission-setup.md)
  — what App Store Connect required before 1.0.0 could be submitted. **Start there for App
  Store Connect work**, as opposed to TestFlight
- [../plans/2026-08-31-play-store-submission-setup.md](../plans/2026-08-31-play-store-submission-setup.md)
  — the Android counterpart, which has no equivalent script yet
- [../plans/2026-08-27-apple-review-app-items.md](../plans/2026-08-27-apple-review-app-items.md)
  — the app's half of the App Store review checklist
