# kubectl-multi Overview

**kubectl-multi** is a comprehensive kubectl plugin for multi-cluster operations with KubeStellar. This plugin extends kubectl to work seamlessly across all KubeStellar managed clusters, providing unified views and operations while filtering out workflow staging clusters (WDS).

## What is kubectl-multi?

kubectl-multi is a kubectl plugin written in Go that automatically discovers KubeStellar managed clusters and executes kubectl commands across all of them simultaneously. It provides a unified tabular output with cluster context information, making it easy to monitor and manage resources across multiple clusters.

## Key Features

- **Multi-cluster resource viewing**: Get resources from all managed clusters with unified output
- **Cluster context identification**: Each resource shows which cluster it belongs to
- **All kubectl commands**: Supports all major kubectl commands across clusters
- **KubeStellar integration**: Automatically discovers managed clusters via KubeStellar APIs
- **WDS filtering**: Automatically excludes Workload Description Space clusters
- **Familiar syntax**: Uses the same command structure as kubectl

## Quick Example

```bash
# Get nodes from all managed clusters
kubectl multi get nodes

# Get pods from all clusters in all namespaces
kubectl multi get pods -A
```

## Documentation

- **[Installation Guide](../installation_guide.md)** - How to install and set up kubectl-multi
- **[Usage Guide](../usage_guide.md)** - Detailed usage examples and commands
- **[Architecture Guide](../architecture_guide.md)** - Technical architecture and how it works
- **[Development Guide](../development_guide.md)** - Contributing and development workflow
- **[API Reference](../api_reference.md)** - Code organization and technical implementation

## Tech Stack

- **Go 1.21+**: Primary language for the plugin
- **Cobra**: CLI framework for command structure and parsing
- **Kubernetes client-go**: Official Kubernetes Go client library
- **KubeStellar APIs**: For discovering and managing clusters

## Related Projects

- [KubeStellar](https://github.com/kubestellar/kubestellar) - Multi-cluster configuration management
- [kubectl](https://kubernetes.io/docs/reference/kubectl/) - Kubernetes command-line tool

## Support

For issues and questions:
- File an issue in this repository  
- Check the KubeStellar documentation
- Join the KubeStellar community discussions
