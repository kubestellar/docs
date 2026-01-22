---
title: "Stats Blocks"
linkTitle: "Stats Blocks"
weight: 8
description: >
  All 85 stats blocks across 13 dashboard types
---

# Stats Blocks

Stats blocks are the numbers you see at the top of each dashboard. They give you a quick summary without having to look at individual cards.

## What Are Stats Blocks?

Stats blocks show you important numbers at a glance:
- **Big number** - The main value
- **Label** - What it measures
- **Subtitle** - Extra context
- **Color** - Indicates status (green = good, red = bad, etc.)

---

## Customize Your Stats

Click "Configure stats" to:
- Show or hide individual stats
- Reorder them
- Change which stats appear on each dashboard

---

## All 85 Stats Blocks

### Main Dashboard Stats (6)

| # | ID | Name | Color | What it shows |
|---|---|------|-------|---------------|
| 80 | clusters | Clusters | blue | Total cluster count |
| 81 | healthy | Healthy | green | Healthy clusters |
| 82 | warnings | Warnings | yellow | Clusters with warnings |
| 83 | errors | Errors | red | Unhealthy clusters |
| 84 | namespaces | Namespaces | purple | Total namespaces |
| 85 | pods | Pods | cyan | Total pods |

---

### Clusters Dashboard Stats (10)

| # | ID | Name | Color | What it shows |
|---|---|------|-------|---------------|
| 1 | clusters | Clusters | purple | Total clusters |
| 2 | healthy | Healthy | green | Healthy clusters |
| 3 | unhealthy | Unhealthy | orange | Unhealthy clusters |
| 4 | unreachable | Offline | yellow | Offline clusters |
| 5 | nodes | Nodes | cyan | Total nodes |
| 6 | cpus | CPUs | blue | Total CPU cores |
| 7 | memory | Memory | green | Total memory |
| 8 | storage | Storage | purple | Total storage |
| 9 | gpus | GPUs | yellow | Total GPUs |
| 10 | pods | Pods | purple | Total pods |

---

### Workloads Dashboard Stats (7)

| # | ID | Name | Color | What it shows |
|---|---|------|-------|---------------|
| 11 | namespaces | Namespaces | purple | Total namespaces |
| 12 | critical | Critical | red | Critical issues |
| 13 | warning | Warning | yellow | Warnings |
| 14 | healthy | Healthy | green | Healthy workloads |
| 15 | deployments | Deployments | blue | Total deployments |
| 16 | pod_issues | Pod Issues | orange | Pods with problems |
| 17 | deployment_issues | Deploy Issues | red | Deployments with problems |

---

### Pods Dashboard Stats (6)

| # | ID | Name | Color | What it shows |
|---|---|------|-------|---------------|
| 18 | total_pods | Total Pods | purple | Total pod count |
| 19 | healthy | Healthy | green | Running pods |
| 20 | issues | Issues | red | Pods with issues |
| 21 | pending | Pending | yellow | Pending pods |
| 22 | restarts | High Restarts | orange | Pods with many restarts |
| 23 | clusters | Clusters | cyan | Clusters with pods |

---

### GitOps Dashboard Stats (8)

| # | ID | Name | Color | What it shows |
|---|---|------|-------|---------------|
| 24 | total | Total | purple | Total releases |
| 25 | helm | Helm | blue | Helm releases |
| 26 | kustomize | Kustomize | cyan | Kustomizations |
| 27 | operators | Operators | purple | OLM operators |
| 28 | deployed | Deployed | green | Successfully deployed |
| 29 | failed | Failed | red | Failed deployments |
| 30 | pending | Pending | blue | Pending deployments |
| 31 | other | Other | gray | Other types |

---

### Storage Dashboard Stats (5)

| # | ID | Name | Color | What it shows |
|---|---|------|-------|---------------|
| 32 | ephemeral | Ephemeral | purple | Ephemeral storage |
| 33 | pvcs | PVCs | blue | Total PVCs |
| 34 | bound | Bound | green | Bound PVCs |
| 35 | pending | Pending | yellow | Pending PVCs |
| 36 | storage_classes | Storage Classes | cyan | Storage class count |

---

### Network Dashboard Stats (6)

