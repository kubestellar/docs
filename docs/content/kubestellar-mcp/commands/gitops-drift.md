---
title: "GitOps Drift Detection"
description: "Detect drift between git manifests and what's actually deployed in your clusters."
---

> Source: [`kubestellar/kubestellar-mcp/commands/gitops-drift.md`](https://github.com/kubestellar/kubestellar-mcp/blob/main/commands/gitops-drift.md)

# GitOps Drift Detection

Detect drift between git manifests and what's actually deployed in your clusters.

## Usage

Compare your git repository against cluster state to find configuration drift.

## Examples

- "Are my clusters in sync with git?"
- "Check for drift from github.com/myorg/manifests"
- "What's different between git and production?"
- "Find configuration drift in my clusters"

## What it shows

- Missing resources (in git but not in cluster)
- Modified resources (differ between git and cluster)
- Specific field differences

## MCP Tools Used

- `detect_drift` - Compare git manifests against cluster state

## Implementation

Use `detect_drift` with:
- `repo`: Git repository URL (required)
- `path`: Path within repo (optional)
- `branch`: Branch name (default: main)
- `clusters`: Target clusters (all if not specified)

## Drift Types

- **missing**: Resource exists in git but not in cluster
- **modified**: Resource exists in both but fields differ
- **extra**: Resource exists in cluster but not in git (not yet implemented)
