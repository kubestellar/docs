---
title: "GitOps Sync"
description: "Sync manifests from a git repository to your clusters."
---

> Source: [`kubestellar/kubestellar-mcp/commands/gitops-sync.md`](https://github.com/kubestellar/kubestellar-mcp/blob/main/commands/gitops-sync.md)

# GitOps Sync

Sync manifests from a git repository to your clusters.

## Usage

Provide a git repository URL and optional path, and kubestellar-deploy will apply all manifests to your clusters.

## Examples

- "Sync my manifests from github.com/myorg/k8s-manifests"
- "Apply the production manifests from git to all clusters"
- "Sync from git repo github.com/org/configs path environments/prod"
- "Preview what would change if I sync from git"

## What it does

1. Clones the git repository (shallow clone)
2. Reads all YAML/JSON manifests from the specified path
3. Applies each manifest to target clusters
4. Reports created/updated/unchanged counts per cluster

## MCP Tools Used

- `sync_from_git` - Apply manifests from git to clusters
- `preview_changes` - Dry-run to see what would change
- `reconcile` - Force sync to bring clusters in line with git

## Implementation

Use `sync_from_git` with:
- `repo`: Git repository URL (required)
- `path`: Path within repo (optional)
- `branch`: Branch name (default: main)
- `clusters`: Target clusters (all if not specified)
- `dry_run`: Set to true to preview without applying
