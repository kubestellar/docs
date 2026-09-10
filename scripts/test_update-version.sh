#!/usr/bin/env bash
# test_update-version.sh — regression guard for scripts/update-version.js.
#
# scripts/update-version.js is the release-time script that mutates
# src/config/versions.ts and public/config/shared.json to record a new
# frozen docs version (and optionally promote it to "latest"). The
# script drives its own file I/O from __dirname, matches large regions
# of versions.ts with 's'-flag regexes, and has a dozen independent
# code branches — every one of them a landmine at release time if it
# breaks silently. Failure modes worth guarding against:
#
#   * missing --project / --version / --branch flags that used to
#     exit 1 are now allowed through, and the script crashes mid-write
#   * an unknown project ID is quietly accepted and a stray/wrong
#     versionConstants entry is written
#   * the latestRegex or currentVersionRegex is refactored to no
#     longer match, so setLatest looks like it succeeded but the
#     label/branch/currentVersion never changed
#   * a plain "add a new version entry" flow (no --set-latest)
#     regresses so historical versions vanish from the version picker
#   * shared.json update loses its previous-latest preservation and
#     the previous release's docs become unreachable
#
# All five paths are structurally reachable via a scratch fixture: we
# copy the real update-version.js into a temp tree with its expected
# neighbours (src/config/versions.ts + public/config/shared.json), run
# `node scripts/update-version.js …` inside that tree, then assert on
# the exit code, on the mutated versions.ts, and on the rewritten
# shared.json. No external services, no network — the script never
# reaches out; every side effect stays in $work_root.
#
# The pattern mirrors scripts/test_migrate-version.sh in this repo:
# build a self-contained fixture in a temp dir, drop the script into
# it, drive each branch, and clean up on trap EXIT.
#
# Usage: scripts/test_update-version.sh
# Exit status: 0 if all assertions pass, 1 otherwise.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT_SOURCE="$REPO_ROOT/scripts/update-version.js"

if [ ! -f "$SCRIPT_SOURCE" ]; then
  echo "FAIL (setup): script not found at $SCRIPT_SOURCE"
  exit 1
fi
if ! command -v node >/dev/null 2>&1; then
  echo "SKIP: node not on PATH"
  exit 0
fi

fail_count=0
work_root="$(mktemp -d)"
trap 'rm -rf "$work_root"' EXIT

# ---------------------------------------------------------------
# make_fixture <dir>
#   Builds a minimal scratch tree at $dir:
#     $dir/scripts/update-version.js  (real script, verbatim copy)
#     $dir/src/config/versions.ts     (a shrunken but structurally
#                                      identical constant block that
#                                      exercises every regex the
#                                      script uses)
#     $dir/public/config/shared.json  (minimal but complete shape)
# ---------------------------------------------------------------
make_fixture() {
  local dir="$1"
  mkdir -p "$dir/scripts" "$dir/src/config" "$dir/public/config"
  cp "$SCRIPT_SOURCE" "$dir/scripts/update-version.js"

  cat >"$dir/src/config/versions.ts" <<'TS'
// Test fixture — do not use in production.
export interface VersionInfo {
  label: string
  branch: string
  isDefault: boolean
}

const KUBESTELLAR_VERSIONS: Record<string, VersionInfo> = {
  latest: {
    label: "v0.29.0 (Latest)",
    branch: "docs/0.29.0",
    isDefault: true,
  },
  main: {
    label: "main (dev)",
    branch: "main",
    isDefault: false,
  },
  "0.28.0": {
    label: "v0.28.0",
    branch: "docs/0.28.0",
    isDefault: false,
  },
}

export const PROJECTS = {
  kubestellar: {
    currentVersion: "0.29.0",
    versions: KUBESTELLAR_VERSIONS,
  },
}
TS

  cat >"$dir/public/config/shared.json" <<'JSON'
{
  "updatedAt": "2025-01-01T00:00:00.000Z",
  "projects": {
    "kubestellar": {
      "currentVersion": "0.29.0"
    }
  },
  "versions": {
    "kubestellar": {
      "latest": {
        "label": "v0.29.0 (Latest)",
        "branch": "docs/0.29.0",
        "isDefault": true
      },
      "main": {
        "label": "main (dev)",
        "branch": "main",
        "isDefault": false
      },
      "0.28.0": {
        "label": "v0.28.0",
        "branch": "docs/0.28.0",
        "isDefault": false
      }
    }
  },
  "editBaseUrls": {
    "kubestellar": "https://github.com/kubestellar/docs/edit/main/docs/content"
  }
}
JSON
}

