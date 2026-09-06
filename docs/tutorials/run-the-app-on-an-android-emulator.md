---
title: Run the App on an Android Emulator
type: tutorial
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-09-06
audience: internal
---

# Run the App on an Android Emulator

> From a machine with nothing installed to PINDOM running on a virtual Pixel, with your edits appearing on it a second after you save. Written for someone who has never built a mobile app. Assumes macOS on Apple Silicon (M1–M4).

## What you will build

By the end you will have a **development build** of PINDOM installed on an Android emulator
on your Mac: a real Android app, compiled from this repo, that loads your TypeScript from a
dev server so that saving a file updates the screen without rebuilding.

You will not need the Firebase project, the Naver Maps key, or any Apple account. The app
detects that those are missing and serves fixture data from `src/mocks/` instead — real
screens, fake content. That is a supported way to work, not a degraded one.

Budget **90 minutes** the first time. Most of it is downloads.

> [!NOTE]
> You do not have to understand what you are typing yet. Get it running first — the
> concepts are in [expo-and-native-builds.md](../explanation/expo-and-native-builds.md),
> and they make far more sense once you have watched the thing work.

## Prerequisites

- A Mac with Apple Silicon, and about **30 GB free**. Android Studio, the SDK, an emulator
  image and the Gradle cache are each large.
- The Terminal app. Every command below is typed there.
- Read access to this repository.

Nothing else. In particular you need **no** paid developer account.

## Steps

### 1. Install Node

The repo pins its Node version in `.nvmrc`. Use **nvm**, a version manager, so this project
gets that version without disturbing anything else on your machine.

```bash
brew install nvm
```

Homebrew prints setup lines to add to `~/.zshrc` after installing. Add them, then open a new
Terminal window and check:

```bash
command -v nvm    # should print: nvm
```

Then, from inside the repo later on, `nvm install` reads `.nvmrc` and installs the pinned
version. You will do that in step 6.

Install Yarn too — it is the package manager this repo's lockfile is written for:

```bash
npm install -g yarn
```

### 2. Install the JDK

Android is built with Gradle, which runs on Java. **The version matters** — a newer JDK is
not better here, it fails with a class-file version error.

```bash
brew install openjdk@17
```

Homebrew does not put it on your `PATH` automatically. Add this to `~/.zshrc`:

```bash
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
```

Open a new Terminal and verify:

```bash
java -version     # openjdk version "17.x.x"
```

> [!WARNING]
> If you have ever installed Java before, you may now have several. Gradle uses whichever
> `JAVA_HOME` points at — not the newest one, and not the one Android Studio bundles. When a
> build fails with `Unsupported class file major version`, this is the cause. Run
> `/usr/libexec/java_home -V` to see every JDK on the machine.

### 3. Install Android Studio

