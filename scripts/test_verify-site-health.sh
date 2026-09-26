#!/usr/bin/env bash
# test_verify-site-health.sh — regression guard for scripts/verify-site-health.sh.
#
# The production script polls a /api/healthz endpoint and reports whether
# the docs site is up. It exists as a manual safeguard for the SLI defined
# in runbooks/slo.md, so its exit contract and the shape of its output are
# what an on-call responder relies on during an incident. That contract had
# no automated regression guard — a refactor that dropped the `set -euo`
# guard, swapped the URL-defaulting rule, mis-parsed the `%{http_code}`
# trailer, or forgot to exit non-zero on unhealthy responses would land
# silently.
#
# Test strategy mirrors the runbooks pattern already used by other repos
# in this hive (scripts/test_verify_release_health.sh in homebrew-tap):
# build a self-contained fixture in a temp dir, drop the script into it,
# stub `curl` onto PATH so no real network I/O happens, and drive each
# branch through the stub.
#
# Six cases:
#   1. HEALTHY (default URL)      — stubbed curl returns "{...}\n200",
#                                    script exits 0, prints OK line.
#   2. HEALTHY (custom URL arg)   — trailing slash trimmed correctly, so
#                                    the healthz URL is well-formed.
#   3. UNHEALTHY 503              — stubbed curl returns "{err}\n503",
#                                    script exits 1, prints UNHEALTHY,
#                                    references the deploy-rollback runbook.
#   4. Network / curl failure     — stubbed curl exits non-zero, script
#                                    exits 1 with the "could not reach"
#                                    branch and does NOT reference the
#                                    runbook line (a different branch).
#   5. 200 body preserved         — the JSON body from a healthy response
#                                    is echoed to stdout so an operator can
#                                    inspect it; regression would strip it.
#   6. Non-200 body preserved     — same for unhealthy responses, so the
#                                    operator sees the endpoint's error
#                                    payload alongside the status code.
#
# Usage: scripts/test_verify-site-health.sh
# Exit status: 0 if all assertions pass, 1 otherwise.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT_SOURCE="$REPO_ROOT/scripts/verify-site-health.sh"

if [ ! -f "$SCRIPT_SOURCE" ]; then
  echo "FAIL (setup): script not found at $SCRIPT_SOURCE"
  exit 1
fi

fail_count=0
work_root="$(mktemp -d)"
trap 'rm -rf "$work_root"' EXIT

# Build a case fixture: a copy of the script under $dir/scripts/ and a
# stubbed `curl` under $dir/bin/. The stub writes $body to stdout then
# appends the http_status line the way the real `curl -w '\n%{http_code}'`
# would, and exits with $curl_exit.
_make_fixture() {
  local dir="$1"; local body="$2"; local http_status="$3"; local curl_exit="${4:-0}"
  mkdir -p "$dir/scripts" "$dir/bin"
  cp "$SCRIPT_SOURCE" "$dir/scripts/verify-site-health.sh"
  chmod +x "$dir/scripts/verify-site-health.sh"
  cat > "$dir/bin/curl" <<EOF
#!/usr/bin/env bash
# Record argv so cases can grep for the URL that was polled.
printf '%s\n' "\$*" >> "$dir/bin/curl.log"
if [ "$curl_exit" -ne 0 ]; then
  printf 'network error\n' >&2
  exit $curl_exit
fi
printf '%s\n%s' '$body' '$http_status'
EOF
  chmod +x "$dir/bin/curl"
}

# ---------------------------------------------------------------------------
# Case 1: HEALTHY, default URL.
# ---------------------------------------------------------------------------
case_dir="$work_root/case1"
_make_fixture "$case_dir" '{"ok":true}' 200 0
output=$(PATH="$case_dir/bin:/usr/bin:/bin" \
  "$case_dir/scripts/verify-site-health.sh" 2>&1)
exit_code=$?
if [ "$exit_code" -ne 0 ]; then
  echo "FAIL (healthy-default): expected exit=0, got exit=$exit_code. Output: $output"
  fail_count=$((fail_count + 1))
elif ! printf '%s' "$output" | grep -q "OK — .*/api/healthz returned 200"; then
  echo "FAIL (healthy-default): expected OK line. Got: $output"
  fail_count=$((fail_count + 1))
elif ! grep -q "kubestellar-docs.netlify.app/api/healthz" "$case_dir/bin/curl.log"; then
  echo "FAIL (healthy-default): curl was not called against the default healthz URL. Log: $(cat "$case_dir/bin/curl.log")"
  fail_count=$((fail_count + 1))
else
  echo "OK (healthy-default)"
fi

# ---------------------------------------------------------------------------
# Case 2: HEALTHY, custom URL with trailing slash. The script must trim
# the trailing '/' before appending /api/healthz — a regression that
# concatenated blindly would produce '//api/healthz' and skew the
# curl.log grep below.
# ---------------------------------------------------------------------------
case_dir="$work_root/case2"
_make_fixture "$case_dir" '{"ok":true}' 200 0
output=$(PATH="$case_dir/bin:/usr/bin:/bin" \
  "$case_dir/scripts/verify-site-health.sh" "https://staging.example.test/" 2>&1)
