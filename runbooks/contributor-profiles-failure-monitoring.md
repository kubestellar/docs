# Runbook: Contributor Profile Generation Failure (Silent)

## Scope

Applies to the `Generate contributor profiles` step of
`.github/workflows/generate-leaderboard.yml`, which runs
`scripts/generate-contributor-profiles.mjs` six times a day (every 4
hours) to produce `public/data/contributors/*.json` — the per-contributor
topic-clustering and cadence data consumed by the contributor profile
pages.

## Known gap

Unlike the workflow's other steps (`generate-leaderboard.mjs`,
`check-leaderboard-regression.mjs`, and the git push), this step runs with
both a `timeout-minutes: 5` cap and `continue-on-error: true`:

```yaml
      - name: Generate contributor profiles
        env:
          GITHUB_TOKEN: ${{ secrets.LEADERBOARD_GITHUB_TOKEN }}
        run: node scripts/generate-contributor-profiles.mjs
        timeout-minutes: 5
        continue-on-error: true
```

`continue-on-error: true` means this step's outcome never counts toward
the job's own status. The workflow's one alerting mechanism — the
`Create issue on failure` step, gated on `if: failure()` — can never fire
because of this step alone, since the job itself never reports `failure`
on its account. A crash, a timeout, or an API-quota exhaustion in
`generate-contributor-profiles.mjs` produces **zero signal**: no issue, no
comment, no failed check — while the rest of the run (leaderboard scores,
regression check, git push) continues to show green. Tracked in
[#6899](https://github.com/kubestellar/docs/issues/6899) (requires a
maintainer to edit the workflow file; agent tokens lack the `workflows`
permission needed to write `.github/workflows/*`).

This is the same failure class documented for a different workflow's
swallowed step in `kubestellar/console-marketplace#545` ("Nightly
Marketplace Auto-QA scan can crash silently with zero alert —
continue-on-error swallows failures").

## Detecting a silent failure manually

1. Compare the newest file `mtime`/commit history under
   `public/data/contributors/` against the leaderboard's own update
   cadence (`public/data/leaderboard.json`, updated every successful run).
   If `leaderboard.json` is fresh but no `contributors/*.json` file has
   changed across several scheduled runs, the profile-generation step is
   likely failing or timing out.
2. Open the [Generate Leaderboard Data workflow run history](https://github.com/kubestellar/docs/actions/workflows/generate-leaderboard.yml)
   and inspect the `Generate contributor profiles` step log directly for
   each recent run — its own exit status is not visible from the run's
   overall green/red check because of `continue-on-error: true`.
3. Common causes to check first: `LEADERBOARD_GITHUB_TOKEN` rate-limit
   exhaustion (the script fetches issue bodies for every contributor) and
   the 5-minute timeout being too short as the contributor list grows.

## Recovery

No rollback is required — a failed run only means contributor profile
data did not refresh; the previously generated files remain served as-is.
Re-run manually via `workflow_dispatch` (Actions tab → "Generate
Leaderboard Data" → "Run workflow") to confirm whether the failure was
transient. If it fails again, investigate
`scripts/generate-contributor-profiles.mjs` directly (see reproduce
command below) rather than assuming a re-run will resolve it:

```bash
npm ci && GITHUB_TOKEN=ghp_xxx node scripts/generate-contributor-profiles.mjs
```