| # | ID | Name | Color | What it shows |
|---|---|------|-------|---------------|
| 37 | services | Services | blue | Total services |
| 38 | loadbalancers | LoadBalancers | green | LoadBalancer services |
| 39 | nodeport | NodePort | yellow | NodePort services |
| 40 | clusterip | ClusterIP | cyan | ClusterIP services |
| 41 | ingresses | Ingresses | purple | Total ingresses |
| 42 | endpoints | Endpoints | gray | Total endpoints |

---

### Security Dashboard Stats (7)

| # | ID | Name | Color | What it shows |
|---|---|------|-------|---------------|
| 43 | issues | Issues | red | Total security issues |
| 44 | critical | Critical | red | Critical severity |
| 45 | high | High | orange | High severity |
| 46 | medium | Medium | yellow | Medium severity |
| 47 | low | Low | blue | Low severity |
| 48 | privileged | Privileged | red | Privileged containers |
| 49 | root | Running as Root | orange | Containers running as root |

---

### Compliance Dashboard Stats (6)

| # | ID | Name | Color | What it shows |
|---|---|------|-------|---------------|
| 50 | score | Score | purple | Compliance percentage |
| 51 | total_checks | Total Checks | blue | Number of checks |
| 52 | passing | Passing | green | Passing checks |
| 53 | failing | Failing | red | Failing checks |
| 54 | warning | Warning | yellow | Warning checks |
| 55 | critical_findings | Critical | red | Critical findings |

---

### Compute Dashboard Stats (8)

| # | ID | Name | Color | What it shows |
|---|---|------|-------|---------------|
| 56 | nodes | Nodes | purple | Total nodes |
| 57 | cpus | CPUs | blue | CPU cores |
| 58 | memory | Memory | green | Total memory |
| 59 | gpus | GPUs | yellow | Total GPUs |
| 60 | tpus | TPUs | orange | Total TPUs |
| 61 | pods | Pods | cyan | Running pods |
| 62 | cpu_util | CPU Util | blue | CPU utilization % |
| 63 | memory_util | Memory Util | green | Memory utilization % |

---

### Events Dashboard Stats (5)

| # | ID | Name | Color | What it shows |
|---|---|------|-------|---------------|
| 64 | total | Total | purple | Total events |
| 65 | warnings | Warnings | yellow | Warning events |
| 66 | normal | Normal | blue | Normal events |
| 67 | recent | Recent (1h) | cyan | Events in last hour |
| 68 | errors | Errors | red | Error events |

---

### Cost Dashboard Stats (6)

| # | ID | Name | Color | What it shows |
|---|---|------|-------|---------------|
| 69 | total_cost | Total Cost | green | Estimated monthly cost |
| 70 | cpu_cost | CPU Cost | blue | Cost for CPU |
| 71 | memory_cost | Memory Cost | purple | Cost for memory |
| 72 | storage_cost | Storage Cost | cyan | Cost for storage |
| 73 | network_cost | Network Cost | yellow | Cost for network |
| 74 | gpu_cost | GPU Cost | orange | Cost for GPUs |

---

### Alerts Dashboard Stats (5)

| # | ID | Name | Color | What it shows |
|---|---|------|-------|---------------|
| 75 | firing | Firing | red | Active alerts |
| 76 | pending | Pending | yellow | Pending alerts |
| 77 | resolved | Resolved | green | Resolved alerts |
| 78 | rules_enabled | Rules Enabled | blue | Enabled alert rules |
| 79 | rules_disabled | Rules Disabled | gray | Disabled alert rules |

---

## Stats by Color

### Green (Good things)
- Healthy clusters, pods, workloads
- Bound PVCs
- Passing compliance checks
- Resolved alerts

### Yellow (Warnings)
- Warnings in clusters
- Pending items
- Medium severity issues

### Red (Problems)
- Errors and failures
- Critical issues
- Firing alerts
- Security problems

### Blue/Cyan/Purple (Informational)
- Counts and totals
- Resource amounts
- Neutral information

---

## Tips

### Which Stats Matter Most?

For day-to-day work, focus on:
1. **Healthy vs Unhealthy** - Quick health check
2. **Critical/Errors** - Things needing immediate attention
3. **Resource utilization** - Are you running out of capacity?

### Custom Stat Configurations

You can configure stats per dashboard:
1. Click "Configure stats"
2. Drag to reorder
3. Toggle visibility
4. Save your changes

Your configuration is saved to your account, so it's the same on any device.
