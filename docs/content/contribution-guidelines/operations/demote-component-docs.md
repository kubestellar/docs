# Demoting Docs in Component Repositories

All KubeStellar documentation has been consolidated into the [kubestellar/docs](https://github.com/kubestellar/docs) repository. Component repositories (such as `kubeflex`, `a2a`, `ocm-status-addon`, and `kubectl-multi-plugin`) previously maintained their own `docs/` folders. Those folders now contain stale content that must be demoted to prevent confusion.

The process below mirrors what was already completed for the `kubestellar/kubestellar` repository. See the resulting [`docs/README.md`](https://github.com/kubestellar/kubestellar/blob/main/docs/README.md) in that repo for a live example.

## Status of Component Repositories

| Repository | Status |
|---|---|
| [kubestellar/kubestellar](https://github.com/kubestellar/kubestellar) | ✅ Done |
| [kubestellar/kubeflex](https://github.com/kubestellar/kubeflex) | ❌ Needs demotion |
| [kubestellar/a2a](https://github.com/kubestellar/a2a) | ❌ Needs demotion |
| [kubestellar/ocm-status-addon](https://github.com/kubestellar/ocm-status-addon) | ❌ Needs demotion |
| [kubestellar/kubectl-multi-plugin](https://github.com/kubestellar/kubectl-multi-plugin) | ❌ Needs demotion |

## Demotion Process

### Step 1 — Move existing docs content to a staging folder

In the component repository, rename (or move) all existing content from `docs/` into a new `docs/docs-to-be-deleted/` subfolder. This preserves the old files during a transition period while making it clear they are no longer the authoritative source.

```shell
# Run from the root of the component repository
cd docs
mkdir docs-to-be-deleted
# Move all content except the docs folder itself
git mv *.md docs-to-be-deleted/ 2>/dev/null || true
# If there are subdirectories, move those too
# git mv <subdir> docs-to-be-deleted/
```

> **Note:** If the `docs/` folder contains an `images/` subfolder whose images are referenced from the repository's **root** `README.md`, copy (don't move) those images to an `images/` folder in the **root** of the repository first and update the image links in the root `README.md` to match. Then you can safely move the `docs/images/` folder into `docs/docs-to-be-deleted/`.

### Step 2 — Add a redirect README to the docs folder

Create a new `docs/README.md` that redirects visitors to the canonical docs in `kubestellar/docs`. Use the template below, replacing `<REPO_NAME>` with the actual repository name (e.g. `kubeflex`, `a2a`).

```markdown
# These Are Not The Docs You Are Looking For

The documentation for KubeStellar has been moved to a separate repository,
[https://github.com/kubestellar/docs](https://github.com/kubestellar/docs),
to be rendered as part of the consolidated [kubestellar.io](https://kubestellar.io) site.

**Do NOT open issues or PRs against anything in the docs folder of this repository.**

The previous docs folder contents have been moved into a `docs-to-be-deleted/` folder
as a precaution while we confirm there are no omissions in the files copied to
the docs repository.

## How to make a docs PR for <REPO_NAME>

### A. The easy way

For simple edits to a single page:

1. Sign into GitHub in your browser.
2. Open a second tab and visit the page on the website you wish to modify.
   _(Make sure you have selected the appropriate version with the dropdown in the masthead.)_
3. Find and click the **Edit This Page** (pencil) icon near the upper-right of the page.
4. A GitHub editor session will open. When you commit your changes you will be offered
   the option to create a PR.
5. You may need to adjust the PR title to meet contribution requirements.

### B. The detailed way

For edits across multiple files, or for editing the docs site structure or navigation:

1. Fork the [kubestellar/docs](https://github.com/kubestellar/docs) repository.
2. Edit the relevant files under `docs/content/<REPO_NAME>/`.
3. Commit your changes (sign off with `-s` for DCO and sign with `-S`).
4. Push to your fork and open a Pull Request against `kubestellar/docs`.

## Don't waste your or the reviewers' time

Docs PRs for the website submitted against this repository instead of
**[kubestellar/docs](https://github.com/kubestellar/docs)** will be closed without further review.
```

### Step 3 — Commit and open a Pull Request

```shell
git add docs/
git commit -s -S -m "doc: demote stale docs to docs-to-be-deleted; add redirect README"
git push origin <your-branch>
```

Open a Pull Request against the `main` branch of the component repository with the title:
```
doc: demote stale docs folder content
```

Reference this guide in the PR description so reviewers understand the context.

## FAQ

**Why not just delete the old files immediately?**

Moving the files to `docs-to-be-deleted/` first allows maintainers to verify that no content was accidentally omitted from `kubestellar/docs` before the stale files are permanently removed.

**What if the component repo doesn't have a `docs/` folder at all?**

No action needed — the repo is already clean.

**What if images in `docs/images/` are used in the root `README.md`?**

Copy those images to a top-level `images/` folder in the repository root, update the links in the root `README.md`, then include `docs/images/` in the move to `docs-to-be-deleted/`.