exit_code=$?
if [ "$exit_code" -ne 0 ]; then
  echo "FAIL (healthy-custom): expected exit=0, got exit=$exit_code. Output: $output"
  fail_count=$((fail_count + 1))
elif grep -q "//api/healthz" "$case_dir/bin/curl.log"; then
  echo "FAIL (healthy-custom): trailing-slash guard removed — curl called with double slash. Log: $(cat "$case_dir/bin/curl.log")"
  fail_count=$((fail_count + 1))
elif ! grep -q "staging.example.test/api/healthz" "$case_dir/bin/curl.log"; then
  echo "FAIL (healthy-custom): expected custom URL in curl argv. Log: $(cat "$case_dir/bin/curl.log")"
  fail_count=$((fail_count + 1))
else
  echo "OK (healthy-custom)"
fi

# ---------------------------------------------------------------------------
# Case 3: UNHEALTHY 503. Exit 1, UNHEALTHY line with status code, and
# the deploy-rollback runbook pointer (this is a different code path
# from the "could not reach" branch which does NOT print the runbook
# reference).
# ---------------------------------------------------------------------------
case_dir="$work_root/case3"
_make_fixture "$case_dir" '{"error":"database unreachable"}' 503 0
output=$(PATH="$case_dir/bin:/usr/bin:/bin" \
  "$case_dir/scripts/verify-site-health.sh" 2>&1)
exit_code=$?
if [ "$exit_code" -ne 1 ]; then
  echo "FAIL (unhealthy-503): expected exit=1, got exit=$exit_code. Output: $output"
  fail_count=$((fail_count + 1))
elif ! printf '%s' "$output" | grep -q "UNHEALTHY — .* returned 503"; then
  echo "FAIL (unhealthy-503): expected UNHEALTHY … 503 line. Got: $output"
  fail_count=$((fail_count + 1))
elif ! printf '%s' "$output" | grep -q "runbooks/deploy-rollback.md"; then
  echo "FAIL (unhealthy-503): expected runbook pointer. Got: $output"
  fail_count=$((fail_count + 1))
else
  echo "OK (unhealthy-503)"
fi

# ---------------------------------------------------------------------------
# Case 4: curl fails (network/DNS/TLS). Exit 1, "could not reach" line,
# and NO runbook pointer (that's a separate branch above).
# ---------------------------------------------------------------------------
case_dir="$work_root/case4"
_make_fixture "$case_dir" '' 0 6
output=$(PATH="$case_dir/bin:/usr/bin:/bin" \
  "$case_dir/scripts/verify-site-health.sh" 2>&1)
exit_code=$?
if [ "$exit_code" -ne 1 ]; then
  echo "FAIL (curl-fail): expected exit=1, got exit=$exit_code. Output: $output"
  fail_count=$((fail_count + 1))
elif ! printf '%s' "$output" | grep -q "could not reach"; then
  echo "FAIL (curl-fail): expected 'could not reach' diagnostic. Got: $output"
  fail_count=$((fail_count + 1))
elif printf '%s' "$output" | grep -q "runbooks/deploy-rollback.md"; then
  echo "FAIL (curl-fail): runbook pointer leaked into the network-error branch."
  fail_count=$((fail_count + 1))
else
  echo "OK (curl-fail)"
fi

# ---------------------------------------------------------------------------
# Case 5: 200 body is preserved on stdout so operators can inspect the
# JSON payload alongside the OK line.
# ---------------------------------------------------------------------------
case_dir="$work_root/case5"
distinctive='{"ok":true,"content_root":"/opt/docs","file_count":1234}'
_make_fixture "$case_dir" "$distinctive" 200 0
output=$(PATH="$case_dir/bin:/usr/bin:/bin" \
  "$case_dir/scripts/verify-site-health.sh" 2>&1)
if ! printf '%s' "$output" | grep -q '"file_count":1234'; then
  echo "FAIL (body-200): expected healthy body to be echoed. Got: $output"
  fail_count=$((fail_count + 1))
else
  echo "OK (body-200)"
fi

# ---------------------------------------------------------------------------
# Case 6: non-200 body is preserved on stdout so operators can see what
# the endpoint said about the failure.
# ---------------------------------------------------------------------------
case_dir="$work_root/case6"
distinctive='{"error":"content tree missing","code":"E_CONTENT_ROOT"}'
_make_fixture "$case_dir" "$distinctive" 500 0
output=$(PATH="$case_dir/bin:/usr/bin:/bin" \
  "$case_dir/scripts/verify-site-health.sh" 2>&1)
if ! printf '%s' "$output" | grep -q '"code":"E_CONTENT_ROOT"'; then
  echo "FAIL (body-500): expected unhealthy body to be echoed. Got: $output"
  fail_count=$((fail_count + 1))
else
  echo "OK (body-500)"
fi

if [ "$fail_count" -eq 0 ]; then
  echo "All verify-site-health.sh tests passed."
  exit 0
else
  echo "$fail_count verify-site-health.sh test(s) failed."
  exit 1
fi
