# Runbook: Detecting a Silently-Failed/Partial Maintainer Audit Run

## Scope

Applies to `.github/workflows/run-all-maintainer-audits.yml`, which runs
weekly (`cron: "0 17 * * 1"`, Mondays 12:00 PM Eastern) and sequentially
triggers `maintainer-metrics.lock.yml` for each of 7 maintainers via
`gh workflow run`, sleeping 3.5 minutes between dispatches.

## Known gap

The `audit-all` job has no `if: failure()` step, unlike
`generate-leaderboard.yml` and `generate-acmm-history.yml` in this repo,
which both open/update a dedup-tagged tracking issue on failure. Worse,
the loop body does `exit 1` the instant a single `gh workflow run`
dispatch fails — every maintainer later in the fixed `MAINTAINERS` array
gets **no** audit dispatched for that week, and nothing surfaces this
beyond a red X in the Actions tab. See
[#6759](https://github.com/kubestellar/docs/issues/6759) for the tracked
finding; the workflow-side `if: failure()` fix needs a maintainer with
`workflows` permission to add, since agent tokens cannot write files under
`.github/workflows/*`.

## Detecting a silent or partial failure manually

Until the automated alert is added, check for a stalled, failed, or
partial run:

1. Open the [Run All Maintainer Audits run history](https://github.com/kubestellar/docs/actions/workflows/run-all-maintainer-audits.yml)
   and confirm a run exists for the most recent Monday with a green
   check. A missing run, or one that ended with a red X, means the weekly
   dispatch did not complete for all 7 maintainers.
2. Open the failed run's logs and check which maintainer's `gh workflow
   run maintainer-metrics.lock.yml` dispatch the loop stopped at (the
   step logs `❌ Failed to trigger audit for $maintainer` right before
   `exit 1`) — every maintainer after that one in the list got no audit
   dispatched this week.
3. Cross-check the [maintainer-metrics.lock.yml run history](https://github.com/kubestellar/docs/actions/workflows/maintainer-metrics.lock.yml)
   for the same date: it should show exactly 7 dispatched runs (one per
   maintainer). Fewer than 7 confirms a partial week.
4. If a partial/failed run is confirmed, re-run
   `run-all-maintainer-audits.yml` manually via `workflow_dispatch`
   (Actions tab → "Run All Maintainer Audits" → "Run workflow") after
   addressing the underlying cause (transient API error, rate limit, or
   the target workflow being renamed/removed).

## Recovery

No rollback is required — a failed or partial audit run does not affect
the production docs site or its content. The impact is limited to one or
more maintainers missing their weekly metrics audit until the next
successful (or manually re-triggered) run.
