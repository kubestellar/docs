# Runbook: Detecting a Manually-Disabled `gh-aw` Scheduled Workflow

## Scope

Applies to the `gh-aw`-generated (`*.lock.yml`) scheduled workflows in this
repo. Confirmed for:

- `.github/workflows/devstats.lock.yml` (`cron: '0 9 * * 1-5'`)
- `.github/workflows/daily-team-status.lock.yml` (`cron: '0 9 * * 1-5'`)

## Known gap

This is a different failure mode from the ones already covered by
[`gh-aw-stop-time-monitoring.md`](gh-aw-stop-time-monitoring.md) (expired
hard-coded stop-time) and
[`gh-aw-uncompiled-source-monitoring.md`](gh-aw-uncompiled-source-monitoring.md)
(source `.md` never compiled to `.lock.yml`). A workflow can also be
disabled directly at the GitHub Actions level — `GET
/repos/{owner}/{repo}/actions/workflows/{id}` reports a `state` field that
is `"active"` when a scheduled workflow is registered and will fire, but
`"disabled_manually"` when someone (or an automated client) has called the
disable-workflow API/UI action. A `disabled_manually` workflow produces
**zero run history at all** for every scheduled trigger after the disable
point — not even the grey "skipped" runs the stop-time gap produces — so
it is invisible from the Actions run list unless you check the workflow's
`state` field directly.

Both `devstats.lock.yml` and `daily-team-status.lock.yml` were confirmed
`"disabled_manually"` on 2026-10-07, with their most recent run dated
2026-03-03 and 2026-01-05 respectively (7 and 9 months of silence). This is
notable because their `GH_AW_STOP_TIME` values were already bumped forward
to `2027-09-15` as the fix for
[#6769](https://github.com/kubestellar/docs/issues/6769) — the stop-time
fix alone did not restore these two workflows to running, because the
Actions-level disable is a separate, independent gate from the in-file
stop-time check.

## Detecting a manually-disabled workflow

1. List a candidate workflow's registration state directly (requires only
   read access to the Actions API):

   ```bash
   gh api repos/kubestellar/docs/actions/workflows/<id-or-filename> --jq '{state,updated_at}'
   ```

   `state` will be `"active"` for a normally-scheduled workflow. Any other
   value (`"disabled_manually"`, `"disabled_inactivity"`,
   `"disabled_fork"`) means the schedule will not fire regardless of what
   the lock file's `on.schedule` says.

2. Cross-check against the run list — a `disabled_manually` workflow will
   have no runs at all since the disable point, not even skipped ones:

   ```bash
   gh api "repos/kubestellar/docs/actions/workflows/<id-or-filename>/runs?per_page=3" \
     --jq '.workflow_runs[] | {status,conclusion,created_at}'
   ```

3. To audit every scheduled `gh-aw` workflow in one pass:

   ```bash
   for f in .github/workflows/*.lock.yml .github/workflows/healthz-monitor.yml; do
     name=$(basename "$f")
     gh api "repos/kubestellar/docs/actions/workflows/$name" --jq "{file: \"$name\", state}"
   done
   ```

## Recovery

Re-enabling a disabled workflow (`PUT
/repos/{owner}/{repo}/actions/workflows/{id}/enable`) requires `actions:
write` on the repository — an operations/scanner agent token at the
`contributor` tier does not have this, so a maintainer or an
`ISSUES_PRS_MERGE`-tier agent has to toggle it back on (via the Actions
tab → the workflow → "Enable workflow", or the API call above). No
rollback risk: re-enabling only restores a previously-scheduled recurring
report/deliverable and does not affect the production docs site.
