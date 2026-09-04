# Runbook: Detecting Silently-Failed Scheduled Workflows

## Scope

This repo has several scheduled (`cron`) GitHub Actions workflows that,
unlike `generate-leaderboard.yml` / `generate-acmm-history.yml`, do not
have an `if: failure()` step that opens or updates a tracking issue on
failure. Adding that step requires a maintainer with `workflows`
permission (agent tokens cannot write files under `.github/workflows/*`),
so until it lands for each workflow below, use the manual checks in this
runbook to notice a silent failure.

This is a companion to `runbooks/version-branch-rollback.md`'s "Detecting
a silently-failed sync" section (which covers
`sync-console-release-versions.yml` specifically) and to `runbooks/slo.md`
(which covers the proposed `healthz-monitor` workflow). It exists because
two more scheduled workflows share the same missing-alert gap class and
didn't have an existing runbook home.

## `run-all-maintainer-audits.yml` (weekly, `0 17 * * 1`)

Tracked in [docs#6714](https://github.com/kubestellar/docs/issues/6714).

Sequentially triggers `maintainer-metrics.lock.yml` for each maintainer via
`gh workflow run`; the loop exits on the first failure, so remaining
maintainers are silently never audited that week.

**Detecting a silent failure:**

1. Check the [workflow's run
   history](https://github.com/kubestellar/docs/actions/workflows/run-all-maintainer-audits.yml)
   after the Monday 17:00 UTC schedule — a red X means the loop stopped
   early.
2. Confirm every maintainer in the loop got a fresh
   `maintainer-metrics.lock.yml` run that week (check that workflow's own
   [run
   history](https://github.com/kubestellar/docs/actions/workflows/maintainer-metrics.lock.yml)
   for one run per maintainer, dated after the weekly trigger).
3. If some maintainers are missing a run for the week, re-run
   `run-all-maintainer-audits.yml` via `workflow_dispatch` after fixing the
   underlying cause (API rate limit, auth token issue) shown in the failed
   run's logs.

## `fuzz-mdx.yml` scheduled run (weekly, `0 3 * * 1`)

Tracked in [docs#6715](https://github.com/kubestellar/docs/issues/6715).

The scheduled run of the `sanitizeHtmlForMdx` fuzz harness only uploads a
log artifact on failure (`fuzz-failure-log`, 14-day retention) — nothing
notifies a maintainer to look for it.

**Detecting a silent failure:**

1. Check the [workflow's run
   history](https://github.com/kubestellar/docs/actions/workflows/fuzz-mdx.yml)
   for scheduled (non-PR) runs after Monday 03:00 UTC — a red X indicates
   either a crash or a sanitizer regression was found.
2. Download the `fuzz-failure-log` artifact from that run and inspect it
   for the failing input and stack trace.
3. If it's a genuine sanitizer bypass, treat it as a security regression
   of the fixes in #6223/#6234: open a `[security]`-labeled issue, do not
   ship further MDX sanitizer changes until the regression is understood.
4. If it's harness flakiness (not a real bypass), re-run via
   `workflow_dispatch` to confirm before dismissing.

## Suggested hardening (not applied by this change)

For both workflows above, add an `if: failure()` step (gated to
`github.event_name == 'schedule'` for `fuzz-mdx.yml`, so PR-triggered
failures keep using the normal required-check UI) that opens or updates a
`ci-failure`-labeled issue via `actions/github-script`, following the
existing pattern in `generate-leaderboard.yml` / `generate-acmm-history.yml`.
This requires `workflows` permission and is not applied here.
