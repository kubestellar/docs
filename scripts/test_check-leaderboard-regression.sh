#!/usr/bin/env bash
# test_check-leaderboard-regression.sh — regression guard for
# scripts/check-leaderboard-regression.mjs.
#
# check-leaderboard-regression.mjs is the release-gate script that compares
# a freshly generated public/data/leaderboard.json against the version
# committed on HEAD, refuses to proceed if any of the top 3 contributors
# lost more than 10% of their points, and short-circuits on several
# "don't check" signals: LEADERBOARD_FORCE=1, no prior snapshot on HEAD,
# and a year-start rollover. It is wired into generate-leaderboard.yml.
#
# Failure modes worth guarding against:
#   * REGRESSION_THRESHOLD_PCT or TOP_N gets tweaked and the check
#     starts flagging normal fluctuations (or worse, stops flagging
#     genuine 20 %+ point drops).
#   * `git show HEAD:...` path or error handling is refactored and the
#     "no previous snapshot" arm stops firing, so first-run in a fresh
#     branch hard-fails instead of skipping.
#   * The year-boundary short-circuit (line 76-79) is dropped, so the
#     first run of the new year always trips the regression gate and
#     requires manual LEADERBOARD_FORCE.
#   * The `LEADERBOARD_FORCE=1` bypass is broken (e.g. the equality
#     comparison switches to !== 1 by accident), locking maintainers out
#     of intentional scope changes.
#   * The "new to top N" skip (line 92) is dropped, so a first-time
#     top-3 entrant with no prior_points crashes the check.
#
# Each case builds a scratch git repo in $work_root/<case>, seeds
# public/data/leaderboard.json into HEAD (the "previous" snapshot),
# then overwrites it with a "new" snapshot and runs the real script
# against that tree. All I/O is local — the script never reaches out.
#
# Usage: scripts/test_check-leaderboard-regression.sh
# Exit status: 0 if all assertions pass, 1 otherwise.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT_SOURCE="$REPO_ROOT/scripts/check-leaderboard-regression.mjs"

if [ ! -f "$SCRIPT_SOURCE" ]; then
  echo "FAIL (setup): script not found at $SCRIPT_SOURCE"
  exit 1
fi
if ! command -v node >/dev/null 2>&1; then
  echo "SKIP: node not on PATH"
  exit 0
fi
if ! command -v git >/dev/null 2>&1; then
  echo "SKIP: git not on PATH"
  exit 0
fi

fail_count=0
work_root="$(mktemp -d)"
trap 'rm -rf "$work_root"' EXIT

pass() { echo "OK ($1)"; }
fail() { echo "FAIL ($1): $2"; fail_count=$((fail_count + 1)); }

# ---------------------------------------------------------------
# make_fixture <dir> [<prev_json>]
#   Build a scratch git repo at $dir, drop the real script into
#   $dir/scripts/, and optionally seed $dir/public/data/leaderboard.json
#   with <prev_json> as the "previous" HEAD snapshot the script will
#   diff against. If <prev_json> is omitted, HEAD contains no
#   leaderboard.json at all (used to exercise the "no previous snapshot"
#   arm).
# ---------------------------------------------------------------
make_fixture() {
  local dir="$1"
  local prev_json="${2:-}"
  mkdir -p "$dir/scripts" "$dir/public/data"
  cp "$SCRIPT_SOURCE" "$dir/scripts/check-leaderboard-regression.mjs"

  (
    cd "$dir"
    git init --quiet
    git config user.email 'test@example.com'
    git config user.name  'Test Fixture'
    git config commit.gpgsign false
    if [ -n "$prev_json" ]; then
      printf '%s' "$prev_json" > public/data/leaderboard.json
      git add public/data/leaderboard.json
    else
      # Need at least one commit for `git show HEAD:...` to work.
      echo 'seed' > .seed
      git add .seed
    fi
    git commit --quiet -m 'seed'
  )
}

