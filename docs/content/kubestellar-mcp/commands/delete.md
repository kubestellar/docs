---
title: "Delete"
description: "Delete Kubernetes resources from clusters."
---

> Source: [`kubestellar/kubestellar-mcp/commands/delete.md`](https://github.com/kubestellar/kubestellar-mcp/blob/main/commands/delete.md)

# Delete

Delete Kubernetes resources from clusters.

## Usage

Delete a resource by kind and name from one or more clusters.

## Examples

- "Delete deployment nginx from default namespace"
- "Remove the my-config configmap from all clusters"
- "Delete service my-app from production cluster"
- "Delete the old-job job from batch namespace"

## What it does

1. Targets specified clusters (or all available)
2. Deletes the resource from each cluster
3. Reports success/failure/not-found per cluster

## MCP Tools Used

- `delete_resource` - Delete a Kubernetes resource

## Supported Resource Types

- Deployments, StatefulSets, DaemonSets
- Services, Ingresses
- ConfigMaps, Secrets
- Pods, Jobs, CronJobs
- PersistentVolumeClaims
- Namespaces
- ServiceAccounts
- Roles, RoleBindings, ClusterRoles, ClusterRoleBindings

## Implementation

Use the `delete_resource` tool with:
- `kind`: Resource kind (required) - e.g., Deployment, Service, ConfigMap
- `name`: Resource name (required)
- `namespace`: Namespace (default: default, ignored for cluster-scoped)
- `dry_run`: Preview without applying
- `clusters`: Target clusters (all if not specified)

## Examples of Tool Calls

```json
{
  "kind": "Deployment",
  "name": "my-app",
  "namespace": "production",
  "dry_run": false,
  "clusters": ["cluster-1", "cluster-2"]
}
```
