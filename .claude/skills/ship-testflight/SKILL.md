---
name: ship-testflight
description: Ship a PINDOM iOS build to TestFlight — pulls main into dev, bumps the build number, archives, uploads, and submits for external Beta App Review. Use when asked to ship, release, cut a build, upload to TestFlight, or push a new iOS build of PINDOM.
---

# Ship PINDOM to TestFlight

Run the script. It does the whole thing.

```bash
./scripts/ship-testflight.sh
```

Phases run in order — `preflight sync bump gates archive verify upload wait submit`.
The whole run is ~12–15 min, most of it the archive.

| Need | Command |
| --- | --- |
| Pin the build number | `--build 9` |
| Set What to Test | `--whats-new '…'` (defaults to the last commit subject) |
| Resume after a failure | `--from archive` |
| One phase only | `--only submit` |
| Phase names | `--list` |

The script is the documentation: `scripts/ship-testflight.sh` explains every guard in
its header and inline, and `scripts/asc.mjs` is the App Store Connect client it calls.

## What you still do by hand

- **Extend the `buildNumber` comment** in `app.config.ts` with what this build carries.
  The script bumps the number but leaves the prose — that history is worth writing.
- **Commit.** The script prints the message to use. Work on `dev`.
- **App Privacy and availability** have no ASC API at this version — browser work.

## When it stops

It fails with a sentence naming what it found. Two that need a human decision:

- **`build N already exists`** — pick another with `--build`.
- **Beta review slot taken** — only one build per version train may sit in review.
  Withdraw the one holding it with the red **'심사 대상에서 삭제'** on its TestFlight
  page. Not **'빌드 무효화하기'** next to it, which expires the build instead.

The cert and the `PINDOM App Store` profile both expire **2026-10-19**; `preflight`
prints the date every run.
