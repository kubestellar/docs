---
title: "Deploy"
description: "Deploy an app to multiple clusters with smart placement."
---

> Source: [`kubestellar/kubestellar-mcp/commands/deploy.md`](https://github.com/kubestellar/kubestellar-mcp/blob/main/commands/deploy.md)

# Deploy

Deploy an app to multiple clusters with smart placement.

## Usage

Deploy a workload to clusters. You can specify target clusters explicitly or let kubestellar-deploy find matching clusters based on requirements.

## Examples

- "Deploy this nginx deployment to all clusters"
- "Deploy my ML model to clusters with GPUs"
- "Deploy this app to clusters with at least 16Gi memory"
- "Do a dry run of deploying this manifest"

## What it does

1. Finds clusters matching your requirements (or uses all clusters)
2. Applies the manifest to each target cluster
3. Reports success/failure per cluster

## MCP Tools Used

- `deploy_app` - Deploy an app to clusters
- `find_clusters_for_workload` - Find clusters matching requirements
- `list_cluster_capabilities` - See what each cluster can run

## Implementation

Use the `deploy_app` tool with:
- `manifest`: The Kubernetes YAML manifest
- `clusters`: Optional list of target clusters
- `gpu_type`: Optional GPU type requirement (e.g., "nvidia.com/gpu")
- `min_gpu`: Optional minimum GPU count
- `dry_run`: Set to true to preview without applying

## Smart Placement

If you don't specify clusters, kubestellar-deploy can:
- Deploy to all clusters
- Filter to clusters with specific GPU types
- Filter to clusters with minimum CPU/memory
- Filter to clusters with specific node labels
