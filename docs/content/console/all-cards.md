---
title: "All Cards"
linkTitle: "Cards"
weight: 7
description: >
  Complete list of all 110+ card types
---

# Dashboard Cards

Cards are the building blocks of your dashboards. Each card shows specific information that you can resize, move, and configure.

## Card Features

Every card has:
- **Drag handle** - Move it around
- **Menu button** - Configure, replace, or remove
- **AI button** - Ask AI about this card
- **Expand button** - Make it full screen
- **Refresh indicator** - See when data was last updated

---

## All 110+ Card Types

The console ships with 110+ built-in cards, and you can create more using the Card Factory. Below are the main categories.

### Cluster Health Cards (7)

| # | Card | What it shows |
|---|------|---------------|
| 1 | **Cluster Health** | Health status of all clusters with green/red/gray indicators |
| 2 | **Cluster Metrics** | Time-series graphs of CPU, memory, pods, nodes |
| 3 | **Cluster Focus** | Detailed view of one specific cluster |
| 4 | **Cluster Comparison** | Side-by-side comparison of multiple clusters |
| 5 | **Cluster Costs** | Cost breakdown per cluster |
| 6 | **Upgrade Status** | Version info and available upgrades |
| 7 | **Cluster Resource Tree** | Hierarchical view of cluster resources |

---

### Workload Cards (6)

| # | Card | What it shows |
|---|------|---------------|
| 8 | **Deployment Status** | Donut chart of deployment health |
| 9 | **Deployment Issues** | Table of deployments with problems |
| 10 | **Deployment Progress** | Rollout progress gauge |
| 11 | **Pod Issues** | Table of pods with problems (crashes, OOM, etc.) |
| 12 | **Top Pods** | Bar chart of top resource-consuming pods |
| 13 | **App Status** | Overall application health status |

---

### Compute Cards (8)

| # | Card | What it shows |
|---|------|---------------|
| 14 | **Compute Overview** | Summary of CPU, memory, nodes, pods, GPUs |
| 15 | **Resource Usage** | Gauge showing CPU/memory/GPU utilization |
| 16 | **Resource Capacity** | Bar chart of used vs available resources |
| 17 | **GPU Overview** | Summary of GPU resources and utilization |
| 18 | **GPU Status** | Donut chart of GPU allocation |
| 19 | **GPU Inventory** | Table of GPU nodes with types and counts |
| 20 | **GPU Workloads** | Table of workloads using GPUs |
| 21 | **GPU Usage Trend** | Time-series graph of GPU utilization |

---

### Storage Cards (2)

| # | Card | What it shows |
|---|------|---------------|
| 22 | **Storage Overview** | Summary of storage resources |
| 23 | **PVC Status** | Table of Persistent Volume Claims |

---

### Network Cards (3)

| # | Card | What it shows |
|---|------|---------------|
| 24 | **Network Overview** | Summary of network resources |
| 25 | **Service Status** | Table of services |
| 26 | **Cluster Network** | Network status per cluster |

---

### GitOps Cards (7)

| # | Card | What it shows |
|---|------|---------------|
| 27 | **Helm Release Status** | Status of Helm releases |
| 28 | **Helm History** | Event timeline of Helm deployments |
| 29 | **Helm Values Diff** | Compare Helm values between releases |
| 30 | **Chart Versions** | Available chart version updates |
| 31 | **Kustomization Status** | Status of Kustomize overlays |
| 32 | **Overlay Comparison** | Compare Kustomize overlays |
| 33 | **GitOps Drift** | Detect when clusters don't match git |

---

### ArgoCD Cards (3)

| # | Card | What it shows |
|---|------|---------------|
| 34 | **ArgoCD Applications** | Status of ArgoCD apps |
| 35 | **ArgoCD Sync Status** | Donut chart of sync status |
| 36 | **ArgoCD Health** | Health status of ArgoCD |

---

### Operator Cards (3)

| # | Card | What it shows |
|---|------|---------------|
| 37 | **Operator Status** | Status of OLM operators |
| 38 | **Operator Subscriptions** | Table of operator subscriptions |
| 39 | **CRD Health** | Health of Custom Resource Definitions |

---

### Namespace Cards (4)

| # | Card | What it shows |
|---|------|---------------|
| 40 | **Namespace Overview** | Summary of namespace resources |
| 41 | **Namespace Quotas** | Gauge of quota usage |
| 42 | **Namespace RBAC** | Table of RBAC rules |
| 43 | **Namespace Events** | Event stream for namespace |

