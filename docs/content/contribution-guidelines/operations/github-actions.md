# GitHub Action Reference Discipline

For the sake of supply chain security, every reference from a workflow to an action identifies the action's version by a commit hash rather than a tag or branch name. This ensures reproducibility and prevents supply chain attacks through action tampering.

## The Reversemap File

The file `.gha-reversemap.yml` in the root of the repository is the single source of truth for the mapping from action identity (owner/repo) to commit hash. This file should only be updated when you have confidence in the new or added version.

## Managing Action References

The script `hack/gha-reversemap.sh` provides commands for managing GitHub Action references across workflows.

### Available Commands

| Command | Description |
|---------|-------------|
| `update-action-version` | Updates an action to its latest version in the reversemap file |
| `update-reversemap` | Updates the reversemap file with a specific action reference from a workflow |
| `apply-reversemap` | Distributes the reversemap specifications to all workflow files |
| `verify-mapusage` | Verifies that all workflow files use correct commit hashes |

### Updating an Action

To update an action (e.g., `actions/checkout`) to the latest version:

```shell
hack/gha-reversemap.sh update-action-version actions/checkout
hack/gha-reversemap.sh apply-reversemap
```

The first command updates `.gha-reversemap.yml` with the latest commit hash for the action. The second command propagates this change to all workflow files that reference the action.

### Verifying Action References

To verify that all workflow files use the correct commit hashes:

```shell
hack/gha-reversemap.sh verify-mapusage
```

This command checks all workflow files and reports any discrepancies between the reversemap file and actual workflow references.

## GitHub API Rate Limiting

The `hack/gha-reversemap.sh` script makes calls to the GitHub API, which is rate-limited. If you encounter rate limit errors, you can authenticate using a GitHub token:

```shell
export GITHUB_TOKEN=your_token_here
hack/gha-reversemap.sh update-action-version actions/checkout
```

Authenticated requests have significantly higher rate limits than unauthenticated requests.

## Typical Workflow: Responding to Dependabot PRs

CI maintains the fact that `hack/gha-reversemap.sh verify-mapusage` passes.

The most common workflow is responding to a Dependabot PR proposing to switch to a newer version of some GitHub Action. Following is the workflow for that.

1. **Wait for safety period**: Wait until at least a week after the new version was released, to allow time for vulnerabilities to be discovered and reported.

2. **Research the action**: Do a web search on the Action; examine the results to see if any look like reports of a vulnerability.

3. **Check advisories**: Consult [github.com/advisories](https://github.com/advisories) about the Action.

4. **Decision point**: If the above turns up a vulnerability, skip this upgrade. Otherwise proceed as follows.

5. **Update the action**:
   - **IF** no subsequent release has been made in the interim, create a PR that uses `hack/gha-reversemap.sh update-action-version` to pick up that release.
   - **Otherwise**, edit one workflow to reference the tag of the desired release and use `hack/gha-reversemap.sh update-reversemap <that one workflow>`.

6. **Apply changes**: In that PR, follow the map update with `hack/gha-reversemap.sh apply-reversemap`.

7. **Get reviewed and merged**: Get the PR reviewed and merged.

## Why Commit Hashes?

Using commit hashes instead of tags provides several security benefits:

- **Immutability**: Commit hashes cannot be changed, while tags can be moved to point to different commits.
- **Verification**: You can verify exactly what code will run by inspecting the specific commit.
- **Supply Chain Security**: Prevents attacks where a malicious actor compromises an action and moves a tag to point to malicious code.
- **Reproducibility**: Builds are reproducible because the exact same action code runs every time.
