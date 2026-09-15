# Runbook: Detecting a `gh-aw` Workflow Source With No Compiled `.lock.yml`

## Scope

Applies to every `gh-aw`-authored workflow source in
`.github/workflows/*.md` (e.g. `link-checker.md`, `typo-checker.md`,
`devstats.md`, `daily-team-status.md`, `maintainer-metrics.md`,
`technical-doc-writer.md`). Each of these is only a *source* file — `gh
aw compile` has to be run against it to produce the sibling
`.github/workflows/<name>.lock.yml` that GitHub Actions actually
registers and schedules.

This is a different failure mode from the one covered by
[`gh-aw-stop-time-monitoring.md`](gh-aw-stop-time-monitoring.md): that
runbook is for a workflow that **used to run** and went silently inert
once its baked-in `stop-after` expired. This one is for a workflow that
**never ran at all**, because it was never compiled in the first place.

## Known gap

A `.md` source with no corresponding `.lock.yml` produces zero trace in
GitHub Actions — no run history, no "skipped" status, nothing to alert
on, because the workflow was never registered in the first place. It
looks, from the Actions tab, identical to "this workflow doesn't exist,"
which is easy to miss since the `.md` source is still sitting right there
in `.github/workflows/`, describing a schedule that implies it should be
running. Confirmed once for `link-checker.md` and `typo-checker.md`
(both declaring `cron: "0 6 * * *"`) in
[#6955](https://github.com/kubestellar/docs/issues/6955) — neither had a
`.lock.yml`, and neither appeared in `GET
/repos/kubestellar/docs/actions/workflows` at all. Fixed by running `gh
aw compile` for both and committing the resulting lock files.

## Detecting a missing compile manually

1. List the `gh-aw` sources and their compiled counterparts side by side:

   ```bash
   for f in .github/workflows/*.md; do
     lock="${f%.md}.lock.yml"
     [ -f "$lock" ] || echo "MISSING: $lock"
   done
   ```

2. For anything flagged, cross-check the GitHub Actions API directly
   rather than trusting the file listing alone (a `.lock.yml` present
   locally but never pushed would look fine here but still not be
   registered):

   ```bash
   gh api repos/kubestellar/docs/actions/workflows --jq '.workflows[].name'
   ```

3. If a source's schedule implies it should be running nightly/weekly
   and it's missing from both checks, it has never executed.

## Recovery

Run `gh aw compile <workflow-id>` for the missing source(s) and commit
the resulting `.lock.yml` — this requires `.github/workflows/**` write
access, which an operations/scanner agent token does not have (see
#6955), so a maintainer or an external PR has to carry the compiled file
through. No rollback risk: compiling and registering a previously-dormant
scheduled check has no effect on the production docs site itself.
