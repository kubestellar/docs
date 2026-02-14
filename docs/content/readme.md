# KubeStellar

Multi-cluster configuration management for edge, multi-cloud, and hybrid cloud environments.

<div className="flex flex-wrap gap-2 my-4">
  <a href="https://artifacthub.io/packages/search?repo=kubestellar" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/endpoint?url=https://artifacthub.io/badge/repository/kubestellar" alt="Artifact Hub" />
  </a>
  <a href="https://github.com/kubestellar/kubestellar/releases" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/github/release/kubestellar/kubestellar/all.svg?style=flat-square" alt="GitHub release" />
  </a>
</div>

> **KubeStellar** is a CNCF sandbox project that simplifies the deployment and configuration of applications across multiple Kubernetes clusters, providing a seamless single-cluster experience with the tools you already know.

## Overview

KubeStellar enables you to manage multiple Kubernetes clusters as easily as managing one. Whether you're expanding from a single cluster or streamlining an existing multi-cluster setup, KubeStellar lets you define binding policies that automatically deploy and configure workloads across your fleet.

![KubeStellar High Level View](./images/kubestellar-high-level.png)

## Key Features

| Feature | Description |
|---------|-------------|
| **Declarative Multi-Cluster** | Define what to deploy and where using familiar Kubernetes objects and binding policies |
| **Single-Cluster Experience** | Use your existing tools (kubectl, Helm, ArgoCD) without modification |
| **Flexible Targeting** | Deploy to clusters based on labels, location, capabilities, or custom criteria |
| **Edge-Ready** | Support for disconnected environments and intermittent connectivity |
| **Status Aggregation** | Unified view of workload status across all clusters |
| **GitOps Compatible** | Native integration with ArgoCD and other GitOps tools |

## Why Multi-Cluster?

Organizations adopt multi-cluster architectures for:

- **Environment separation** - Development, staging, and production isolation
- **Team isolation** - Dedicated clusters for different groups or departments
- **Compliance** - Meeting security and data governance requirements
- **Resilience** - High availability across regions and clouds
- **Edge computing** - Running workloads close to users or data sources

## Quick Start

Get up and running with KubeStellar in minutes:

```bash
# Install KubeStellar CLI
brew install kubestellar/kubestellar/kubestellar

# Initialize your environment
kubestellar init
```

For a complete walkthrough, see the [Quick Start Guide](kubestellar/get-started.md).

## Documentation

- [Quick Start Guide](kubestellar/get-started.md): Get up and running quickly
- [Architecture](kubestellar/architecture.md): Deep-dive into technical architecture
- [User Guide](kubestellar/user-guide-intro.md): Detailed usage instructions
- [Release Notes](kubestellar/release-notes.md): What's new in each release

## Community and Support

- **Slack**: [`#kubestellar-dev`](https://cloud-native.slack.com/archives/C097094RZ3M) in the [CNCF Slack workspace](https://communityinviter.com/apps/cloud-native/cncf)
- **Mailing Lists**: [kubestellar-dev](https://groups.google.com/g/kubestellar-dev) and [kubestellar-users](https://groups.google.com/g/kubestellar-users)
- **YouTube**: [Community meetings and demos](https://www.youtube.com/@kubestellar)
- **Contributing**: [Contribution guide](contribution-guidelines/contributing-inc.md)

## License

KubeStellar is licensed under the Apache 2.0 License.

---

*KubeStellar is a [CNCF sandbox project](https://www.cncf.io/sandbox-projects/) focused on making multi-cluster Kubernetes as simple as single-cluster operations.*
