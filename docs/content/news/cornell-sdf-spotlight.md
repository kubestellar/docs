# Adopter Spotlight: Cornell University's Software-Defined Farm

*June 2026*

When most people think about Kubernetes multi-cluster management, they picture data centers, cloud regions, and microservice architectures. Cornell University's Software-Defined Farm (SDF) project is a reminder that the problems KubeStellar solves are universal — wherever you have compute distributed across locations, the challenge of coordinating workloads follows.

---

## The Challenge: Farming at the Edge

Modern precision agriculture generates enormous amounts of data. Sensors in the field, imaging drones, soil monitors, irrigation controllers, weather stations — a single farm operation can have hundreds of data-producing endpoints. The Software-Defined Farm project, led by researchers at the [Cornell Institute for Digital Agriculture (CIDA)](https://cida.cornell.edu/), is building infrastructure to make that data useful.

The core challenge: farm infrastructure is inherently distributed. Data needs to be processed close to where it's generated (edge compute), aggregated and analyzed at a regional level, and coordinated from a central management plane. That's a multi-cluster problem.

---

## Why KubeStellar

The SDF team uses KubeStellar for **workload orchestration** across their distributed Kubernetes clusters. Rather than managing cluster-specific deployment configurations by hand, KubeStellar lets them express *what* they want running *where* using BindingPolicies, and the system handles distribution.

For an academic research project, this matters operationally: researchers should be focused on agriculture, not YAML sprawl. KubeStellar's abstraction lets the team treat a heterogeneous set of edge devices and cloud nodes as a single, policy-governed compute surface.

---

## The Broader Pattern

The SDF use case illustrates a pattern that appears across many KubeStellar deployments:

- **Hub-and-spoke topology** — central management plane + distributed edge compute
- **Heterogeneous infrastructure** — different hardware classes managed under one policy layer
- **Domain expertise at the center** — the team focuses on their problem (agriculture), not on cluster operations

This pattern shows up in industrial IoT, scientific computing, telecommunications, and retail. If your work happens at the edge and you need to keep a central view, KubeStellar's multi-cluster placement model is designed for you.

---

## Join the Adopter Community

Cornell is the first organization listed in our [ADOPTERS.md](https://github.com/kubestellar/kubestellar/blob/main/ADOPTERS.md). We'd love for you to be next.

If you're using KubeStellar in your organization — at any maturity level, from prototype to production — we want to hear about it. Adding your organization to ADOPTERS.md takes [a few minutes and a pull request](https://github.com/kubestellar/kubestellar/blob/main/ADOPTERS.md), and helps the whole community understand the breadth of where KubeStellar is being applied.

Come find us in [#kubestellar](https://cloud-native.slack.com/archives/C097094RZ3M) on CNCF Slack, or [open a discussion](https://github.com/kubestellar/kubestellar/discussions) if you want to share your story.

---

## Further Reading

- [Cornell CIDA Software-Defined Farm Repository](https://github.com/Cornell-CIDA-Dev/Software-Defined-Farm)
- [KubeStellar Quickstart](https://docs.kubestellar.io/release-0.30.0/Getting-Started/quickstart/)
- [BindingPolicy Reference](https://docs.kubestellar.io/release-0.30.0/Coding-Milestones/PoC2019q1/mailbox-controller/)
- [Add Your Organization to ADOPTERS.md](https://github.com/kubestellar/kubestellar/blob/main/ADOPTERS.md)
