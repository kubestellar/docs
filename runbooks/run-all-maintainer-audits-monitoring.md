# Runbook: Detecting a Silently-Failed Maintainer Audits Run

## Scope

Applies to `.github/workflows/run-all-maintainer-audits.yml`, which runs
every Monday at 17:00 UTC (`cron: "0 17 * * 1"`) and via
`workflow_dispatch`. It iterates over the project's maintainer list
sequentially, triggering `maintainer-metrics.lock.yml` (via
`gh workflow run`) for each maintainer to refresh their activity audit.

## Known gap

The workflow has no `if: failure()` step and does not open or update a
tracking issue if a run fails or exits partway through the maintainer
list. Because maintainers are processed sequentially in a single job, a
failure partway through (rate limiting, a bad `gh workflow run` call, a
transient runner issue) can silently stop the remaining audits from being
triggered for that week, with no signal beyond a red X in the Actions tab.
See [#6714](https://github.com/kubestellar/docs/issues/6714) for the
tracked finding; the workflow-side `if: failure()` fix needs a maintainer
with `workflows` permission to add, since agent tokens cannot write files
under `.github/workflows/*`.

## Detecting a silent failure manually

Until the automated alert is added, check for a stalled or failed run:

1. Open the
   [Run All Maintainer Audits workflow run history](https://github.com/kubestellar/docs/actions/workflows/run-all-maintainer-audits.yml)
   and confirm a run exists for the most recent Monday and that it
   completed with a green check. A missing run, or one that ended with a
   red X, means that week's audits did not fully trigger.
2. Compare the run's logged maintainer list against the full maintainer
   list in the workflow file — if the job log stops partway through (e.g.
   only a subset of maintainers were processed before the run failed),
   the remaining maintainers' `maintainer-metrics.lock.yml` audits were
   never triggered for that cycle.
3. Check the
   [Maintainer Metrics workflow run history](https://github.com/kubestellar/docs/actions/workflows/maintainer-metrics.lock.yml)
   to confirm one triggered run per maintainer for the current cycle.
4. If either check indicates a stalled/failed run, re-run
   `run-all-maintainer-audits.yml` manually via `workflow_dispatch`
   (Actions tab → "Run All Maintainer Audits" → "Run workflow") and, if it
   fails again, open a tracking issue describing the failure mode so a
   maintainer can investigate (transient vs. persistent).

## Recovery

No rollback is required — a failed or partial audit run does not affect
the production docs site or its content. The impact is limited to stale or
missing maintainer activity metrics for that week until the next
successful (or manually re-triggered) run.
