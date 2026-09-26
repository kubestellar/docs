# Runbooks Index

Quick lookup for on-call/incident response. Each entry links to the full
runbook; use `slo.md` first if you're unsure which failure mode you're
looking at.

| Runbook | Use when... | Linked from |
| --- | --- | --- |
| [`slo.md`](slo.md) | Establishing the readiness SLO/SLI for the production docs site and how the (proposed) `healthz-monitor` alerting would work. | Start here for any production readiness question. |
| [`deploy-rollback.md`](deploy-rollback.md) | The live site is serving broken/stale content or a bad deploy went out (Netlify or container path) and needs to be rolled back. | `slo.md` |
| [`api-error-rate-latency.md`](api-error-rate-latency.md) | The `DocsApiHighErrorRate` or `DocsApiHighRequestLatency` alert fires. | `cluster-objects/prometheusrule.yaml` `runbook_url` annotations |
| [`netlify-build-failure.md`](netlify-build-failure.md) | A Netlify build fails: a `[netlify-deploy-failure]` issue opens for a direct-to-main commit, or `netlify-error-reporter.yml` comments on a PR (the alert links this runbook and auto-closes on the next successful deploy, added in [#6783](https://github.com/kubestellar/docs/issues/6783)). | `netlify-error-reporter.yml` failure alert |
| [`version-branch-rollback.md`](version-branch-rollback.md) | The version picker shows a wrong/missing version, `versions.ts`/`shared.json` changed unexpectedly, or `create-version-branch.yml`/`sync-console-release-versions.yml` needs investigating. | — |
| [`scorecard-monitoring.md`](scorecard-monitoring.md) | The weekly OpenSSF Scorecard scan (`scorecard.yml`) fails — an automated `[scorecard-failure]` alert opens/comments on a `ci-failure` issue (added in [#6918](https://github.com/kubestellar/docs/pull/6918)); check for the known recurring `gcr.io` pull-failure root cause first. | `ci-failure`-labeled issues titled `[scorecard-failure] ...` |
| [`stale-workflow-monitoring.md`](stale-workflow-monitoring.md) | The daily stale issue/PR triage (`stale.yml`) fails — an `alert-on-failure` job files a `[stale-workflow-failure]` `ci-failure` issue (added in [#6729](https://github.com/kubestellar/docs/issues/6729)). | `ci-failure`-labeled issues titled `[stale-workflow-failure] ...` |
| [`fuzz-mdx-failure-detection.md`](fuzz-mdx-failure-detection.md) | The weekly `sanitizeHtmlForMdx` fuzz harness (`fuzz-mdx.yml`) fails or finds a sanitizer crash/bypass — a `Create issue on failure` step files a `[fuzz-mdx-failure]` `ci-failure` issue (added in [#6715](https://github.com/kubestellar/docs/issues/6715)). | `ci-failure`-labeled issues titled `[fuzz-mdx-failure] ...` |
| [`maintainer-audit-monitoring.md`](maintainer-audit-monitoring.md) | The weekly maintainer audit dispatcher (`run-all-maintainer-audits.yml`) fails or partially skips maintainers — a `Create issue on failure` step files a `[maintainer-audit-failure]` `ci-failure` issue (added in [#6759](https://github.com/kubestellar/docs/issues/6759)). | `ci-failure`-labeled issues titled `[maintainer-audit-failure] ...` |
| [`acmm-history-failure-monitoring.md`](acmm-history-failure-monitoring.md) | The scheduled ACMM history generator (`generate-acmm-history.yml`) fired its `[acmm-history-failure]` issue, or you need to confirm the alert's known gaps. | — |
| [`gh-aw-stop-time-monitoring.md`](gh-aw-stop-time-monitoring.md) | A `gh-aw`-generated scheduled workflow (e.g. `devstats.lock.yml`, `daily-team-status.lock.yml`) shows a "skipped" run — check whether its hard-coded stop-time has expired; both lock files' stop-times were bumped forward as a fix (see [#6769](https://github.com/kubestellar/docs/issues/6769)), so a fresh expiry means a new bump is needed. | — |
| [`gh-aw-uncompiled-source-monitoring.md`](gh-aw-uncompiled-source-monitoring.md) | A `.github/workflows/*.md` `gh-aw` source has no sibling `.lock.yml`, so GitHub Actions never registered it at all — fixed once for `link-checker.md`/`typo-checker.md`, which now both have compiled `.lock.yml` files (see [#6955](https://github.com/kubestellar/docs/issues/6955)). | — |
| [`contributor-profiles-failure-monitoring.md`](contributor-profiles-failure-monitoring.md) | `generate-leaderboard.yml`'s `Generate contributor profiles` step can crash/timeout; that step still runs with `continue-on-error: true`, but a dedicated failure-alert step now files/comments on a tracking issue for it (added in [#6899](https://github.com/kubestellar/docs/issues/6899)). | `ci-failure`-labeled issues for the contributor-profiles step |
| [`ci-failure-label-stale-exemption.md`](ci-failure-label-stale-exemption.md) | A `ci-failure`-labeled issue auto-filed by `generate-leaderboard.yml`/`netlify-error-reporter.yml` needs manual stale-bot protection; `stale.yml`'s `exempt_labels` now includes `ci-failure` by default (fixed in [#6773](https://github.com/kubestellar/docs/issues/6773)), so this is only needed if that exemption regresses. | — |

For a confirmed production incident, use the "Incident Postmortem" issue
template (`.github/ISSUE_TEMPLATE/incident_postmortem.yaml`) once
mitigated, referencing whichever runbook step(s) above were followed.

This index is documentation-only; update it whenever a runbook is added to
or removed from this directory.
