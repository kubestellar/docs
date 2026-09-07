# Runbooks Index

Quick reference for on-call responders. Each row links to the full
runbook; use the scope column to pick the right one before reading.

| Runbook | Scope | Linked from |
| --- | --- | --- |
| [`slo.md`](./slo.md) | Docs-site readiness SLI/SLO (Netlify prod site) and current alerting coverage. | Root `README.md`, `scripts/verify-site-health.sh` |
| [`deploy-rollback.md`](./deploy-rollback.md) | Detecting and rolling back a bad Netlify or container deploy. | Root `README.md`, `.github/ISSUE_TEMPLATE/incident_postmortem.yaml`, `cluster-objects/deployment.yaml`, `scripts/verify-site-health.sh` |
| [`version-branch-rollback.md`](./version-branch-rollback.md) | Recovering from a bad automated version-branch/config push (`create-version-branch.yml`). | Root `README.md` |
| [`scorecard-monitoring.md`](./scorecard-monitoring.md) | Detecting a silently-failed weekly OpenSSF Scorecard scan (`scorecard.yml`). | Root `README.md` |
| [`stale-workflow-monitoring.md`](./stale-workflow-monitoring.md) | Detecting a silently-failed daily stale issues/PRs run (`stale.yml`). | Root `README.md` |
| [`api-error-rate-latency.md`](./api-error-rate-latency.md) | Diagnosing the `DocsApiHighErrorRate` / `DocsApiHighRequestLatency` alerts. | Root `README.md`, `cluster-objects/prometheusrule.yaml` (`runbook_url`) |

To record a production incident affecting the docs site, use the
[Incident Postmortem issue template](../.github/ISSUE_TEMPLATE/incident_postmortem.yaml)
and reference the runbook step(s) you followed.
