# Runbook: Detecting a Silently-Failed MDX Sanitizer Fuzz Run

## Scope

Applies to `.github/workflows/fuzz-mdx.yml`, which runs the mutation-based
fuzz harness for `sanitizeHtmlForMdx` (`.github/fuzzing/fuzz-mdx-sanitizer.ts`,
addressing kubestellar/docs#6223) weekly (`cron: '0 3 * * 1'`), on any PR
touching the sanitizer or the workflow, and via `workflow_dispatch`.

`sanitizeHtmlForMdx` is the function that strips/escapes raw HTML embedded
in MDX content before it renders — a crash or hang in the fuzz harness can
indicate a real input the sanitizer mishandles, which is a potential XSS or
content-rendering regression, not just a flaky test.

## Known gap

Unlike `generate-leaderboard.yml` and `generate-acmm-history.yml` in this
repo, which both open/update a dedup-tagged tracking issue via
`if: failure()`, `fuzz-mdx.yml`'s only `if: failure()` step uploads the
crash log as a build artifact (`fuzz-failure-log`, 14-day retention) — it
never opens or comments on an issue. On a PR this is still visible as a
failing check, but the **weekly scheduled run on `main`** has no reviewer
watching it: a crash there is only visible as a red X in the Actions tab,
and the artifact evidence expires after 14 days if nobody looks. See
[#6805](https://github.com/kubestellar/docs/issues/6805) for the tracked
finding; the workflow-side `if: failure()` alert fix needs a maintainer
with `workflows` permission to add, since agent tokens cannot write files
under `.github/workflows/*`.

## Detecting a silent failure manually

Until the automated alert is added, check for a stalled or failed run:

1. Open the
   [Fuzz MDX Sanitizer workflow run history](https://github.com/kubestellar/docs/actions/workflows/fuzz-mdx.yml)
   and confirm a run exists for the most recent Monday. A missing run, or
   one that ended with a red X, means the weekly fuzz pass did not
   complete cleanly.
2. If a run failed, open it and download the `fuzz-failure-log` artifact
   (if still within its 14-day retention window) — it contains the seed
   and the input that triggered the crash, which is needed to reproduce
   locally with
   `npx tsx .github/fuzzing/fuzz-mdx-sanitizer.ts --seed=<seed>`.
3. If the artifact has already expired, re-run the workflow manually via
   `workflow_dispatch` (Actions tab → "Fuzz MDX Sanitizer" → "Run
   workflow") with a fixed `seed` if one is known, or a fresh run with
   default random iterations to try to reproduce the failure.

## Recovery

1. If a genuine sanitizer crash/bypass is reproduced, treat it as a
   potential security issue in HTML rendering: open a tracking issue
   describing the failing input and file a fix in `src/lib/sanitizeHtml.ts`
   before merging any other change to that file.
2. If the failure is a harness/dependency issue (e.g. `npm ci` failure,
   runner timeout) rather than a sanitizer crash, no content-security
   impact — re-run to confirm, and note the flake if it doesn't reproduce.
3. No rollback is required — a failed fuzz run does not affect the
   production docs site; the impact is a delayed detection window for a
   potential sanitizer regression until the next successful run (scheduled
   or manual).
