---
title: "Helm Install"
description: "Install or upgrade a Helm chart to multiple clusters."
---

> Source: [`kubestellar/kubestellar-mcp/commands/helm-install.md`](https://github.com/kubestellar/kubestellar-mcp/blob/main/commands/helm-install.md)

# Helm Install

Install or upgrade a Helm chart to multiple clusters.

## Usage

Install a Helm chart to clusters. Can specify target clusters explicitly or deploy to all available clusters.

## Examples

- "Install nginx chart to all clusters"
- "Helm install my-app ./charts/myapp to production cluster"
- "Deploy redis chart version 17.0.0 to clusters with label env=staging"
- "Install prometheus with custom values to monitoring namespace"

## What it does

1. Finds target clusters (specified or all available)
2. Runs `helm upgrade --install` on each cluster
3. Reports success/failure per cluster

## MCP Tools Used

- `helm_install` - Install or upgrade a Helm release

## Implementation

Use the `helm_install` tool with:
- `release_name`: Name for the Helm release (required)
- `chart`: Chart name, path, or OCI URL (required)
- `namespace`: Target namespace (default: default)
- `values`: Key-value pairs for --set
- `values_yaml`: Full YAML values
- `version`: Specific chart version
- `repo`: Chart repository URL
- `wait`: Wait for resources to be ready
- `timeout`: Timeout for wait
- `dry_run`: Preview without applying
- `clusters`: Target clusters (all if not specified)

## Examples of Tool Calls

```json
{
  "release_name": "my-nginx",
  "chart": "nginx",
  "repo": "https://charts.bitnami.com/bitnami",
  "namespace": "web",
  "values": {
    "replicaCount": "3",
    "service.type": "LoadBalancer"
  },
  "wait": true
}
```
