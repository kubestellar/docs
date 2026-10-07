# Runbook: Detecting a Silently-Failed Health Monitor Run

## Scope

Applies to `.github/workflows/healthz-monitor.yml`, which runs every 15
minutes (`cron: '*/15 * * * *'`) and implements the production readiness
SLI/SLO defined in `runbooks/slo.md` by probing `GET /api/healthz` and
opening/closing a `[production-outage]` issue based on the result.

## Known gap (resolved)

Unlike `stale.yml`, `run-all-maintainer-audits.yml`,
`generate-leaderboard.yml`, and every other scheduled workflow in this
repo, `healthz-monitor.yml` previously had no `if: failure()` step of its
own. If the job itself failed outright — a `checkout` failure, a
malformed `.github/state/healthz-monitor-status.json` breaking the
`jq -r` parse, a `gh api` call erroring instead of returning an empty
result, or the "Commit and push status if changed" step exhausting all 5
retries and hitting its trailing `exit 1` — the run would end with a red
X and nothing would alert a maintainer. Because this workflow **is** the
alerting mechanism for the production readiness SLO, a silent failure
here is more severe than the equivalent gap in a cosmetic scheduled job:
the site could be down and serving broken documentation with zero
automated signal, because the one check that would have caught it never
ran to completion.

**This is now closed.** A `Create issue on monitor failure` step with
`if: failure()` files/updates a `[healthz-monitor-failure]`
`ci-failure`-labeled issue whenever the workflow itself fails, matching
the pattern used by the repo's other scheduled workflows. Applied in
[#7288](https://github.com/kubestellar/docs/pull/7288), closing
[#7284](https://github.com/kubestellar/docs/issues/7284).

A second, narrower failure mode remains worth noting: if the "Commit and
push status if changed" step fails after persisting `STATE_FILE` locally
but before the push succeeds, the next run's `git pull --rebase` may
still reconcile the state, but a maintainer has no visibility into how
many consecutive 15-minute cycles were affected without checking the
Actions tab directly (the new self-failure alert does cover this case
too, since that step's trailing `exit 1` now triggers it — but the
state-file history itself is still not surfaced beyond the alert issue).

## Detecting a silent failure manually

The automated `[healthz-monitor-failure]` alert (above) covers a failed
workflow run, but it cannot fire for a run that never triggers at all
(e.g. a scheduling gap) or for the narrower state-persistence case noted
above. Use the steps below to confirm the alert's result or to check
coverage independently:

1. Open the [Docs Site Health Monitor run history](https://github.com/kubestellar/docs/actions/workflows/healthz-monitor.yml)
   and confirm a run exists within the last 15–30 minutes with a green
   check. A missing recent run, or one that ended with a red X, means the
   readiness SLI in `runbooks/slo.md` is not being measured right now.
2. If a run is red, open its logs and identify which step failed — this
   determines whether a `[production-outage]` alert may have been
   missed for that cycle (if the probe step itself never ran) or whether
   only the state-persistence step failed (probe result still valid, but
   not recorded for the next run's consecutive-failure comparison).
3. Check `.github/state/healthz-monitor-status.json` on `main` for its
   `checked_at` timestamp — if it is more than ~30 minutes old, the
   commit-back step has not succeeded recently even if probes are still
   running.
4. If a stalled/failed run is confirmed, re-run it manually via
   `workflow_dispatch` (Actions tab → "Docs Site Health Monitor" → "Run
   workflow"), and separately verify production health directly:
   `curl -sS https://kubestellar-docs.netlify.app/api/healthz`.

## Recovery

No rollback is required for a monitoring-workflow failure by itself — it
does not affect the production docs site. However, treat any confirmed
gap in monitoring coverage as reduced confidence in the SLO for that
window: if the manual check in step 4 above reveals the site was actually
unhealthy during the gap, follow `runbooks/deploy-rollback.md` immediately
and complete the "Incident Postmortem" issue template noting the delayed
detection.
