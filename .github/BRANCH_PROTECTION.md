# Branch Protection Configuration Guide

This document provides instructions for repository administrators to configure branch protection rules that enforce code review and status check requirements.

## Overview

These settings complement the code review policy documented in [CONTRIBUTING.md](../CONTRIBUTING.md#code-review-requirements) and help maintain code quality and security standards required by [OpenSSF Scorecard](https://github.com/ossf/scorecard).

## Required Configuration

### Enable Required PR Reviews

**Objective**: Require at least 1 approving review before any PR can be merged to the `main` branch.

**Steps**:

1. Navigate to repository **Settings** → **Branches** → **Branch protection rules**
2. Add or update rule for `main` branch
3. Enable **"Require a pull request before merging"**
4. Enable **"Require approvals"** and set minimum to **1**
5. **Recommended**: Enable **"Dismiss stale pull request approvals when new commits are pushed"**
6. **Recommended**: Enable **"Require review from Code Owners"** (uses `.github/CODEOWNERS`)
7. Save the branch protection rule

**Expected Impact**: Ensures all changes receive at least one code review, directly improving the OpenSSF Scorecard Code-Review score.

### Enable Required Status Checks

**Objective**: Require CI/CD validations to pass before PRs can be merged, providing automated quality gates.

**Steps**:

1. Navigate to repository **Settings** → **Branches** → **Branch protection rules**
2. Select the rule for `main` branch
3. Enable **"Require status checks to pass before merging"**
4. Select specific required checks from the available workflows:
   - Link checker (e.g., `check-links`, `linkinator`)
   - Markdown linting (e.g., `markdownlint`, `lint`)
   - Build validation (e.g., `build`, `deploy-preview`)
   - Security scanning (e.g., `codeql`, `trivy`, `osv-scanner`)
   - Any other critical CI checks
5. **Recommended**: Enable **"Require branches to be up to date before merging"**
6. Save the branch protection rule

**Expected Impact**: Prevents broken or malicious changes from being merged even if reviewed, providing defense-in-depth for the documentation site and deployment infrastructure.

## Verification

After configuring branch protection:

1. Create a test PR to verify:
   - Review approval is required before merge button activates
   - All selected CI checks run and must pass
   - PR cannot be merged until requirements are met

2. Verify CODEOWNERS integration:
   - PRs touching files in `.github/workflows/`, `Dockerfile*`, etc. should auto-request reviews from code owners
   - These PRs should require approval from code owners specifically

## Additional Recommendations

- **Restrict who can push**: Consider enabling "Restrict who can push to matching branches" to limit direct pushes
- **Include administrators**: Enable "Include administrators" to apply rules even to repo admins
- **Require signed commits**: Consider enabling for supply-chain security (requires developer setup)
- **Require conversation resolution**: Ensures all review comments are addressed before merge

## Related Issues

- [#5903](https://github.com/kubestellar/docs/issues/5903) — Enable required PR reviews in branch protection
- [#5905](https://github.com/kubestellar/docs/issues/5905) — Implement required status checks before merge
- [#5906](https://github.com/kubestellar/docs/issues/5906) — Document review policy and process

## References

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [OpenSSF Scorecard](https://github.com/ossf/scorecard) — Security best practices
- [CODEOWNERS File](./CODEOWNERS) — Defines review requirements for sensitive paths