pass() { echo "OK ($1)"; }
fail() { echo "FAIL ($1): $2"; fail_count=$((fail_count + 1)); }

# ---------------------------------------------------------------
# Case 1: missing required args must exit 1 with usage on stderr.
# Covers the `if (!project || !version || !branch)` guard.
# ---------------------------------------------------------------
case1() {
  local dir="$work_root/case1"
  make_fixture "$dir"
  local out
  out="$(node "$dir/scripts/update-version.js" --project kubestellar 2>&1)"
  local ec=$?
  if [ "$ec" -eq 1 ] && printf '%s\n' "$out" | grep -q "Usage: node update-version.js"; then
    pass "missing-args-exits-1-with-usage"
  else
    fail "missing-args-exits-1-with-usage" "ec=$ec, out=$out"
  fi
}

# ---------------------------------------------------------------
# Case 2: unknown project ID must exit 1 with the "Unknown project"
# error. Covers the `if (!constName)` guard.
# ---------------------------------------------------------------
case2() {
  local dir="$work_root/case2"
  make_fixture "$dir"
  local out
  out="$(node "$dir/scripts/update-version.js" \
    --project not-a-real-project \
    --version 1.0.0 \
    --branch docs/1.0.0 2>&1)"
  local ec=$?
  if [ "$ec" -eq 1 ] && printf '%s\n' "$out" | grep -q "Unknown project: not-a-real-project"; then
    pass "unknown-project-exits-1"
  else
    fail "unknown-project-exits-1" "ec=$ec, out=$out"
  fi
}

# ---------------------------------------------------------------
# Case 3: add a new version entry WITHOUT --set-latest.
# Must:
#   * exit 0
#   * insert the new "0.29.5" block after `main:` in versions.ts
#   * NOT touch the existing `latest:` label
#   * insert the entry into shared.json.versions.kubestellar
# ---------------------------------------------------------------
case3() {
  local dir="$work_root/case3"
  make_fixture "$dir"
  local out
  out="$(node "$dir/scripts/update-version.js" \
    --project kubestellar \
    --version 0.29.5 \
    --branch docs/0.29.5 2>&1)"
  local ec=$?
  local ts="$dir/src/config/versions.ts"
  local sj="$dir/public/config/shared.json"
  if [ "$ec" -ne 0 ]; then
    fail "add-non-latest-entry" "non-zero exit: ec=$ec, out=$out"; return
  fi
  if ! grep -q '"0.29.5"' "$ts"; then
    fail "add-non-latest-entry" "versions.ts missing new 0.29.5 entry: $(cat "$ts")"; return
  fi
  if ! grep -q 'label: "v0.29.5"' "$ts"; then
    fail "add-non-latest-entry" "versions.ts missing v0.29.5 label"; return
  fi
  # latest must NOT have been updated.
  if ! grep -q 'label: "v0.29.0 (Latest)"' "$ts"; then
    fail "add-non-latest-entry" "versions.ts latest label was unexpectedly changed"; return
  fi
  # shared.json must include the new entry under versions.kubestellar.
  if ! node -e "
    const d = JSON.parse(require('fs').readFileSync('$sj','utf8'));
    if (!d.versions.kubestellar['0.29.5']) { console.error('missing entry'); process.exit(1); }
    if (d.versions.kubestellar['0.29.5'].branch !== 'docs/0.29.5') { console.error('wrong branch'); process.exit(1); }
    if (d.projects.kubestellar.currentVersion !== '0.29.0') { console.error('currentVersion changed'); process.exit(1); }
  " 2>/dev/null; then
    fail "add-non-latest-entry" "shared.json missing/wrong 0.29.5 entry"; return
  fi
  pass "add-non-latest-entry"
}

