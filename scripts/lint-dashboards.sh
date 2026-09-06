#!/usr/bin/env bash
# Lints the repo's self-observability artifacts:
#   - cluster-objects/*.json          Grafana dashboard(s) for the docs site's
#                                      own bounded Prometheus self-metrics.
#   - cluster-objects/prometheusrule.yaml  Alerting rules over the same metrics.
#
# Checks performed:
#   1. Each dashboard JSON file is well-formed and has the minimum fields
#      Grafana expects (title, panels).
#   2. `promtool check rules` validates prometheusrule.yaml for
#      syntactically/semantically valid PromQL and rule structure, if
#      promtool is available (best-effort locally; required in CI).
#   3. Every metric name referenced by a dashboard panel or alert rule is in
#      the bounded allow-list derived from src/lib/metrics.ts. This guards
#      against a dashboard or alert silently drifting to reference an
#      unbounded or not-yet-registered metric.
#
# Requires: jq. promtool is optional locally (skipped with a warning if
# missing) but should be installed in CI for full rule validation.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

METRICS_TS="src/lib/metrics.ts"
RULES_FILE="cluster-objects/prometheusrule.yaml"
DASHBOARD_GLOB="cluster-objects/*.json"

fail=0

echo "== Deriving bounded metric allow-list from ${METRICS_TS} =="
# Extract `name: "docs_..."` literals — the only metrics this app actually
# registers (see src/lib/metrics.ts).
mapfile -t base_metrics < <(grep -oP 'name:\s*"\K[^"]+' "$METRICS_TS" | sort -u)
if [ "${#base_metrics[@]}" -eq 0 ]; then
  echo "::error::No metric names found in ${METRICS_TS} — refusing to lint against an empty allow-list"
  exit 1
fi

# Build the full allow-list including histogram suffixes Prometheus
# generates automatically (_bucket, _sum, _count) so alerts/dashboards that
# query those derived series aren't flagged as unknown.
allow_list=()
for m in "${base_metrics[@]}"; do
  allow_list+=("$m" "${m}_bucket" "${m}_sum" "${m}_count")
done
printf ' - %s\n' "${base_metrics[@]}"

is_allowed() {
  local candidate="$1"
  for m in "${allow_list[@]}"; do
    [ "$candidate" = "$m" ] && return 0
  done
  return 1
}

# Scans a chunk of text for identifiers that look like our metrics
# (docs_<word>) and flags any not in the allow-list.
check_metric_refs() {
  local source_label="$1"
  local text="$2"
  local found
  found=$(grep -oP 'docs_[a-zA-Z0-9_]+' <<<"$text" | sort -u || true)
  while IFS= read -r ref; do
    [ -z "$ref" ] && continue
    if ! is_allowed "$ref"; then
      echo "::error::${source_label} references unbounded/unknown metric '${ref}' (not in ${METRICS_TS} allow-list)"
      fail=1
    fi
  done <<<"$found"
}

echo
echo "== Validating dashboard JSON files =="
shopt -s nullglob
dashboards=($DASHBOARD_GLOB)
if [ "${#dashboards[@]}" -eq 0 ]; then
  echo "::error::No dashboard JSON files found matching ${DASHBOARD_GLOB}"
  exit 1
fi
for f in "${dashboards[@]}"; do
  echo "-- ${f}"
  if ! jq empty "$f" 2>/tmp/jq-err.txt; then
    echo "::error::${f} is not valid JSON: $(cat /tmp/jq-err.txt)"
    fail=1
    continue
  fi
  title=$(jq -r '.title // empty' "$f")
  panel_count=$(jq -r '.panels // [] | length' "$f")
  if [ -z "$title" ]; then
    echo "::error::${f} is missing a top-level 'title'"
    fail=1
  fi
  if [ "$panel_count" -eq 0 ]; then
    echo "::error::${f} has no panels"
    fail=1
  fi
  check_metric_refs "$f" "$(jq -r '[.panels[]?.targets[]?.expr // empty] | join("\n")' "$f")"
done

echo
echo "== Validating alert rules =="
if [ -f "$RULES_FILE" ]; then
  check_metric_refs "$RULES_FILE" "$(cat "$RULES_FILE")"
  if command -v promtool >/dev/null 2>&1; then
    # promtool expects a plain Prometheus rules file, not a PrometheusRule
    # CRD — extract .spec.groups as a standalone rules YAML for validation.
    tmp_rules="$(mktemp)"
    if command -v yq >/dev/null 2>&1; then
      yq eval '{"groups": .spec.groups}' "$RULES_FILE" >"$tmp_rules"
      if ! promtool check rules "$tmp_rules"; then
        echo "::error::promtool check rules failed for ${RULES_FILE}"
        fail=1
      fi
    else
      echo "::warning::yq not found — skipping promtool validation of ${RULES_FILE} (metric-reference check above still ran)"
    fi
    rm -f "$tmp_rules"
  else
    echo "::warning::promtool not found — skipping PromQL syntax validation of ${RULES_FILE} locally (CI should install it)"
  fi
else
  echo "::warning::${RULES_FILE} not found — skipping alert rule lint"
fi

echo
if [ "$fail" -ne 0 ]; then
  echo "== dashboard-lint FAILED =="
  exit 1
fi
echo "== dashboard-lint OK =="
