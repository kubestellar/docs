---
title: "Agentic Quality Controls — How Console Keeps AI Development Honest"
linkTitle: "Agentic Quality Controls"
weight: 21
description: >
  How KubeStellar Console catches AI mistakes, prevents repeat mistakes,
  measures issue-resolution quality, handles untouched issues, and treats
  AI pull requests that are not accepted.
keywords:
  - kubestellar console ai quality
  - agentic development quality gates
  - hive quality controls
  - ai pull request review
  - console ci gates
---

# Agentic Quality Controls

KubeStellar Console uses AI heavily, but it does **not** trust AI output by default.
The quality model is layered: deterministic routing, repo rules, CI gates, AI review, human approval, and post-merge verification.

## At a glance

| Question | Short answer |
|---|---|
| How are AI mistakes caught? | By repository rules, tier/complexity routing, CI, automated review, and human maintainer approval. |
| What prevents repeats? | Agent memory, codified rules in `CLAUDE.md`/`AGENTS.md`, and consistency tests that ratchet against known failure modes. |
| How is quality measured? | By CI pass rates, review outcomes, merge acceptance, post-merge verification, workflow-failure issues, and tuning metrics. |
| What happens to untouched issues? | They stay open, remain in the scanner backlog, and are reprioritized by rotation, weight, tier, and maintainer triage. |
| What happens to rejected AI PRs? | They are revised or closed like any other PR; the issue stays open until a correct fix is accepted. |

## 1. How AI mistakes are caught

The project uses **multiple independent checks**, because any one model can be wrong.

### Before code is written

The first layer is policy:

- `CLAUDE.md` and `AGENTS.md` define non-negotiable rules for tests, array safety, i18n, demo data, Netlify parity, named constants, and security.
- Issue complexity and PR tiers route work to the right level of scrutiny instead of treating every change as equally safe.
- The Hive workflow separates deterministic decisions from model judgment, so things like classification, gating, and protected operations are not left to prompt interpretation alone.

### While the fix is being prepared

The agentic system uses specialized roles such as scanner, reviewer, architect, and outreach agents.
That separation matters: the same agent that proposes a fix is not the only one evaluating it.

### On every pull request

Every PR still has to pass normal project gates.
The important checks include:

| Gate | What it catches |
|---|---|
| Build + lint | Syntax errors, broken imports, type and style regressions |
| CodeQL | Security regressions |
| Visual regression | UI breakage that screenshots expose |
| Performance TTFI | Slower user-facing interactions |
| Nil safety + consistency checks | Common AI mistakes such as unsafe access, magic numbers, and pattern drift |
| Route smoke + full-stack E2E | Broken flows and integration regressions |
| Coverage gate | Changes that reduce exercised behavior on touched frontend code |
| DCO / sign-off | Provenance and contribution compliance |

The project also uses automated review and then **human maintainer review**.
No PR gets a privileged AI-only merge path.
Maintainers decide whether the change is correct, and merges still require the usual approval path (`lgtm` / `approved` labels in the project workflow).

## 2. What prevents the same mistake from being made again?

The project tries to convert one-off failures into durable guardrails.

### Agent memory and retained conventions

The agentic system keeps memory about conventions, previous failures, and successful patterns so later sessions do not start from zero.
That memory is reinforced by project documents and by the issue / PR history itself.

### Written rules become harder to violate

When a mistake repeats, the response is usually to encode it:

- add or tighten a rule in `CLAUDE.md` or `AGENTS.md`
- update development guides or card guides
- add a consistency check or expand a baseline
- route similar work to a more appropriate tier or model

This is the main anti-regression pattern: **lessons become infrastructure**.

### Consistency tests enforce architecture

The repo includes `scripts/consistency-test.sh` and related checks to catch rule drift, not just compile errors.
These checks enforce architectural expectations such as safe array handling, timeout discipline, and cache-pattern consistency.
That makes repeated AI mistakes easier to detect automatically.

## 3. How the quality of issue resolutions is measured

Quality is measured at more than one point in the lifecycle.

### Resolution-quality signals

| Signal | Why it matters |
|---|---|
| CI pass/fail | Basic correctness and safety before merge |
| Reviewer + maintainer acceptance | Whether the proposed fix is actually convincing |
| Tier / complexity fit | Whether the work was handled at the right scrutiny level |
| Post-merge verification | Whether the fix still works in a deployed environment |
| Workflow-failure monitoring | Whether the system detects new breakage quickly |
| Acceptance / closure history | Whether automated work is producing mergeable PRs or noisy PRs |
| SLA monitoring | Whether issues and responses are moving quickly enough |

The project also tracks tuning data and historical outcomes so the system can see which categories are getting accepted, merged, blocked, or ignored.
That gives maintainers a way to measure whether the automation is useful instead of just active.

## 4. What happens to issues that are not acted upon?

They are **not silently treated as solved**.

- They stay open in GitHub.
- They remain part of the scanner backlog.
- Rotations, issue weighting, and tiering affect **when** they are picked up, not whether they magically become resolved.
- Maintainers can reprioritize, relabel, escalate, or leave them for human contributors.
- Automated workflow failures can open or refresh issues so persistent breakage stays visible.

In practice, this means some classes of issue may be scanned less often or deferred when higher-value or higher-risk work is present.
But an untouched issue remains an open issue, not a hidden success.

## 5. What happens when an AI-generated PR is not accepted?

Exactly what should happen in a healthy repo: it does **not** merge.

### If CI fails

The PR stays red until fixed or closed.
A failing AI PR is evidence that the issue is not solved yet.

### If review requests changes

The agent or maintainer updates the branch, or the PR is closed and the issue returns to the queue.
There is no force-merge path just because the author was an AI system.

### If the PR is rejected outright

The issue stays open, gets reassigned or retriaged, and the rejected PR becomes a learning signal:

- feedback can be added to memory
- instructions can be tightened
- tests and consistency rules can be expanded
- similar future work can be routed differently

In other words, a rejected AI PR is treated as **quality feedback**, not as wasted process.

## Why this works

The Console project treats agentic development as a system that must be **constrained, measured, and corrected**.
Quality comes from the combination of:

- deterministic routing and gating
- explicit repository rules
- specialized agents with separated roles
- CI checks aimed at common AI failure modes
- human approval before merge
- issue-based follow-up when fixes fail or are rejected
- retained memory and rule updates so the same mistake is less likely next time

That is the core answer to the issue behind this page: the project does not assume AI is reliable. It builds a process that keeps unreliable steps reviewable and recoverable.
