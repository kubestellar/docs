# Runbook: Detecting a Silently-Failed Contributor Profiles Generation Step

## Scope

Applies to the `Generate contributor profiles` step in
`.github/workflows/generate-leaderboard.yml`, which runs
`scripts/generate-contributor-profiles.mjs` on every scheduled (every 4
hours) and manually-dispatched run of that workflow.

## Known gap

That step is configured with `timeout-minutes: 5` and
`continue-on-error: true`. If `generate-contributor-profiles.mjs` crashes,
hangs past the 5-minute timeout, or otherwise exits non-zero, the step is
marked as a non-blocking failure and the job continues — including the
`Commit and push if changed` step immediately after it, which only stages
whatever `public/data/contributors/` output happens to already be on disk
(stale, partial, or entirely absent, depending on when the failure
occurred). Because the step's own outcome is swallowed by
`continue-on-error`, the workflow's final status is still green
(`success`), so the `Create issue on failure` step (`if: failure()`) never
runs for this specific failure — only a genuine failure in a later,
non-`continue-on-error` step would trigger it. There is no job-summary
note, comment, or issue produced for a contributor-profiles crash; the run
simply shows as fully green in the Actions tab. See
[#6899](https://github.com/kubestellar/docs/issues/6899) for the tracked
finding.

This is a narrower, single-step variant of the "no failure alert beyond a
job summary" gap class already tracked for other workflows in this repo
(#6718/#6724/#6729/#6715/#6759) — here the run doesn't even show as
"skipped" or partially failed, it shows as a plain success.

## Detecting a silent contributor-profiles failure manually

1. Open the most recent
   [`Generate Leaderboard Data` workflow runs](https://github.com/kubestellar/docs/actions/workflows/generate-leaderboard.yml)
   and check the `Generate contributor profiles` step specifically — a
   red "X" with a small "continue on error" annotation next to a
   still-green overall run indicates this gap fired.
2. Compare the commit timestamps/content under `public/data/contributors/`
   against `public/data/leaderboard.json` (updated by the earlier,
   non-`continue-on-error` `Generate leaderboard data` step in the same
   run) — if the leaderboard data is fresh but the contributor profiles
   are stale or missing entries for recently-active contributors, this
   step likely failed or timed out on the corresponding run(s).
3. Confirm by opening the step's own log output for a stack trace, a
   `Process completed with exit code 1` (or similar) line, or a
   "The action has timed out" message despite the job overall reporting
   success.

## Recovery

- No rollback is required — a failed contributor-profiles generation only
  leaves `public/data/contributors/` stale or incomplete; it does not
  affect `public/data/leaderboard.json`/`leaderboard-snapshot.json` or the
  production docs site's readiness (`/api/healthz`).
- Re-run `scripts/generate-contributor-profiles.mjs` locally or via
  `workflow_dispatch` to refresh the stale/missing profile data once the
  underlying cause (timeout, API rate limit, script bug) is understood.
- Fixing the underlying alerting gap (giving this step its own
  `if: failure()` signal, e.g. checking `steps.<id>.outcome` before the
  commit step, or removing `continue-on-error` if blocking is
  acceptable) requires editing `.github/workflows/generate-leaderboard.yml`,
  which needs a maintainer or an `ISSUES_PRS_MERGE`-tier agent, since
  agent tokens cannot write files under `.github/workflows/*`. See #6899
  — that underlying gap remains open; this runbook only documents manual
  detection in the meantime.
