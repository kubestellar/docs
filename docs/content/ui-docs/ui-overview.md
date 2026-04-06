# KubeStellar UI

!!! warning "Deprecated"
    The `kubestellar/ui` repository has been replaced by **[kubestellar/console](https://github.com/kubestellar/console)**. All development, features, and documentation now live in the console project.

## Migration

The KubeStellar Console is the successor to the original KubeStellar UI. It includes all previous features plus significant new capabilities:

- **AI-powered Missions** for automated issue detection and remediation
- **110+ dashboard cards** for monitoring clusters, workloads, GPU/AI, security, and more
- **Real-time SSE streaming** replacing polling-based data updates
- **Marketplace** for community-shared dashboards, cards, and themes
- **Multi-cluster deployment** with drag-and-drop workload placement
- **llm-d inference monitoring** with Prometheus metrics integration

## Updated Documentation

Please refer to the current console documentation:

- **[Console Overview](/docs/console/console-overview/)** - Feature overview and getting started
- **[Quick Start](/docs/console/quickstart/)** - Get running in minutes
- **[Installation](/docs/console/installation/)** - All deployment options (curl, source, Helm, Docker, OpenShift)
- **[Features Guide](/docs/console/console-features/)** - Detailed feature documentation
- **[Architecture](/docs/console/architecture/)** - System design and component details
- **[Local Setup Guide](/docs/console/local-setup/)** - Complete local development setup
- **[Authentication](/docs/console/authentication/)** - OAuth flow, sessions, and security

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
