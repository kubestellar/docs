# Runbook: Detecting Silent Failures in Unattended Scheduled Workflows

## Scope

Applies to two scheduled CI jobs that currently have no `if: failure()`
alert step, unlike `generate-leaderboard.yml` and `generate-acmm-history.yml`
in this repo (both of which open/update a dedup-tagged tracking issue on
failure):

- `.github/workflows/run-all-maintainer-audits.yml` — weekly
  (`cron: "0 17 * * 1"`), sequentially triggers `maintainer-metrics.lock.yml`
  for each of 7 maintainers via `gh workflow run`.
- `.github/workflows/fuzz-mdx.yml` — weekly scheduled run
  (`cron: '0 3 * * 1'`), fuzzes `sanitizeHtmlForMdx` (the MDX sanitizer that
  fixed the vulnerabilities in #6234).

## Known gap

- `run-all-maintainer-audits.yml`: if `gh workflow run` fails for any
  maintainer, the loop `exit 1`s and remaining maintainers in the list are
  never triggered, but nothing notifies anyone — visible only as a red X in
  the Actions tab. See [#6714](https://github.com/kubestellar/docs/issues/6714).
- `fuzz-mdx.yml`: the only failure handling is an `if: failure()` step that
  uploads a `fuzz-failure-log` artifact (lines 60-67); no issue is opened or
  updated, so a scheduled run that finds a sanitizer regression is only
  discoverable by someone downloading and inspecting the artifact. See
  [#6715](https://github.com/kubestellar/docs/issues/6715).

The workflow-side fix (adding an `if: failure()` step that opens/updates a
`ci-failure`-labeled issue, following the exact pattern already used in
`generate-leaderboard.yml` / `generate-acmm-history.yml`) needs a maintainer
with `workflows` permission to add, since agent tokens cannot write files
under `.github/workflows/*`.

## Detecting a silent failure manually

Until the automated alert is added, check for a stalled or failed run:

1. **`run-all-maintainer-audits.yml`:**
   - Open the [workflow run history](https://github.com/kubestellar/docs/actions/workflows/run-all-maintainer-audits.yml)
     and confirm a run exists for the most recent Monday with a green
     check. A missing run, or one that ended with a red X, means the weekly
     dispatch loop stopped early.
   - Cross-check the [`maintainer-metrics.lock.yml` run history](https://github.com/kubestellar/docs/actions/workflows/maintainer-metrics.lock.yml):
     there should be one successful run per maintainer in the list (7 total)
     dated the same day. Fewer than 7 successful runs means the loop exited
     before triggering all maintainers.
2. **`fuzz-mdx.yml`:**
   - Open the [workflow run history](https://github.com/kubestellar/docs/actions/workflows/fuzz-mdx.yml)
     and confirm a run exists for the most recent Monday with a green
     check.
   - If the most recent scheduled run is red, download the
     `fuzz-failure-log` artifact from that run and inspect it for a crash
     input; a genuine sanitizer regression must be triaged as a security
     issue (per #6223/#6234), not just re-run and ignored.
3. If either check indicates a stalled/failed run, re-run manually via
   `workflow_dispatch` and, if it fails again, open a tracking issue
   describing the failure mode so a maintainer can investigate (transient
   vs. persistent).

## Recovery

No rollback is required for either workflow — a failed run does not affect
the production docs site or its content:

- A failed `run-all-maintainer-audits.yml` run only delays that week's
  maintainer-activity metrics for the un-triggered maintainers; re-run the
  loop (or trigger `maintainer-metrics.lock.yml` individually for the
  missing maintainers) once the underlying cause is fixed.
- A failed `fuzz-mdx.yml` run means the sanitizer went unfuzzed for that
  week; re-run it manually once the underlying failure (dependency install,
  harness bug, or a genuine regression) is resolved.

## Related

- [#6714](https://github.com/kubestellar/docs/issues/6714) — tracked finding for `run-all-maintainer-audits.yml`
- [#6715](https://github.com/kubestellar/docs/issues/6715) — tracked finding for `fuzz-mdx.yml`
- [`runbooks/scorecard-monitoring.md`](scorecard-monitoring.md) — same gap class for `scorecard.yml`
- [`runbooks/version-branch-rollback.md`](version-branch-rollback.md) — same gap class for `sync-console-release-versions.yml`
