# Runbooks Index

Quick lookup for on-call/incident response. Each entry links to the full
runbook; use `slo.md` first if you're unsure which failure mode you're
looking at.

| Runbook | Use when... | Linked from |
| --- | --- | --- |
| [`slo.md`](slo.md) | Establishing the readiness SLO/SLI for the production docs site and how the (proposed) `healthz-monitor` alerting would work. | Start here for any production readiness question. |
| [`deploy-rollback.md`](deploy-rollback.md) | The live site is serving broken/stale content or a bad deploy went out (Netlify or container path) and needs to be rolled back. | `slo.md` |
| [`api-error-rate-latency.md`](api-error-rate-latency.md) | The `DocsApiHighErrorRate` or `DocsApiHighRequestLatency` alert fires. | `cluster-objects/prometheusrule.yaml` `runbook_url` annotations |
| [`version-branch-rollback.md`](version-branch-rollback.md) | The version picker shows a wrong/missing version, `versions.ts`/`shared.json` changed unexpectedly, or `create-version-branch.yml`/`sync-console-release-versions.yml` needs investigating. | — |
| [`scorecard-monitoring.md`](scorecard-monitoring.md) | The weekly OpenSSF Scorecard scan (`scorecard.yml`) may have silently failed (no automated alert exists yet — see [#6724](https://github.com/kubestellar/docs/issues/6724)). | — |
| [`stale-workflow-monitoring.md`](stale-workflow-monitoring.md) | The daily stale issue/PR triage (`stale.yml`) may have silently failed (no automated alert exists yet — see [#6729](https://github.com/kubestellar/docs/issues/6729)). | — |

For a confirmed production incident, use the "Incident Postmortem" issue
template (`.github/ISSUE_TEMPLATE/incident_postmortem.yaml`) once
mitigated, referencing whichever runbook step(s) above were followed.

This index is documentation-only; update it whenever a runbook is added to
or removed from this directory.
