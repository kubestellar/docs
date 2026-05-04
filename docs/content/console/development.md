---
title: "Development Methodology — Console Development, Testing & Maintenance"
linkTitle: "Development Methodology"
weight: 20
description: >
  How the KubeStellar Console is developed, tested, and maintained using a hybrid human + AI-agentic workflow. Covers issue triage, PR requirements, CI pipeline, testing strategy, code standards, and contribution guide.
keywords:
  - kubestellar console development
  - agentic development workflow
  - kubernetes dashboard contributing
  - console CI pipeline
  - console testing strategy
---

# Development Methodology

> This page describes how the KubeStellar Console project is developed, tested, and maintained. It covers the hybrid human + AI-agentic model, issue lifecycle, PR requirements, and how to contribute.

## Overview

KubeStellar Console uses a **hybrid human + AI-agentic development model**. Human contributors handle design decisions, architecture changes, and complex features, while an automated agentic pipeline handles routine bug fixes, documentation updates, and well-scoped improvements.

This approach enables:

- **Rapid iteration** — routine issues are fixed within hours of being filed
- **Consistent quality** — every PR passes the same CI gates regardless of author
- **Scalable maintenance** — the agentic pipeline processes multiple issues in parallel
- **Human oversight** — all PRs require review and CI approval before merge

---

## Issue Workflow

### Filing Issues

Issues reach the project through two paths:

1. **In-app feedback dialog** — users click the feedback button inside the console, which opens a GitHub issue pre-populated with context (page, browser, console version)
2. **Direct GitHub issue** — contributors and maintainers file issues in `kubestellar/console`

### Classification

Issues are classified by complexity:

| Label | Complexity | Typical Scope | Handler |
|-------|-----------|---------------|---------|
| `S` | Simple | Typo, label fix, config tweak | Agentic pipeline |
| `M` | Medium | Bug fix, new card, hook change | Agentic pipeline or human |
| `C` | Complex | Architecture change, new feature | Human contributor |

Classification is performed automatically based on issue content, labels, and historical patterns. Maintainers can override classification at any time.

### Triage

- New issues are reviewed within 24 hours
- Issues labeled `good first issue` are reserved for human contributors
- Issues labeled `agentic` are eligible for automated processing
- Stale issues (no activity for 30 days) are flagged for review

---

## Agentic CI Pipeline

The console project employs an automated agentic pipeline that processes eligible issues end-to-end.

### How It Works

```
     ┌──────────────┐     ┌─────────────┐     ┌──────────┐
  Issue Filed │────▶│ Scanner Agent │────▶│  Fix Agent   │────▶│  PR Open  │
     └──────────────┘     └─────────────┘     └──────────┘
                          │                      │
                    Reads filtered         Creates worktree
                    issue list            Makes fix, commits
                    (S/M classified)      Pushes branch
```

1. **Scanner agent** runs on a cron schedule (every few hours)
2. It reads a pre-filtered list of issues classified as `S` or `M` complexity
3. It dispatches **4–6 sub-agents in parallel**, each assigned one issue
4. Each sub-agent:
   - Creates a Git worktree branch (`fix/<issue-number>`)
   - Reads the issue description and any linked context
   - Makes the code fix or documentation change
   - Runs build and lint locally to verify
   - Commits with DCO sign-off and proper emoji prefix
   - Pushes the branch and opens a PR with `Fixes #NNN`
5. The PR enters normal CI — all checks must pass before merge

### Guardrails

- Agents cannot merge their own PRs
- Agents cannot modify security-sensitive files without human review
- If CI fails, the agent may retry once; after that, the issue is escalated to a human
- All agent-authored PRs are labeled `authored-by: bot` for visibility

---

## PR Requirements

Every pull request — whether from a human or an agent — must meet these requirements:

### 1. DCO Sign-Off

All commits must include a `Signed-off-by` trailer for Developer Certificate of Origin compliance:

```bash
git commit -s -m "✨ Add cluster health polling"
```

### 2. Commit Message Format

```
<emoji> <Short description in imperative mood (under 72 chars)>

<Optional longer description>

Signed-off-by: Name <email>
```

#### Emoji Prefixes

| Emoji | Type | When to Use |
|-------|------|-------------|
| ✨ | Feature | New functionality |
| 🐛 | Bug fix | Fixing broken behavior |
| 📖 | Docs | Documentation changes only |
| 📝 | Proposal | Design proposals |
| ⚠️ | Breaking change | API or behavior changes |
| 🌱 | Other | Tests, CI, refactoring, tooling |

### 3. PR Body

The **first line** of the PR body must be `Fixes #NNN` where `NNN` is the issue number. This ensures GitHub automatically closes the issue when the PR is merged.

### 4. CI Must Pass

All of the following checks must pass:

