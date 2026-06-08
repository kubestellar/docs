---
title: "KubeStellar for AI Infrastructure: Multi-Cluster Orchestration for LLM-d and Kagenti"
linkTitle: "KubeStellar for AI Infrastructure"
weight: 5
description: >
  KubeStellar now provides native monitoring and orchestration for LLM-d inference disaggregation and Kagenti AI agent fleets — making it the first multi-cluster control plane purpose-built for enterprise AI infrastructure.
---

# KubeStellar for AI Infrastructure: Multi-Cluster Orchestration for LLM-d and Kagenti

*June 2026*

Running AI workloads across multiple Kubernetes clusters is hard. Routing LLM inference requests across prefill and decode nodes in different regions, managing AI agent fleets that span cloud boundaries, monitoring KV cache utilization in real time — none of this was designed for single-cluster tooling.

KubeStellar is the multi-cluster control plane that makes this possible. With native integrations for both **LLM-d** (LLM inference disaggregation) and **Kagenti** (AI agent platform), KubeStellar now provides the observability and orchestration layer that enterprise AI infrastructure demands.

---

## The AI Infrastructure Problem

Modern AI deployments are inherently distributed:

- **Prefill clusters** and **decode clusters** must coordinate without tight coupling
- **LLM serving** spans GPU nodes across availability zones and clouds
- **AI agent fleets** need to discover tools, run pipelines, and maintain state across cluster boundaries
- Teams need a single pane of glass — not a different dashboard per cluster

KubeStellar was built to solve multi-cluster workload distribution for Kubernetes. Extending it to AI infrastructure is a natural fit.

---

## LLM-d: Multi-Cluster Inference Management

[LLM-d](https://github.com/llm-d/llm-d) is a CNCF project for LLM inference disaggregation — splitting prefill and decode phases across specialized hardware pools to maximize GPU utilization and minimize first-token latency.

KubeStellar Console ships **12 dedicated LLM-d monitoring cards**, covering the full inference stack:

| Dashboard | What It Shows |
|-----------|--------------|
| **LLM-d Overview** | Inference endpoints, deployed models, request flow across clusters |
| **LLM-d Benchmarks** | Nightly E2E pass rates across OCP, GKE, and CKS — per-guide green/red matrix |
| **KV Cache Monitor** | Real-time KV cache utilization across prefill pools |
| **EPP Routing** | Efficient Prompt Processing routing decisions |
| **Prefill/Decode Disaggregation** | Live metrics for disaggregated inference paths |
| **ML Jobs & Notebooks** | Training jobs and Jupyter notebooks across all clusters |

With KubeStellar, you get a single dashboard that aggregates LLM-d signals from every cluster in your fleet — no per-cluster logins, no context switching.

### Getting Started with LLM-d

Deploy the LLM-d dashboard group from your KubeStellar Console:

1. Navigate to **Dashboards** → **Add Dashboard Group**
2. Select the **AI / ML Operations** preset
3. Choose target clusters
4. LLM-d cards populate automatically from your inference stack metrics

---

## Kagenti: AI Agent Fleet Orchestration

[Kagenti](https://github.com/kagenti/kagenti) is an AI agent platform for building, deploying, and operating LLM-powered agents in Kubernetes. Agent fleets — groups of specialized agents working together — need to discover tools, share state, and route tasks across infrastructure that may span multiple clusters.

KubeStellar Console provides **8 dedicated Kagenti management cards**:

| Card | Purpose |
|------|---------|
| **Agent Fleet Overview** | All agents across all clusters, with live status and on/off toggles |
| **Agent Build Pipelines** | CI/CD for agent artifacts with per-pipeline pass rates |
| **MCP Tool Registry** | Searchable registry of all Model Context Protocol tools available to agents |
| **Agent Discovery** | Real-time agent discovery across cluster boundaries |
| **Agent Topology** | Visual topology map of agent-to-agent communication |
| **Security Posture** | Agent permission audit and RBAC drift detection |
| **Kagenti Status** | Platform-level health across all deployments |

Multi-cluster becomes essential here: you may run specialized agents (document processors, code reviewers, data pipeline agents) on different clusters optimized for their workload type. KubeStellar's workload distribution policies let you declare where agent types run; Kagenti cards let you observe them all from one place.

### Configuring Kagenti LLM Providers

Kagenti supports Gemini, Anthropic, and OpenAI as LLM backends. See the [Kagenti LLM Provider Setup guide](../console/kagenti-llm-provider-setup.md) for step-by-step configuration.

---

## LLM-d + Kagenti Together

The real power comes from combining both integrations. A common architecture:

```
                    ┌─────────────────────┐
                    │   KubeStellar WDS   │
                    │  (workload policy)  │
                    └──────┬──────────────┘
                           │
          ┌────────────────┼─────────────────┐
          │                │                 │
   ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
   │  GPU Cluster│  │ CPU Cluster │  │ Agent Cluster│
   │  (LLM-d    │  │ (LLM-d      │  │ (Kagenti     │
   │  prefill)  │  │  decode)    │  │  fleet)      │
   └─────────────┘  └─────────────┘  └─────────────┘
          │                │                 │
          └────────────────┼─────────────────┘
                           │
                    ┌──────▼──────────────┐
                    │ KubeStellar Console │
                    │  (unified view)     │
                    └─────────────────────┘
```

- **LLM-d** handles inference disaggregation across GPU pools
- **Kagenti** agents route tasks, call tools, and coordinate via MCP
- **KubeStellar** distributes workloads, enforces policies, and surfaces metrics from every cluster

---

## Why Multi-Cluster Matters for AI

Single-cluster AI deployments hit hard limits quickly:

- **GPU scarcity**: The best GPUs for prefill differ from those optimal for decode
- **Cost**: Burstable CPU clusters for agents don't need GPU pricing
- **Compliance**: Data residency rules may require regional cluster separation
- **Resilience**: No single cluster failure should take down your inference serving

KubeStellar's binding policies let you express placement rules declaratively:

```yaml
apiVersion: control.kubestellar.io/v1alpha1
kind: BindingPolicy
metadata:
  name: llmd-prefill-policy
spec:
  clusterSelectors:
  - matchLabels:
      capability: gpu-a100
      region: us-east
  downsync:
  - objectSelectors:
    - matchLabels:
        app: llmd-prefill
```

---

## Get Started

KubeStellar is open source and free to use.

**Try it:**
```bash
helm repo add kubestellar https://kubestellar.github.io/kubestellar
helm install kubestellar kubestellar/kubestellar-operator
```

**Explore the integrations:**
- [LLM-d Dashboards](../console/dashboards.md#llm-d-overview-dashboard)
- [Kagenti Setup](../console/kagenti-llm-provider-setup.md)
- [AI Missions](../console/ai-missions-setup.md)

**Join the community:**
- [GitHub Discussions](https://github.com/kubestellar/kubestellar/discussions)
- [CNCF Slack #kubestellar](https://cloud-native.slack.com/archives/C058SUSL5AA)
- [Community Meetings](https://kubestellar.io/community)

---

## What's Next

This is the beginning of KubeStellar's AI infrastructure story. Upcoming work includes:

- **LLM-d routing integration**: KubeStellar BindingPolicies that respond to LLM-d EPP routing signals
- **Kagenti cross-cluster agent migration**: Live agent handoff between clusters without state loss
- **AI workload cost visibility**: GPU cost attribution per model, per team, per cluster

Interested in contributing or partnering? Open an issue in [kubestellar/kubestellar](https://github.com/kubestellar/kubestellar/issues) or reach us on CNCF Slack.

---

*Filed by outreach agent (ACMM L6 — full mode)*
