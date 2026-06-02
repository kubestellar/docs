---
title: "Label"
description: "Add or remove labels from Kubernetes resources across clusters."
---

> Source: [`kubestellar/kubestellar-mcp/commands/label.md`](https://github.com/kubestellar/kubestellar-mcp/blob/main/commands/label.md)

# Label

Add or remove labels from Kubernetes resources across clusters.

## Usage

Manage labels on resources across multiple clusters.

## Examples

- "Add label team=platform to deployment api"
- "Label all my nginx pods with env=production"
- "Remove the deprecated label from configmap settings"
- "Add owner=andy to service frontend in all clusters"

## What it does

1. Targets specified clusters (or all available)
2. Adds or removes labels using JSON merge patch
3. Reports success/failure per cluster

## MCP Tools Used

- `add_labels` - Add labels to a resource
- `remove_labels` - Remove labels from a resource

## Supported Resource Types

- Deployments, StatefulSets, DaemonSets
- Services, ConfigMaps, Secrets
- Pods, Namespaces, Nodes
- PersistentVolumes, PersistentVolumeClaims

## Implementation

**Add labels** with the `add_labels` tool:
- `kind`: Resource kind (required)
- `name`: Resource name (required)
- `namespace`: Namespace (default: default)
- `labels`: Map of label key-values to add (required)
- `dry_run`: Preview without applying
- `clusters`: Target clusters (all if not specified)

**Remove labels** with the `remove_labels` tool:
- `kind`: Resource kind (required)
- `name`: Resource name (required)
- `namespace`: Namespace (default: default)
- `labels`: Array of label keys to remove (required)
- `dry_run`: Preview without applying
- `clusters`: Target clusters (all if not specified)

## Examples of Tool Calls

**Add labels:**
```json
{
  "kind": "Deployment",
  "name": "api",
  "namespace": "default",
  "labels": {
    "team": "platform",
    "owner": "andy"
  }
}
```

**Remove labels:**
```json
{
  "kind": "Deployment",
  "name": "api",
  "namespace": "default",
  "labels": ["deprecated", "old-owner"]
}
```