- **Build** — Go backend and TypeScript frontend compile without errors
- **Lint** — ESLint passes with no warnings or errors
- **Visual regression** — Playwright screenshot comparisons match baselines
- **CodeQL** — No new security vulnerabilities introduced
- **DCO** — All commits are signed off
- **Schema validation** — Mission KB YAML files conform to schema

### 5. Rebase Workflow

PRs must be rebased on `main` before merge (no merge commits):

```bash
git fetch origin main
git rebase origin/main
```

---

## Testing Strategy

### Frontend — Playwright E2E

End-to-end tests in `web/e2e/` verify full user flows:

- **Visual regression tests** (`web/e2e/visual/`) — screenshot comparisons catch unintended layout changes
- **Functional tests** — verify navigation, data loading, card interactions
- **Demo mode tests** — ensure the console works without cluster connections

Best practices:
- Use `expect(locator).toBeVisible()` over `waitForTimeout()`
- One assertion per concept
- Descriptive test names: `test('card shows cached data on warm return', ...)`

### Backend — Go Tests

Go tests in `pkg/` and `cmd/` cover:

- API handler behavior (request/response contracts)
- Store layer (SQLite CRUD operations)
- Multi-cluster query logic
- Error handling and edge cases

Best practices:
- Table-driven tests with descriptive case names
- `require` for fatal assertions, `assert` for non-fatal
- Test error cases, not just happy paths

### Visual Regression

Any PR modifying UI must:

1. Extract a visual checklist from the issue
2. Capture screenshots of affected pages
3. Create or update tests in `web/e2e/visual/`
4. Commit test files AND snapshot baselines

### Schema Validation

Mission KB YAML files are validated against a JSON schema on every PR to prevent malformed mission definitions from reaching production.

---

## Code Standards

### TypeScript

- **Explicit types** — no `any`, no implicit any
- **Functional components** with hooks (no class components)
- **Array safety** — always guard with `(data || [])` before `.map()`, `.filter()`, `.join()`
- **No magic numbers** — every numeric literal must be a named constant
- **i18n** — all user-facing strings use `t()` from `react-i18next`, never raw strings

### Styling

- **Tailwind CSS** with semantic color tokens (never raw hex values)
- **`cn()` utility** for merging classNames
- **Theme-aware** — use `text-foreground`, `bg-card`, etc., not hardcoded colors
- **Mobile-first** responsive design with Tailwind breakpoints

### Go Backend

- **Fiber v2** web framework
- **Structured logging** with `log/slog`
- **`make([]T, 0)`** not `var x []T` (nil slices serialize as `null`)
- **Demo mode** — every endpoint must check and return demo data when active
- **Goroutines + WaitGroup** for parallel multi-cluster queries

### Security

- No hardcoded secrets — environment variables only
- All LLM-calling code must follow `docs/security/SECURITY-AI.md`
- CodeQL scans on every PR

---

## Local Development

### Quick Start

```bash
# Clone the repository
git clone https://github.com/kubestellar/console.git
cd console

# Start in mock mode (no OAuth required)
./start-dev.sh

# Or with GitHub OAuth (requires .env with GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET)
./startup-oauth.sh
```

### Ports

| Service | Port |
|---------|------|
| Frontend (Vite) | 5174 |
| Backend (Go/Fiber) | 8080 |
| KC Agent WebSocket | 8585 |

### Pre-PR Validation

Before opening a PR, ensure build and lint pass:

```bash
cd web
npm run build
npm run lint
```

---

## How to Contribute

1. **Fork** the `kubestellar/console` repository
2. **Clone** your fork and create a branch from `main`:
   ```bash
   git checkout -b fix/your-issue-number
   ```
3. **Make changes** following the code standards above
4. **Validate** locally:
   ```bash
   cd web && npm run build && npm run lint
   ```
5. **Commit** with DCO sign-off and emoji prefix:
   ```bash
   git commit -s -m "🐛 Fix cluster count in sidebar"
   ```
6. **Push** and open a PR:
   - First line of PR body: `Fixes #NNN`
   - Describe what changed and why
   - Wait for CI checks to pass
7. **Address review feedback** if any, then rebase if needed

### What Makes a Good PR

- Focused on a single issue
- Includes tests for new behavior
- Passes all CI checks
- Has a clear description
- Links to the issue it resolves

### Getting Help

- File an issue with the `question` label
- Check existing documentation at [kubestellar.io/console](https://kubestellar.io/docs/console/)
- Review the [architecture page](./architecture/) for system design context

---

## Maintenance

### Release Cadence

The console follows continuous deployment — changes merged to `main` are deployed to the hosted instance at `console.kubestellar.io` via Netlify.

### Dependency Updates

- Frontend dependencies are updated regularly via automated PRs
- Go dependencies follow the KubeStellar release cadence
- Security patches are prioritized and applied immediately

### Monitoring

- Netlify deployment status is tracked per commit
- Runtime errors are captured via the console's built-in feedback mechanism
- Performance metrics (TTFI, cache hit rates) are monitored via analytics
