# Runbook: MDX Sanitizer Fuzz Harness

## Scope

Applies to `.github/fuzzing/fuzz-mdx-sanitizer.ts`, the mutation-based fuzz
harness for `sanitizeHtmlForMdx` (`src/lib/sanitizeHtml.ts`) that was added
after the sanitizer vulnerabilities fixed in #6234. It runs via
`.github/workflows/fuzz-mdx.yml`:

- On every PR that touches `src/lib/sanitizeHtml.ts`,
  `.github/fuzzing/fuzz-mdx-sanitizer.ts`, or the workflow itself.
- On a weekly schedule (`cron: '0 3 * * 1'`, Mondays at 03:00 UTC), to catch
  regressions from changes elsewhere (e.g. a dependency bump) that a
  path-scoped PR trigger would miss.

## What a failure means

A failed run means the harness found an input that defeats the sanitizer
(a potential XSS/HTML-injection regression), or the harness itself
crashed/errored. Either way it is a security-relevant signal, not a flaky
test — do not dismiss a red run without triage.

## Detecting and triaging a failure

- **PR-triggered runs** surface normally through the PR's required-checks
  UI — no special detection needed.
- **Scheduled (weekly) runs:** the workflow only uploads a `fuzz-failure-log`
  artifact on failure (`if: failure()`, retention 14 days); it does **not**
  open or comment on an issue. There is currently no automated alert for
  this cron job — tracked as a known gap in
  [#6715](https://github.com/kubestellar/docs/issues/6715). Until that gap
  is closed, a manual periodic check of the
  [Fuzz MDX Sanitizer Actions history](https://github.com/kubestellar/docs/actions/workflows/fuzz-mdx.yml)
  is the only way to catch a scheduled-run-only failure.
- To triage: download the `fuzz-failure-log` artifact from the failed run,
  reproduce locally with `npx tsx .github/fuzzing/fuzz-mdx-sanitizer.ts
  --seed=<seed-from-log>`, and determine whether the failing input
  represents a real sanitizer bypass.
- If it is a real bypass, follow `SECURITY.md`'s vulnerability-handling
  process rather than fixing it in a public PR first.

## Related

- `runbooks/slo.md` — production readiness SLO/alerting for the docs site
  (a separate concern from this build-time/CI fuzz check).
- [#6715](https://github.com/kubestellar/docs/issues/6715) — tracks adding
  an `if: failure()` alert step to `fuzz-mdx.yml`'s scheduled run, following
  the same `actions/github-script` pattern already used in
  `generate-leaderboard.yml` / `generate-acmm-history.yml`.
