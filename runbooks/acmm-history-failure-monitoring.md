# Runbook: ACMM History Generation Failure Alert

## Scope

Applies to `.github/workflows/generate-acmm-history.yml` ("Generate ACMM
History"), which runs on a schedule (Sun/Mon/Wed/Fri at 02:00 UTC), in
addition to `workflow_dispatch`. It regenerates
`public/data/acmm-history.json` (the data backing the ACMM leaderboard's
sparkline trend charts) and commits it back to `main` if it changed.

## Known gap

The workflow's "Create issue on failure" step (`if: failure()`) already
opens a `[acmm-history-failure]`-tagged issue labeled `bug` when a run
fails — unlike `fuzz-mdx.yml`
(`runbooks/fuzz-mdx-failure-detection.md`), this alert does exist. Two
gaps remain in it, both requiring an edit to the workflow file (agent
tokens lack the `workflows` permission needed to write
`.github/workflows/*`, so this needs a maintainer):

1. **No runbook link.** The issue body is only
   `` Workflow run: <run URL> `` — it gives on-call no diagnosis or
   recovery steps and does not link to any runbook, unlike the pattern
   this doc now establishes.
2. **Never auto-closes.** The dedup check
   (`issues.some(i => i.title.includes(tag))`) only prevents opening a
   *second* issue while one is open — nothing closes the existing
   `[acmm-history-failure]` issue once a later scheduled run succeeds, so
   a resolved failure stays open until a human notices and closes it by
   hand. This is the same gap class documented for
   `netlify-error-reporter.yml` in
   [#6783](https://github.com/kubestellar/docs/issues/6783).

Note the alert issue is labeled `bug`, not `ci-failure`, so it is not
subject to the `ci-failure`-label stale-bot exemption gap tracked in
[#6773](https://github.com/kubestellar/docs/issues/6773) — a `bug`-labeled
issue is a normal candidate for maintainer triage, not silent
auto-close, under this repo's current stale-bot exemption list.

## Detecting a silent/unresolved failure manually

1. Search open issues for the `[acmm-history-failure]` tag. If one exists,
   check whether a scheduled run *after* it was opened has since
   succeeded (see step 2) — if so, the underlying failure is already
   resolved and the issue is safe to close with a note referencing the
   passing run.
2. Open the [Generate ACMM History workflow run history](https://github.com/kubestellar/docs/actions/workflows/generate-acmm-history.yml)
   and confirm the most recent scheduled run (Sun/Mon/Wed/Fri) completed
   with a green check. A missing run, or one that ended with a red X,
   means `public/data/acmm-history.json` may be stale.
3. Compare the `acmm-history.json` commit history against the expected
   schedule — a gap of more than one scheduled run without a
   `chore: update ACMM history data` commit (or an explicit "No changes"
   log line in a successful run) indicates the generation step itself is
   failing, not just finding no diff.

## Recovery

No rollback is required — a failed run does not affect the currently
published leaderboard data, it only means the next scheduled update did
not land. Re-run manually via `workflow_dispatch` (Actions tab →
"Generate ACMM History" → "Run workflow") to confirm whether the failure
was transient. If it fails again, investigate `scripts/generate-acmm-history.mjs`
and the `ACMM_APP_ID` / `ACMM_APP_PRIVATE_KEY` app-token secrets before
assuming the fix is a simple re-run.
