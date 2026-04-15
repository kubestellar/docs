---
title: "Architecture Evolution — From Legacy KubeStellar to KubeStellar Console"
linkTitle: "Architecture Evolution"
description: >
  KubeStellar has evolved from the original multi-cluster binding model
  (BindingPolicy, WECs, ITSs, KubeFlex) to the KubeStellar Console — a
  kubeconfig-based, AI-driven multi-cluster management experience. This page
  explains the two models, why the project evolved, and where current users
  should look for docs.
keywords:
  - kubestellar architecture
  - kubestellar console
  - legacy kubestellar
  - binding policy
  - post office model
  - multi-cluster kubernetes
---

# Architecture Evolution: From Legacy KubeStellar to KubeStellar Console

KubeStellar has evolved significantly since the project began in the CNCF
Sandbox. The original multi-cluster binding model — sometimes referred to as
the "Post Office" model, built around `BindingPolicy`, Workload Execution
Clusters (WECs), Inventory & Transport Spaces (ITSs), and KubeFlex control
planes — has been **superseded** by the [KubeStellar Console](/docs/console/overview/introduction),
which provides the same multi-cluster capabilities through a simpler,
kubeconfig-based architecture.

This page exists because many external references, blog posts, and older docs
still describe the legacy model first. If you landed here with that mental
model, this page will help you reconcile it with how KubeStellar is built
today.

