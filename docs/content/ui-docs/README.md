
# KubeStellar UI (Deprecated)

!!! warning "Deprecated"
    The `kubestellar/ui` repository has been replaced by **[kubestellar/console](https://github.com/kubestellar/console)**. All development now happens in the console project.

## Where to Go

- **[Console Documentation](../console/readme.md)** - Full documentation for the current project
- **[Quick Start](../console/quickstart.md)** - Get running in minutes
- **[Installation](../console/installation.md)** - All deployment options
- **[Local Setup Guide](../console/local-setup.md)** - Complete local development setup

## What Changed

The original `kubestellar/ui` project (React + Gin, ports 5173/4000, optional Redis) has been superseded by `kubestellar/console` (React + Go, port 8080, in-memory caching). The console includes all original features plus AI Missions, 120+ monitoring cards, a Marketplace, llm-d inference monitoring, and real-time SSE streaming.

See the [migration notes](ui-overview.md) for a full comparison.