# ---------------------------------------------------------------
# Case 4: --set-latest promotes 0.30.0.
# Must:
#   * update versions.ts latest label to "v0.30.0 (Latest)"
#   * update versions.ts latest branch to "docs/0.30.0"
#   * update PROJECTS.kubestellar.currentVersion to "0.30.0"
#   * preserve the previous latest (v0.29.0) as a historical entry
#   * update shared.json.versions.kubestellar.latest similarly
#   * add shared.json.versions.kubestellar["0.29.0"] historical entry
#   * update shared.json.projects.kubestellar.currentVersion
#   * update shared.json.editBaseUrls.kubestellar to point at the new branch
# ---------------------------------------------------------------
case4() {
  local dir="$work_root/case4"
  make_fixture "$dir"
  local out
  out="$(node "$dir/scripts/update-version.js" \
    --project kubestellar \
    --version 0.30.0 \
    --branch docs/0.30.0 \
    --set-latest 2>&1)"
  local ec=$?
  local ts="$dir/src/config/versions.ts"
  local sj="$dir/public/config/shared.json"
  if [ "$ec" -ne 0 ]; then
    fail "set-latest-promotes-version" "non-zero exit: ec=$ec, out=$out"; return
  fi
  if ! grep -q 'label: "v0.30.0 (Latest)"' "$ts"; then
    fail "set-latest-promotes-version" "versions.ts latest label not updated"; return
  fi
  if ! grep -q 'branch: "docs/0.30.0"' "$ts"; then
    fail "set-latest-promotes-version" "versions.ts latest branch not updated"; return
  fi
  if ! grep -q 'currentVersion: "0.30.0"' "$ts"; then
    fail "set-latest-promotes-version" "versions.ts currentVersion not updated"; return
  fi
  # Previous latest v0.29.0 must be preserved as a historical entry.
  if ! grep -q '"0.29.0"' "$ts"; then
    fail "set-latest-promotes-version" "versions.ts missing historical 0.29.0 entry"; return
  fi
  # shared.json checks.
  if ! node -e "
    const d = JSON.parse(require('fs').readFileSync('$sj','utf8'));
    const errs = [];
    if (d.versions.kubestellar.latest.label !== 'v0.30.0 (Latest)') errs.push('latest.label='+d.versions.kubestellar.latest.label);
    if (d.versions.kubestellar.latest.branch !== 'docs/0.30.0') errs.push('latest.branch='+d.versions.kubestellar.latest.branch);
    if (!d.versions.kubestellar['0.29.0']) errs.push('missing historical 0.29.0');
    if (d.versions.kubestellar['0.29.0'] && d.versions.kubestellar['0.29.0'].branch !== 'docs/0.29.0') errs.push('historical 0.29.0 branch wrong');
    if (d.projects.kubestellar.currentVersion !== '0.30.0') errs.push('projects.currentVersion='+d.projects.kubestellar.currentVersion);
    if (d.editBaseUrls.kubestellar !== 'https://github.com/kubestellar/docs/edit/docs/0.30.0/docs/content') errs.push('editBaseUrl='+d.editBaseUrls.kubestellar);
    if (errs.length) { console.error(errs.join('; ')); process.exit(1); }
  " 2>/tmp/case4-err; then
    fail "set-latest-promotes-version" "shared.json checks: $(cat /tmp/case4-err 2>/dev/null)"; return
  fi
  pass "set-latest-promotes-version"
}

# ---------------------------------------------------------------
# Case 5: re-running --set-latest with the SAME target version must
# be a no-op for the historical-preservation branch — the guard is
# `if (previousLatestBranch !== 'main' && previousLatestVersion !== version)`.
# When the "previous latest" already matches the requested version,
# previousLatestVersion is nulled and no historical entry is added.
# We assert that no duplicate "0.29.0" appears — i.e. still exactly one.
# ---------------------------------------------------------------
case5() {
  local dir="$work_root/case5"
  make_fixture "$dir"
  # First run: promote 0.29.0 -> already latest, so no historical entry.
  node "$dir/scripts/update-version.js" \
    --project kubestellar \
    --version 0.29.0 \
    --branch docs/0.29.0 \
    --set-latest >/dev/null 2>&1
  local ec=$?
  local ts="$dir/src/config/versions.ts"
  if [ "$ec" -ne 0 ]; then
    fail "set-latest-same-version-no-duplicate" "non-zero exit: ec=$ec"; return
  fi
  # Count occurrences of `"0.29.0":` — should be zero (no historical
  # block inserted) because the previousLatest equalled the target.
  local historical_count
  historical_count="$(grep -c '"0.29.0":' "$ts")"
  if [ "$historical_count" -ne 0 ]; then
    fail "set-latest-same-version-no-duplicate" "unexpected historical 0.29.0 entries: $historical_count"; return
  fi
  # Latest must still read v0.29.0 (Latest).
  if ! grep -q 'label: "v0.29.0 (Latest)"' "$ts"; then
    fail "set-latest-same-version-no-duplicate" "latest label lost"; return
  fi
  pass "set-latest-same-version-no-duplicate"
}

case1
case2
case3
case4
case5

if [ "$fail_count" -eq 0 ]; then
  echo "All scripts/update-version.js tests passed."
  exit 0
else
  echo "$fail_count scripts/update-version.js test(s) FAILED"
  exit 1
fi
