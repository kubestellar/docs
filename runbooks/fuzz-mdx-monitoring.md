# Runbook: Detecting a Silently-Failed MDX Sanitizer Fuzz Run

## Scope

Applies to `.github/workflows/fuzz-mdx.yml`, which runs the mutation-based
fuzz harness for `sanitizeHtmlForMdx` weekly (`cron: '0 3 * * 1'`), on any
pull request touching the sanitizer or the workflow itself, and via
`workflow_dispatch`.

## Known gap

The workflow's only `if: failure()` step uploads a fuzz-failure log
artifact (`fuzz-failure-log`) for post-mortem inspection — it does not
notify anyone or open/update a tracking issue. If the scheduled Monday run
fails (a genuine sanitizer regression found by the fuzzer, a harness
crash, a transient runner issue, etc.), the only signal is a red X in the
Actions tab and an artifact that nobody is prompted to look at. See
[#6715](https://github.com/kubestellar/docs/issues/6715) for the tracked
finding; the workflow-side alerting fix needs a maintainer with
`workflows` permission to add, since agent tokens cannot write files under
`.github/workflows/*`.

## Detecting a silent failure manually

Until the automated alert is added, check for a stalled or failed fuzz run:

1. Open the
   [Fuzz MDX Sanitizer workflow run history](https://github.com/kubestellar/docs/actions/workflows/fuzz-mdx.yml)
   and confirm a scheduled run exists for the most recent Monday and that
   it completed with a green check. A missing run, or one that ended with
   a red X, means the weekly fuzz pass did not complete successfully.
2. If a run failed, download its `fuzz-failure-log` artifact from the run
   page and inspect it — a genuine sanitizer regression (the fuzzer found
   an input that breaks `sanitizeHtmlForMdx`'s invariants) requires a code
   fix, not just a re-run.
3. If either check indicates a stalled/failed run without an obvious
   sanitizer regression in the log, re-run it manually via
   `workflow_dispatch` (Actions tab → "Fuzz MDX Sanitizer" → "Run
   workflow") and, if it fails again, open a tracking issue describing the
   failure mode so a maintainer can investigate (transient vs. genuine
   regression).

## Recovery

No rollback is required for a failed scheduled run by itself — it does not
affect the production docs site. However, if the fuzz log reveals a real
sanitizer regression, treat it as a security-relevant finding: the
mitigation is a code fix to `src/lib/sanitizeHtml.ts` (see
[#6223](https://github.com/kubestellar/docs/issues/6223) for the original
harness rationale), not a workflow re-run.
