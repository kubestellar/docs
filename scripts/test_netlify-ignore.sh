#!/bin/bash
# Regression tests for scripts/netlify-ignore.sh.
#
# The script is called by Netlify (netlify.toml: ignore = "/bin/bash
# scripts/netlify-ignore.sh") on every deploy-preview build. It must exit
# 0 to SKIP a build and 1 to PROCEED. A regression here silently spends
# Netlify build minutes on hive snapshot branches — or, worse, skips real
# PR builds.
#
# These tests invoke the script as a subprocess with the four env vars
# Netlify exposes (BRANCH, HEAD, PULL_REQUEST, REVIEW_ID, COMMIT_REF)
# and assert on the exit code + a hint from stdout. They are stdlib-only
# bash + coreutils — no framework, no network — so they can be run
# directly:
#
#   bash scripts/test_netlify-ignore.sh
#
# and later wired into any existing shell CI step. Exit 0 on all-pass,
# 1 on first failure.

set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET="${SCRIPT_DIR}/netlify-ignore.sh"

if [ ! -x "$TARGET" ] && [ ! -f "$TARGET" ]; then
  echo "FAIL: cannot locate netlify-ignore.sh at $TARGET" >&2
  exit 1
fi

pass=0
fail=0

# run_case NAME EXPECTED_EXIT EXPECTED_STDOUT_SUBSTRING [ENV=VALUE ...]
run_case() {
  local name="$1"; shift
  local want_exit="$1"; shift
  local want_substr="$1"; shift

  local out rc
  # Explicitly unset the vars first so a leaked shell env cannot pollute
  # the case, then set only what the case asked for.
  out=$(env -i \
    BRANCH="" HEAD="" PULL_REQUEST="" REVIEW_ID="" COMMIT_REF="" \
    "$@" \
    bash "$TARGET" 2>&1)
  rc=$?

  if [ "$rc" -ne "$want_exit" ]; then
    echo "FAIL[$name]: exit code $rc, want $want_exit"
    echo "--- output ---"
    echo "$out"
    echo "--------------"
    fail=$((fail + 1))
    return
  fi
  if [ -n "$want_substr" ] && ! echo "$out" | grep -qF -- "$want_substr"; then
    echo "FAIL[$name]: stdout missing substring \"$want_substr\""
    echo "--- output ---"
    echo "$out"
    echo "--------------"
    fail=$((fail + 1))
    return
  fi
  pass=$((pass + 1))
}

# --- Skip-the-build cases (exit 0) ---
# BRANCH set to a hive snapshot branch matches the glob and skips.
run_case "branch is hive snapshot" 0 "Skipping build" \
  BRANCH="chore/hive-snapshot-2026-09-09"

# The prefix chore/hive-snapshot (no suffix) should also match the glob.
run_case "branch is bare hive snapshot" 0 "Skipping build" \
  BRANCH="chore/hive-snapshot"

# HEAD alone (BRANCH empty) is checked in the same loop and must skip.
run_case "head is hive snapshot" 0 "Skipping build" \
  HEAD="chore/hive-snapshot-abc123"

# When both BRANCH and HEAD are hive snapshots the loop still skips (and
# should not double-print or double-exit).
run_case "both branch and head are hive snapshots" 0 "hive snapshot branch" \
  BRANCH="chore/hive-snapshot-x" HEAD="chore/hive-snapshot-y"

# --- Proceed-with-build cases (exit 1) ---
# A regular feature branch must NOT match the glob and must proceed.
run_case "regular feature branch proceeds" 1 "Proceeding with build" \
  BRANCH="feat/add-a-page" HEAD="feat/add-a-page"

# main proceeds — production build must never be skipped.
run_case "main proceeds" 1 "Proceeding with build" \
  BRANCH="main" HEAD="main"

# Empty env (Netlify occasionally omits vars for scheduled builds).
run_case "empty env proceeds" 1 "Proceeding with build"

# A branch containing hive-snapshot in the MIDDLE (not prefixed by
# chore/hive-snapshot) must not match — this pins that the glob is
# anchored on chore/hive-snapshot, not a bare substring, so a
# well-meaning contributor's "docs/hive-snapshot-notes" is still built.
run_case "middle-substring branch proceeds" 1 "Proceeding with build" \
  BRANCH="docs/hive-snapshot-notes" HEAD="docs/hive-snapshot-notes"

# The debug preamble is always printed regardless of outcome. This is
# what makes Netlify build logs diagnosable when the wrong decision is
# reached, so pin its presence.
run_case "debug preamble present on proceed" 1 "[netlify-ignore] BRANCH=" \
  BRANCH="main"
run_case "debug preamble present on skip" 0 "[netlify-ignore] BRANCH=" \
  BRANCH="chore/hive-snapshot-preamble-check"

echo
echo "Result: $pass passed, $fail failed"
if [ "$fail" -gt 0 ]; then
  exit 1
fi
exit 0
