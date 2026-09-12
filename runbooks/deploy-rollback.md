# Runbook: Docs Site Deploy Rollback

## Scope

Applies to the `kubestellar/docs` Next.js site, which ships through two paths:

- **Netlify** (primary): builds and deploys on every push to `main` and to
  version branches (`docs/*`, see `netlify.toml`).
- **Container image** (`Dockerfile`): builds a runtime image from prebuilt
  `.next/` output for container-based deployment.

## Detecting a bad deploy

- `GET /api/healthz` reports readiness. It returns `200 {"status":"ok"}`
  only when the docs content tree (`docs/content`, the directory every page
  render and `/api/search` read from at request time) is present, is a
  directory, and is non-empty. It returns `503` otherwise. `GET /api/livez`
  is a separate, dependency-free liveness check used by the Deployment's
  `livenessProbe` (see `cluster-objects/deployment.yaml`) — it always
  returns `200` so a content-tree problem marks a pod not-ready instead of
  triggering a restart loop that cannot fix a bad volume mount.
- The container image's `HEALTHCHECK` calls this same endpoint, so
  `docker ps` / your orchestrator's readiness status reflects real content
  availability, not just process liveness.
- A proposed `healthz-monitor` scheduled workflow (see `runbooks/slo.md`)
  would poll the production readiness endpoint every 15 minutes and open a
  `[production-outage]` issue (label `site-outage`) if it stays unhealthy
  across two consecutive checks, or close that issue automatically on
  recovery. It has not been implemented yet — tracked in
  [#6701](https://github.com/kubestellar/docs/issues/6701) since agent
  tokens lack the `workflows` permission required to write
  `.github/workflows/*` and a maintainer needs to add it. This would be
  distinct from `.github/workflows/netlify-error-reporter.yml`, which only
  fires on build-time Netlify deploy failures, not a runtime regression in
  an otherwise-successful deploy. For a build-time failure (the site
  serving stale content because the latest commit never finished a
  successful build), see `runbooks/netlify-build-failure.md` instead of
  the rollback steps below.
- **Neither of the above catches a "stuck on stale content" deploy.**
  `.github/workflows/netlify-error-reporter.yml` only runs when GitHub
  receives a `status` event from Netlify's GitHub integration — if that
  integration itself stops sending status events (revoked/misconfigured
  App installation, broken webhook, Netlify-side outage in the
  status-posting path), the workflow never runs and produces zero signal.
  Meanwhile `GET /api/healthz` keeps reporting `200` the whole time,
  because the content tree it checks is still present and non-empty, just
  from an old commit — it has no way to know `main` stopped deploying. If
  the docs site looks stuck on old content with no matching commit/PR
  reporting a Netlify failure, treat this as a possible silent-integration
  failure and check the Netlify dashboard directly rather than trusting
  the absence of a `netlify-error-reporter` alert. Tracked in
  [#6778](https://github.com/kubestellar/docs/issues/6778) for a
  maintainer to add a scheduled check comparing the latest Netlify
  deploy's `commit_ref` against `main`'s HEAD SHA.
- User-visible signals: docs pages rendering empty/404 for known-good paths,
  or `/api/search` returning no results across the board.
- Until the automated `healthz-monitor` workflow above exists, run
  `scripts/verify-site-health.sh` (optionally passing a site URL, e.g. a
  Netlify deploy-preview URL, as the first argument) to run the same
  readiness check by hand — useful right after a deploy or when a runtime
  regression is suspected. It exits non-zero and prints the endpoint's
  `reason` field on failure.

## Rollback: Netlify path

1. Open the Netlify dashboard for the `kubestellar-docs` site (or run
   `netlify status` / `netlify deploy:list` if you have the CLI configured).
2. Identify the last known-good deploy (the one immediately before the
   regression).
3. Use **"Publish deploy"** on that prior deploy to instantly restore it as
   production — this does not require a new build or a revert commit.
4. In parallel, open a revert PR against the offending commit(s) on `main`
   (or the affected `docs/*` version branch) so the next normal deploy does
   not reintroduce the regression.
5. Confirm `GET /<site>/api/healthz` returns `200` on the restored deploy —
   run `scripts/verify-site-health.sh` to check this without a manual curl.

## Rollback: Container image path

1. Re-deploy the previous known-good image tag (the registry/orchestrator
   should retain at least the last few tags — do not rely on `latest`).
2. Confirm the new container reports healthy: `docker inspect --format
   '{{.State.Health.Status}}' <container>` (or the equivalent orchestrator
   readiness check) reaches `healthy`.
3. If the rollout still reports unhealthy after reverting the image tag,
   check whether the `docs/content` directory is actually present in the
   image/volume for that tag — `/api/healthz` will report `503` with a
   `reason` field describing exactly what is missing or unreadable.
4. `cluster-objects/poddisruptionbudget.yaml` bounds *voluntary*
   disruptions (node drains, cluster-autoscaler scale-downs) to the same
   one-replica-at-a-time ceiling the Deployment's own
   `RollingUpdate.maxUnavailable: 1` already assumes for self-inflicted
   rollout unavailability. If more than one of the 3 replicas is
   unexpectedly unready at once outside of an active rollout, confirm this
   object is applied and its selector still matches the Deployment's pod
   labels before assuming a code-level regression.

## Related: bad automated version-branch/config push

If the symptom is a wrong entry in the version picker, a version pointing
at the wrong content, or an unexpected change to which branch is served as
"latest" — rather than a bad deploy of otherwise-correct content — see
`runbooks/version-branch-rollback.md`. That failure mode comes from the
`create-version-branch.yml` automation, which pushes a version branch and
self-approves its own `versions.ts`/`shared.json` update PR, and needs a
different rollback path (revert the config commit / delete the bad
branch) than the deploy rollback steps above.

## Escalation

If rollback does not resolve the issue within one on-call cycle, open an
incident using the "Docs site incident" issue template
(`.github/ISSUE_TEMPLATE/incident_postmortem.yaml` — labeled `kind/incident,
lifecycle/frozen`, the latter so the stale-bot in `.github/workflows/stale.yml`
never auto-closes an open incident tracking issue) and link it from this
runbook's future revisions if a new failure mode is discovered.
