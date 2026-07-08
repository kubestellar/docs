# Branch Protection Policy

The `main` branch of this repository must have the following protection rules enabled:

- Require pull request review before merging
  - Required approving reviews: **1**
  - Dismiss stale approvals when new commits are pushed
- Restrict who can push to matching branches: only maintainers via PR merge
- Do not allow force pushes
- Do not allow deletions
- Require linear history (recommended)

## Applying

A repository administrator must apply these settings via the GitHub Settings > Branches UI, or via:

```bash
gh api -X PUT "repos/kubestellar/docs/branches/main/protection" --input policy.json
```

Where `policy.json` contains:

```json
{
  "required_status_checks": null,
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false
}
```

## Rationale

Addresses security findings tracked in issue #6219 (branch protection) and #6220 (mandatory code review).
