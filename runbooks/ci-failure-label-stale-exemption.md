# Runbook: `ci-failure`-Labeled Alert Issues Are Not Stale-Bot Exempt

## Scope

Applies to the two automations that auto-file or auto-comment on a
`ci-failure`-labeled tracking issue when something breaks:

- `.github/workflows/generate-leaderboard.yml` — scheduled 6x/day; its
  `if: failure()` step opens/updates a `[leaderboard-gen-failure]` issue
  labeled `ci-failure` (creating the label itself if missing).
- `.github/workflows/netlify-error-reporter.yml` — triggered by the
  `status` event on a failed Netlify deploy; also applies the
  `ci-failure` label.

## Known gap

`.github/workflows/stale.yml` delegates to
`kubestellar/infra`'s `reusable-stale.yml`, whose default
`exempt_labels` is
`security,bug,enhancement,good first issue,help wanted,hacktober-fest,lifecycle/frozen,stale-exempt`.
`docs/stale.yml` does not override this input, and `ci-failure` is not in
that default list (`generate-acmm-history.yml`'s equivalent failure path
uses label `bug`, which is already exempt, so it is unaffected).

A `ci-failure`-tagged issue for a failure that does not recur (the next
scheduled `generate-leaderboard.yml` run succeeds, or a later Netlify
deploy supersedes the bad one) gets no further comments, so it is eligible
to be auto-labeled `lifecycle/stale` after 90 days of inactivity and
auto-closed 90 days after that by the daily `stale.yml` run — silently
discarding an operational signal instead of requiring an explicit
maintainer close. This is the same gap class previously confirmed and
fixed in `kubestellar/homebrew-tap`'s
`proposed-scheduled-workflow-failure-issue.yml` (auto-filed issues missing
the `lifecycle/frozen` stale-exemption). See
[#6773](https://github.com/kubestellar/docs/issues/6773) for the tracked
finding; the fix needs a maintainer with `workflows` permission to add,
since agent tokens cannot write files under `.github/workflows/*`.

## Detecting an at-risk issue manually

Until the automated exemption is added:

1. List open issues labeled `ci-failure`:
   `gh issue list --repo kubestellar/docs --label ci-failure --state open`.
2. For each, check its last-updated date. One approaching ~80-90 days of
   inactivity has not been triaged/closed by a maintainer and is close to
   being marked `lifecycle/stale`, then auto-closed ~90 days after that.
3. If a `ci-failure` issue is genuinely resolved (the underlying scheduled
   job or deploy path is healthy again), close it explicitly with a
   resolution comment rather than letting the stale-bot do it, so the
   closure records why it was safe to close.
4. If it is still relevant, add a comment (which resets the stale-bot's
   inactivity clock) or apply the `lifecycle/frozen` / `stale-exempt`
   label directly to protect it until the workflow-side fix lands.

## Recovery

No rollback is required — this gap only affects whether a past-failure
tracking issue can be silently auto-closed by the stale-bot; it does not
affect the docs site itself. Once a maintainer adds `lifecycle/frozen` (or
another exempt label) to the two workflows' issue-creation calls, or
overrides `exempt_labels` in `stale.yml`'s `uses:` call to include
`ci-failure`, this manual check is no longer necessary.
