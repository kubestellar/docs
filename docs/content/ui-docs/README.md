
# KubeStellar UI (Deprecated)

!!! warning "Deprecated"
    The `kubestellar/ui` repository has been replaced by **[kubestellar/console](https://github.com/kubestellar/console)**. All development now happens in the console project.

## Where to Go

- **[Console Documentation](/docs/console/console-overview)** - Full documentation for the current project
- **[Quick Start](/docs/console/quickstart)** - Get running in minutes
- **[Installation](/docs/console/installation)** - All deployment options
- **[Local Setup Guide](/docs/console/local-setup)** - Complete local development setup

## What Changed

The original `kubestellar/ui` project (React + Gin, ports 5173/4000, optional Redis) has been superseded by `kubestellar/console` (React + Go, port 8080, in-memory caching). The console includes all original features plus AI Missions, 120+ monitoring cards, a Marketplace, llm-d inference monitoring, and real-time SSE streaming.

See the [migration notes](/docs/ui-docs/ui-overview) for a full comparison.
