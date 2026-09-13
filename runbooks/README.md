# Runbooks Index

Quick lookup for on-call/incident response. Each entry links to the full
runbook; use `slo.md` first if you're unsure which failure mode you're
looking at.

| Runbook | Use when... | Linked from |
| --- | --- | --- |
| [`slo.md`](slo.md) | Establishing the readiness SLO/SLI for the production docs site and how the (proposed) `healthz-monitor` alerting would work. | Start here for any production readiness question. |
| [`deploy-rollback.md`](deploy-rollback.md) | The live site is serving broken/stale content or a bad deploy went out (Netlify or container path) and needs to be rolled back. | `slo.md` |
| [`api-error-rate-latency.md`](api-error-rate-latency.md) | The `DocsApiHighErrorRate` or `DocsApiHighRequestLatency` alert fires. | `cluster-objects/prometheusrule.yaml` `runbook_url` annotations |
| [`netlify-build-failure.md`](netlify-build-failure.md) | A Netlify build fails: a `[netlify-deploy-failure]` issue opens for a direct-to-main commit, or `netlify-error-reporter.yml` comments on a PR (no direct link from the alert yet — see [#6783](https://github.com/kubestellar/docs/issues/6783)). | — |
| [`version-branch-rollback.md`](version-branch-rollback.md) | The version picker shows a wrong/missing version, `versions.ts`/`shared.json` changed unexpectedly, or `create-version-branch.yml`/`sync-console-release-versions.yml` needs investigating. | — |
| [`scorecard-monitoring.md`](scorecard-monitoring.md) | The weekly OpenSSF Scorecard scan (`scorecard.yml`) may have silently failed (no automated alert exists yet — see [#6724](https://github.com/kubestellar/docs/issues/6724)). | — |
| [`stale-workflow-monitoring.md`](stale-workflow-monitoring.md) | The daily stale issue/PR triage (`stale.yml`) may have silently failed (no automated alert exists yet — see [#6729](https://github.com/kubestellar/docs/issues/6729)). | — |
| [`fuzz-mdx-failure-detection.md`](fuzz-mdx-failure-detection.md) | The weekly `sanitizeHtmlForMdx` fuzz harness (`fuzz-mdx.yml`) may have silently failed or found a sanitizer crash/bypass with no notification (no automated alert exists yet — see [#6715](https://github.com/kubestellar/docs/issues/6715)). | — |
| [`maintainer-audit-monitoring.md`](maintainer-audit-monitoring.md) | The weekly maintainer audit dispatcher (`run-all-maintainer-audits.yml`) may have silently failed or partially skipped maintainers (see [#6759](https://github.com/kubestellar/docs/issues/6759)). | — |
| [`acmm-history-failure-monitoring.md`](acmm-history-failure-monitoring.md) | The scheduled ACMM history generator (`generate-acmm-history.yml`) fired its `[acmm-history-failure]` issue, or you need to confirm the alert's known gaps. | — |
| [`gh-aw-stop-time-monitoring.md`](gh-aw-stop-time-monitoring.md) | A `gh-aw`-generated scheduled workflow (e.g. `devstats.lock.yml`, `daily-team-status.lock.yml`) shows a "skipped" run with no alert — its hard-coded stop-time may have expired (no automated alert exists yet — see [#6769](https://github.com/kubestellar/docs/issues/6769)). | — |
| [`contributor-profiles-failure-monitoring.md`](contributor-profiles-failure-monitoring.md) | The `Generate contributor profiles` step of `generate-leaderboard.yml` may have silently failed — `continue-on-error: true` hides it from the workflow's own failure alert (no automated alert exists yet — see [#6899](https://github.com/kubestellar/docs/issues/6899)). | — |

For a confirmed production incident, use the "Incident Postmortem" issue
template (`.github/ISSUE_TEMPLATE/incident_postmortem.yaml`) once
mitigated, referencing whichever runbook step(s) above were followed.

This index is documentation-only; update it whenever a runbook is added to
or removed from this directory.
