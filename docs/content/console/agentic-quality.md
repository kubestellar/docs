---
title: "Agentic Quality Controls — How Console Catches AI Mistakes"
linkTitle: "Agentic Quality Controls"
weight: 21
description: >
  How the KubeStellar Console project catches AI mistakes, prevents repeat mistakes,
  measures quality, handles unresolved issues, and handles rejected AI pull requests.
keywords:
  - kubestellar console ai quality
  - agentic development quality gates
  - ai pull request review
  - console ci gates
  - copilot quality controls
---

# Agentic Quality Controls

This page explains how the KubeStellar Console project keeps **AI-assisted changes reviewable, measurable, and recoverable**.

Short version: the project does **not** trust AI output by default. It uses layered checks, explicit coding rules, automated review, and human merge decisions.

> Scope note: this page describes mechanisms visible in the `kubestellar/console` main branch today. Some ideas discussed elsewhere (for example, a richer resolution-memory system or a separate Hive script layer) are not present in the main branch as implemented repo code.

## 1. How does the project catch AI mistakes?

It catches them in **multiple layers**, not with a single gate.

### Repository guardrails before review

The first defense is the repo's written instructions:

- [`CLAUDE.md`](https://github.com/kubestellar/console/blob/main/CLAUDE.md) defines mandatory testing, visual verification, array safety, i18n, cache-hook usage, Netlify parity, no secrets, and named-constant rules.
- [`AGENTS.md`](https://github.com/kubestellar/console/blob/main/AGENTS.md) points every agent back to `CLAUDE.md` as the source of truth.
- [`.github/CARD_DEVELOPMENT_GUIDE.md`](https://github.com/kubestellar/console/blob/main/.github/CARD_DEVELOPMENT_GUIDE.md) documents common rejection reasons for card PRs.

These rules encode mistakes the project has already seen before: demo-only cards, missing `isDemoData`, raw English strings, array crashes, nil slices, scope creep, and weak tests.

### PR-time checks

On pull requests, the repo runs targeted workflows such as:

| Workflow | Purpose |
|---|---|
| `go-test.yml` | Full Go test suite with `-race` |
| `nil-safety.yml` | New nil-pointer regressions, array-safety regressions, and ratcheted AI antipattern checks |
| `coverage-gate.yml` | Coverage report for modified frontend files |
| `visual-regression.yml` | Playwright screenshot regression testing |
| `perf-ttfi.yml` | Time-to-first-interaction regression checks |
| `route-smoke.yml` | Route and modal smoke coverage |
| `fullstack-e2e.yml` | Go-backend + frontend smoke test |
| `api-contract.yml` | Demo-backend contract verification |
| `codeql.yml` | Security scanning for Go and TypeScript |
| `copilot-dco.yml` | DCO / sign-off compliance |

A key detail is that `nil-safety.yml` is not just about nil pointers. It also fails PRs when the repo sees more of the patterns AI tools often introduce, including:

- magic numbers in timers
- no-op assertions like `expect(true).toBe(true)`
- hardcoded route strings
- cards missing unified loading controls
- non-localized strings

Those checks are **ratcheted**: existing debt may stay temporarily, but a new PR is not supposed to make it worse.

### Automated review before merge

The repo also runs [`claude-code-review.yml`](https://github.com/kubestellar/console/blob/main/.github/workflows/claude-code-review.yml), which asks Claude to review each PR under three headings:

- **Correctness**
- **Security**
- **Style**

That review is advisory, but it gives maintainers another pass focused on runtime bugs, security gaps, magic numbers, localization misses, and similar issues.

### Post-merge verification

The quality system does not stop at PR checks.

[`post-merge-verify.yml`](https://github.com/kubestellar/console/blob/main/.github/workflows/post-merge-verify.yml) waits for production deploy, selects Playwright specs based on the merged PR and linked issue, and tests the live site. If the merged fix regresses in production, the workflow comments on the PR, comments on the original issue, and opens a new regression issue.

## 2. How does the project prevent repeat mistakes?

The main branch shows three concrete mechanisms.

### Codified lessons in agent instructions

When the same mistake shows up more than once, it gets turned into a written rule in `CLAUDE.md`, `AGENTS.md`, or the card guide.

Examples:

- always guard array operations with `(data || [])`
- always pass `isDemoData` and `isRefreshing`
- never hardcode user-facing strings
- update Netlify Functions when adding certain Go API routes
- write visual regression tests for UI changes

That means the next agent sees prior lessons **before** it starts coding.

### Ratcheted CI baselines

Several workflows use baseline files so new work cannot reintroduce known problem classes.

Examples include:

- `.github/nilaway-baseline.json`
- `.github/array-safety-baseline.txt`
- `.github/ai-*-baseline.txt`

This is an important pattern: even when the repo still contains older debt, the project can stop AI from expanding that debt.

### Quality tuning from historical outcomes

[`auto-qa.yml`](https://github.com/kubestellar/console/blob/main/.github/workflows/auto-qa.yml) and [`.github/auto-qa-tuning.json`](https://github.com/kubestellar/console/blob/main/.github/auto-qa-tuning.json) track which quality categories get accepted, merged, or blocked. The workflow uses that history to change its rotation and focus areas.

So the system does not only check code; it also learns which kinds of automated findings are producing useful follow-up work.

### What about a memory system?

There is a documented resolution-memory design in [`docs/ai/RETAINEDKNOWLEDGE.md`](https://github.com/kubestellar/console/blob/main/docs/ai/RETAINEDKNOWLEDGE.md), but that document is explicitly marked **Planned**.

So, in the main branch today, the project's practical anti-repeat system is:

1. documented rules
2. ratcheted baselines
3. issue/PR history
4. tuning data from automation

## 3. How does the project measure quality?

It measures quality with both **merge-time signals** and **continuous signals**.

### Merge-time signals

Examples:

- build/test success
- nil-safety regressions
- coverage on modified files
- visual diffs
- TTFI performance regressions
- API contract validation
- CodeQL results
- DCO compliance

### Continuous signals

Examples:

- scheduled `auto-qa.yml` audits
- scheduled nil-safety scans that can open issues
- scheduled TTFI checks that can open perf-regression issues
- scheduled workflow failure monitoring via `workflow-failure-issue.yml`
- weekly OpenSSF Scorecard scans via `scorecard.yml`
- post-merge Playwright checks against the live site

The repo also stores acceptance-rate and category history in `auto-qa-tuning.json`, which gives maintainers a way to measure whether automated issue generation is producing good work or noisy work.

## 4. How are unresolved issues handled?

Unresolved problems are usually converted into **tracked GitHub issues**, not silently ignored.

### Scheduled failures become issues

[`workflow-failure-issue.yml`](https://github.com/kubestellar/console/blob/main/.github/workflows/workflow-failure-issue.yml) watches important scheduled and nightly workflows. If one fails, it either opens a new `workflow-failure` issue or comments on the existing one instead of duplicating noise.

### Regression after merge becomes a new bug

`post-merge-verify.yml` opens a new regression issue with labels such as:

- `kind/bug`
- `priority/critical`
- `regression-detected`
- `ai-fix-requested`
- `triage/accepted`

That means an issue is not considered resolved just because a PR merged.

### Hold labels block premature closure

[`hold-issue-guard.yml`](https://github.com/kubestellar/console/blob/main/.github/workflows/hold-issue-guard.yml) prevents PRs from auto-closing hold-labeled issues. If a PR body says `Fixes #123` but the issue is on hold, the workflow fails and tells the author to remove the closing keyword or remove the hold label first.

### Tiering changes review expectations

[`tier-classifier.yml`](https://github.com/kubestellar/console/blob/main/.github/workflows/tier-classifier.yml) and [`.github/tier-classifier-rules.yml`](https://github.com/kubestellar/console/blob/main/.github/tier-classifier-rules.yml) automatically label each PR as one of:

- `tier/0-automatic`
- `tier/1-lightweight`
- `tier/2-standard`
- `tier/3-restricted`

High-risk files such as workflows, auth paths, RBAC manifests, and security docs are explicitly pushed into `tier/3-restricted` for stronger scrutiny.

## 5. What happens when an AI PR is rejected?

The important answer is: **it follows the normal PR process**.

AI-authored PRs do not get a privileged merge path.

### If CI fails

The PR stays red until someone fixes it. Depending on the failure, the response might be:

- update the branch with a correction
- close the PR and keep working from the issue
- open a follow-up regression issue if the failure is discovered after merge

### If automated review finds concerns

`claude-code-review.yml` adds advisory review comments. Maintainers decide whether those findings are real blockers, should be fixed now, or should become follow-up work.

### If human review rejects the change

The PR is either revised or closed. The issue remains the source of truth. In other words, the project treats a rejected AI PR as **evidence that the issue is still open**, not as a reason to relax standards.

### If a merged AI PR later proves wrong

The post-merge verifier creates a new regression issue and can assign follow-up work back into the automation loop through labels such as `ai-fix-requested`.

## 6. Is there a scanner → reviewer → supervisor Hive layer in the main repo?

Not in the main branch as checked for this document.

Searches for these repo artifacts returned no matches in `kubestellar/console` main:

- `bin/`
- `supervisor.sh`
- `reviewer.sh`
- `scanner.sh`
- `kick-agents.sh`
- `enumerate-actionable.sh`

So the quality system that is concretely visible in the repository today is **workflow-centric**:

1. issue and PR metadata
2. CI workflows
3. automated review comments
4. human approval and merge decisions
5. post-merge verification and follow-up issues

## Summary

The Console project controls AI quality by combining:

- explicit coding rules
- PR checks that target common AI failure modes
- automated code review
- production verification after merge
- issue-based handling of unresolved failures
- tiering and hold guards for governance
- tuning data that measures which automated work is actually useful

That combination is the real answer to "how do you trust agentic development?": **you do not trust it blindly; you constrain it, test it, review it, and keep measuring it after merge.**
