# Runbook: Detecting a Silently-Failed Netlify Freshness Check

## Scope

Applies to the `check-deploy-freshness` job in
`.github/workflows/netlify-error-reporter.yml`, which runs every 6 hours
(`cron: '0 */6 * * *'`) and is the scheduled fallback that detects a
production Netlify deploy going stale — specifically the case where the
Netlify↔GitHub `status`-event integration itself has gone silent
(revoked/misconfigured GitHub App, broken webhook, Netlify-side outage),
so the workflow's primary, event-reactive `report-netlify-failure` job
never runs at all. See the job's own header comment and
`runbooks/netlify-build-failure.md` for the normal (event-driven) alert
path.

## Known gap

Unlike `fuzz-mdx.yml`, `generate-acmm-history.yml`,
`generate-leaderboard.yml`, `healthz-monitor.yml`,
`run-all-maintainer-audits.yml`, `scorecard.yml`, `stale.yml`, and
`sync-console-release-versions.yml` — every other scheduled, alerting
workflow in this repo — `netlify-error-reporter.yml` has no step with
`if: failure()` anywhere in it. If the `check-deploy-freshness` job fails
outright (a `checkout` failure, or an unexpected non-zero exit from
`jq`/`curl` in a code path not already guarded by the script's own
`|| { ...; exit 0; }` fallbacks), the run ends with a red X and nothing
alerts a maintainer.

Because this job is itself the *backup* detection path for a dead
Netlify↔GitHub integration, a silent failure here is compounding, not
independent: both the primary (event-driven) and the fallback (scheduled)
signal can be down at once with zero automated indication, while the live
site may be serving stale content with no alert of either problem.

This gap is tracked in
[kubestellar/docs#7377](https://github.com/kubestellar/docs/issues/7377),
which includes the exact replacement workflow step to close it. That
change touches `.github/workflows/netlify-error-reporter.yml` and must be
applied by a maintainer or an `ISSUES_PRS_MERGE`-mode agent — it cannot be
delivered as a PR from a `contributor`-tier token.

## Detecting a silent failure manually

Until the workflow-level alert above lands, use these steps to confirm
whether `check-deploy-freshness` is running and succeeding on schedule:

1. Open the
   [netlify-error-reporter.yml run history](https://github.com/kubestellar/docs/actions/workflows/netlify-error-reporter.yml)
   and filter for `schedule`-triggered runs. Confirm one exists within the
   last 6–7 hours with a green check on the `check-deploy-freshness` job
   specifically (the `report-netlify-failure` job is skipped on schedule
   triggers by design — that is expected, not a failure).
2. If the most recent scheduled run is red, open its logs and identify
   which step failed. A failure before the freshness comparison completes
   means this cycle could not tell you whether the production deploy is
   stale or fresh.
3. Independent of the workflow's own status, verify deploy freshness
   directly: compare the latest Netlify deploy's commit
   (`https://app.netlify.com/sites/<site>/deploys`, or
   `gh api sites/<site-id>/deploys?per_page=1` via the Netlify API) against
   `git rev-parse origin/main`. A mismatch with no in-progress deploy for
   `main`'s HEAD means the production site may be serving stale content
   regardless of whether this workflow is alerting on it.
4. If a stalled/failed run is confirmed, re-run it manually via
   `workflow_dispatch` (Actions tab → "Netlify Deploy Failure Reporter" →
   "Run workflow"), and treat any confirmed staleness found in step 3 per
   `runbooks/netlify-build-failure.md` and `runbooks/deploy-rollback.md`.

## Recovery

No rollback is required for a monitoring-workflow failure by itself — it
does not affect the production docs site directly. However, treat any
confirmed gap in this watchdog's coverage as reduced confidence in deploy
freshness for that window: if step 3 above reveals the site was actually
stale during the gap, follow `runbooks/netlify-build-failure.md` and
`runbooks/deploy-rollback.md` immediately.
