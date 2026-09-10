#!/usr/bin/env bash
# Regression tests for scripts/create-version-branches.sh
#
# The script batch-invokes migrate-version.sh for each stable release. Its only
# safely testable mode is --dry-run, which enumerates every version WITHOUT
# doing network access, git clone, git checkout, or git push. We cover:
#
#   1. --dry-run enumerates every version listed in STABLE_VERSIONS with the
#      expected "[DRY RUN] Would migrate version X from release-X" line.
#   2. --dry-run emits the "DRY RUN MODE" banner.
#   3. --dry-run reports a Successful count == number of enumerated versions,
#      and Failed count == 0.
#   4. --dry-run never invokes migrate-version.sh (we stub it and record calls).
#   5. --dry-run never runs git commands that would mutate state
#      (we stub git and record calls; only 'ls-remote' or read-only 'checkout main'
#      wouldn't happen in dry-run mode anyway).
#   6. Version:branch entries follow "X.Y.Z:release-X.Y.Z" shape.
#
# Each case runs in a temp workdir with PATH shimmed so a fake `git`, fake
# `migrate-version.sh` are picked up first.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT="${SCRIPT_DIR}/create-version-branches.sh"

if [ ! -f "$SCRIPT" ]; then
  echo "FAIL: $SCRIPT not found" >&2
  exit 1
fi

PASS=0
FAIL=0
FAILURES=()

record_pass() { PASS=$((PASS + 1)); echo "  ✓ $1"; }
record_fail() { FAIL=$((FAIL + 1)); FAILURES+=("$1: $2"); echo "  ✗ $1 — $2" >&2; }

assert_contains() {
  local name="$1" needle="$2" hay="$3"
  if grep -qF -- "$needle" <<< "$hay"; then
    record_pass "$name"
  else
    record_fail "$name" "missing '$needle'"
  fi
}

assert_not_contains() {
  local name="$1" needle="$2" hay="$3"
  if ! grep -qF -- "$needle" <<< "$hay"; then
    record_pass "$name"
  else
    record_fail "$name" "unexpected '$needle'"
  fi
}

# make_env creates a temp workdir, copies the script and a scripts/ shim of
# migrate-version.sh into it, and prepends a `bin/` PATH with fake `git` and
# `migrate-version.sh` that log calls.
make_env() {
  local dir
  dir="$(mktemp -d)"
  mkdir -p "$dir/scripts" "$dir/bin"
  cp "$SCRIPT" "$dir/scripts/create-version-branches.sh"
  chmod +x "$dir/scripts/create-version-branches.sh"
  # Migrate stub — writes each invocation to a log so we can assert non-invocation.
  cat > "$dir/scripts/migrate-version.sh" <<'MSTUB'
#!/usr/bin/env bash
echo "MIGRATE_STUB_INVOKED $*" >> "${MIGRATE_LOG:-/dev/null}"
exit 0
MSTUB
  chmod +x "$dir/scripts/migrate-version.sh"
  # git stub — records every invocation.
  cat > "$dir/bin/git" <<'GSTUB'
#!/usr/bin/env bash
echo "GIT_STUB_INVOKED $*" >> "${GIT_LOG:-/dev/null}"
exit 0
GSTUB
  chmod +x "$dir/bin/git"
  echo "$dir"
}

# ---- case 1: --dry-run enumerates every listed version ----
echo "case 1: --dry-run enumerates each version"
d="$(make_env)"
export MIGRATE_LOG="$d/migrate.log"
export GIT_LOG="$d/git.log"
: > "$MIGRATE_LOG"; : > "$GIT_LOG"
OUT="$(cd "$d" && PATH="$d/bin:/usr/bin:/bin" bash scripts/create-version-branches.sh --dry-run 2>&1)"
RC=$?

assert_contains "1a banner"        "DRY RUN MODE"                      "$OUT"
assert_contains "1b enumerates 28" "[DRY RUN] Would migrate version 0.28.0 from release-0.28.0" "$OUT"
assert_contains "1c enumerates 21" "[DRY RUN] Would migrate version 0.21.0 from release-0.21.0" "$OUT"
assert_contains "1d summary"       "Migration Summary"                 "$OUT"
[ "$RC" -eq 0 ] && record_pass "1e rc=0" || record_fail "1e rc" "rc=$RC"

# Count enumerated versions in the STABLE_VERSIONS array and in OUT.
EXPECTED_COUNT="$(grep -c '"[0-9][0-9.]*:release-' "$SCRIPT" || echo 0)"
GOT_COUNT="$(grep -c '\[DRY RUN\] Would migrate version' <<< "$OUT")"
if [ "$EXPECTED_COUNT" -eq "$GOT_COUNT" ] && [ "$EXPECTED_COUNT" -gt 0 ]; then
  record_pass "1f version count matches STABLE_VERSIONS ($GOT_COUNT)"
else
  record_fail "1f version count" "STABLE_VERSIONS=$EXPECTED_COUNT vs enumerated=$GOT_COUNT"
