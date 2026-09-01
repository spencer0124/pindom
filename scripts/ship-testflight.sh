#!/usr/bin/env bash
# Ship an iOS build of PINDOM to TestFlight, end to end.
#
#   scripts/ship-testflight.sh                 # every phase, build number auto-bumped
#   scripts/ship-testflight.sh --build 9       # pin the build number
#   scripts/ship-testflight.sh --from archive  # resume after a failure
#   scripts/ship-testflight.sh --only submit   # one phase
#   scripts/ship-testflight.sh --list          # phase names
#
# Phases run in order: preflight sync bump gates archive verify upload wait submit.
#
# Every guard below is a thing that actually went wrong at least once, not a
# hypothetical. The four that cost the most time:
#
#   1. A provisioning profile passed on the `xcodebuild` command line applies to
#      *every* target in the workspace, and the ~60 Pods static libraries reject
#      it with "<pod> does not support provisioning profiles" — after compiling
#      everything. Manual signing belongs in ExportOptions.plist. `DEVELOPMENT_TEAM`
#      is the exception: Pods accept a team, they only reject profiles, and the
#      project sets no team so automatic signing fails without it.
#   2. `-allowProvisioningUpdates` looks like the easy path and is a trap. The ASC
#      key's 앱 관리 role can upload builds but cannot *create* a distribution
#      profile, so cloud signing dies with "Cloud signing permission error" while
#      the archive step has quietly already succeeded signed with Apple Development.
#   3. The build number lives in two places. `ios/` is gitignored and the prebuilt
#      Info.plist carries a literal CFBundleVersion, not $(CURRENT_PROJECT_VERSION),
#      so a number bumped only in app.config.ts uploads as a duplicate.
#   4. `extra.useMocks` is baked into EXConstants.bundle/app.config at build time.
#      A fixture build is indistinguishable from a real one from the outside, so
#      the archive is opened and read before anything is uploaded.
#
# Failure is a sentence naming what was found, not an Xcode stack trace.

set -euo pipefail

readonly TEAM_ID=95HGXTX76L
readonly BUNDLE_ID=com.zoyoong.pindom
readonly ASC_KEY_ID=VL6TWU5ST5
readonly ASC_ISSUER_ID=97e30026-b115-4ce3-8939-a98af36dcf3b
readonly ASC_KEY_PATH="$HOME/project/skkumap/ios/fastlane/AuthKey_$ASC_KEY_ID.p8"
# Both external groups. An address that is not an ASC team user cannot be an
# internal tester, which is what forces Beta App Review in the first place.
readonly EXTERNAL_GROUPS=(
  753d559f-cf4f-4668-a57a-87e2f1049c18  # 외부 테스터
  0b830972-c76e-4bd2-9302-29b93bc5a917  # 외부 테스터 2
)
# A Release archive consumed >8 GB of DerivedData and still died with "No space
# left on device": expo-build-properties forces static frameworks for the Naver
# Map SDK, and Firestore drags in gRPC-Core.
readonly DISK_NEED_GB=15

readonly ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly ALL_PHASES=(preflight sync bump gates archive verify upload wait submit)

BUILD_NUMBER=""
WHATS_NEW=""
FROM=""
ONLY=""
OUT="${SHIP_OUT_DIR:-${TMPDIR:-/tmp}/pindom-ship}"

say()  { printf '\n\033[1m▸ %s\033[0m\n' "$*"; }
info() { printf '  %s\n' "$*"; }
die()  { printf '\n\033[1;31merror:\033[0m %s\n' "$*" >&2; exit 1; }

asc() { node "$ROOT/scripts/asc.mjs" "$@"; }

usage() {
  sed -n '2,10p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
  exit "${1:-0}"
}

while [ $# -gt 0 ]; do
  case "$1" in
    --build)     BUILD_NUMBER="${2:?--build needs a number}"; shift 2 ;;
    --whats-new) WHATS_NEW="${2:?--whats-new needs text}"; shift 2 ;;
    --from)      FROM="${2:?--from needs a phase}"; shift 2 ;;
    --only)      ONLY="${2:?--only needs a phase}"; shift 2 ;;
    --list)      printf '%s\n' "${ALL_PHASES[@]}"; exit 0 ;;
    -h|--help)   usage ;;
    *)           die "unknown argument: $1 (try --help)" ;;
  esac
