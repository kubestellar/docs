# Legacy Components

The KubeStellar project includes several legacy components that form the foundation of the original multi-cluster configuration management system. These components are still maintained for existing deployments but are being superseded by the [KubeStellar Console](/docs/console/overview/introduction) and [KubeStellar MCP](/docs/kubestellar-mcp/overview/introduction) for new installations.

## Components

| Component | Description |
|-----------|-------------|
| [**KubeStellar**](/docs/what-is-kubestellar/overview) | The core multi-cluster configuration management engine using OCM transport |
| [**A2A**](/docs/a2a/overview/introduction) | Agent-to-Agent protocol support for KubeStellar |
| [**KubeFlex**](/docs/kubeflex/overview/introduction) | Lightweight Kube API Server instances and control planes as a service |
| [**Multi-Plugin**](/docs/multi-plugin/overview/introduction) | kubectl plugin for managing multiple KubeStellar control planes |

## When to Use Legacy vs. New Components

- **New deployments**: Use [KubeStellar Console](https://console.kubestellar.io) with the [KubeStellar MCP](/docs/kubestellar-mcp/overview/introduction) plugin for AI-powered multi-cluster management.
- **Existing deployments**: Legacy components continue to work and are maintained. Migration guides will be provided as the new architecture stabilizes.
