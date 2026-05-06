# Legacy Components

The KubeStellar project includes several legacy components that form the foundation of the original multi-cluster configuration management system. These components are still maintained for existing deployments but are being superseded by the [KubeStellar Console](console/readme.md) and [KubeStellar MCP](kubestellar-mcp/overview/intro.md) for new installations.

## Components

| Component | Description |
|-----------|-------------|
| [**KubeStellar**](kubestellar/user-guide-intro.md) | The core multi-cluster configuration management engine using OCM transport |
| [**A2A**](a2a/intro.md) | Agent-to-Agent protocol support for KubeStellar |
| [**KubeFlex**](kubeflex/readme.md) | Lightweight Kube API Server instances and control planes as a service |
| [**Multi-Plugin**](multi-plugin/overview/introduction.md) | kubectl plugin for managing multiple KubeStellar control planes |

## When to Use Legacy vs. New Components

- **New deployments**: Use [KubeStellar Console](https://console.kubestellar.io) with the [KubeStellar MCP](kubestellar-mcp/overview/intro.md) plugin for AI-powered multi-cluster management.
- **Existing deployments**: Legacy components continue to work and are maintained. Migration guides will be provided as the new architecture stabilizes.
