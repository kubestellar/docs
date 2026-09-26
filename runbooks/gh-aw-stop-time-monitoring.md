# Runbook: Detecting a Silently-Skipped `gh-aw` Scheduled Workflow (Expired Stop-Time)

## Scope

Applies to the `gh-aw`-generated (`*.lock.yml`) scheduled workflows in this
repo, confirmed for:

- `.github/workflows/devstats.lock.yml` (`cron: '0 9 * * 1-5'`)
- `.github/workflows/daily-team-status.lock.yml` (`cron: '0 9 * * 1-5'`)

Each of these has a `pre_activation` job with a `check_stop_time` step
that compares the current time to a hard-coded `GH_AW_STOP_TIME` baked
into the lock file at compile time. Once that time has passed,
`check_stop_time` sets `stop_time_ok`/`activated` to `false`, and the
downstream `activation`/`agent`/`conclusion` jobs are all skipped via
`needs.pre_activation.outputs.activated == 'true'` gates.

## Known gap

A workflow past its stop-time still fires on schedule and still shows a
run in the Actions tab — but every job after `pre_activation` is skipped,
so the run shows as a normal grey "skipped" status, never a red ❌. There
is no `if: failure()` step, issue, discussion, or job-summary alert for
this case (unlike `generate-leaderboard.yml` / `generate-acmm-history.yml`,
which do alert on genuine failures). A workflow can therefore go
completely inert for months while looking identical to "nothing was
scheduled to run." See
[#6769](https://github.com/kubestellar/docs/issues/6769) for the tracked
finding — as of that report, `devstats.lock.yml` and
`daily-team-status.lock.yml` had both been silently skipped for 8+ months
(stop-times `2026-01-16 19:38:33` and `2026-01-03 19:22:35`
respectively). The fix (recompiling the lock files from their `.md`
sources with an extended or removed `stop-after`) requires a maintainer
with `gh-aw`/`workflows` write access, since agent tokens cannot write
files under `.github/workflows/*`.

## Detecting a silent stop-time skip manually

1. Open the run history for the workflow in question (e.g.
   [`devstats.lock.yml` runs](https://github.com/kubestellar/docs/actions/workflows/devstats.lock.yml)
   or
   [`daily-team-status.lock.yml` runs](https://github.com/kubestellar/docs/actions/workflows/daily-team-status.lock.yml))
   and check the most recent run's jobs. If `pre_activation` succeeded but
   every job after it (`activation`, `agent`, `conclusion`) shows
   "Skipped," the stop-time gate has likely expired.
2. Confirm by opening the `pre_activation` job log and reading the
   `Check stop-time limit` step output — it logs the configured
   `GH_AW_STOP_TIME` and whether the current run is past it.
3. Cross-check against the hard-coded value in the lock file itself
   (search for `GH_AW_STOP_TIME` in `.github/workflows/<name>.lock.yml`)
   to confirm without waiting for a new run.
4. If confirmed expired, open or update a tracking issue (see #6769 for
   the format) so a maintainer with `gh-aw` access recompiles the lock
   file with a new `stop-after` window.

## Recovery

No rollback is required — an expired stop-time only disables the
workflow's own scheduled deliverable (e.g. the team-status report or
devstats update); it does not affect the production docs site or its
content. The impact is limited to the missing recurring
report/deliverable until the lock file is recompiled with an extended
stop-time.
