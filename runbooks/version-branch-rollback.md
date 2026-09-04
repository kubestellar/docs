# Runbook: Version Branch / Version Config Rollback

## Scope

Applies to the automated version-branch pipeline in this repo:

- `.github/workflows/create-version-branch.yml` — triggered by
  `workflow_dispatch` or a `repository_dispatch` (`create-version-branch`)
  event from a source project's release workflow. It pushes a new
  `docs/<project>/<version>` branch directly from `main`, then opens a PR
  updating `src/config/versions.ts` and `public/config/shared.json` and
  immediately comments `/lgtm` and `/approve` on that PR so it auto-merges
  via Prow.
- `.github/workflows/sync-console-release-versions.yml` — a related,
  lower-risk nightly job that performs the same `versions.ts`/`shared.json`
  update for console releases, but opens a plain PR for human review and
  does **not** self-approve. It currently has no failure-alert step (see
  [docs#6718](https://github.com/kubestellar/docs/issues/6718)), so a
  failed run is silent rather than surfaced — see "Detecting a
  silently-failed sync" below.

This runbook is specific to the version-routing config
(`src/config/versions.ts` / `public/config/shared.json`), which controls
the version picker, each project's `basePath`, and which branch is served
as "latest"/`currentVersion`. It is distinct from
`runbooks/deploy-rollback.md`, which covers a bad deploy of already-correct
content, and `runbooks/slo.md`, which covers readiness of the currently
deployed instance.

## Why this needs its own runbook

`create-version-branch.yml` writes a new git ref directly (no PR, no
review) and then self-merges the PR that repoints production version
routing, via its own `/lgtm`/`/approve` comment. A malformed trigger input
(wrong `version`, wrong `source_repo`/`source_branch`, or `set_as_latest`
incorrectly `true`) can reach production with no human in the loop between
the bad input and the config change going live.

## Detecting a bad automated version-branch/config push

Symptoms that point to this pipeline rather than a normal content/deploy
issue:

- The version picker on the live site shows a new entry with the wrong
  label, or the wrong entry is marked as "latest"/default.
- A version's docs unexpectedly point at the wrong branch (e.g. selecting
  version X renders content that doesn't match that version's release).
- `currentVersion` for a project changed without a corresponding real
  release (check `src/config/versions.ts` history on `main` — look for a
  commit whose diff was authored by `github-actions[bot]` around the
  suspected time, on a PR that has **no independent human reviewer** other
  than the `/lgtm`/`/approve` comment posted by the same workflow run).
- A `docs/<project>/<version>` branch exists that doesn't correspond to any
  real tagged release in the source project's repo.

## Rollback: bad `versions.ts` / `shared.json` change

1. Find the offending commit on `main` (the PR title is
   `📖 Update <project> docs to v<version>`; check
   `git log --oneline -- src/config/versions.ts public/config/shared.json`).
2. Revert it: `git revert <sha>` and push directly, or open a revert PR if
   time allows a normal review — either restores the previous, correct
   version-routing config immediately.
3. Confirm the version picker and `basePath` routing are correct again by
   loading the live site and checking the affected project's version
   dropdown.
4. Do **not** re-run `create-version-branch.yml` with the same inputs until
   the bad trigger input has been identified and corrected upstream (e.g.
   the source project's release automation that fired the
   `repository_dispatch` event).

## Detecting a silently-failed sync (no PR appears)

Unlike a bad push (previous section), `sync-console-release-versions.yml`
has no failure-alert step
([docs#6718](https://github.com/kubestellar/docs/issues/6718)), so a
failed run produces **no visible symptom** — no PR, no issue, no error
anyone sees by default. The only way to notice is to actively check for
staleness:

1. Compare the latest stable tag at
   `https://github.com/kubestellar/console/releases` against the console
   entry in `src/config/versions.ts` on `main`.
2. If a release is newer than what's in `versions.ts` and it's been more
   than ~24h since that release published (one cron cycle), check the
   [workflow's run history](https://github.com/kubestellar/docs/actions/workflows/sync-console-release-versions.yml)
   for a recent failure.
3. If the run failed, re-run it via `workflow_dispatch` after fixing the
   underlying cause (expired `WORKFLOW_SYNC_TOKEN`, GitHub API rate limit,
   or a `scripts/update-version.js` error shown in the failed run's logs).
4. If it succeeded but still produced no PR, that's expected when there is
   no new stable console release to sync — not a bug.

This check has no fixed cadence enforced by tooling today; treat it as a
manual spot-check when a console release is expected to appear in the docs
version picker and doesn't.

## Rollback: bad version branch

1. If the pushed `docs/<project>/<version>` branch is wrong (wrong content,
   wrong name, or shouldn't exist), delete it:
   `git push origin --delete docs/<project>/<version>`.
2. If it should exist but points at the wrong source content, re-run
   `workflow_dispatch` for `create-version-branch.yml` manually with the
   correct `source_repo`/`source_branch`/`version` inputs — the workflow
   skips branch creation if the branch already exists, so delete it first
   (step 1) or it will no-op.
3. Verify the corrected branch deploys correctly on Netlify and that
   `GET /api/healthz` on that branch's preview deploy returns
   `200 {"status":"ok"}` (see `runbooks/deploy-rollback.md`).

## Escalation

If the bad config reached production and user-visible impact persists
after the revert (step above), open an incident using the "Docs site
incident" issue template
(`.github/ISSUE_TEMPLATE/incident_postmortem.yaml`).

## Suggested hardening (not applied by this change)

This runbook documents detection/recovery only. Agent tokens cannot modify
`.github/workflows/*`, so the following is a recommendation for a
maintainer, not something applied here: remove the self `/lgtm`/`/approve`
step from `create-version-branch.yml` (or gate it behind an explicit
`workflow_dispatch` input reviewed by a human) so this pipeline matches
`sync-console-release-versions.yml`'s pattern of opening a plain PR for
review rather than self-merging.
