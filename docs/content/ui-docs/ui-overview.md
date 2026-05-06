# KubeStellar UI

!!! warning "Deprecated"
    The `kubestellar/ui` repository has been replaced by **[kubestellar/console](https://github.com/kubestellar/console)**. All development, features, and documentation now live in the console project.

## Migration

The KubeStellar Console is the successor to the original KubeStellar UI. It includes all previous features plus significant new capabilities:

- **AI-powered Missions** for automated issue detection and remediation
- **120+ dashboard cards** for monitoring clusters, workloads, GPU/AI, security, and more
- **Real-time SSE streaming** replacing polling-based data updates
- **Marketplace** for community-shared dashboards, cards, and themes
- **Multi-cluster deployment** with drag-and-drop workload placement
- **llm-d inference monitoring** with Prometheus metrics integration

## Updated Documentation

Please refer to the current console documentation:

- **[Console Overview](../console/readme.md)** - Feature overview and getting started
- **[Quick Start](../console/quickstart.md)** - Get running in minutes
- **[Installation](../console/installation.md)** - All deployment options (curl, source, Helm, Docker, OpenShift)
- **[Features Guide](../console/console-features.md)** - Detailed feature documentation
- **[Architecture](../console/architecture.md)** - System design and component details
- **[Local Setup Guide](../console/local-setup.md)** - Complete local development setup
- **[Authentication](../console/authentication.md)** - OAuth flow, sessions, and security

## Repository Change

| Before | After |
|--------|-------|
| `kubestellar/ui` | `kubestellar/console` |
| React + Gin backend | React + Go backend |
| Ports 5173 / 4000 | Port 8080 (unified) |
| Optional Redis | In-memory caching with TTL |
| Manual cluster config | Auto-discovery via kubeconfig |

```bash
# Old (deprecated)
git clone https://github.com/kubestellar/ui.git

# New (current)
git clone https://github.com/kubestellar/console.git
```
