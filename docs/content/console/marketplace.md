---
title: "KubeStellar Console Marketplace — Community Dashboards, Cards & Themes for Multi-Cluster Kubernetes"
linkTitle: "Marketplace"
weight: 12
description: >
  Browse, install, and contribute dashboards, card presets, and themes for multi-cluster Kubernetes operations. The KubeStellar Console Marketplace lets teams extend their multi-cluster management experience with community-built monitoring, observability, and deployment tools.
keywords:
  - kubernetes marketplace
  - multi-cluster dashboard marketplace
  - CNCF project monitoring
  - kubernetes observability marketplace
  - multi-cluster operations tools
  - kubernetes dashboard extensions
  - cloud native marketplace
---

# KubeStellar Console Marketplace

The KubeStellar Console Marketplace is where teams discover, install, and share extensions for multi-cluster Kubernetes operations. Instead of building every dashboard and card from scratch, you can browse a growing library of community-contributed dashboards, card presets, and themes — all designed for multi-cluster environments.

## What the Marketplace Offers

The Marketplace ships three categories of installable content:

| Category | What It Is | Examples |
|----------|-----------|---------|
| **Dashboards** | Full pre-built dashboard layouts for specific use cases | CNCF Observability Dashboard, GPU Fleet Monitor, Cost Optimization View |
| **Card Presets** | Individual monitoring cards for specific CNCF projects | Prometheus alert summary, Istio traffic map, Cilium network policy card |
| **Themes** | Visual themes that change the console's appearance | Dark engineering, light operations, high-contrast accessibility |

## Browsing and Installing

Open the Marketplace from the console sidebar or navigate to `/marketplace`.

### Finding What You Need

- **Search** — Full-text search across names, descriptions, tags, and authors
- **Filter by type** — Dashboards, card presets, or themes
- **Filter by CNCF category** — Observability, networking, security, runtime, storage, and more
- **Filter by difficulty** — Beginner, intermediate, or advanced configurations
- **Sort** — By name, author, type, or difficulty level

### One-Click Install

Every Marketplace item includes:

1. **Preview screenshot** — See exactly what you get before installing
2. **Description and tags** — Understand what the item monitors or configures
3. **Author profile** — GitHub-linked author with contribution stats (coins earned, PRs merged)
4. **Version info** — Track updates and changelogs
5. **Install button** — One click to add to your console

After installing, the dashboard, card, or theme is immediately available — no restarts, no config files.

## CNCF Project Coverage

The Marketplace tracks coverage across the entire CNCF landscape. A progress banner shows how many graduated, incubating, and sandbox projects have community-built monitoring cards.

**Current coverage:**

| Maturity | Projects Covered | Status |
|----------|-----------------|--------|
| Graduated | 35+ | Active monitoring cards available |
| Incubating | 33+ | Community contributions growing |
| Help Wanted | 57+ | Open for community contributions |

Every CNCF project card in the Marketplace includes metadata about the project's maturity level, category, and official documentation links.

## Contributing to the Marketplace

Anyone can contribute dashboards, card presets, or themes to the KubeStellar Console Marketplace.

### How to Contribute

1. **Fork** the [console-marketplace](https://github.com/kubestellar/console-marketplace) repository
2. **Add your item** following the schema in the contributing guide
3. **Submit a PR** — automated quality gates validate your contribution:
   - Schema validation (required fields, correct types)
   - Registry integrity check (no duplicates, valid references)
   - Nightly auto-QA runs against the latest console build
4. **Get reviewed** — maintainers review and merge

### Quality Gates

Every contribution passes through automated checks:

- **Schema validation** — All required fields present with correct types
- **Screenshot required** — Every item must include a preview image
- **Registry integrity** — No conflicts with existing items
- **Nightly QA** — Automated testing runs every night against the live console

### Author Profiles

Contributors get a public author profile in the Marketplace showing:

- GitHub username and avatar
- Number of contributions (dashboards, cards, themes)
- Coins earned through the console rewards system
- PRs merged to both the console and marketplace repos

## Marketplace Registry

The Marketplace registry is hosted at:

```text
https://raw.githubusercontent.com/kubestellar/console-marketplace/main/registry.json
```

The registry is a JSON file containing all published items with their metadata, download URLs, and version history. The console fetches this registry on load and caches it locally for offline browsing.

## Why a Marketplace for Multi-Cluster Kubernetes?

Managing multiple Kubernetes clusters means monitoring dozens of CNCF projects, each with different metrics, alert patterns, and operational requirements. Building monitoring dashboards for every project in every cluster is repetitive work.

The KubeStellar Console Marketplace eliminates this duplication:

- **Install once, monitor everywhere** — Marketplace dashboards work across all connected clusters
- **Community-tested** — Cards and dashboards are battle-tested by other multi-cluster operators
- **Always current** — The community keeps dashboards updated as CNCF projects evolve
- **Zero config** — No Prometheus rules, no Grafana JSON, no manual wiring — just install and go

This is what makes KubeStellar Console different from single-cluster dashboards: every Marketplace item is designed for **multi-cluster operations** from day one, giving you fleet-wide visibility with AI-powered insights that save you time and tokens.
