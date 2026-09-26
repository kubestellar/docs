# Runbook: Detecting a Silently-Failed Fuzz MDX Sanitizer Run

## Scope

Applies to `.github/workflows/fuzz-mdx.yml` ("Fuzz MDX Sanitizer"), which
runs the mutation-based fuzz harness for `sanitizeHtmlForMdx` weekly
(`cron: '0 3 * * 1'`), in addition to `pull_request` (when the sanitizer or
this workflow changes) and `workflow_dispatch` triggers. See
[#6223](https://github.com/kubestellar/docs/issues/6223) for why the harness
exists.

## Known gap

The workflow's only `if: failure()` step is "Upload fuzz log on failure",
which uploads `/tmp/fuzz-*.log` as a build artifact with a 14-day retention
period. Unlike `generate-acmm-history.yml` and `generate-leaderboard.yml` in
this repo — both of which open or comment on a dedup-tagged tracking issue
when their scheduled run fails — `fuzz-mdx.yml` has no step that notifies a
human. A failed weekly run, including the case where the fuzzer actually
found a sanitizer crash or bypass, is visible only as a red X in the Actions
tab and a time-limited artifact that nobody is prompted to download. See
[#6807](https://github.com/kubestellar/docs/issues/6807) for the tracked
finding; the workflow-side `if: failure()` "create issue" fix needs a
maintainer with `workflows` permission to add, since agent tokens cannot
write files under `.github/workflows/*`.

## Detecting a silent failure manually

Until the automated alert is added, check for a stalled or failed run:

1. Open the [Fuzz MDX Sanitizer workflow run history](https://github.com/kubestellar/docs/actions/workflows/fuzz-mdx.yml)
   and confirm a run exists for the most recent Monday with a green check.
   A missing run, or one that ended with a red X, means the weekly fuzz
   pass did not complete.
2. If a run failed, download the `fuzz-failure-log` artifact from that run
   (before its 14-day retention window expires) and inspect it — a failure
   can mean either a broken harness/dependency (transient) or that the
   fuzzer found an actual `sanitizeHtmlForMdx` crash or sanitization bypass
   (a real security-relevant regression that needs immediate triage, not
   just a re-run).
3. Re-run manually via `workflow_dispatch` (Actions tab → "Fuzz MDX
   Sanitizer" → "Run workflow") to distinguish a transient failure from a
   reproducible one. If it fails again with the same finding, open a
   tracking issue describing the failure mode (crash input, stack trace,
   or harness error) so a maintainer can investigate before the artifact
   expires.

## Recovery

No rollback is required — a failed fuzz run does not itself affect the
production docs site. The risk is a missed real sanitizer regression: if
the fuzzer found a crash or bypass and nobody notices before the next
scheduled run overwrites/expires the artifact, that finding can be lost.
Treat any failed run as worth investigating before assuming it was
transient.
