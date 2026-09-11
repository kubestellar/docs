#!/usr/bin/env bash
# test_migrate-version.sh — regression guard for scripts/migrate-version.sh.
#
# The production script is used during a KubeStellar release to spin off
# a docs/<version> branch from a release-<version> branch on the upstream
# kubestellar repo. It clones with a real `git`, mutates `docs/content`,
# rewrites CURRENT_VERSION in src/config/versions.ts, then commits and
# pushes. The failure modes that a bad refactor could introduce here
# would corrupt or fail a release:
#
#   * missing-argument checks that let the script run without a version
#     or source branch and then crash mid-clone
#   * dropped "must run from repo root" precondition that would land
#     version-migration content in a random directory
#   * a broken `sed` line that stopped updating CURRENT_VERSION (Linux
#     path is used on CI runners) and shipped a stale marker
#   * a lost check-then-abort on a source branch whose docs/content
#     directory is absent, which would delete the target's content and
#     leave the branch empty
#
# All four paths are structurally reachable via a PATH shim over `git`
# and a captured filesystem so we exercise them here without any real
# network I/O. The pattern mirrors scripts/test_verify-site-health.sh
# in this repo and scripts/test_verify_release_health.sh in
# kubestellar/homebrew-tap: build a self-contained fixture in a temp
# dir, drop the script into it, stub each external binary the script
# calls, and drive each branch through the stub.
#
# Usage: scripts/test_migrate-version.sh
# Exit status: 0 if all assertions pass, 1 otherwise.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT_SOURCE="$REPO_ROOT/scripts/migrate-version.sh"

if [ ! -f "$SCRIPT_SOURCE" ]; then
  echo "FAIL (setup): script not found at $SCRIPT_SOURCE"
  exit 1
fi

fail_count=0
work_root="$(mktemp -d)"
trap 'rm -rf "$work_root"' EXIT

# Build a fixture: a copy of the script under $dir/scripts/, the two
# preconditions the script checks (package.json + src/config/versions.ts
# with a placeholder CURRENT_VERSION), an empty docs/content/, and a
# stubbed `git` on PATH. The stub logs every invocation and, on
# `git clone --branch <B> --depth 1 <URL> <TARGET>`, materialises
# $TARGET with a docs/content tree so the copy step has real inputs.
# All other subcommands (checkout / pull / add / commit / push) succeed
# silently to keep the happy path exercisable end-to-end.
_make_fixture() {
  local dir="$1"; local include_docs_content="${2:-1}"
  mkdir -p "$dir/repo/scripts" "$dir/repo/src/config" \
           "$dir/repo/docs/content" "$dir/bin"
  cp "$SCRIPT_SOURCE" "$dir/repo/scripts/migrate-version.sh"
  chmod +x "$dir/repo/scripts/migrate-version.sh"
  printf '{}\n' > "$dir/repo/package.json"
  # Placeholder line the script's sed edits.
  printf 'export const CURRENT_VERSION = "0.0.0";\n' \
      > "$dir/repo/src/config/versions.ts"

  cat > "$dir/bin/git" <<EOF
#!/usr/bin/env bash
# Log every invocation for later assertion.
printf '%s\n' "\$*" >> "$dir/bin/git.log"
# Handle 'git clone --branch <B> --depth 1 <URL> <TARGET>'. Every other
# subcommand is a no-op that succeeds — the script does not read stdout.
if [ "\${1:-}" = "clone" ]; then
  target=""
  # Find the last non-flag positional arg — that's the clone target.
  for a in "\$@"; do
    case "\$a" in
      -*|clone|--branch|--depth) : ;;
      *) target="\$a" ;;
    esac
  done
  if [ -z "\$target" ]; then
    echo "stub-git: clone target missing" >&2
    exit 1
  fi
  mkdir -p "\$target/docs"
  if [ "$include_docs_content" = "1" ]; then
    mkdir -p "\$target/docs/content/getting-started"
    printf '# Overview\n' > "\$target/docs/content/index.md"
    printf '# Install\n'  > "\$target/docs/content/getting-started/install.md"
    printf 'site_name: test\n' > "\$target/docs/mkdocs.yml"
  fi
  exit 0