done

# Which phases to run.
phases=()
if [ -n "$ONLY" ]; then
  phases=("$ONLY")
else
  started=$([ -n "$FROM" ] && echo no || echo yes)
  for p in "${ALL_PHASES[@]}"; do
    [ "$p" = "$FROM" ] && started=yes
    [ "$started" = yes ] && phases+=("$p")
  done
fi
[ ${#phases[@]} -gt 0 ] || die "no such phase: ${ONLY:-$FROM} (try --list)"

cd "$ROOT"
mkdir -p "$OUT"

# The build number is state shared across phases and across *runs* — resuming at
# `upload` after a failed `wait` has to find the same number the archive used.
# app.config.ts is the source of truth, so it is read back rather than cached.
current_build() {
  sed -n "s/^[[:space:]]*buildNumber: '\([0-9]*\)'.*/\1/p" app.config.ts | head -1
}

archive_path() { echo "$OUT/PINDOM-build$(current_build).xcarchive"; }

# ---------------------------------------------------------------- preflight ---
phase_preflight() {
  say "preflight"

  local avail
  avail=$(df -g /System/Volumes/Data | awk 'NR==2 {print $4}')
  info "free disk: ${avail} GB (need ~${DISK_NEED_GB})"
  [ "$avail" -ge "$DISK_NEED_GB" ] ||
    die "only ${avail} GB free; an archive needs ~${DISK_NEED_GB}.
  Reclaim by deleting per-project dirs under ~/Library/Developer/Xcode/DerivedData/
  and ModuleCache.noindex. Leave ~/Library/Developer/Xcode/Archives alone."

  command -v xcodebuild >/dev/null || die "xcodebuild not on PATH."
  [ -f "$ASC_KEY_PATH" ] || die "App Store Connect key missing at $ASC_KEY_PATH"
  [ -f "$ROOT/scripts/ExportOptions.plist" ] || die "scripts/ExportOptions.plist is missing."

  # The legacy "iOS Distribution" certificate has no private key in this keychain;
  # the usable one is the "For use in Xcode 11 or later" Apple Distribution entry.
  security find-identity -v -p codesigning 2>/dev/null | grep -q "Apple Distribution.*$TEAM_ID" ||
    die "no Apple Distribution identity for team $TEAM_ID in the keychain.
  In the portal, pick the certificate marked 'For use in Xcode 11 or later' — the
  legacy 'iOS Distribution' entry has no private key here."

  # The cert and the App Store profile expire together. Warn before the archive
  # rather than after, when the export step would fail having spent eight minutes.
  local prof exp
  prof="$HOME/Library/Developer/Xcode/UserData/Provisioning Profiles/8bc0571c-b322-477f-9ffd-9df27f8cde82.mobileprovision"
  if [ -f "$prof" ]; then
    exp=$(security cms -D -i "$prof" 2>/dev/null |
      plutil -extract ExpirationDate raw -o - - 2>/dev/null || true)
    [ -n "$exp" ] && info "PINDOM App Store profile expires $exp"
  else
    die "the 'PINDOM App Store' provisioning profile is not installed.
  Download it from the portal into ~/Library/Developer/Xcode/UserData/Provisioning Profiles/"
  fi

  # A fixture build looks identical from the outside, so this is checked twice:
  # here on intent, and in `verify` on what actually got baked in.
  grep -q '^EXPO_PUBLIC_USE_MOCKS=false' .env ||
    die "EXPO_PUBLIC_USE_MOCKS is not false in .env — this would ship a fixture build."
  info "EXPO_PUBLIC_USE_MOCKS=false"
}

# --------------------------------------------------------------------- sync ---
phase_sync() {
  say "sync — pulling main into dev"

  # PRs merge into main on GitHub; dev is the working branch and absorbs them.
  # Local main is only ever a pointer, so it is moved rather than checked out.
  git fetch origin --prune
  git branch -f main origin/main >/dev/null

  local branch
  branch=$(git rev-parse --abbrev-ref HEAD)
  [ "$branch" = dev ] || die "on branch '$branch'; this script expects dev. \`git checkout dev\`"

  if git diff --quiet && git diff --cached --quiet; then :; else
    die "the working tree is dirty. Commit or stash before merging."
  fi

  local behind
  behind=$(git rev-list --count dev..origin/main)
  if [ "$behind" -eq 0 ]; then
    info "dev already has everything on origin/main"
  else
    info "merging $behind commit(s) from origin/main"
    git merge origin/main --no-edit
  fi
}

# --------------------------------------------------------------------- bump ---
phase_bump() {
  say "bump — build number"

  local current next
  current=$(current_build)
  [ -n "$current" ] || die "could not read ios.buildNumber out of app.config.ts"
  next="${BUILD_NUMBER:-$((current + 1))}"

  if [ "$next" = "$current" ]; then
    info "app.config.ts already at build $next"
  else
    # Deliberately narrow: only the buildNumber line, so the comment above it —
    # which records what each build carried — is left for a human to extend.
    perl -0pi -e "s/(\n\s*buildNumber: ')$current(')/\${1}$next\${2}/" app.config.ts
    [ "$(current_build)" = "$next" ] || die "failed to rewrite buildNumber in app.config.ts"
    info "app.config.ts: $current → $next"
  fi

  # The other half. ios/ is gitignored and holds a literal, so this does not
  # survive a prebuild — which is exactly why app.config.ts is the source of truth.
  plutil -replace CFBundleVersion -string "$next" ios/PINDOM/Info.plist
  info "ios/PINDOM/Info.plist: CFBundleVersion=$next"

  # A build number Apple has already accepted is refused on upload, and you find
  # out at the very end. Ask now.
  if asc build-state "$next" 2>/dev/null | grep -q '"found": true'; then
    die "build $next already exists on App Store Connect. Pick another with --build."
  fi
}

# -------------------------------------------------------------------- gates ---
phase_gates() {
  say "gates — typecheck and lint"
  # Run after the merge, not before: two branches can each be clean while their
  # union is not, and `--max-warnings 0` makes any warning fatal.
  yarn typecheck
  yarn lint
}

# ------------------------------------------------------------------ archive ---
phase_archive() {
  local n path log
  n=$(current_build)
  path=$(archive_path)
  log="$OUT/archive-build$n.log"

  say "archive — build $n"
  info "log: $log"
  info "this takes ~6-8 min against a warm DerivedData, far longer cold"

  # No PROVISIONING_PROFILE_SPECIFIER here — see the header. Signing with Apple
  # Development is fine; the export step re-signs for distribution.
  if ! xcodebuild \
      -workspace ios/PINDOM.xcworkspace \
      -scheme PINDOM \
      -configuration Release \
      -destination 'generic/platform=iOS' \
      -archivePath "$path" \
      DEVELOPMENT_TEAM="$TEAM_ID" \
      archive > "$log" 2>&1; then
    printf '\n' >&2
    grep -E "error:|No space left" "$log" | head -20 >&2 || tail -30 "$log" >&2
    die "archive failed — full log at $log"
  fi
  info "archived: $path"
}

# ------------------------------------------------------------------- verify ---
phase_verify() {
  local n app
  n=$(current_build)
  app="$(archive_path)/Products/Applications/PINDOM.app"

  say "verify — reading the archive"
  [ -d "$app" ] || die "no PINDOM.app inside $(archive_path)"

  # EXConstants.bundle/app.config is baked at build time and is the only place
  # that says what this binary will actually do at runtime.
  python3 - "$app" "$n" <<'PY'
import json, sys, pathlib
app, want = sys.argv[1], sys.argv[2]
cfg = json.loads(pathlib.Path(app, 'EXConstants.bundle/app.config').read_text())
mocks = cfg.get('extra', {}).get('useMocks')
built = cfg.get('ios', {}).get('buildNumber')
problems = []
if mocks is not False:
    problems.append(f'extra.useMocks is {mocks!r}, not False — this archive ships fixtures')
if built != want:
    problems.append(f'the archive says build {built!r}, expected {want!r}')
if not pathlib.Path(app, 'main.jsbundle').exists():
    problems.append('main.jsbundle is missing — the JS never bundled')
if problems:
    print('\n  '.join(['archive is not shippable:'] + problems), file=sys.stderr)
    raise SystemExit(1)
print(f'  useMocks=False  buildNumber={built}  main.jsbundle present')
PY
}

# ------------------------------------------------------------------- upload ---
phase_upload() {
  local n log
  n=$(current_build)
  log="$OUT/upload-build$n.log"

  say "upload — export and send to App Store Connect"
  info "log: $log"

  # Manual signing lives entirely in ExportOptions.plist. No -allowProvisioningUpdates.
  if ! xcodebuild -exportArchive \
      -archivePath "$(archive_path)" \
      -exportOptionsPlist "$ROOT/scripts/ExportOptions.plist" \
      -exportPath "$OUT/export-build$n" \
      -authenticationKeyPath "$ASC_KEY_PATH" \
      -authenticationKeyID "$ASC_KEY_ID" \
      -authenticationKeyIssuerID "$ASC_ISSUER_ID" > "$log" 2>&1; then
    printf '\n' >&2
    grep -E "error:|Cloud signing|No profiles" "$log" | head -20 >&2 || tail -30 "$log" >&2
    die "export/upload failed — full log at $log"
  fi
  # dSYM warnings for hermes/React/NMapsMap are normal for React Native.
  info "uploaded build $n"
}

# --------------------------------------------------------------------- wait ---
phase_wait() {
  local n state tries=0
  n=$(current_build)
  say "wait — App Store Connect processing build $n"

  # Apple offers no callback; processing normally reaches VALID in 2-3 min.
  while [ $tries -lt 40 ]; do
    state=$(asc build-state "$n" 2>/dev/null || echo '{}')
    case "$state" in
      *'"processingState": "VALID"'*)
        info "VALID"
        printf '%s\n' "$state" | sed 's/^/  /'
        return 0 ;;
      *'"processingState": "INVALID"'*|*'"processingState": "FAILED"'*)
        printf '%s\n' "$state" >&2
        die "App Store Connect rejected build $n. Check the email from Apple for why." ;;
    esac
    tries=$((tries + 1))
    info "still processing… (${tries}/40)"
    sleep 30
  done
  die "build $n was still processing after 20 minutes; check App Store Connect."
}

