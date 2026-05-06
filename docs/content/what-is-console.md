---
title: "What is KubeStellar Console?"
linkTitle: "What is Console"
description: >
  KubeStellar Console is a standalone project for multi-cluster Kubernetes observability and AI-driven Mission Control. It is not related to the original kubestellar/kubestellar repository.
---

# What is KubeStellar Console?

KubeStellar Console is a **standalone project** focused on multi-cluster Kubernetes observability, AI-driven Mission Control, and direct kubeconfig-based workflows. Its source lives at [github.com/kubestellar/console](https://github.com/kubestellar/console) and a live demo runs at [console.kubestellar.io](https://console.kubestellar.io).

## It is a separate project

KubeStellar Console is **not** related to the original [`kubestellar/kubestellar`](https://github.com/kubestellar/kubestellar) repository. It does **not** install, depend on, or interoperate with any of the following:

- KubeFlex
- Workload Execution Clusters (WECs)
- Inventory and Transport Spaces (ITSs)
- Workload Description Spaces (WDSs)
- BindingPolicy / CombinedStatus
- The original "Post Office" control model

If you arrived here looking for those components, you are on a different project. See [Legacy Components](/docs/legacy-components) for pointers to the original `kubestellar/kubestellar` work.

## What the Console does

- **Multi-cluster dashboards** — 20+ dashboards and 120+ cards showing health, workloads, compute, storage, network, security, GitOps, alerts, and cost across every cluster you have access to.
- **AI Mission Control** — Chat-driven troubleshooting, diagnose-and-repair flows, and AI-generated cards and dashboards.
- **Drill-downs** — Click any card to open targeted views for pods, nodes, events, logs, and more.
- **kc-agent kubeconfig bridge** — A local agent proxies the browser to your kubeconfig, so the Console only ever sees what you already have access to. There is no new control plane to install.

## Get started

- **Live demo**: [console.kubestellar.io](https://console.kubestellar.io) (starts in demo mode with sample data)
- **Repository**: [github.com/kubestellar/console](https://github.com/kubestellar/console)
- **Install**: [Installation guide](/docs/console/installation)
- **Quick Start**: [Console Quick Start](/docs/console/quickstart)
