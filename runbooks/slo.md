# SLO/SLI: Docs Site Readiness

## Scope

Applies to the production `kubestellar-docs` Netlify site
(`https://kubestellar-docs.netlify.app`), which is what
`https://docs.kubestellar.io` and `https://kubestellar.io/docs` ultimately
redirect/route to. See `runbooks/deploy-rollback.md` for deploy paths.

## SLI: readiness check success rate

**Indicator:** the fraction of `GET /api/healthz` checks against the
production site that return `200 {"status":"ok"}`, sampled every 15 minutes
by a proposed `healthz-monitor` scheduled workflow (see "Alerting" below —
not yet added to this repo; tracked in
[#6701](https://github.com/kubestellar/docs/issues/6701) for a maintainer
with `workflows` permission to add, since agent tokens cannot write files
under `.github/workflows/`).

`/api/healthz` (`src/app/api/healthz/route.ts`) checks the one dependency
required to serve real traffic: the `docs/content` tree is present, is a
directory, and is non-empty. A `200` from this endpoint is a direct proxy
for "this instance can render real documentation pages," not just process
liveness — process liveness alone is checked separately by `/api/livez`
(`src/app/api/livez/route.ts`), which the Deployment's `livenessProbe` uses
instead of `/api/healthz` so a shared-cause content problem (e.g. a bad
volume mount, identical across every replica) marks instances not-ready
rather than triggering a simultaneous restart loop across the whole
Deployment.

## SLO

**Target: 99.5% of readiness checks succeed over a rolling 30-day window**
(no more than ~3.6 hours of cumulative unready time per month).

This target reflects that the docs site has no user-facing write path and a
single content dependency — the acceptable-loss budget is dominated by
deploy-time gaps and content-sync failures, not runtime request failures.

## SLI: API error rate and latency

**Indicator:** the 5xx rate and p95 request latency of the docs site's two
instrumented API routes — `search` (`src/app/api/search/route.ts`) and
`docs-image` (`src/app/api/docs-image/[...path]/route.ts`) — measured from
the `docs_api_requests_total` and `docs_api_request_duration_seconds`
metrics (`src/lib/metrics.ts`), scraped via
`cluster-objects/servicemonitor.yaml`.

**SLO target:** 5xx rate stays under 5% and p95 latency stays under 1s,
each evaluated over a rolling 5-minute window and sustained for 10 minutes
before alerting — see `cluster-objects/prometheusrule.yaml` for the exact
`DocsApiHighErrorRate` and `DocsApiHighRequestLatency` rule expressions,
and `runbooks/api-error-rate-latency.md` for detection/diagnosis/recovery.

Unlike the readiness SLI above, this alerting is already implemented and
live — it only requires an in-cluster Prometheus Operator to already be
scraping the `docs` namespace (see "Notes on monitoring backend" below);
no `workflows`-permission gap applies here.

## Alerting (readiness check)

- **Alert condition:** two consecutive failed scheduled checks (i.e. ready
  state was lost and did not recover within the following 15-minute check),
  or any single check that cannot reach the site at all (network/DNS/TLS
  failure), opens or updates a `[production-outage]`-tagged issue via the
  proposed `healthz-monitor` workflow (tracked in
  [#6701](https://github.com/kubestellar/docs/issues/6701) — it could not
  be committed directly because agent tokens lack the `workflows`
  permission needed to write `.github/workflows/*`).
- **Runbook:** every alert issue links to `runbooks/deploy-rollback.md` for
  detection/rollback steps, and to the "Incident Postmortem" issue template
  (`.github/ISSUE_TEMPLATE/incident_postmortem.yaml`) once the incident is
  resolved.
- **Recovery:** once added, the same workflow closes the alert issue
  automatically with a resolution comment when a subsequent scheduled check
  reports healthy again — this does not change the SLO target or suppress
  the underlying signal, it only reflects that the SLI has recovered.

## Notes on monitoring backend

No metrics/alerting backend is provisioned *by this repository* — the
readiness SLI above is intentionally self-contained (scheduled GitHub
Actions workflow + `curl` + `gh issue`) so it does not depend on any
external monitoring stack. `cluster-objects/prometheusrule.yaml` and
`cluster-objects/servicemonitor.yaml` define a Prometheus Operator
scrape target and alerting rules for the API error-rate/latency SLI
above, but these only take effect if an in-cluster Prometheus Operator is
already watching the `docs` namespace; this repo does not install one or
send data off-box. If no such operator is present in a given deployment,
the API error-rate/latency SLI has no active alerting and only the
readiness SLI (once its workflow is added) applies. If the readiness SLI
is later backed by the same metrics backend, it should be re-implemented
as a proper time-series query and this doc updated to reference it
instead of the scheduled-workflow approach.
