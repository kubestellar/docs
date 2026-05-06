---
title: "KubeStellar Console Marketplace & Knowledge Base — 400+ AI Missions for Multi-Cluster Kubernetes"
linkTitle: "Marketplace & KB Launch"
weight: 3
description: >
  Announcing the KubeStellar Console Marketplace and Knowledge Base — a community-driven ecosystem of dashboards, monitoring cards, themes, and 400+ AI Mission prompts for installing, configuring, and repairing CNCF open source projects across multi-cluster Kubernetes environments.
keywords:
  - kubernetes marketplace launch
  - AI kubernetes missions
  - CNCF project automation
  - multi-cluster kubernetes tools
  - kubernetes knowledge base
  - kubernetes operations automation
---

# KubeStellar Console Marketplace & Knowledge Base

**March 2026**

We're launching two new programs that expand KubeStellar Console from a multi-cluster Kubernetes dashboard into a complete operations platform: the **Marketplace** and the **Knowledge Base**.

## The Marketplace: Community-Built Extensions for Multi-Cluster Kubernetes

The [KubeStellar Console Marketplace](../console/marketplace.md) is where teams discover, install, and share dashboards, monitoring cards, and themes for multi-cluster Kubernetes operations.

**What you can install:**

- **Dashboards** — Pre-built monitoring layouts for CNCF projects, security compliance, GPU fleet management, and more
- **Card Presets** — Individual monitoring cards for specific projects (Prometheus, Istio, Cilium, Argo CD, and many more)
- **Themes** — Visual themes that change the console's appearance

Every Marketplace item is designed for multi-cluster operations from day one. Install once, monitor across all your clusters.

**Contributing is open.** Fork the [console-marketplace](https://github.com/kubestellar/console-marketplace) repo, add your item, and submit a PR. Automated quality gates (schema validation, registry integrity, nightly QA) keep the Marketplace reliable.

## The Knowledge Base: 400+ AI Mission Prompts

The [Knowledge Base](../console/knowledge-base.md) is the library behind KubeStellar Console's AI Missions system. It contains **400+ ready-to-use mission prompts** across two categories:

### Installation Missions

Step-by-step AI-guided installation of CNCF and open source projects across your multi-cluster fleet. Each mission includes prerequisites, installation steps, configuration options, verification, uninstall, and upgrade paths.

**Covered CNCF categories:**
- Observability: Prometheus, Grafana, Jaeger, OpenTelemetry, Fluentd, Thanos, Loki
- Networking: Istio, Envoy, Cilium, Calico, Linkerd, CoreDNS, NATS
- Security: OPA/Gatekeeper, Falco, cert-manager, Kyverno, Trivy, Vault
- Storage: Longhorn, OpenEBS, Rook/Ceph, MinIO, Velero
- GitOps: Argo CD, Flux CD, Helm, Kustomize, Crossplane
- Runtime: containerd, Knative, KEDA, KubeVirt, Volcano
- Infrastructure: Cluster API, Metal3, Tinkerbell, wasmCloud

### Solution Missions

Troubleshooting and repair prompts that start from a symptom and guide the AI through diagnosis and repair — across all affected clusters simultaneously.

**What makes this different from ChatGPT or Stack Overflow:**

1. **Multi-cluster aware** — Missions target specific clusters by name or label, run in parallel, and verify results fleet-wide
2. **Context-rich** — The AI sees your actual cluster state (namespaces, resources, versions) and adapts the steps
3. **Approval gates** — Every action requires your approval before execution
4. **Resolution memory** — Solutions are saved to a personal or shared Knowledge Base for instant reuse
5. **Token efficient** — Structured mission prompts use fewer tokens than free-form chat

## What This Means for Multi-Cluster Kubernetes Operations

Traditional Kubernetes operations involve:

- Googling error messages and reading Stack Overflow
- Manually applying fixes one cluster at a time
- Building monitoring dashboards from scratch for each project
- Maintaining internal runbooks that go stale

KubeStellar Console's Marketplace and Knowledge Base replace all of this:

- **Marketplace** eliminates dashboard building — install community-tested monitoring in one click
- **Knowledge Base** eliminates manual troubleshooting — AI Missions guide you through diagnosis and repair
- **Resolution memory** eliminates stale runbooks — every successful fix is saved and reusable
- **Multi-cluster execution** eliminates per-cluster work — run missions across your entire fleet

**The result:** Multi-cluster Kubernetes operations that save you time and tokens at every step.

## Get Started

- [Browse the Marketplace](../console/marketplace.md)
- [Explore the Knowledge Base](../console/knowledge-base.md)
- [Try KubeStellar Console](https://console.kubestellar.io) — starts in demo mode, no installation needed
- [Install locally](../console/quickstart.md) — running in minutes

## Links

- [KubeStellar Console Repository](https://github.com/kubestellar/console)
- [Marketplace Repository](https://github.com/kubestellar/console-marketplace)
- [KubeStellar Project](https://kubestellar.io)
