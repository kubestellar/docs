# Runbook: Netlify Build Failure (Alerted by `netlify-error-reporter.yml`)

## Scope

Applies to a build-time failure of the Netlify deploy for `main` or a
`docs/*` version branch — the case handled by
`.github/workflows/netlify-error-reporter.yml`, distinct from a runtime
regression in an otherwise-successful deploy (see
`runbooks/deploy-rollback.md`) or a stale readiness endpoint (see
`runbooks/slo.md`).

## How this alert reaches you

- For a PR/deploy-preview build, `netlify-error-reporter.yml` posts a
  **comment on the PR** with the deploy ID, a link to the Netlify admin UI,
  and an excerpt of the build log.
- For a **direct-to-main** (or version-branch) commit with no associated
  PR, it instead opens or updates a `[netlify-deploy-failure]`-tagged issue
  (labels `ci-failure,kind/bug`). Its body currently does **not** link to
  this runbook or to `runbooks/deploy-rollback.md` — that cross-link needs
  a maintainer with `workflows` permission to add to the workflow file,
  since agent tokens cannot write under `.github/workflows/*`. Until then,
  treat any `[netlify-deploy-failure]` issue as pointing here.
- **Impact while open:** the live site is serving whatever content was
  published by the *last successful* deploy — not the latest commit on
  `main`. This is a content-staleness risk, not a site-down incident; the
  running production instance's `/api/healthz`/`/api/livez` are unaffected
  because they check the already-deployed content tree, not the failed
  build.

## Diagnosing the failure

1. Open the deploy's admin URL from the PR comment or issue body (or the
   [Netlify deploys list](https://app.netlify.com/) for the
   `kubestellar-docs` site) and read the full build log — the alert only
   includes a short `error|fail|fatal` grep excerpt from the `building`/
   `preparation` log sections, which can miss the real root cause.
2. Common causes, roughly in order of frequency for this repo:
   - **Dependency install failure** — `npm ci` failing on a lockfile/
     registry mismatch. Reproduce locally with `npm ci` from a clean
     checkout of the failing commit.
   - **Type or lint errors surfaced only at build time** — run
     `npm run build` locally (or `npx tsc --noEmit`, matching
     `.github/workflows/typecheck.yml`) against the same commit.
   - **Bad `netlify.toml` / build environment change** — check whether the
     commit touched `netlify.toml`, `NODE_VERSION`, or
     `scripts/netlify-ignore.sh` (the `[build] ignore` command); a
     non-zero/unexpected exit there changes which branch deploys build at
     all.
   - **Missing or invalid environment variable/secret** — the build relies
     on `NEXT_PUBLIC_BRANCH` (via `netlify.toml`) and any Netlify-side
     env vars configured outside this repo; a removed or renamed one fails
     the build with no corresponding code change to point at.
   - **Out-of-memory / timeout** on Netlify's build runner for an
     unusually large content or dependency change.
3. If the log doesn't make the cause obvious, retry the deploy from the
   Netlify dashboard ("Retry deploy") to rule out a transient
   infrastructure issue before spending time bisecting the commit.

## Recovery

1. **Direct-to-main failure (the common case this alert targets):** open a
   revert PR for the offending commit(s) so the next push builds cleanly,
   or push a forward-fix commit if the cause and fix are both well
   understood. A build failure on `main` does not roll back what's already
   live — the previous successful deploy keeps serving until a new commit
   builds successfully, so there is no separate "rollback" action beyond
   fixing or reverting the source.
2. **PR/deploy-preview failure:** fix the PR branch and push; Netlify
   rebuilds the preview automatically. No production impact.
3. Once a subsequent commit builds successfully, close any open
   `[netlify-deploy-failure]` issue with a comment noting the fixing
   commit — the workflow does not currently auto-close these on recovery
   (unlike the proposed `healthz-monitor` alert in `runbooks/slo.md`,
   which is designed to auto-close). That auto-close behavior would also
   need a maintainer to add to `netlify-error-reporter.yml`.

## Escalation

If the build keeps failing after a revert/forward-fix and root cause is
unclear (e.g. suspected Netlify-side outage or a secret only a maintainer
can rotate), escalate using the "Incident Postmortem" issue template
(`.github/ISSUE_TEMPLATE/incident_postmortem.yaml`) if the staleness
window is user-impacting, and reference the `[netlify-deploy-failure]`
issue and this runbook from it.
