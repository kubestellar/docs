# Legacy Components

The KubeStellar project includes several legacy components that form the foundation of the original multi-cluster configuration management system. These components are still maintained for existing deployments but are being superseded by the [KubeStellar Console](/docs/console/readme) and [KubeStellar MCP](/docs/kubestellar-mcp/overview/intro) for new installations.

## Components

| Component | Description |
|-----------|-------------|
| [**KubeStellar**](/docs/readme) | The core multi-cluster configuration management engine using OCM transport |
| [**A2A**](/docs/a2a/intro) | Agent-to-Agent protocol support for KubeStellar |
| [**KubeFlex**](/docs/kubeflex/readme) | Lightweight Kube API Server instances and control planes as a service |
| [**Multi-Plugin**](/docs/multi-plugin/overview/introduction) | kubectl plugin for managing multiple KubeStellar control planes |

## When to Use Legacy vs. New Components

- **New deployments**: Use [KubeStellar Console](https://console.kubestellar.io) with the [KubeStellar MCP](/docs/kubestellar-mcp/overview/intro) plugin for AI-powered multi-cluster management.
- **Existing deployments**: Legacy components continue to work and are maintained. Migration guides will be provided as the new architecture stabilizes.
