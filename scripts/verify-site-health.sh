#!/bin/bash
# Manual safeguard for runbooks/deploy-rollback.md's "Detecting a bad
# deploy" step and the SLI defined in runbooks/slo.md.
#
# Polls the production readiness endpoint (GET /api/healthz) and reports
# whether the docs site's one real dependency for serving traffic — the
# docs/content tree — is present, non-empty, and readable. This is the same
# check a future automated healthz-monitor workflow (tracked in
# https://github.com/kubestellar/docs/issues/6701) would run on a schedule;
# until that workflow exists, this script lets an on-call responder run the
# same check by hand during a suspected outage or right after a deploy.
#
# Usage:
#   scripts/verify-site-health.sh [site-url]
#
# site-url defaults to the production site. Exits 0 when healthy, 1 when
# the endpoint reports unhealthy or cannot be reached at all.

set -euo pipefail

SITE_URL="${1:-https://kubestellar-docs.netlify.app}"
HEALTHZ_URL="${SITE_URL%/}/api/healthz"

echo "[verify-site-health] checking $HEALTHZ_URL"

http_status=0
body=""
if ! body=$(curl -sS --max-time 15 -w '\n%{http_code}' "$HEALTHZ_URL" 2>&1); then
  echo "[verify-site-health] UNHEALTHY — could not reach $HEALTHZ_URL (network/DNS/TLS failure)"
  echo "$body"
  exit 1
fi

http_status="${body##*$'\n'}"
response_json="${body%$'\n'*}"

if [ "$http_status" = "200" ]; then
  echo "[verify-site-health] OK — $HEALTHZ_URL returned 200"
  echo "$response_json"
  exit 0
fi

echo "[verify-site-health] UNHEALTHY — $HEALTHZ_URL returned $http_status"
echo "$response_json"
echo
echo "See runbooks/deploy-rollback.md for rollback steps."
exit 1
