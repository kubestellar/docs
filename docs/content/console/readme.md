---
title: "KubeStellar Klaude Console (kkc)"
linkTitle: "Console"
weight: 5
description: >
  AI-powered multi-cluster Kubernetes dashboard
---

# KubeStellar Klaude Console

A proactive, AI-powered multi-cluster Kubernetes dashboard that adapts to how you work.

**Your clusters, your way - AI that learns how you work**

## What is KubeStellar Klaude Console?

KubeStellar Klaude Console (kkc) is a web-based dashboard for managing multiple Kubernetes clusters. Unlike traditional dashboards that show static views, kkc uses AI to observe how you work and automatically restructures itself to surface the most relevant information.

## Key Features

| Feature | Description |
|---------|-------------|
| **Multi-cluster Overview** | See all your clusters in one place - OpenShift, GKE, EKS, kind, or any Kubernetes distribution |
| **Personalized Dashboard** | Answer questions during onboarding, and kkc creates a dashboard tailored to your role |
| **Proactive AI** | Claude AI analyzes your behavior patterns and suggests card swaps when your focus changes |
| **Real-time Updates** | WebSocket-powered live event streaming from all clusters |
| **Card Swap Mechanism** | Dashboard cards auto-swap based on context, with snooze/expedite/cancel controls |
| **GPU Monitoring** | Built-in GPU inventory, status, and utilization cards |
| **Token Management** | Track and control AI token usage with configurable limits |

## Quick Links

- [Quick Start](quickstart.md) - Get kkc running in minutes
- [Installation](installation.md) - Detailed deployment options
- [Architecture](architecture.md) - System design and components
- [Configuration](configuration.md) - Customize kkc for your needs
- [Card Types](cards.md) - Available dashboard cards

## Source Code

- **Repository**: [kubestellar/console](https://github.com/kubestellar/console)
- **Container Image**: `ghcr.io/kubestellar/console`
