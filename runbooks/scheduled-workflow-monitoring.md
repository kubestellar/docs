# Runbook: Detecting Silently-Skipped or Silently-Failed Scheduled Workflows

## Scope

Applies to any scheduled (`cron`) workflow in `.github/workflows/` that has
no automated failure-alert step, including:

- `.github/workflows/devstats.lock.yml` and
  `.github/workflows/daily-team-status.lock.yml` (`cron: '0 9 * * 1-5'`,
  weekdays) — see "Known gap: expired stop-time gate" below.
- `.github/workflows/stale.yml` (see
  [`stale-workflow-monitoring.md`](./stale-workflow-monitoring.md)).
- `.github/workflows/scorecard.yml` (see
  [`scorecard-monitoring.md`](./scorecard-monitoring.md)).
- `.github/workflows/sync-console-release-versions.yml` (see
  [`version-branch-rollback.md`](./version-branch-rollback.md)).

This runbook covers the general detection pattern; see the linked
per-workflow runbooks above for workflow-specific symptoms and recovery
steps.

## Known gap: expired stop-time gate (devstats / daily-team-status)

`devstats.lock.yml` and `daily-team-status.lock.yml` are `gh-aw`-generated
workflows whose `pre_activation` job compares the current time against a
hard-coded `GH_AW_STOP_TIME` value and sets `activated=false` once that
time has passed. Both files' `activation` and `agent` jobs are gated on
`needs.pre_activation.outputs.activated == 'true'`, and downstream
`conclusion` steps are further gated on `needs.agent.result != 'skipped'`.

As of this writing, both stop times are long past:

- `devstats.lock.yml`: `GH_AW_STOP_TIME: 2026-01-16 19:38:33`
- `daily-team-status.lock.yml`: `GH_AW_STOP_TIME: 2026-01-03 19:22:35`

so every scheduled run since has been a normal grey **"skipped"** run in
the Actions tab, not a red **"failure"** — the same detection tooling that
watches for failed runs (a maintainer scanning for red X's) will not
notice this. See [docs#6769](https://github.com/kubestellar/docs/issues/6769)
for the tracked finding; bumping `GH_AW_STOP_TIME` (or removing the gate)
needs a maintainer with `workflows` permission, since agent tokens cannot
write files under `.github/workflows/*`.

## Detecting a silently-skipped or silently-failed scheduled run

Until per-workflow failure/skip alerting is added, check manually:

1. Open the workflow's run history in the Actions tab (e.g.
   [`devstats.lock.yml` runs](https://github.com/kubestellar/docs/actions/workflows/devstats.lock.yml),
   [`daily-team-status.lock.yml` runs](https://github.com/kubestellar/docs/actions/workflows/daily-team-status.lock.yml)).
2. Distinguish the three possible outcomes for the most recent scheduled
   run:
   - **Red ❌ (failed):** the job ran and errored — check the job logs for
     the failing step.
   - **Grey "skipped":** every job after `pre_activation` was skipped. Open
     the `pre_activation` job's logs and check the `check_stop_time` step
     output — if it reports the configured stop-time has passed, the
     workflow is inert until a maintainer updates `GH_AW_STOP_TIME`.
   - **Green ✅ (success):** working as expected; no action needed.
3. If the expected deliverable (e.g. a daily team-status summary/comment,
   or refreshed devstats data) hasn't appeared in longer than the
   workflow's own cadence would predict, treat it as a silent gap even if
   every individual run shows grey rather than red.
4. If either a stalled/failed run or an expired stop-time gate is found and
   not already tracked, open a `[operations]`-tagged issue describing the
   gap (workflow name, cadence, and whether it's a failure or a skip), so a
   maintainer with `workflows` permission can fix it.

## Recovery

No rollback is required for either failure mode — a missed or skipped
scheduled run does not affect the production docs site or its content.
The impact is limited to a stale or missing recurring deliverable (team
status report, devstats data, stale-issue triage, Scorecard score, or
version picker entries) until the underlying workflow is fixed and a
subsequent run succeeds.
