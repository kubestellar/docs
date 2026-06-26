# How Drasi Became the First CNCF Sandbox Project to Verify a KubeStellar Install Mission End-to-End

*June 2026*

When a project maintainer runs your guided install workflow, finds bugs, reports them, and then marks it as verified — that's not just a user story. It's a signal that the ecosystem is beginning to trust the tooling.

That's exactly what happened with [Drasi](https://drasi.io), a CNCF Sandbox project for change data capture in cloud-native applications. A Drasi maintainer ran the KubeStellar Console install mission at [console.kubestellar.io/missions/install-drasi](https://console.kubestellar.io/missions/install-drasi) end-to-end — found issues, reported them, tracked engagement in [drasi-project/drasi-platform#400](https://github.com/drasi-project/drasi-platform/issues/400), and confirmed the experience was solid enough to recommend.

Drasi is now listed in [KubeStellar Console's ADOPTERS file](https://github.com/kubestellar/console/blob/main/ADOPTERS.md) — and is the first CNCF Sandbox project to have a maintainer-verified install mission in the console.

---

## What Is Drasi?

[Drasi](https://drasi.io) solves a problem that distributed systems engineers deal with constantly: how do you react to changes in data — across databases, queues, and services — without polling, without building custom CDC pipelines, and without coupling your logic to every upstream system?

Drasi provides a **continuous query engine** that watches changes in data sources (Azure Cosmos DB, PostgreSQL, Kubernetes resources) and automatically triggers reactions when conditions are met. Think of it as a standing query that runs forever: "Whenever an order total exceeds $10,000 AND the customer tier is Gold, trigger the premium fulfillment workflow."

This is particularly relevant for edge computing, multi-cluster environments, and event-driven microservices — exactly the environments KubeStellar manages.

---

## What Is a KubeStellar Install Mission?

Install missions are guided, interactive workflows built into the KubeStellar Console. They walk you through deploying a CNCF project onto your cluster — step by step — with pre-flight checks, dependency management, automated `helm` or `kubectl` sequences, validation steps, and rollback support.

Think of them as runbooks that execute themselves, with an AI layer that can diagnose failures and suggest fixes in real time.

The Drasi install mission:
1. Checks cluster prerequisites (Kubernetes version, available storage classes, network policies)
2. Deploys Drasi's control plane components via Helm
3. Deploys sample Drasi sources (Kubernetes resource watcher, PostgreSQL CDC)
4. Verifies that reactions are firing correctly with a built-in smoke test
5. Provides rollback instructions if any step fails

---

## What the Maintainer Found

When the Drasi maintainer ran the mission, they identified several issues:

- A prerequisite check that incorrectly flagged a valid storage class as missing
- A Helm values override that didn't propagate correctly to the reaction processor
- A validation step that timed out before the Drasi control plane finished initializing

Each of these was reported, triaged, and fixed — with the maintainer confirming the fix in the tracking issue. The result is a mission that's been battle-tested by someone who knows the project deeply.

---

## Why This Matters for the CNCF Ecosystem

### It defines a repeatable adoption pattern

The Drasi engagement established a template for how KubeStellar Console onboards CNCF projects:

1. Build an install mission using the console's mission authoring tools
2. Share it with project maintainers and ask them to run it
3. Accept feedback, fix issues, and iterate
4. List the project as a verified adopter once the maintainer confirms

This is different from a one-way integration. It's a collaborative verification loop that builds trust on both sides.

### It expands what "multi-cluster management" means

Drasi fits naturally into multi-cluster environments: you might run a CDC source in a data-center cluster and process reactions in an edge cluster closer to your IoT devices. KubeStellar's multi-cluster orchestration handles the placement; Drasi handles the data flow. The combination is more powerful than either project alone.

### It signals project maturity to the broader ecosystem

When CNCF projects evaluate tools and platforms, maintainer endorsement carries weight. Drasi's verification signals that KubeStellar Console's mission framework is production-ready enough for a CNCF Sandbox project to stake its install documentation on.

---

## What's Next

The Drasi mission is live and publicly accessible at [console.kubestellar.io/missions/install-drasi](https://console.kubestellar.io/missions/install-drasi). No account required — the console demo mode lets you explore it without connecting a cluster.

For the Drasi team, the next step is exploring multi-cluster mission scenarios: running Drasi sources in one cluster and reactions in another, orchestrated by KubeStellar's WorkloadPlacement policies.

For the KubeStellar team, Drasi is the first in a growing list of CNCF projects with verified install missions. OpenCost, Notary Project/Ratify, Submariner, Microcks, and 7 others are already listed in ADOPTERS — each with upstream engagement tracked in their respective repos.

If you maintain a CNCF project and want to build a verified install mission, open an issue at [github.com/kubestellar/console](https://github.com/kubestellar/console) or reach out in CNCF Slack `#kubestellar`.

---

## Try It

- **Live demo**: [console.kubestellar.io](https://console.kubestellar.io) (no install, no account)
- **Drasi install mission**: [console.kubestellar.io/missions/install-drasi](https://console.kubestellar.io/missions/install-drasi)
- **Drasi project**: [drasi.io](https://drasi.io) / [github.com/drasi-project](https://github.com/drasi-project)
- **KubeStellar Console**: [github.com/kubestellar/console](https://github.com/kubestellar/console)
- **CNCF Slack**: `#kubestellar`