# write_new <dir> <json>
#   Overwrite the working-tree leaderboard.json with a "new" snapshot.
write_new() {
  local dir="$1" json="$2"
  mkdir -p "$dir/public/data"
  printf '%s' "$json" > "$dir/public/data/leaderboard.json"
}

# run_script <dir> [<env>...]
#   Run `node scripts/check-leaderboard-regression.mjs` inside $dir with
#   optional additional env vars. Prints combined stdout+stderr and
#   returns the script's exit code.
run_script() {
  local dir="$1"; shift
  (cd "$dir" && env "$@" node scripts/check-leaderboard-regression.mjs 2>&1)
}

# ---------------------------------------------------------------
# Case 1: LEADERBOARD_FORCE=1 short-circuits before any file I/O.
# Covers the top-of-main guard (line 60-63). Even a wildly regressed
# snapshot must be accepted with exit 0.
# ---------------------------------------------------------------
case1() {
  local dir="$work_root/case1"
  local prev='{"entries":[{"login":"alice","total_points":1000},{"login":"bob","total_points":800},{"login":"carol","total_points":600}]}'
  local new='{"entries":[{"login":"alice","total_points":10},{"login":"bob","total_points":8},{"login":"carol","total_points":6}]}'
  make_fixture "$dir" "$prev"
  write_new "$dir" "$new"

  local out rc
  out=$(run_script "$dir" LEADERBOARD_FORCE=1); rc=$?

  if [ "$rc" -ne 0 ]; then
    fail "force-bypass" "expected exit 0, got $rc; output: $out"
    return
  fi
  if ! printf '%s' "$out" | grep -q 'LEADERBOARD_FORCE=1'; then
    fail "force-bypass" "expected FORCE message; output: $out"
    return
  fi
  pass "force-bypass"
}

# ---------------------------------------------------------------
# Case 2: no previous leaderboard.json on HEAD ⇒ skip with exit 0.
# Covers the `if (!prevData)` arm (line 68-71). This is the first-run
# case on a branch where the file has never been committed.
# ---------------------------------------------------------------
case2() {
  local dir="$work_root/case2"
  local new='{"entries":[{"login":"alice","total_points":1000}]}'
  make_fixture "$dir"  # no prev arg -> HEAD has no leaderboard.json
  write_new "$dir" "$new"

  local out rc
  out=$(run_script "$dir"); rc=$?

  if [ "$rc" -ne 0 ]; then
    fail "no-previous" "expected exit 0, got $rc; output: $out"
    return
  fi
  if ! printf '%s' "$out" | grep -q 'No previous leaderboard snapshot'; then
    fail "no-previous" "expected 'No previous leaderboard snapshot' message; output: $out"
    return
  fi
  pass "no-previous"
}

# ---------------------------------------------------------------
# Case 3: year_start changed between prev and new ⇒ skip with exit 0.
# Covers the year-boundary short-circuit (line 76-79). This is the
# Jan 1 rollover case: the scoring window slid forward, so a large
# absolute point drop is expected and MUST NOT trip the gate.
# ---------------------------------------------------------------
case3() {
  local dir="$work_root/case3"
  local prev='{"year_start":"2026-01-01","entries":[{"login":"alice","total_points":1000},{"login":"bob","total_points":800},{"login":"carol","total_points":600}]}'
  local new='{"year_start":"2027-01-01","entries":[{"login":"alice","total_points":50},{"login":"bob","total_points":40},{"login":"carol","total_points":30}]}'
  make_fixture "$dir" "$prev"
  write_new "$dir" "$new"

  local out rc
  out=$(run_script "$dir"); rc=$?

  if [ "$rc" -ne 0 ]; then
    fail "year-rollover" "expected exit 0, got $rc; output: $out"
    return
  fi
  if ! printf '%s' "$out" | grep -q 'Scoring year changed'; then
    fail "year-rollover" "expected 'Scoring year changed' message; output: $out"
    return
  fi
  pass "year-rollover"
}

