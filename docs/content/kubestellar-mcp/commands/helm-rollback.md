---
title: "Helm Rollback"
description: "Rollback a Helm release to a previous revision."
---

> Source: [`kubestellar/kubestellar-mcp/commands/helm-rollback.md`](https://github.com/kubestellar/kubestellar-mcp/blob/main/commands/helm-rollback.md)

# Helm Rollback

Rollback a Helm release to a previous revision.

## Usage

Roll back a Helm release to a previous revision across clusters.

## Examples

- "Rollback my-app to the previous version"
- "Helm rollback nginx to revision 3"
- "Undo the last deployment of redis"

## What it does

1. Finds clusters where the release exists
2. Runs `helm rollback` on each cluster
3. Reports success/failure per cluster

## MCP Tools Used

- `helm_rollback` - Rollback a Helm release

## Implementation

Use the `helm_rollback` tool with:
- `release_name`: Name of the release (required)
- `namespace`: Namespace of the release (default: default)
- `revision`: Revision number to rollback to (previous if not specified)
- `dry_run`: Preview without applying
- `clusters`: Target clusters (auto-detected if not specified)

## Examples of Tool Calls

```json
{
  "release_name": "my-nginx",
  "namespace": "web",
  "revision": 2
}
```