fi
exit 0
EOF
  chmod +x "$dir/bin/git"
}

# Runs the script from inside a fixture with a stubbed git on PATH.
_run() {
  local dir="$1"; shift
  ( cd "$dir/repo" && \
    PATH="$dir/bin:/usr/bin:/bin" \
    OSTYPE="linux-gnu" \
    "$dir/repo/scripts/migrate-version.sh" "$@" 2>&1 )
}

# ---------------------------------------------------------------------------
# Case 1: HAPPY PATH. Both args provided, package.json + src/config exist,
# clone produces docs/content — script should succeed, replace docs/content,
# rewrite CURRENT_VERSION, and issue the clone / checkout / commit / push
# subcommands in order.
# ---------------------------------------------------------------------------
case_dir="$work_root/case1"
_make_fixture "$case_dir" 1
output=$(_run "$case_dir" "0.28.0" "release-0.28.0")
exit_code=$?
if [ "$exit_code" -ne 0 ]; then
  echo "FAIL (happy-path): expected exit=0, got exit=$exit_code. Output: $output"
  fail_count=$((fail_count + 1))
elif ! grep -q '"0.28.0"' "$case_dir/repo/src/config/versions.ts"; then
  echo "FAIL (happy-path): CURRENT_VERSION was not rewritten. Content: $(cat "$case_dir/repo/src/config/versions.ts")"
  fail_count=$((fail_count + 1))
elif [ ! -f "$case_dir/repo/docs/content/index.md" ]; then
  echo "FAIL (happy-path): docs/content was not populated from the source clone."
  fail_count=$((fail_count + 1))
elif [ ! -f "$case_dir/repo/docs/mkdocs.yml" ]; then
  echo "FAIL (happy-path): mkdocs.yml was not copied from the source clone."
  fail_count=$((fail_count + 1))
elif ! grep -q "clone --branch release-0.28.0" "$case_dir/bin/git.log"; then
  echo "FAIL (happy-path): git clone did not use the requested source branch. Log: $(cat "$case_dir/bin/git.log")"
  fail_count=$((fail_count + 1))
elif ! grep -q "checkout -b docs/0.28.0" "$case_dir/bin/git.log"; then
  echo "FAIL (happy-path): git checkout -b docs/0.28.0 was not invoked. Log: $(cat "$case_dir/bin/git.log")"
  fail_count=$((fail_count + 1))
elif ! grep -q "push origin docs/0.28.0" "$case_dir/bin/git.log"; then
  echo "FAIL (happy-path): git push origin docs/0.28.0 was not invoked. Log: $(cat "$case_dir/bin/git.log")"
  fail_count=$((fail_count + 1))
elif ! grep -q "commit -s" "$case_dir/bin/git.log"; then
  echo "FAIL (happy-path): commit missing -s DCO sign-off flag. Log: $(cat "$case_dir/bin/git.log")"
  fail_count=$((fail_count + 1))
else
  echo "OK (happy-path)"
fi

# ---------------------------------------------------------------------------
# Case 2: MISSING VERSION ARG. Script must print usage and exit 1 without
# ever invoking git. Guards the `-z "$VERSION"` / `-z "$SOURCE_BRANCH"`
# top-of-file guard.
# ---------------------------------------------------------------------------
case_dir="$work_root/case2"
_make_fixture "$case_dir" 1
output=$(_run "$case_dir")
exit_code=$?
if [ "$exit_code" -eq 0 ]; then
  echo "FAIL (missing-args): expected non-zero exit for missing args."
  fail_count=$((fail_count + 1))
elif ! printf '%s' "$output" | grep -q "Usage:"; then
  echo "FAIL (missing-args): expected Usage line in output. Got: $output"
  fail_count=$((fail_count + 1))
elif [ -s "$case_dir/bin/git.log" ]; then
  echo "FAIL (missing-args): git was invoked before the arg check. Log: $(cat "$case_dir/bin/git.log")"
  fail_count=$((fail_count + 1))
