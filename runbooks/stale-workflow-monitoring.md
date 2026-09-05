# Runbook: Detecting a Silently-Failed Stale Issues/PRs Run

## Scope

Applies to `.github/workflows/stale.yml`, which runs the stale-issue/PR
triage daily (`cron: '0 0 * * *'`) and via `workflow_dispatch`. It
delegates to the reusable workflow
`kubestellar/infra/.github/workflows/reusable-stale.yml`.

## Known gap

Neither `stale.yml` nor the reusable workflow it calls has an
`if: failure()` step, unlike `generate-leaderboard.yml` and
`generate-acmm-history.yml` in this repo, which both open/update a
dedup-tagged tracking issue on failure. If the daily run fails (reusable-
workflow regression, API rate-limiting, a bad `secrets: inherit` token,
etc.), nothing notifies a maintainer — the run is only visible as a red X
in the Actions tab, and issues/PRs that should be marked stale (or
auto-closed per the repo's staleness policy) keep accumulating unflagged.
See [#6729](https://github.com/kubestellar/docs/issues/6729) for the
tracked finding; the workflow-side `if: failure()` fix needs a maintainer
with `workflows` permission to add, since agent tokens cannot write files
under `.github/workflows/*`.

## Detecting a silent failure manually

Until the automated alert is added, check for a stalled or failed run:

1. Open the [Stale Issues workflow run history](https://github.com/kubestellar/docs/actions/workflows/stale.yml)
   and confirm a run exists for today (or the most recent day) with a
   green check. A missing run, or one that ended with a red X, means the
   daily triage did not complete.
2. Spot-check a handful of long-inactive issues/PRs that should already
   carry a `stale` label per the repo's configured staleness policy. If
   several qualifying items are missing the label despite being inactive
   well past the threshold, the daily run has likely been failing silently
   for multiple days.
3. If either check indicates a stalled/failed run, re-run it manually via
   `workflow_dispatch` (Actions tab → "Stale Issues" → "Run workflow") and,
   if it fails again, open a tracking issue describing the failure mode so
   a maintainer can investigate (transient vs. persistent).

## Recovery

No rollback is required — a failed stale-triage run does not affect the
production docs site or its content. The impact is limited to a growing
backlog of untriaged stale issues/PRs until the next successful (or
manually re-triggered) run.
