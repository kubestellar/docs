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

## Alerting

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

No *external* metrics/alerting backend (Prometheus server, Datadog, or
similar) is confirmed for this project, and nothing here pushes data off-box.
However, an in-process, pull-only Prometheus-format endpoint does already
exist: `/api/metrics` (`src/app/api/metrics/route.ts`, `src/lib/metrics.ts`)
is wired into the production `Service` via `prometheus.io/scrape`
annotations (`cluster-objects/deployment.yaml`) for an in-cluster Prometheus
to optionally discover, if one is present — see "telemetry: add bounded API
metrics, /metrics endpoint, and structured logging" and "Wire existing
/api/healthz and /api/metrics into k8s Deployment/Service".

That endpoint does **not** cover the SLI in this doc: `ApiRoutes` in
`src/lib/metrics.ts` is currently limited to `"search"` and `"docs-image"` —
no counter or histogram records `/api/healthz` outcomes. So even where a
cluster Prometheus scrapes `/api/metrics`, it would not observe
readiness-check success/failure today. The proposed `healthz-monitor`
scheduled workflow (see "Alerting" above, tracked in
[#6701](https://github.com/kubestellar/docs/issues/6701)) remains the only
path to measuring this SLI, unless/until `/api/healthz` outcomes are also
instrumented in `src/lib/metrics.ts`.

If an external metrics backend is confirmed for this project in the future,
this SLI should be re-implemented as a proper time-series query (e.g.
success-rate over the same 30-day window, backed by a `healthz`-labeled
metric) and this doc updated to reference it instead of, or in addition to,
the scheduled-workflow approach.
