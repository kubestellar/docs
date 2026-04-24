---
title: Federation & Multi-Hub
description: OCM federation provider and multi-hub fan-out support in KubeStellar Console.
---

# Federation & Multi-Hub Support

KubeStellar Console supports **federated multi-hub topologies** through the OCM (Open Cluster Management) provider and a multi-hub fan-out skeleton.

## OCM Provider

The **OCM federation provider** (`feat(federation): OCM provider + Phase 1 UI`, PR #9380) adds native support for Open Cluster Management as a cluster discovery and workload placement backend.

### What This Enables

- Discover managed clusters registered with an OCM hub
- View OCM-managed cluster status alongside kubeconfig-based clusters
- Place workloads using OCM `Placement` and `ManifestWork` resources

### Configuration

The OCM provider is auto-detected when an OCM hub kubeconfig is present. No additional configuration is required.

## Multi-Hub Fan-Out

The multi-hub architecture allows a single Console instance to aggregate data from multiple cluster management hubs:

- **Hub 1** — Primary kubeconfig-based clusters
- **Hub 2** — OCM hub
- **Hub N** — Additional providers (planned)

Each hub contributes its managed clusters to the unified cluster list in Console. Deduplication ensures clusters appearing in multiple hubs are shown once.

## Orbits — Resource Targeting

**Orbit resource targeting** (`feat: orbit resource targeting`, PR #9378) enables precise workload placement:

- **Namespaced targeting** — Deploy resources into specific namespaces on selected clusters
- **Cluster-scoped targeting** — Apply cluster-level resources across a selection
- **Post-mission monitor** — After an orbit completes, a monitoring offer appears to track the deployed workload

### Creating an Orbit

1. Navigate to **AI Missions** sidebar
2. Click **New Orbit**
3. Select target clusters (confirmation required before proceeding with empty selection)
4. Choose resource scope (namespaced or cluster-scoped)
5. Define the resource payload
6. Deploy and optionally accept the post-mission monitoring offer
