# Runbook: Docs API High Error Rate / High Latency

## Scope

Applies to the three alerts defined in `cluster-objects/prometheusrule.yaml`
over the docs site's existing `/api/metrics` output
(`src/lib/metrics.ts`), which only instruments the `search`
(`src/app/api/search/route.ts`) and `docs-image`
(`src/app/api/docs-image/[...path]/route.ts`) routes:

- **`DocsApiHighErrorRate`** — fires when more than 5% of requests to
  these instrumented routes return a `5xx` status over a 5-minute window,
  sustained for 10 minutes.
- **`DocsApiHighRequestLatency`** — fires when the p95 request duration
  across these routes exceeds 1s over a 5-minute window, sustained for 10
  minutes.
- **`DocsApiMetricsTargetDown`** — fires when Prometheus has been unable
  to scrape the `kubestellar-docs` job for 10 minutes. This covers the
  blackout case the other two alerts cannot: while the scrape target is
  down, both rate/ratio expressions evaluate over no data and stay
  silent, so a crash-looping pod, an `/api/metrics` regression, or a
  `ServiceMonitor`/selector mismatch would otherwise go undetected.

### Other PrometheusRule resources over the same metrics

Two other files independently define alerts over the same
`docs_api_requests_total` / `docs_api_request_duration_seconds` metrics,
added by separate PRs (#6741, #6745) without being reconciled against
`prometheusrule.yaml` above:

- `cluster-objects/alerts.yaml` (`kubestellar-docs-alerts`): per-route
  `DocsApiHighErrorRate` (>5%) and `DocsApiHighLatency` (p95 > 2s).
- `cluster-objects/prometheusrule-docs-api.yaml`
  (`kubestellar-docs-api-alerts`): `DocsApiHighErrorRatio` (4xx+5xx >
  10%) and `DocsApiHighLatencyP95` (p95 > 2s).

All three files are valid, independently-applicable resources with
different `metadata.name` values, so a cluster operator could apply more
than one at once. If that happens, expect duplicate and inconsistent
paging for the same underlying condition (different alert names and
thresholds — 5% vs. 10% error-rate, 1s vs. 2s p95 latency — for what is
effectively the same symptom). **Recommendation:** an operator/maintainer
should pick one PrometheusRule as canonical for this repo and remove or
merge the others; until that happens, treat any of the six alert names
above as covered by this runbook, and confirm which file(s) are actually
applied in your cluster before assuming a given threshold governs
production.

All three alerts only fire if a Prometheus Operator is already scraping
this namespace via `cluster-objects/servicemonitor.yaml` — this runbook
does not assume any specific monitoring backend is provisioned.

## Detecting and diagnosing `DocsApiHighErrorRate`

1. Both instrumented routes wrap their handler body in a `catch` that
   sets `status = 500` and logs a structured `error` entry (see
   `logger.error("search request failed", ...)` /
   `logger.error('docs-image request failed', ...)`). Check application
   logs for these two messages first to see the underlying `error` field
   and narrow down which route and root cause is responsible.
2. For `search`: a 500 here means the search index/query path itself
   threw (not a "no results" case, which returns `200` with an empty
   array) — check for a missing/corrupt search index artifact or an
   unexpected query-parsing failure.
3. For `docs-image`: a 500 here typically means the requested image
   asset could not be read/streamed from disk — check whether the
   `docs/content` tree (the same dependency `/api/healthz` checks, see
   `runbooks/deploy-rollback.md`) is present and intact, since a bad
   volume mount or incomplete deploy affects both.
4. If `/api/healthz` is also reporting `503` at the same time, treat this
   as the same underlying incident and follow
   `runbooks/deploy-rollback.md` instead — the API error rate is a
   symptom of the missing/broken content dependency, not a separate root
   cause.

## Detecting and diagnosing `DocsApiHighRequestLatency`

1. Confirm which route is slow: compare
   `docs_api_request_duration_seconds_bucket{route="search"}` against
   `route="docs-image"` in Prometheus/Grafana — the alert's
   `histogram_quantile` aggregates both routes together, so the raw
   per-route buckets are needed to isolate which one regressed.
   `cluster-objects/grafana-dashboard.json` has a ready-made "P95 request
   latency by route" panel for this exact comparison (import it into a
   Grafana instance already pointed at the Prometheus scraping this
   deployment — it does not configure a data source itself).
2. For `search`: elevated latency usually indicates a larger-than-normal
   search index, a slow/uncached parse of the query, or resource
   contention on the instance (check pod CPU/memory alongside this
   alert).
3. For `docs-image`: elevated latency usually indicates slow disk I/O
   reading a large asset, or resource contention — check pod-level
   CPU/memory and disk I/O metrics for the same window.
4. A sustained latency regression with no matching error-rate increase
   does not necessarily indicate a broken deploy — check recent traffic
   volume first, since a legitimate spike in requests can raise p95
   latency without any content or code defect.

## Detecting and diagnosing `DocsApiMetricsTargetDown`

1. Check pod status first (`kubectl get pods -n docs -l app=kubestellar-docs`)
   — a crash-looping or pending pod is the most common cause and is a
   deploy/infra problem, not an application code defect.
2. If pods are `Running`, check whether `/api/metrics` itself is
   responding (`kubectl exec` into a pod, or port-forward and `curl
   localhost:3000/api/metrics`) — a regression in the metrics route
   handler itself would leave the pod healthy but the scrape failing.
3. If the endpoint responds locally but Prometheus still reports the
   target down, check that `cluster-objects/servicemonitor.yaml`'s
   `spec.selector`/`spec.namespaceSelector` still match the current
   `Service` object's labels (`cluster-objects/deployment.yaml`) — a
   label drift between the two is a silent scrape-config break with no
   other symptom.
4. This alert firing does not by itself mean traffic is failing —
   `/api/healthz`/`/api/livez` and real user traffic may be unaffected.
   Treat it as "observability is blind right now", and prioritize
   restoring the scrape target so `DocsApiHighErrorRate` /
   `DocsApiHighRequestLatency` can do their job again.

## Recovery

- If the root cause is a bad deploy or missing/corrupt content tree,
  follow the rollback steps in `runbooks/deploy-rollback.md`.
- If the root cause is resource contention (CPU/memory/disk) at
  higher-than-expected traffic, scale the Deployment
  (`cluster-objects/deployment.yaml`) rather than rolling back, since no
  code or content regression is involved.
- Both alerts clear automatically once the underlying rate/latency drops
  back under threshold for a subsequent 5-minute evaluation window — no
  manual alert-clearing step is required.
