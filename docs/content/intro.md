# KubeStellar Project Documentation 

Multi-cluster configuration management for edge, multi-cloud, and hybrid cloud environments.

Enabled via  ***[KubeStellar Console](/docs/console/overview/introduction)***, a modern, AI-powered multi-cluster management interface that provides real-time monitoring, intelligent insights, and a customizable dashboard experience for managing Kubernetes clusters at scale.

<div className="flex flex-wrap gap-2 my-4">
  <a href="https://artifacthub.io/packages/search?repo=kubestellar" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/endpoint?url=https://artifacthub.io/badge/repository/kubestellar" alt="Artifact Hub" />
  </a>
  <a href="https://github.com/kubestellar/kubestellar/releases" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/github/release/kubestellar/kubestellar/all.svg?style=flat-square" alt="GitHub release" />
  </a>
</div>

> **KubeStellar** is a CNCF sandbox project that simplifies the deployment and configuration of applications across multiple Kubernetes clusters, providing a seamless single-cluster experience with the tools you already know.

## Documentation Overview

### KubeStellar Console

Most users will wish to explore the demo and documentation for KubeStellar Console and the KubeStellar-MCP plugin for multicluster management and workload deployment. KubeStellar Console is a new, nimbler, from-the-ground-up AI-enabled control layer that does not use the legacy components.

- [KubeStellar Console Documentation](/docs/console/overview/introduction): Architecture, Features, Installation and Configuration
- [KubeStellar-MCP Documentation](/docs/kubestellar-mcp/overview/introduction): More details about the Claude Code-enabled plugin for app-centric deployment management
- [KubeStellar Console Demo](https://console.kubestellar.io): Live online demo of the KubeStellar Console UI/UX

!!! info "Coming from the legacy BindingPolicy / WEC / ITS model?"
    KubeStellar has evolved. The original multi-cluster binding model (WECs,
    ITSs, `BindingPolicy`, KubeFlex) has been superseded by the Console,
    which works directly against your kubeconfig. See
    [Architecture Evolution](/docs/architecture-evolution) for a side-by-side
    comparison and a short migration note.

### Core KubeStellar Components

In-depth documentation for the foundational components that power KubeStellar's multi-cluster capabilities.

- [KubeStellar](/docs/kubestellar/overview): The multi-cluster configuration management engine at the heart of the project
- [KubeFlex](/docs/kubeflex/overview/introduction): A flexible and scalable platform for running Kubernetes control plane APIs with multi-tenancy support
- [KubeStellar A2A](/docs/a2a/overview/introduction): Agent-to-agent orchestration for agentic multi-cluster management
- [kubectl-multi](/docs/multi-plugin/overview/introduction): A kubectl plugin for multi-cluster operations with KubeStellar

### Community and Support Information

- [Contributing](/docs/contributing): Guidelines and documentation for contributing to the KubeStellar project and its documentation
- [Community](/docs/community): Resources for joining and engaging with the KubeStellar open-source community and maintainers
- [News](/docs/news): Announcements and KubeStellar in the news



## License

KubeStellar is licensed under the Apache 2.0 License.

---

*KubeStellar is a [CNCF sandbox project](https://www.cncf.io/sandbox-projects/) focused on making multi-cluster Kubernetes as simple as single-cluster operations.*