Download it from [developer.android.com/studio](https://developer.android.com/studio) and
run the setup wizard, accepting the defaults. The wizard installs the Android SDK, the
emulator, and the platform tools. This is the longest download.

You will barely use Android Studio as an editor — you will write code in your normal editor
and build from the terminal. It is here because it owns the SDK and the emulator.

When the wizard finishes, open **Settings → Languages & Frameworks → Android SDK**, and on
the **SDK Tools** tab confirm these are ticked:

- Android SDK Build-Tools
- Android SDK Command-line Tools (latest)
- Android Emulator
- Android SDK Platform-Tools

On the **SDK Platforms** tab, the latest stable Android version should already be installed
from the wizard. If Gradle later wants a different one, it fails with that API level in the
message — come back and tick that number.

### 4. Tell your shell where the SDK is

The build does not find the SDK by magic; it reads an environment variable. Add to
`~/.zshrc`:

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin"
```

Open a new Terminal and verify all three work:

```bash
adb --version
emulator -version
sdkmanager --version
```

If `sdkmanager` is missing, the command-line tools are not installed — go back to step 3.

### 5. Create an emulator

An **AVD** (Android Virtual Device) is the virtual phone. Create one in Android Studio:
**Tools → Device Manager → `+` (Create Virtual Device)**.

| Choice | Pick | Why |
| --- | --- | --- |
| Device | **Pixel 7** | Ordinary modern screen size and aspect ratio |
| System image | An **arm64-v8a** image | Apple Silicon runs arm images natively. An x86 image will be unusably slow or refuse to boot |
| Services | **Google APIs** | Includes Google Play *services*, which Firebase needs. The "Google Play" variant adds the Play *Store* and locks the device down; you do not need it |

Everything else can stay at its default. Give it a name you will recognise.

> [!NOTE]
> Evidence, not a rule: the AVD this app has been developed against is a Pixel 7 on API 35,
> Google APIs, `arm64-v8a`. A newer API level is fine. Matching it is the safe choice if
> something behaves oddly and you want to rule the emulator out.

Boot it once from Device Manager (the ▶ button) and let it reach the home screen, so you
know it works before a build depends on it. Then confirm your terminal can see it:

```bash
adb devices     # emulator-5554   device
```

`device` on the right means ready. `offline` means still booting — wait.

### 6. Set up the repo

```bash
git clone <the repo url> pindom
cd pindom
nvm install            # reads .nvmrc
yarn install           # installs dependencies; takes a few minutes
cp .env.example .env
```

Open `.env` and read the comments — that file is the documented contract for every key the
app takes. For your first run, **change nothing**. `EXPO_PUBLIC_USE_MOCKS=true` is already
set, which is what you want.

Then confirm the toolchain agrees with itself:

```bash
npx expo-doctor
```

Version-mismatch warnings are informational and safe to leave alone. Anything about a
missing SDK or JDK is not — fix it before continuing.

### 7. The first build

```bash
yarn android
```

Then leave it alone. On a recent Apple Silicon Mac expect **roughly 10–20 minutes**, and the
first minutes look like nothing is happening. It is not stuck. In order, it:

1. Runs `expo prebuild`, generating the `android/` directory — a fresh clone has none, by
   design ([CNG](../explanation/expo-and-native-builds.md#continuous-native-generation))
2. Downloads Gradle, the Android build tools, and every native dependency — including the
   Naver Map SDK, which comes from Naver's own Maven repository
3. Compiles the app
4. Installs the APK on the running emulator
5. Starts **Metro**, the JavaScript dev server, and leaves it running in your terminal

Two things you will see and should not worry about:

- A yellow warning that Firebase config files were not found, and that screens will read
  fixtures. That is the expected state until you are added to the Firebase project. It is
  printed loudly on purpose — a silent fixture build that looks real is the failure it
  guards against.
- A great deal of Gradle output. Only the last lines matter.

### 8. Check it works

PINDOM should open on the emulator by itself. Tap through a couple of screens.

There is also a screen that renders every design-system component at once, which is the
fastest way to confirm fonts, colours and theming all loaded. Reach it by typing this in a
second terminal:

```bash
adb shell am start -a android.intent.action.VIEW -d "pindom://sds-preview"
```

`pindom://` is this app's URL scheme, declared as `scheme` in `app.config.ts`. Every route
under `app/` is reachable this way, which is much faster than tapping through a flow to
reach the screen you are working on.

### 9. Edit a file and watch it change

This is the part you will use all day.

Leave Metro running. Open the home screen, `app/(tabs)/index.tsx`, change a piece of visible
text, and save.

The emulator updates in about a second, without rebuilding and without losing where you
were in the app. That is **Fast Refresh**: Metro sends only the module you touched.

The Metro terminal is interactive. Useful keys:

| Key | Does |
| --- | --- |
| `r` | Reload the app from scratch. Use when a change did not take, or state is stuck |
| `a` | Open the app on the Android emulator |
| `m` | Toggle the in-app developer menu |
| `j` | Open the JavaScript debugger |
| `?` | List every key |

Stop Metro with `Ctrl+C`. Start it again with `yarn start`.

> [!NOTE]
> A red error screen on the emulator is Metro telling you what broke, not a crash to be
> afraid of. Read the top line, fix the file, save. It clears on its own.

### 10. Every run after the first

**Do not run `yarn android` again.** That was the ten-minute step, and you almost never need
it twice.

Normal day:

```bash
yarn start     # then press `a` to open it on the emulator
```

The app is already installed. It reconnects to Metro and you are working.

You only rebuild when the *native* side of the app changed — a new dependency, a change to
`app.config.ts`. Which change needs what is set out in
[the rebuild table](../explanation/expo-and-native-builds.md#when-do-i-need-to-rebuild), and
it is worth reading once now:

```bash
# after pulling a branch that touched package.json
yarn install && yarn android

# after a change to app.config.ts plugins, permissions or icons
npx expo prebuild -p android --clean && yarn android
```

Before you call anything done, run the two gates. They are the same ones CI and the release
script run:

```bash
yarn typecheck
yarn lint
```

## Testing GPS and the camera

PINDOM is a location-verified app: its core loop is *stand in the right place, take a photo,
get a ticket*. Both halves of that need setting up on an emulator, because a virtual phone
is in no place and has no camera.

### Setting the emulator's location

Click the **⋯** button on the emulator's toolbar → **Location**, enter a latitude and
longitude, and press **SET LOCATION**.

From the terminal it is quicker, and scriptable:

```bash
# NOTE: longitude first, then latitude — the reverse of how they are usually written
adb emu geo fix 126.9780 37.5665
```

Set the emulator to a filming location's coordinates and the GPS check will pass. Set it
somewhere else and you can watch the failure path, which is just as important to test.

> [!WARNING]
> A passing GPS check on an emulator proves the screen works, and nothing more. **The client
> never decides whether a verification passed** — the radius, speed, accuracy and
> mock-provider checks are anti-spoofing and are adjudicated server-side. On-screen distance
> is feedback, not the check. See
> [backend-contract.md](../reference/backend-contract.md).

### The camera

The emulator's back camera can render a virtual 3D room, which is enough to confirm the
capture flow runs, that the preview appears and that a photo comes back. Set it in Device
Manager → edit the AVD → **Show Advanced Settings → Camera → Back: VirtualScene**.

> [!WARNING]
> Confirm every camera change on a real phone before it ships. This app has already lost a
> build to that gap: a camera-availability check behaved differently on hardware than in any
> simulator, and every ticket issued on a real device carried a grey placeholder instead of
> the photo. No emulator run could have shown it. The account is in the `ios.buildNumber`
> comment in `app.config.ts`, under build 11.

### The map

The map renders as a blank grey rectangle without `EXPO_PUBLIC_NAVER_MAP_CLIENT_ID` in
`.env`. That is expected on a fresh clone — the SDK fails silently, so the app checks at
build time and says so on screen rather than looking broken. Ask for the key when you need
to work on 지도, and note that it is baked in natively: after adding it you need a prebuild,
not a reload.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `SDK location not found` | `ANDROID_HOME` unset in this shell | Step 4, then open a **new** terminal |
| `Unsupported class file major version` | Gradle is using the wrong JDK | `java -version` must say 17. Step 2 |
| `Failed to install ... some licences have not been accepted` | SDK licences unsigned | `sdkmanager --licenses`, accept all |
| `error: no devices/emulators found` | Emulator not booted | Start it in Device Manager, then `adb devices` until it says `device` |
| Metro starts, app never opens | The app is not installed on this AVD | `yarn android` once for that AVD |
| `Unable to resolve module ...` | Dependencies out of date with the branch | `yarn install`, then `yarn start --clear` |
| Port `8081` already in use | An old Metro is still running | `lsof -ti:8081 \| xargs kill`, or `yarn start --port 8082` |
| App crashes on launch right after a `git pull` | The branch added native code your installed shell lacks | `yarn install && yarn android` |
| Edits do not appear | Metro is serving a stale cache | `yarn start --clear` |
| A change to `app.config.ts` seems ignored | It is native config, not JS | `npx expo prebuild -p android --clean && yarn android` |
| A change to `.env` seems ignored | Env values are compiled into the binary; Metro does not serve them | `yarn android`. Restarting Metro will never pick them up — see [the rebuild table](../explanation/expo-and-native-builds.md#when-do-i-need-to-rebuild) |
| Blank grey map | No Naver client id | Expected without the key — see above |
| Emulator is extremely slow | An x86 system image on Apple Silicon | Recreate the AVD with an `arm64-v8a` image |
| A tutorial online says to use Expo Go | It is describing a different kind of project | Ignore it; this repo needs a development build. [Why](../explanation/expo-and-native-builds.md#why-this-app-cannot-use-expo-go) |

If a build fails in a way that is not here, the first thing to try is regenerating the
native project — it is disposable, and cannot hold anything you would miss:

```bash
npx expo prebuild -p android --clean && yarn android
```

### When the table does not have your error

1. **Read the last error, not the first.** Gradle prints screens of output and the top of it
   is rarely the cause. Scroll to the bottom: the real message is in the final `FAILURE:`
   block.
2. **Search the exact text, in quotes.** Add `expo android` to it. Your error string is
   almost certainly not unique to you.
3. **Search the owning repository's GitHub issues** if the error names a package. Include
   closed issues — most are closed with the fix in the thread.
4. **Check what kind of project the answer assumes.** This is the step people skip, and it
   costs the most. The filter table is in
   [Looking things up](../explanation/expo-and-native-builds.md#how-to-tell-an-answer-does-not-apply)
   — in short, anything mentioning Expo Go, `react-native init`, `react-native link`,
   `expo eject`, or editing `android/` by hand is describing a different setup.

When asking Claude, paste this ahead of your question so the answer lands in the right
place:

```text
PINDOM: an Expo React Native app on macOS/Apple Silicon, Android emulator.
Development build, not Expo Go. CNG — android/ is gitignored and generated by
expo prebuild from app.config.ts. New Architecture is on. Versions are in
package.json. I am running: <command>. The last lines of the error are: <paste>.
```

Without that preamble you will get advice for a hand-maintained `react-native init` project,
and it will look plausible.

## Next steps

1. Read [expo-and-native-builds.md](../explanation/expo-and-native-builds.md). Now that you
   have watched the pieces move, the model will stick — especially the rebuild table and the
   keyword list, which is written for asking Claude good questions about this stack.
2. Read [architecture.md](../explanation/architecture.md) for what the app does and how
   `app/`, `src/features/`, `src/components/` and `src/design-system/` relate.
3. Read [design-system.md](../reference/design-system.md) **before you build any component**.
   Reuse beats create, and this repo means it.
4. Open [`design/README.md`](../../design/README.md), the interactive prototype. It is the
   design authority and it outranks Figma.
5. Skim [CLAUDE.md](../../CLAUDE.md). It is the short list of rules that the above documents
   back, and it is loaded into Claude's context automatically — so the two of you are
   working from the same instructions.

## Related

- [expo-and-native-builds.md](../explanation/expo-and-native-builds.md) — the concepts and the vocabulary
- [../../README.md](../../README.md) — repo setup and the command table
- [connect-the-app-to-firebase.md](../how-to/connect-the-app-to-firebase.md) — turning fixtures off, once you have project access
- [ship-a-testflight-build.md](../how-to/ship-a-testflight-build.md) — how a release build differs from what you just ran