---

### Security & Events Cards (3)

| # | Card | What it shows |
|---|------|---------------|
| 44 | **Security Issues** | Table of security problems |
| 45 | **Event Stream** | Live event feed |
| 46 | **User Management** | Table of console users |

---

### Live Trend Cards (4)

| # | Card | What it shows |
|---|------|---------------|
| 47 | **Events Timeline** | Time-series of events |
| 48 | **Pod Health Trend** | Time-series of pod health |
| 49 | **Resource Trend** | Time-series of resource usage |
| 50 | **GPU Utilization** | Time-series of GPU usage |

---

### AI Cards (3)

| # | Card | What it shows |
|---|------|---------------|
| 51 | **AI Issues** | Issues detected by AI |
| 52 | **Kubeconfig Audit** | Audit of your kubeconfig |
| 53 | **AI Health Check** | AI health check gauge |

---

### Alerting Cards (2)

| # | Card | What it shows |
|---|------|---------------|
| 54 | **Active Alerts** | Currently firing alerts |
| 55 | **Alert Rules** | Table of alert rules |

---

### Cost Cards (3)

| # | Card | What it shows |
|---|------|---------------|
| 56 | **Cluster Costs** | Cost per cluster |
| 57 | **OpenCost Overview** | OpenCost integration data |
| 58 | **Kubecost Overview** | Kubecost integration data |

---

### Policy Cards (2)

| # | Card | What it shows |
|---|------|---------------|
| 59 | **OPA Policies** | OPA Gatekeeper policies |
| 60 | **Kyverno Policies** | Kyverno policy status |

---

### Compliance Cards (3)

| # | Card | What it shows |
|---|------|---------------|
| 61 | **Compliance Score** | Overall compliance percentage (CIS, NSA, PCI) |
| 62 | **Compliance Findings** | Table of compliance findings by severity |
| 63 | **Security Posture** | Combined security posture overview |

---

### Provider Health Cards (1)

| # | Card | What it shows |
|---|------|---------------|
| 64 | **Provider Health** | Status of AI providers (Claude, OpenAI, Gemini) and cloud providers |

---

### Workload Monitor Cards (2)

| # | Card | What it shows |
|---|------|---------------|
| 65 | **Workload Status** | Cascading cluster/namespace/workload selector with resource details |
| 66 | **Resource Allocation** | Resource allocation across clusters |

---

### Additional Cards (44+)

The console includes 44+ additional specialized cards across categories like:

- **Deploy** - Deployment management and progress tracking
- **Events** - Event timeline and filtering
- **Data Compliance** - Data classification and compliance checks
- **Arcade** - Interactive visualizations
- **Card History** - Track card changes over time
- **User Management** - Console user management

Plus any custom cards you create using the **Card Factory**.

---

## Visualization Types

Cards use different ways to show data:

| Type | Icon | What it looks like |
|------|------|-------------------|
| **Gauge** | ⏱️ | Circular progress indicator |
| **Table** | 📋 | Rows and columns of data |
| **Timeseries** | 📈 | Line chart over time |
| **Events** | 📜 | Scrolling event feed |
| **Donut** | 🍩 | Pie/donut chart |
| **Bar** | 📊 | Bar chart |
| **Status** | 🚦 | Status indicators (green/yellow/red) |

---

## Adding Cards

1. Click the **Add Card** button
2. Browse by category or search
3. Click a card to add it
4. Drag it where you want
5. Click the menu to configure it

### Creating Custom Cards (Card Factory)

Don't see the card you need? Create your own:

1. Open the **Card Factory**
2. Choose your method:
   - **AI-Assisted** - Describe what you want in plain English
   - **JSON** - Write a declarative card definition
   - **TSX Code** - Write a React component (compiled at runtime)
3. Preview your card
4. Add it to any dashboard

---

## Configuring Cards

Click the menu (three dots) on any card:

- **Configure** - Change settings like filters, refresh interval
- **Replace** - Swap for a different card type
- **Remove** - Take it off your dashboard

### Common Configuration Options

- **Clusters** - Show data from specific clusters only
- **Namespaces** - Filter to specific namespaces
- **Refresh interval** - How often to update
- **Show count** - How many items to display

---

## AI Card Suggestions

In High AI mode, the console watches what you look at and suggests new cards:

1. AI notices you're focusing on pods
2. It suggests adding the Pod Issues card
3. You can Accept, Snooze (1 hour), or Dismiss

This helps your dashboard evolve with your needs!
