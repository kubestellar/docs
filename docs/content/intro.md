# KubeStellar Project Documentation 

> **Looking for KubeFlex, BindingPolicy, WECs, ITSs, or the "Post Office" model?** Those are part of a separate project ([`kubestellar/kubestellar`](https://github.com/kubestellar/kubestellar)) and are **not** included in the KubeStellar Console. See [What is KubeStellar Console?](/docs/what-is-console) for details, or [Legacy Components](/docs/legacy-components) for pointers to the original project.

Multi-cluster configuration management for edge, multi-cloud, and hybrid cloud environments.

Enabled via  ***[KubeStellar Console](/docs/console/readme)***, a modern, AI-powered multi-cluster management interface that provides real-time monitoring, intelligent insights, and a customizable dashboard experience for managing Kubernetes clusters at scale.

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

Most users will wish to explore the demo and documentation for KubeStellar Console and the KubeStellar-MCP plugin for multicluster management and workload deployment. KubeStellar Console is a standalone project — it is not related to and does not include any components from the original `kubestellar/kubestellar` repository (KubeFlex, WECs, ITSs, BindingPolicy, etc.).

- [What is KubeStellar Console?](/docs/what-is-console): Short overview of what the Console is — and what it isn't
- [KubeStellar Console Documentation](/docs/console/readme): Architecture, Features, Installation and Configuration
- [KubeStellar-MCP Documentation](/docs/kubestellar-mcp/overview/intro): More details about the Claude Code-enabled plugin for app-centric deployment management
- [KubeStellar Console Demo](https://console.kubestellar.io): Live online demo of the KubeStellar Console UI/UX

### Core KubeStellar Components

In-depth documentation for the foundational components that power KubeStellar's multi-cluster capabilities.

- [KubeStellar](/docs/readme): The multi-cluster configuration management engine at the heart of the project
- [KubeFlex](/docs/kubeflex/readme): A flexible and scalable platform for running Kubernetes control plane APIs with multi-tenancy support
- [KubeStellar A2A](/docs/a2a/intro): Agent-to-agent orchestration for agentic multi-cluster management
- [kubectl-multi](/docs/multi-plugin/overview/introduction): A kubectl plugin for multi-cluster operations with KubeStellar

### Community and Support Information

- [Contributing](/docs/contributing/index): Guidelines and documentation for contributing to the KubeStellar project and its documentation
- [Community](/docs/community/index): Resources for joining and engaging with the KubeStellar open-source community and maintainers
- [News](/docs/news/index): Announcements and KubeStellar in the news



## License

KubeStellar is licensed under the Apache 2.0 License.

---

*KubeStellar is a [CNCF sandbox project](https://www.cncf.io/sandbox-projects/) focused on making multi-cluster Kubernetes as simple as single-cluster operations.*
