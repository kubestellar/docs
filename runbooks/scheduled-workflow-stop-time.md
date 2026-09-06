# Runbook: Detecting an Expired `gh-aw` Stop-Time Gate

## Scope

Applies to `gh-aw`-generated scheduled workflows in this repo that embed a
hard-coded `GH_AW_STOP_TIME` gate in their compiled `.lock.yml`, sourced
from a `stop-after: +1mo` (or similar) directive in the workflow's `.md`
frontmatter. Confirmed affected:

- `.github/workflows/devstats.lock.yml` (`GH_AW_STOP_TIME: 2026-01-16 19:38:33`)
- `.github/workflows/daily-team-status.lock.yml` (`GH_AW_STOP_TIME: 2026-01-03 19:22:35`)

Other `gh-aw` generated workflows in this repo (e.g.
`maintainer-metrics.lock.yml`, `technical-doc-writer.lock.yml`) use the
same `stop-after` pattern and should be spot-checked with the same
procedure.

## Known gap

Each of these workflows still triggers on its `schedule: cron` entry, but
a `pre_activation` job's `check_stop_time` step compares `new Date()` to
the hard-coded `GH_AW_STOP_TIME` and sets `activated=false` once it has
passed. The downstream `activation`/`agent`/`conclusion` jobs all require
`needs.pre_activation.outputs.activated == 'true'` (or
`needs.agent.result != 'skipped'`), so once the stop-time expires every
subsequent scheduled run shows as a normal grey **skipped** run — never a
red ❌ — with no job summary, comment, or issue. This is a strictly worse
variant of the "no failure alert" gap class documented in
[`stale-workflow-monitoring.md`](./stale-workflow-monitoring.md) and
[`scorecard-monitoring.md`](./scorecard-monitoring.md): those workflows at
least fail loudly; an expired stop-time looks identical to "nothing
scheduled to do" and is invisible to failure-alert tooling. See
[#6769](https://github.com/kubestellar/docs/issues/6769) for the tracked
finding.

## Detecting an expired stop-time manually

1. Open the workflow's run history in the Actions tab (e.g.
   [`devstats.lock.yml`](https://github.com/kubestellar/docs/actions/workflows/devstats.lock.yml),
   [`daily-team-status.lock.yml`](https://github.com/kubestellar/docs/actions/workflows/daily-team-status.lock.yml))
   and check the most recent scheduled runs' conclusion. A string of
   **skipped** runs on a workflow that is supposed to produce a recurring
   deliverable (per its `.md` `description:` frontmatter) is the signature
   of this gap — a genuine failure would show as a red ❌, not grey.
2. Confirm by inspecting the `.lock.yml`'s `GH_AW_STOP_TIME` value in the
   `check_stop_time` step and comparing it to today's date. If it is in
   the past, the workflow has been inert since that date.
3. Cross-check the expected deliverable (e.g. a team-status comment/issue,
   a devstats report) for a gap starting around the stop-time date.

## Recovery

- Recompile/regenerate the affected `.lock.yml` from its `.md` source with
  an extended or removed `stop-after`, per the in-file comment ("workflow
  will no longer trigger after 30 days. Remove this and recompile to run
  indefinitely."). This requires `gh-aw` tooling access and a maintainer
  with `workflows` permission — agent tokens cannot write files under
  `.github/workflows/*`.
- No rollback is required — an expired stop-time does not affect the
  production docs site; the impact is limited to the missing recurring
  report/status update until a maintainer recompiles the workflow.
