# Mission Control: Install, Fix, Orbit, and Mission Control

*April 2026*

KubeStellar Console has quietly grown into something more than a multi-cluster dashboard. It is now a **mission platform** — a single place to install CNCF projects, diagnose cross-cluster problems, and orchestrate guided workflows across every connected environment.

This post is a guided tour of every mission type in the console today, and why each one exists.

---

## What Is a "Mission"?

A mission is a guided, end-to-end workflow that takes a complex multi-step task and reduces it to a few clicks. Missions combine:

- **Pre-flight checks** — verify your clusters are ready before doing anything
- **Live execution** — stream logs, status, and progress as the work happens
- **Verification** — confirm the outcome with real cluster state, not assumptions
- **Rollback** — undo the changes if something goes wrong

Missions are not scripts. They are interactive, observable, and reversible.

---

## Install Missions: One-Click CNCF Projects

[Install Missions](https://console.kubestellar.io/missions) take a CNCF or open source project and turn its install instructions into a guided experience. The console currently ships missions for projects spanning networking, storage, security, observability, and more.

Each Install Mission includes:

- **Pre-flight validation** — checks your cluster meets the project's requirements (Kubernetes version, available CRDs, RBAC, GPU/storage class, namespaces)
- **Configurable install** — choose values like namespace, version, replica count from a UI rather than editing YAML
- **Live deployment logs** — watch helm/kubectl/operator output stream into the browser as it happens
- **Post-install verification** — confirm pods are running, services are reachable, and the project's health endpoints respond
- **Guided rollback** — uninstall with the same level of safety

Recent additions include guided installs for **Submariner** (using the current `subctl` workflow — deploy-broker, join, verify, cross-cluster connectivity test), endorsed by the Submariner maintainers themselves in [submariner-io/submariner#3907](https://github.com/submariner-io/submariner/issues/3907). Mutual ADOPTERS listings between KubeStellar and Submariner are now in progress.

Other Install Missions endorsed by their upstream maintainers include OpenCost, KitOps, Cadence, Easegress, Microcks, kcp, kube-vip, Open Cluster Management, and Notary Project / Ratify.

---

## Fix Missions: Diagnose, Repair, Verify

Where Install Missions answer *"how do I deploy this?"*, **Fix Missions** answer *"what is broken and how do I make it stop?"*

Fix Missions take a symptom — a CrashLoopBackOff pod, an OOMKilled deployment, a stuck rollout, an ImagePullBackOff — and walk through diagnosis, root cause, and repair as a single guided workflow.

A typical Fix Mission:

1. **Reads the symptom** from cluster events, pod logs, and resource state
2. **Identifies the root cause** (deleted secret, bad image tag, missing CRD, RBAC denial, OOM, etc.)
3. **Proposes a fix** with the exact `kubectl` / Helm / GitOps change required
4. **Asks for your approval** before touching anything
5. **Applies the fix** and **verifies** the resource is healthy
6. **Surfaces the upstream cause** (e.g. "your nightly cleanup job deleted this secret — here's the patch to exclude it")

Fix Missions are not autonomous. Every action is reviewed and approved by you before anything changes in a cluster.

Beyond pod-level issues, the same Fix workflow handles cross-cluster problems:

- **Cross-cluster RBAC drift** — find service accounts that work in one cluster but fail in another
- **Resource quota bottlenecks** — surface namespaces that are silently blocking deployments
- **GitOps drift** — compare what's in Git to what's actually running, across every cluster at once

---

## Orbit Missions: Recurring Maintenance That Runs Itself

**Orbit Missions** are recurring missions that run on a cadence — daily, weekly, or monthly — without you having to remember to launch them.

Think of an Orbit Mission as a scheduled health check that lives inside the console. It owns its own dashboard ("Ground Control"), keeps a history of every run, and knows when it's overdue.

Common Orbit patterns:

- **Nightly compliance scan** — run a CIS / PCI / SOC2 check across every connected cluster, surface drift in a dashboard, alert on regressions
- **Weekly drift check** — diff Git vs. cluster state for every GitOps-managed namespace
- **Monthly upgrade audit** — list every Helm release, flag any that are more than one minor version behind upstream
- **Daily security posture** — rerun Trivy / Falco / Kyverno scans and chart the trend

Each Orbit Mission has:

- A **cadence** (daily / weekly / monthly) with a configurable grace period before it's flagged as overdue
- A **run history** (the last 50 runs by default) with success/failure outcomes and summaries
- A **Ground Control dashboard** auto-generated for the mission, where every panel reflects the latest run
- An **auto-run scheduler** that wakes up every minute and launches any mission whose next-run window has arrived

Orbit Missions turn one-shot fixes into standing operations.

---

## AI Missions: The Umbrella

**AI Missions** is the unified sidebar that brings Install, Fix, Orbit, and Mission Control together in one place. It is how you actually *use* the mission system day-to-day:

- See every active, scheduled, and completed mission across all clusters
- Filter by type, cluster, status, or feedback
- Resume a mission that's waiting on your input
- Provide thumbs-up / thumbs-down feedback on AI-driven runs to improve future suggestions

When you click the **AI Missions** button in the navbar, this is what you get — a single view of every guided workflow in flight, regardless of which mission type spawned it.

---

## Mission Explorer: Browse, Search, Discover

The [Mission Explorer](https://console.kubestellar.io/missions) is the front door for everything. It lets you:

- Browse all available missions by category (install, diagnose, repair, deploy)
- Search across mission descriptions, tags, and CNCF project names
- Filter by maturity level (Sandbox, Incubating, Graduated)
- See which missions have been endorsed by upstream project maintainers
- Launch a mission with one click

It's the catalog. It's how you find the right tool for the problem in front of you.

---

## Mission Control: Orchestration

**Mission Control** is the layer above all of this. It is where missions become composable.

From Mission Control you can:

- Run a mission across multiple clusters in parallel
- Chain missions together (install → verify → diagnose)
- Schedule missions to run on a cadence (nightly compliance scan, weekly drift check)
- See the live status of every running mission across your entire fleet
- Get notified when a mission needs your input or approval

Mission Control is where the console stops being a dashboard and starts being a control plane.

---

## What Makes This Different

Other tools give you a button. KubeStellar Console gives you a **mission** — a workflow that knows what success looks like, can verify it, and can undo itself if something goes wrong.

Three things make this approach work:

1. **Upstream collaboration.** Every Install Mission is built with engagement from the project's maintainers. Several missions have been endorsed in the upstream issue tracker before going live, and several have led to mutual ADOPTERS listings.
2. **Demo mode everywhere.** Every mission has a demo data path. You can try the entire experience at [console.kubestellar.io](https://console.kubestellar.io) without connecting a single cluster.
3. **AI-maintained.** The mission catalog, the diagnostic workflows, and the orchestration layer are all built and maintained by AI agents working from the [AI Codebase Maturity Model](https://kubestellar.medium.com/i-purposely-built-a-codebase-that-teaches-itself-dbf34915b148). New missions ship in days, not quarters.

---

## Try It

- **Mission Explorer**: [console.kubestellar.io/missions](https://console.kubestellar.io/missions)
- **AI Missions sidebar** (Install + Fix + Orbit + Mission Control in one view): [console.kubestellar.io/missions/ai](https://console.kubestellar.io/missions/ai)
- **Submariner Install Mission**: [console.kubestellar.io/missions/install-submariner](https://console.kubestellar.io/missions/install-submariner)
- **Source code**: [github.com/kubestellar/console](https://github.com/kubestellar/console)
- **Mission catalog repo**: [github.com/kubestellar/console-kb](https://github.com/kubestellar/console-kb)

If you maintain a CNCF or open source project and want a guided install mission for it, open an issue on [console-kb](https://github.com/kubestellar/console-kb/issues) — we'd love to add it.