# ------------------------------------------------------------------- submit ---
phase_submit() {
  local n id
  n=$(current_build)
  say "submit — external Beta App Review"

  id=$(asc build-state "$n" | sed -n 's/.*"id": "\([^"]*\)".*/\1/p' | head -1)
  [ -n "$id" ] || die "could not find build $n on App Store Connect."
  info "build id: $id"

  # External review is refused outright without What to Test.
  local text="${WHATS_NEW:-}"
  if [ -z "$text" ]; then
    text=$(git log -1 --pretty=%s)
    info "no --whats-new given; using the last commit subject"
  fi
  asc whats-new "$n" "$text" | sed 's/^/  /'

  for group in "${EXTERNAL_GROUPS[@]}"; do
    asc POST "/v1/betaGroups/$group/relationships/builds" \
      "{\"data\":[{\"type\":\"builds\",\"id\":\"$id\"}]}" >/dev/null
    info "attached to group $group"
  done

  # Beta App Review Detail — contact, demo account, the 주문진/청계천 coordinates —
  # persists across submissions and needs no touch. Only one build per version
  # train may sit in beta review at a time; if this 409s, withdraw the build
  # holding the slot with '심사 대상에서 삭제' on its TestFlight page. Not
  # '빌드 무효화하기' next to it, which expires the build instead.
  asc POST '/v1/betaAppReviewSubmissions' \
    "{\"data\":{\"type\":\"betaAppReviewSubmissions\",\"relationships\":{\"build\":{\"data\":{\"type\":\"builds\",\"id\":\"$id\"}}}}}" \
    >/dev/null
  info "submitted for Beta App Review"

  # Since build 3 passed, Apple waives review for follow-up builds adding no new
  # permissions or entitlements — approval has been instant.
  sleep 10
  asc build-state "$n" | sed 's/^/  /'
}

for p in "${phases[@]}"; do
  case " ${ALL_PHASES[*]} " in *" $p "*) ;; *) die "no such phase: $p (try --list)" ;; esac
  "phase_$p"
done

say "done — build $(current_build)"
info "commit with: build(ios): build $(current_build) — <what it carries>"
