#!/usr/bin/env bash
# test_netlify-ignore.sh — regression guard for scripts/netlify-ignore.sh.
#
# The production script is Netlify's per-build "ignore" hook: exit 0
# skips the build, exit 1 proceeds. Its whole job is to cheaply short-
# circuit deploy-preview builds for hive snapshot branches
# ("chore/hive-snapshot*") so Netlify preview minutes are not consumed
# by throwaway automation branches. The exit-code contract is what
# Netlify's runtime relies on — inverting it (exit 1 when we meant to
# skip) would silently start building every snapshot preview, and
# exit 0 on a real branch would silently stop deploying the site.
#
# It also has a subtle branch-input surface: Netlify may populate the
# branch name in either $BRANCH or $HEAD depending on the trigger, so
# the script has to match either. A refactor that dropped one of those
# would silently reintroduce full preview builds for snapshot PRs on
# whichever trigger populated the other variable.
#
# Test strategy mirrors the sibling test_migrate-version.sh /
# test_verify-site-health.sh runbooks pattern in this scripts/ dir:
# run the script directly with different env values and assert both
# the exit code and a shape-of-output line.
#
# Six cases (all four exit-code arms + both env-var surfaces + a
# non-snapshot chore branch to guard against an over-broad glob):
#   1. BRANCH=chore/hive-snapshot-abc  — exit 0 (skip)
#   2. HEAD=chore/hive-snapshot-xyz    — exit 0 (skip) via HEAD arm
#   3. BRANCH=main                     — exit 1 (build)
#   4. BRANCH="" HEAD=""               — exit 1 (build): empty envs must
#                                         not accidentally match the glob
#   5. BRANCH=chore/hive-snap          — exit 1 (build): the "chore/hive-"
#                                         prefix alone must NOT skip
#   6. BRANCH=chore/something-else     — exit 1 (build): unrelated chore
#                                         branch must NOT skip
#
# Usage: scripts/test_netlify-ignore.sh
# Exit status: 0 if all assertions pass, 1 otherwise.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT="$REPO_ROOT/scripts/netlify-ignore.sh"

fail_count=0

assert_case() {
  local name="$1" expected_exit="$2" branch="$3" head="$4"
  local output exit_code

  # Explicitly clear the other env vars the script reads so a leaky
  # test host cannot mask a real bug.
  output=$(env -i BRANCH="$branch" HEAD="$head" PULL_REQUEST="" REVIEW_ID="" COMMIT_REF="" \
           PATH="$PATH" bash "$SCRIPT" 2>&1)
  exit_code=$?

  if [ "$exit_code" -ne "$expected_exit" ]; then
    echo "FAIL ($name): expected exit=$expected_exit, got exit=$exit_code. Output: $output"
    fail_count=$((fail_count + 1))
    return
  fi

  # Every branch must emit the debug echo — Netlify build logs rely on
  # it to see what the script actually saw. Guard against a refactor
  # dropping the echo on any arm.
  if ! printf '%s' "$output" | grep -q '^\[netlify-ignore\] BRANCH='; then
    echo "FAIL ($name): missing debug echo. Output: $output"
    fail_count=$((fail_count + 1))
    return
  fi

  if [ "$expected_exit" -eq 0 ]; then
    if ! printf '%s' "$output" | grep -q 'Skipping build'; then
      echo "FAIL ($name): expected 'Skipping build' line. Output: $output"
      fail_count=$((fail_count + 1))
      return
    fi
  else
    if ! printf '%s' "$output" | grep -q 'Proceeding with build'; then
      echo "FAIL ($name): expected 'Proceeding with build' line. Output: $output"
      fail_count=$((fail_count + 1))
      return
    fi
  fi

  echo "OK ($name)"
}

assert_case "snapshot-via-BRANCH"     0 "chore/hive-snapshot-abc" ""
assert_case "snapshot-via-HEAD"       0 ""                        "chore/hive-snapshot-xyz"
assert_case "main-builds"             1 "main"                    ""
assert_case "empty-envs-build"        1 ""                        ""
assert_case "chore-hive-only-builds"  1 "chore/hive-snap"         ""
assert_case "unrelated-chore-builds"  1 "chore/something-else"    ""

if [ "$fail_count" -eq 0 ]; then
  echo "All netlify-ignore.sh cases passed."
  exit 0
fi
echo "$fail_count case(s) failed."
exit 1
