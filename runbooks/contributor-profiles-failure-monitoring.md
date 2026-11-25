# Runbook: Contributor Profiles Generation Failure

## Scope

Applies to the `Generate contributor profiles` step in
`.github/workflows/generate-leaderboard.yml`, which runs
`scripts/generate-contributor-profiles.mjs` on every scheduled (every 4
hours) and manually-dispatched run of that workflow.

## Failure signal

The step has a 20-minute timeout and `continue-on-error: true`, so the
leaderboard can still update when profile generation fails. The workflow
opens or comments on a `[contributor-profiles-failure]` issue using the
step outcome. Failed runs do not stage contributor profile changes.

## Investigating a contributor-profiles failure

1. Open the most recent
   [`Generate Leaderboard Data` workflow runs](https://github.com/kubestellar/docs/actions/workflows/generate-leaderboard.yml)
   and check the `Generate contributor profiles` step specifically — a
   red "X" with a small "continue on error" annotation next to a
   still-green overall run indicates the profile step failed.
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

- No rollback is required for a failed generation: profile changes from that
  step are not staged. The leaderboard and site readiness are independent.
- Re-run `scripts/generate-contributor-profiles.mjs` locally or via
  `workflow_dispatch` to refresh the stale/missing profile data once the
  underlying cause (timeout, API rate limit, script bug) is understood.
