---
title: "AI Codebase Maturity Model (ACMM) Dashboard"
linkTitle: "ACMM Dashboard"
weight: 19
description: >
  Assess any GitHub repository against the AI Codebase Maturity Model — a 5-level framework with 33 feedback loops measuring how well a codebase leverages AI-assisted development.
keywords:
  - acmm
  - ai codebase maturity
  - ai maturity model
  - github repo assessment
  - feedback loops
---

# AI Codebase Maturity Model Dashboard

The `/acmm` dashboard assesses any GitHub repository against the [AI Codebase Maturity Model](https://arxiv.org/abs/2604.09388) (ACMM) — a 5-level framework with 33 feedback loops that measure how well a codebase leverages AI-assisted development.

ACMM was published as an arXiv paper (`cs.SE`, 2604.09388). The console implementation adds three supplementary sources beyond the core ACMM spec: `fullsend`, `agentic-engineering-framework`, and `claude-reflect` — each contributing additional criteria via a plugin registry.

## How it works

1. Paste any `owner/repo` in the **Repo Picker** at the top (defaults to `kubestellar/console`).
2. The backend scans the GitHub tree API once + parallelizes PR/issue search aggregation.
3. All four cards update together from the scan results.

Results are cached for 15 minutes. When no GitHub access is available, demo data kicks in.

## The four cards

### ACMM Level (ring gauge)

Shows the repository's current maturity level (L1 through L5) as a ring gauge, the matching role description, and a progress bar toward the next level.

| Level | Name | AI Contribution Target |
|---|---|---|
| L1 | Assisted | ~25% |
| L2 | Augmented | ~40% |
| L3 | Collaborative | ~55% |
| L4 | Autonomous | ~70% |
| L5 | Self-Evolving | ~85% |

### ACMM Balance (trend chart)

Weekly bar chart showing the ratio of AI-generated vs human-authored contributions. A level-anchored target slider lets you set a goal (e.g., "aim for L3 = 55% AI"). Click a "Use L{n}" snap button to jump to that level's target. The target persists per-repo in localStorage.

### Feedback Loop Inventory

Filterable inventory of all 33 ACMM feedback loops (plus criteria from the three supplementary sources), showing which are detected in the repo and which are missing. Filter by source (`acmm`, `fullsend`, `agentic-engineering-framework`, `claude-reflect`) or by detected/missing status.

Click any missing feedback loop to open a side panel with a description and a Console-specific reference showing how to implement it.

### Recommendations

Role-aware top-5 list of missing criteria prioritized for reaching the next level. Each recommendation links to the relevant feedback loop in the inventory card.

## Backend

The scan runs via a Netlify Function at `GET /api/acmm/scan?repo=owner/repo` (`web/netlify/functions/acmm-scan.mts`). It:
- Hits the GitHub tree API once per scan
- Parallelizes PR and issue search aggregation
- Caches results for 15 minutes (LRU)
- Falls back to demo data when the GitHub API is unreachable or rate-limited
- Has an MSW passthrough rule for demo mode

## Related

- [ACMM paper on arXiv](https://arxiv.org/abs/2604.09388)
- Console PR: #8260
