# Runbook: Detecting a Silently-Failed OpenSSF Scorecard Scan

## Scope

Applies to `.github/workflows/scorecard.yml`, which runs the OpenSSF
Scorecard analysis weekly (`cron: '0 6 * * 1'`), on every push to `main`,
and via `workflow_dispatch`. It delegates to the reusable workflow
`kubestellar/infra/.github/workflows/reusable-scorecard.yml`, which runs
`ossf/scorecard-action`, uploads a SARIF artifact, and uploads results to
GitHub code scanning.

## Known gap

Neither `scorecard.yml` nor the reusable workflow it calls has an
`if: failure()` step, unlike `generate-leaderboard.yml` and
`generate-acmm-history.yml` in this repo, which both open/update a
dedup-tagged tracking issue on failure. If the scheduled Monday run fails
(`scorecard-action` crash, code-scanning upload rejected, transient runner
issue, etc.), nothing notifies a maintainer — the run is only visible as a
red X in the Actions tab. See
[#6724](https://github.com/kubestellar/docs/issues/6724) for the tracked
finding; the workflow-side `if: failure()` fix needs a maintainer with
`workflows` permission to add, since agent tokens cannot write files under
`.github/workflows/*`.

## Detecting a silent failure manually

Until the automated alert is added, check for a stalled or failed scan:

1. Open the [Scorecard workflow run history](https://github.com/kubestellar/docs/actions/workflows/scorecard.yml)
   and confirm a run exists for the most recent Monday. A missing run, or
   one that ended with a red X, means the weekly scan did not complete.
2. Check the repository's
   [Security > Code scanning alerts](https://github.com/kubestellar/docs/security/code-scanning)
   tab for a recent Scorecard entry. If the most recent Scorecard alert
   batch is more than ~8 days old, the weekly upload likely did not
   succeed.
3. If either check indicates a stalled/failed run, re-run it manually via
   `workflow_dispatch` (Actions tab → "OpenSSF Scorecard" → "Run workflow")
   and, if it fails again, open a tracking issue describing the failure
   mode so a maintainer can investigate (transient vs. persistent).

## Recovery

No rollback is required — a failed Scorecard scan does not affect the
production docs site or its content. The impact is limited to a stale
Scorecard score/badge until the next successful run (scheduled or manual).
