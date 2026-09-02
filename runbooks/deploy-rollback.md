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
  directory, and is non-empty. It returns `503` otherwise.
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
  an otherwise-successful deploy.
- User-visible signals: docs pages rendering empty/404 for known-good paths,
  or `/api/search` returning no results across the board.

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
5. Confirm `GET /<site>/api/healthz` returns `200` on the restored deploy.

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
(`.github/ISSUE_TEMPLATE/incident_postmortem.yaml`) and link it from this
runbook's future revisions if a new failure mode is discovered.
