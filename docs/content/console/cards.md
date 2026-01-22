---
title: "Card Types"
linkTitle: "Cards"
weight: 4
description: >
  Available dashboard cards and their configuration
---

# Dashboard Cards

KubeStellar Klaude Console provides a variety of cards to monitor and manage your clusters.

## Available Card Types

| Card Type | Description | Data Source |
|-----------|-------------|-------------|
| **Cluster Health** | Availability graph per cluster | `get_cluster_health` |
| **App Status** | Multi-cluster application health | `get_app_status` |
| **Event Stream** | Live event feed with filtering | `get_events` |
| **Deployment Progress** | Rollout status visualization | `get_app_status` |
| **Pod Issues** | CrashLoopBackOff, OOMKilled pods | `find_pod_issues` |
| **Deployment Issues** | Stuck or failing rollouts | `find_deployment_issues` |
| **Resource Capacity** | CPU/memory/GPU utilization | `list_cluster_capabilities` |
| **GPU Inventory** | GPU nodes and counts across clusters | `get_gpu_nodes` |
| **GPU Status** | Real-time GPU allocation and usage | `get_gpu_nodes` |
| **GPU Overview** | Summary of GPU resources | `get_gpu_nodes` |
| **Security Issues** | Privileged, root, host access | `check_security_issues` |
| **Upgrade Status** | Cluster version and upgrade state | `get_upgrade_status` |

## GPU Cards

### GPU Inventory

Shows all GPU nodes across clusters with:
- Node name and cluster
- GPU type (e.g., NVIDIA A100)
- Total GPU count
- Allocated vs available

### GPU Status

Real-time GPU utilization:
- Allocation percentage per cluster
- Memory usage
- Temperature (if available)

### GPU Overview

Summary card showing:
- Total GPUs across all clusters
- Overall utilization
- Top consumers

## Card Configuration

Each card can be configured with:

```typescript
interface CardConfig {
  id: string;
  type: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: {
    clusters?: string[];      // Filter to specific clusters
    namespaces?: string[];    // Filter to specific namespaces
    refreshInterval?: number; // Update frequency in seconds
    warningsOnly?: boolean;   // For event stream
  };
}
```

## AI Recommendations

In **High** AI mode, kkc analyzes your cluster state and suggests relevant cards:

- **Pod Issues** - Suggested when >5 pods have issues
- **GPU Status** - Suggested when GPU utilization >90%
- **Event Stream** - Suggested when >10 warning events
- **Cluster Health** - Suggested when clusters are unhealthy

You can:
- **Accept** - Add the recommended card
- **Snooze** - Hide suggestion for 1 hour
- **Dismiss** - Don't suggest this card again
