# Runbook: Detecting a Silently-Failed OpenSSF Scorecard Scan

## Scope

Applies to `.github/workflows/scorecard.yml`, which runs the OpenSSF
Scorecard analysis weekly (`cron: '0 6 * * 1'`), on every push to `main`,
and via `workflow_dispatch`. It delegates to the reusable workflow
`kubestellar/infra/.github/workflows/reusable-scorecard.yml`, which runs
`ossf/scorecard-action`, uploads a SARIF artifact, and uploads results to
GitHub code scanning.

## Automated alert (added in #6918)

`scorecard.yml` now has a separate `alert-on-failure` job (`needs:
[analysis]`, `if: failure() && github.event_name != 'pull_request'`) that
opens or comments on a `ci-failure`-labeled issue titled
`[scorecard-failure] OpenSSF Scorecard workflow failing` whenever the
`analysis` job fails — the same pattern already used by
`generate-leaderboard.yml` and `run-all-maintainer-audits.yml`. This
closed [#6724](https://github.com/kubestellar/docs/issues/6724), the
finding that originally reported this workflow had no failure alert; that
issue is resolved and this doc no longer tracks it as an open gap.

The alert only dedups by *finding an already-open issue with the same
title tag* — it does not escalate based on how long or how many times the
scan has kept failing. A short-lived transient failure and a
multi-day/40-run outage look identical from the alert alone (one new
`Still failing as of <date>` comment per run); check the issue's comment
count/timestamps to tell them apart, not just whether it's open.

## Known root cause: `gcr.io` image pulls

If the failing job's log shows `Pull gcr.io/openssf/scorecard-action:...`
failing (not the analysis step itself), this is not specific to this
repo: the same `gcr.io` container-registry billing-deprecation breakage
has already been confirmed for the identical
`ossf/scorecard-action@v2.4.0` Docker-based action in
`kubestellar/homebrew-tap#417` and `kubestellar/console-kb#3368`. Google is
deprecating anonymous/free `gcr.io` pulls, and `scorecard-action` still
resolves its container image there instead of `ghcr.io`. If this is the
failure mode, do not treat it as a repo-local regression — it will keep
recurring on every scheduled/`main`-push run until upstream
(`ossf/scorecard-action`) ships a `ghcr.io`-resolving release, or
`scorecard.yml` is repointed at a pinned `ghcr.io` reference (a
`.github/workflows/*` change, so it needs a maintainer with `workflows`
permission to land).

## Detecting a failure manually

The automated alert above is the primary signal now, but if it's ever
missed or you want to confirm independently:

1. Open the [Scorecard workflow run history](https://github.com/kubestellar/docs/actions/workflows/scorecard.yml)
   and confirm a run exists for the most recent Monday. A missing run, or
   one that ended with a red X, means the weekly scan did not complete.
2. Check the repository's
   [Security > Code scanning alerts](https://github.com/kubestellar/docs/security/code-scanning)
   tab for a recent Scorecard entry. If the most recent Scorecard alert
   batch is more than ~8 days old, the weekly upload likely did not
   succeed.
3. If either check indicates a stalled/failed run, check the failed job's
   log first for the `gcr.io` pull-failure pattern above before assuming a
   new/unrelated cause, then re-run manually via `workflow_dispatch`
   (Actions tab → "OpenSSF Scorecard" → "Run workflow").

## Recovery

No rollback is required — a failed Scorecard scan does not affect the
production docs site or its content. The impact is limited to a stale
Scorecard score/badge until the next successful run (scheduled or manual).