else
  echo "OK (missing-args)"
fi

# ---------------------------------------------------------------------------
# Case 3: MISSING SOURCE-BRANCH ARG. Same guard, second half — a single
# positional arg should still be rejected before any git call.
# ---------------------------------------------------------------------------
case_dir="$work_root/case3"
_make_fixture "$case_dir" 1
output=$(_run "$case_dir" "0.28.0")
exit_code=$?
if [ "$exit_code" -eq 0 ]; then
  echo "FAIL (missing-source-branch): expected non-zero exit for missing source-branch arg."
  fail_count=$((fail_count + 1))
elif ! printf '%s' "$output" | grep -q "Usage:"; then
  echo "FAIL (missing-source-branch): expected Usage line. Got: $output"
  fail_count=$((fail_count + 1))
elif [ -s "$case_dir/bin/git.log" ]; then
  echo "FAIL (missing-source-branch): git was invoked before the arg check."
  fail_count=$((fail_count + 1))
else
  echo "OK (missing-source-branch)"
fi

# ---------------------------------------------------------------------------
# Case 4: NOT IN DOCS REPO. Delete src/config so the "must be run from the
# root of the docs repository" precondition kicks in. Script must exit 1
# and NOT invoke git (the precondition is checked before the clone).
# ---------------------------------------------------------------------------
case_dir="$work_root/case4"
_make_fixture "$case_dir" 1
rm -rf "$case_dir/repo/src/config"
output=$(_run "$case_dir" "0.28.0" "release-0.28.0")
exit_code=$?
if [ "$exit_code" -eq 0 ]; then
  echo "FAIL (not-in-repo): expected non-zero exit when src/config is missing."
  fail_count=$((fail_count + 1))
elif ! printf '%s' "$output" | grep -q "root of the docs repository"; then
  echo "FAIL (not-in-repo): expected 'root of the docs repository' message. Got: $output"
  fail_count=$((fail_count + 1))
elif [ -s "$case_dir/bin/git.log" ]; then
  echo "FAIL (not-in-repo): git was invoked before the repo-root check. Log: $(cat "$case_dir/bin/git.log")"
  fail_count=$((fail_count + 1))
else
  echo "OK (not-in-repo)"
fi

# ---------------------------------------------------------------------------
# Case 5: SOURCE BRANCH HAS NO docs/content. Clone stub does not create
# docs/content in the cloned tree — the script must detect the missing
# dir, exit 1, and NOT touch the target's docs/content or versions.ts.
# ---------------------------------------------------------------------------
case_dir="$work_root/case5"
_make_fixture "$case_dir" 0
# Seed a sentinel file in the target's docs/content so we can assert it
# is preserved on the error path.
printf 'PRE-EXISTING\n' > "$case_dir/repo/docs/content/keep.md"
output=$(_run "$case_dir" "0.28.0" "release-0.28.0")
exit_code=$?
if [ "$exit_code" -eq 0 ]; then
  echo "FAIL (missing-source-content): expected non-zero exit when source clone lacks docs/content."
  fail_count=$((fail_count + 1))
elif ! printf '%s' "$output" | grep -q "docs/content directory not found"; then
  echo "FAIL (missing-source-content): expected 'docs/content directory not found' message. Got: $output"
  fail_count=$((fail_count + 1))
elif [ ! -f "$case_dir/repo/docs/content/keep.md" ]; then
  echo "FAIL (missing-source-content): target docs/content was clobbered on the error path."
  fail_count=$((fail_count + 1))
elif ! grep -q '"0.0.0"' "$case_dir/repo/src/config/versions.ts"; then
  echo "FAIL (missing-source-content): CURRENT_VERSION was rewritten on the error path. Content: $(cat "$case_dir/repo/src/config/versions.ts")"
  fail_count=$((fail_count + 1))
else
  echo "OK (missing-source-content)"
fi

# ---------------------------------------------------------------------------
# Summary.
# ---------------------------------------------------------------------------
if [ "$fail_count" -ne 0 ]; then
  echo "FAILED: $fail_count case(s) failed"
  exit 1
fi
echo "PASSED"
