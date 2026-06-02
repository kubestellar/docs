---
title: "Kustomize"
description: "Apply kustomize configurations to multiple clusters."
---

> Source: [`kubestellar/kubestellar-mcp/commands/kustomize.md`](https://github.com/kubestellar/kubestellar-mcp/blob/main/commands/kustomize.md)

# Kustomize

Apply kustomize configurations to multiple clusters.

## Usage

Build and apply kustomize overlays to one or more clusters.

## Examples

- "Apply kustomize from ./overlays/production to all clusters"
- "Build kustomize output from ./base"
- "Delete resources defined in ./overlays/staging kustomize"

## What it does

1. Builds kustomize output from the specified path
2. Applies (or deletes) the rendered manifests to target clusters
3. Reports success/failure per cluster

## MCP Tools Used

- `kustomize_build` - Render kustomize output without applying
- `kustomize_apply` - Build and apply to clusters
- `kustomize_delete` - Build and delete those resources

## Implementation

Use the `kustomize_apply` tool with:
- `path`: Path to directory containing kustomization.yaml (required)
- `dry_run`: Preview without applying
- `clusters`: Target clusters (all if not specified)

## Examples of Tool Calls

**Build only:**
```json
{
  "path": "./overlays/production"
}
```

**Apply to all clusters:**
```json
{
  "path": "./overlays/production",
  "dry_run": false
}
```

**Delete from specific clusters:**
```json
{
  "path": "./overlays/staging",
  "clusters": ["staging-1", "staging-2"]
}
```

## Prerequisites

Requires either:
- `kustomize` CLI installed
- Or `kubectl` with kustomize support (kubectl kustomize)
