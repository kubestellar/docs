# OCM Status Addon

The [OCM Status Addon](https://github.com/kubestellar/ocm-status-addon) is a status reporting add-on for [Open Cluster Management](https://open-cluster-management.io/concepts/addon/) (OCM). It enables KubeStellar to collect and report the status of workloads running on managed clusters back to the hub (the KubeStellar ITS).

## How It Works

The OCM Status Addon consists of two roles packaged in a single container image:

- **Controller** — runs in the OCM hub (the KubeStellar ITS). Manages the lifecycle of the agent on each managed cluster.
- **Agent** — runs on each managed cluster (WEC). Watches workload resources and reports their status back to the hub.

## Artifacts

| Artifact | Location |
|----------|----------|
| **Container image** | [ghcr.io/kubestellar/ocm-status-addon](https://github.com/orgs/kubestellar/packages/container/package/ocm-status-addon) |
| **Helm chart** | [ghcr.io/kubestellar/ocm-status-addon-chart](https://github.com/orgs/kubestellar/packages/container/package/ocm-status-addon-chart) |
| **Source code** | [github.com/kubestellar/ocm-status-addon](https://github.com/kubestellar/ocm-status-addon) |

## Relationship to KubeStellar

The OCM Status Addon is deployed automatically when an ITS (Inventory and Transport Space) is created via the [Core Helm chart](core-chart.md). It is a required component for status reporting in the legacy KubeStellar architecture.

For more details on packaging, container images, and the Helm chart, see [Packaging and Delivery](packaging.md#ocm-status-addon).