!!! tip "TL;DR"
    - **Legacy model** (`kubestellar/kubestellar`, `control.kubestellar.io` API
      group, `BindingPolicy`, WECs, ITSs, KubeFlex): retired for new
      deployments. Maintained for existing installations.
    - **Current model** ([`kubestellar/console`](https://github.com/kubestellar/console)):
      React UI + Go backend + `kc-agent` acting directly on your **kubeconfig**
      via MCP and REST. AI-driven Mission Control, observability, drill-downs,
      and multi-cluster workflows.
    - **Migration note:** if you were using the binding-policy flow, that flow
      is gone from the new architecture. The Console acts on your kubeconfig
      directly — no transport spaces, no binding policies, no WEC registration.

---

## The legacy model (Post Office / BindingPolicy)

The original KubeStellar architecture, documented under
[`/docs/kubestellar/overview`](/docs/kubestellar/overview), introduced a set of
control-plane abstractions for delivering workloads across many clusters:

| Concept | Purpose |
|---------|---------|
| **KubeFlex** | Lightweight Kubernetes API server instances used as hosting control planes ("spaces"). |
| **Workload Description Space (WDS)** | A KubeFlex control plane that holds the user's *desired* workloads. |
| **Inventory & Transport Space (ITS)** | A KubeFlex control plane that holds the cluster *inventory* and carries workloads to targets via OCM transport. |
| **Workload Execution Cluster (WEC)** | A physical Kubernetes cluster registered with an ITS that actually runs the workloads. |
| **`BindingPolicy` (`control.kubestellar.io`)** | A declarative rule that selected workloads in a WDS and matched them to WECs. The controller then "posted" them through the ITS to the selected WECs — hence the "Post Office" nickname. |
| **`Binding` / `CombinedStatus`** | The reconciled state produced by the binding controller, plus aggregated status back from all the WECs. |

This model solved a real problem: it let a single GitOps source of truth
describe multi-cluster workloads, with cluster selection decoupled from the
workload YAML itself. But it came with significant operational cost:

- Users had to stand up KubeFlex, one or more WDSs, and at least one ITS.
- Every managed cluster had to be **registered** as a WEC and joined to the
  transport plane.
- Debugging multi-cluster rollouts meant tracing objects across WDS → ITS →
  WEC, then back through `CombinedStatus`.
- The concepts did not map to tools users already had (`kubectl`, kubeconfig
  contexts, Argo CD, standard RBAC).

The legacy components still exist and are still documented on this site —
see [Legacy Components](/docs/legacy-components) — but new development is no
longer happening against the `control.kubestellar.io` API group or the
`kubestellar/kubestellar` repository.

---

## The current model (KubeStellar Console)

[KubeStellar Console](https://github.com/kubestellar/console) is a
from-the-ground-up rebuild of the KubeStellar experience. It does **not**
require KubeFlex, a WDS, an ITS, or `BindingPolicy`. Instead, it operates
directly on the clusters already in your **kubeconfig**.

At a high level, the Console is four pieces:

| Component | Role |
|-----------|------|
| **React + TypeScript frontend** | Dashboards, cards, drill-downs, AI Missions UI, Mission Control. |
| **Go backend** | REST/WebSocket API, auth, persistence, caching, orchestration. |
| **`kc-agent`** | Local process that bridges the browser (and AI coding agents) to your kubeconfig via WebSocket + MCP. Executes `kubectl`-style operations on your behalf. |
| **MCP Bridge** | In-process MCP servers (`kubestellar-ops`, `kubestellar-deploy`) that the backend and external AI coding agents (Claude Code, Copilot, Cursor, Gemini CLI, etc.) can query to read and act on your clusters. |

The Console reads every cluster context in your kubeconfig, deduplicates
physical clusters, and fans out cluster operations in parallel. Multi-cluster
is now a *property of your kubeconfig*, not a bespoke control plane.

For the full technical breakdown, see:

- [Console Introduction](/docs/console/overview/introduction)
- [Console Architecture](/docs/console/overview/architecture) — canonical
  architecture reference, with component diagrams.
- [Console Installation](/docs/console/overview/installation)
- [Console Quick Start](/docs/console/overview/quick-start)

### What the Console gives you that the legacy model did not

- **AI Missions** — natural-language, multi-step operations that plan, execute,
  and report on cluster changes across your fleet.
- **Mission Control** — a live view of what AI agents and users are doing in
  each cluster, with drill-downs into logs, events, pods, and GPU allocations.
- **Marketplace + Knowledge Base** — reusable mission templates and
  multi-cluster playbooks from the community.
- **Demo Mode** — the full UI works without any real cluster connection, so
  docs, tutorials, and live demos all stay reproducible.
- **Standard tooling** — works with whatever you already have: kubeconfig,
  `kubectl`, Argo CD, Helm, GitHub OAuth, standard RBAC. No new CRDs required
  on managed clusters.

---

## Migration note for users arriving with legacy expectations

If you found KubeStellar through older documentation, blog posts, or a CNCF
talk that described the binding-policy flow, here is what changed:

| Legacy concept | In the Console |
|----------------|----------------|
| Install KubeFlex, create a WDS and an ITS | **Not required.** The Console runs against your existing clusters. |
| Register each managed cluster as a WEC | **Not required.** The Console discovers clusters from your **kubeconfig** contexts. |
| Author a `BindingPolicy` to select workloads and targets | **Replaced by** AI Missions + Dashboards. You describe *what you want* in natural language or pick a card/mission template; the Console executes it across the clusters you selected. |
| Read `CombinedStatus` to see aggregated results | **Replaced by** Mission Control and live drill-downs (pods, events, GPU allocations, etc.). |
| `kubectl apply -f bindingpolicy.yaml` | `kubectl` still works — use it directly, or let the Console's `kc-agent` run it for you across selected clusters. |

**If you were using `BindingPolicy` in production:** the legacy components in
`kubestellar/kubestellar` are still maintained for existing deployments and
still documented on this site. New features, however, are landing in
`kubestellar/console`. You are encouraged to try the Console against your
existing kubeconfig — no migration of CRDs is required because the Console
does not install any.

---

## Where to go next

- **New users:** start with the [KubeStellar Console Quick Start](/docs/console/overview/quick-start).
- **Live demo:** [console.kubestellar.io](https://console.kubestellar.io) —
  runs in Demo Mode out of the box.
- **AI coding agents:** see [KubeStellar MCP](/docs/kubestellar-mcp/overview/introduction)
  to plug the Console's MCP servers into Claude Code, Copilot, Cursor, or
  Gemini CLI.
- **Existing KubeStellar users on the legacy model:** see
  [Legacy Components](/docs/legacy-components) and
  [KubeStellar Overview](/docs/kubestellar/overview) — these continue to be
  maintained for existing installations.
- **Source:** [github.com/kubestellar/console](https://github.com/kubestellar/console)
