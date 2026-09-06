# Runbook: Docs API High Error Rate / High Latency

## Scope

Applies to the two alerts defined in `cluster-objects/prometheusrule.yaml`
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

Both alerts only fire if a Prometheus Operator is already scraping this
namespace via `cluster-objects/servicemonitor.yaml` — this runbook does
not assume any specific monitoring backend is provisioned.

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