fi

# Verify "Successful: N versions" reports the same number.
if grep -qF "Successful: ${GOT_COUNT} versions" <<< "$OUT"; then
  record_pass "1g reports Successful=${GOT_COUNT}"
else
  record_fail "1g Successful count" "expected 'Successful: ${GOT_COUNT} versions' — output was: $(grep 'Successful' <<< "$OUT")"
fi

# The failure summary line is only printed when at least one version failed.
# In dry-run everything succeeds, so the "Failed:" line must not appear.
assert_not_contains "1h no Failed line" "Failed:" "$OUT"
rm -rf "$d"

# ---- case 2: --dry-run must NOT invoke migrate-version.sh or mutate git ----
echo "case 2: --dry-run does not invoke migrate stub or run git"
d="$(make_env)"
export MIGRATE_LOG="$d/migrate.log"
export GIT_LOG="$d/git.log"
: > "$MIGRATE_LOG"; : > "$GIT_LOG"
(cd "$d" && PATH="$d/bin:/usr/bin:/bin" bash scripts/create-version-branches.sh --dry-run >/dev/null 2>&1)

if [ ! -s "$MIGRATE_LOG" ]; then
  record_pass "2a migrate-version.sh not invoked"
else
  record_fail "2a migrate invoked" "$(head -1 "$MIGRATE_LOG")"
fi

if [ ! -s "$GIT_LOG" ]; then
  record_pass "2b no git commands issued"
else
  record_fail "2b git invoked" "$(head -1 "$GIT_LOG")"
fi
rm -rf "$d"

# ---- case 3: script exists, is a shell script, and defines STABLE_VERSIONS ----
echo "case 3: STABLE_VERSIONS entries follow X.Y.Z:release-X.Y.Z shape"
BAD_LINE="$(grep -oE '"[^"]*:release-[^"]*"' "$SCRIPT" | \
  grep -vE '^"[0-9]+\.[0-9]+\.[0-9]+:release-[0-9]+\.[0-9]+\.[0-9]+"$' || true)"
if [ -z "$BAD_LINE" ]; then
  record_pass "3a all STABLE_VERSIONS entries are X.Y.Z:release-X.Y.Z"
else
  record_fail "3a malformed version entries" "$BAD_LINE"
fi

# Each entry's version and its release branch's version must match (0.28.0:release-0.28.0).
MISMATCH="$(grep -oE '"[0-9]+\.[0-9]+\.[0-9]+:release-[0-9]+\.[0-9]+\.[0-9]+"' "$SCRIPT" | \
  awk -F: '{gsub(/"/,""); v=$1; sub(/release-/,"",$2); if (v != $2) print $0}')"
if [ -z "$MISMATCH" ]; then
  record_pass "3b version prefix matches release branch suffix"
else
  record_fail "3b version mismatch" "$MISMATCH"
fi

# ---- case 4: without --dry-run, in fake env, script still exits gracefully
#              when 'git ls-remote' returns the branch as already-existing.
# We stub git so that ls-remote reports every branch exists, forcing the
# "already exists, skipping" branch for every version. This exercises the
# skip path without executing migrate-version.sh or real git operations.
echo "case 4: non-dry-run + fake git reporting existing branches -> all skipped"
d="$(make_env)"
# Override git stub to make 'git ls-remote --heads origin docs/X' emit a match.
cat > "$d/bin/git" <<'GSTUB2'
#!/usr/bin/env bash
echo "GIT_STUB_INVOKED $*" >> "${GIT_LOG:-/dev/null}"
case "$1" in
  ls-remote)
    # Last arg is the ref (e.g. docs/0.28.0); emit a fake matching line.
    ref="${@: -1}"
    echo "deadbeef refs/heads/${ref}"
    ;;
  *) : ;;
esac
exit 0
GSTUB2
chmod +x "$d/bin/git"
export MIGRATE_LOG="$d/migrate.log"
export GIT_LOG="$d/git.log"
: > "$MIGRATE_LOG"; : > "$GIT_LOG"
OUT="$(cd "$d" && PATH="$d/bin:/usr/bin:/bin" bash scripts/create-version-branches.sh 2>&1)"
RC=$?

assert_contains "4a already-exists msg" "already exists, skipping" "$OUT"
[ "$RC" -eq 0 ] && record_pass "4b rc=0" || record_fail "4b rc" "rc=$RC"
if [ ! -s "$MIGRATE_LOG" ]; then
  record_pass "4c migrate-version.sh not invoked when branch exists"
else
  record_fail "4c migrate invoked" "$(head -1 "$MIGRATE_LOG")"
fi
rm -rf "$d"

unset MIGRATE_LOG GIT_LOG

echo
echo "==================================="
echo "PASS: $PASS   FAIL: $FAIL"
if [ "$FAIL" -gt 0 ]; then
  printf '  - %s\n' "${FAILURES[@]}" >&2
  exit 1
fi