# ---------------------------------------------------------------
# Case 4: healthy top-3 (no drops or small drops) ⇒ exit 0.
# Covers the happy-path loop where dropPct stays under the 10 % gate
# and the "Regression check passed" tail.
# ---------------------------------------------------------------
case4() {
  local dir="$work_root/case4"
  local prev='{"entries":[{"login":"alice","total_points":1000},{"login":"bob","total_points":900},{"login":"carol","total_points":800}]}'
  # alice: flat, bob: +50 (up), carol: -40 (5 % drop, under 10 %).
  local new='{"entries":[{"login":"alice","total_points":1000},{"login":"bob","total_points":950},{"login":"carol","total_points":760}]}'
  make_fixture "$dir" "$prev"
  write_new "$dir" "$new"

  local out rc
  out=$(run_script "$dir"); rc=$?

  if [ "$rc" -ne 0 ]; then
    fail "healthy-top3" "expected exit 0, got $rc; output: $out"
    return
  fi
  if ! printf '%s' "$out" | grep -q 'Regression check passed'; then
    fail "healthy-top3" "expected 'Regression check passed'; output: $out"
    return
  fi
  pass "healthy-top3"
}

# ---------------------------------------------------------------
# Case 5: a top-3 entry drops >10 % ⇒ exit 1, and stderr names the
# offender. Covers the regression-detected tail (line 118-129), which
# is the whole point of this script — a scoring bug that halves a top
# contributor's score must fail the release gate.
# ---------------------------------------------------------------
case5() {
  local dir="$work_root/case5"
  local prev='{"entries":[{"login":"alice","total_points":1000},{"login":"bob","total_points":900},{"login":"carol","total_points":800}]}'
  # alice: -40 %, bob and carol steady — one offender is enough to fail.
  local new='{"entries":[{"login":"alice","total_points":600},{"login":"bob","total_points":900},{"login":"carol","total_points":800}]}'
  make_fixture "$dir" "$prev"
  write_new "$dir" "$new"

  local out rc
  out=$(run_script "$dir"); rc=$?

  if [ "$rc" -eq 0 ]; then
    fail "regression-detected" "expected non-zero exit, got 0; output: $out"
    return
  fi
  if ! printf '%s' "$out" | grep -q 'LEADERBOARD REGRESSION DETECTED'; then
    fail "regression-detected" "expected 'LEADERBOARD REGRESSION DETECTED' banner; output: $out"
    return
  fi
  if ! printf '%s' "$out" | grep -q 'alice'; then
    fail "regression-detected" "expected offender 'alice' to be named; output: $out"
    return
  fi
  pass "regression-detected"
}

# ---------------------------------------------------------------
# Case 6: a first-time top-3 entrant (no prevPts) is skipped, not
# treated as a regression. Covers the `if (!prevPts) continue` guard
# (line 92-95). A dropped guard here would divide-by-zero or throw
# and take down the whole release gate.
# ---------------------------------------------------------------
case6() {
  local dir="$work_root/case6"
  local prev='{"entries":[{"login":"alice","total_points":1000},{"login":"bob","total_points":900},{"login":"carol","total_points":800}]}'
  # dave replaces carol in the top 3, and had no prior entry at all.
  local new='{"entries":[{"login":"alice","total_points":1000},{"login":"bob","total_points":900},{"login":"dave","total_points":500}]}'
  make_fixture "$dir" "$prev"
  write_new "$dir" "$new"

  local out rc
  out=$(run_script "$dir"); rc=$?

  if [ "$rc" -ne 0 ]; then
    fail "new-entrant" "expected exit 0 (new entrant should not regress), got $rc; output: $out"
    return
  fi
  if ! printf '%s' "$out" | grep -q "dave: new to top 3 — skipping"; then
    fail "new-entrant" "expected 'dave: new to top 3 — skipping'; output: $out"
    return
  fi
  pass "new-entrant"
}

case1
case2
case3
case4
case5
case6

if [ "$fail_count" -eq 0 ]; then
  echo "All check-leaderboard-regression.mjs tests passed."
  exit 0
fi
echo "$fail_count check-leaderboard-regression.mjs test(s) failed."
exit 1
