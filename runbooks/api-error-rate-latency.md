# Runbook: Docs API High Error Rate / High Latency

## Scope

Applies to the app-metric alerts defined in `cluster-objects/alerts.yaml`
over the docs site's existing `/api/metrics` output (`src/lib/metrics.ts`).
As of [#6800](https://github.com/kubestellar/docs/pull/6800), that registry
instruments four routes — `search` (`src/app/api/search/route.ts`),
`docs-image` (`src/app/api/docs-image/[...path]/route.ts`), `healthz`
(`src/app/api/healthz/route.ts`), and `livez` (`src/app/api/livez/route.ts`)
— not just the first two; the `ApiRoutes` union in `src/lib/metrics.ts` is
the source of truth. Because the `Aggregate`-suffixed alerts aggregate
`docs_api_requests_total` / `docs_api_request_duration_seconds` across all
instrumented routes (no `route` filter in their `expr`), a sustained `503`
from `/api/healthz` (reported separately by `DocsApiMetricsTargetDown`'s
sibling readiness checks, see `runbooks/deploy-rollback.md`) also counts
toward those alerts' 5xx ratio, not just `search`/`docs-image` failures —
check `/api/healthz`'s own status first (step 4 below) before assuming an
error-rate alert implicates one of the two routes this runbook's
diagnosis steps focus on. `livez` always returns `200`, so it does not
contribute to any error-rate alert, but its (normally trivial) latency is
included in the aggregate p95 the latency alerts evaluate.

- **`DocsApiHighErrorRate`** — fires when more than 5% of requests to a
  given route return a `5xx` status over a 5-minute window, sustained for
  10 minutes (per-route).
- **`DocsApiHighErrorRateAggregate`** — the same 5xx-only check,
  aggregated across all instrumented routes instead of per-route.
- **`DocsApiHighErrorRatio`** — fires when more than 10% of requests
  across all instrumented routes return a `4xx` or `5xx` status (not
  5xx-only) over a 5-minute window, sustained for 10 minutes — catches a
  sustained client-error storm the 5xx-only alerts above cannot.
- **`DocsApiHighLatency`** — fires when the p95 request duration for a
  given route exceeds 2s over a 5-minute window, sustained for 10 minutes
  (per-route).
- **`DocsApiHighRequestLatencyAggregate`** — fires when the aggregate p95
  request duration across all instrumented routes exceeds 1s over a
  5-minute window, sustained for 10 minutes.
- **`DocsApiMetricsTargetDown`** (`cluster-objects/prometheusrule.yaml`)
  — fires when Prometheus has been unable to scrape the `kubestellar-docs`
  job for 10 minutes. This covers the blackout case the other alerts
  cannot: while the scrape target is down, every rate/ratio expression
  above evaluates over no data and stays silent, so a crash-looping pod,
  an `/api/metrics` regression, or a `ServiceMonitor`/selector mismatch
  would otherwise go undetected.

All of the above only fire if a Prometheus Operator is already scraping
this namespace via `cluster-objects/servicemonitor.yaml` — this runbook
does not assume any specific monitoring backend is provisioned.

`cluster-objects/alerts.yaml` is now the single canonical PrometheusRule
for all `docs_api_*`/`docs_i18n_*` app-metric alerts; the previous
three-way duplication across `alerts.yaml`, `prometheusrule.yaml`, and
`prometheusrule-docs-api.yaml` (tracked in
[#6884](https://github.com/kubestellar/docs/issues/6884), closed without
the underlying fix landing) has been consolidated — every distinct
detection case was merged in, only renaming alerts where needed to avoid
an exact `alert:` name collision, with no threshold loosened.
`prometheusrule-docs-api.yaml` was removed entirely;
`prometheusrule.yaml` now holds only the infra/platform alerts
(`DocsApiMetricsTargetDown`, the rollout-checker CronJob alerts) that
reference metrics outside `src/lib/metrics.ts` and so can't be validated
by `scripts/lint-dashboard.mjs`'s known-metric check if moved into
`alerts.yaml`. See `cluster-objects/alerts.yaml`'s header comment for the
full mapping.

The dashboard-side drift ([#6891](https://github.com/kubestellar/docs/issues/6891),
[#6928](https://github.com/kubestellar/docs/issues/6928),
[#7318](https://github.com/kubestellar/docs/issues/7318)) has been
consolidated into a single dashboard, `cluster-objects/dashboard.json`,
whose error-rate panel is the per-route 5xx rate matching
`DocsApiHighErrorRate`. `dashboard-docs-api.json` and
`grafana-dashboard.json` were removed; their distinct coverage
(scrape-down signal) was folded into `dashboard.json`.

## Detecting and diagnosing `DocsApiHighErrorRate` / `DocsApiHighErrorRateAggregate` / `DocsApiHighErrorRatio`

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

## Detecting and diagnosing `DocsApiHighLatency` / `DocsApiHighRequestLatencyAggregate`

1. Confirm which route is slow: compare
   `docs_api_request_duration_seconds_bucket{route="search"}` against
   `route="docs-image"` in Prometheus/Grafana — the alert's
   `histogram_quantile` aggregates both routes together, so the raw
   per-route buckets are needed to isolate which one regressed.
   `cluster-objects/dashboard.json` has a ready-made "p95 request
   duration by route" panel for this exact comparison (import it into a
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
   restoring the scrape target so the error-rate and latency alerts in
   `cluster-objects/alerts.yaml` can do their job again.

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
