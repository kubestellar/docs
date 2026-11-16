---
title: "KubeStellar Glossary"
description: "A comprehensive, beginner-friendly glossary of multi-cluster Kubernetes concepts, acronyms, and custom resources across KubeStellar."
---

# KubeStellar Glossary

Welcome to the KubeStellar glossary. Multi-cluster Kubernetes introduces powerful orchestration capabilities, but it also relies on specialized terminology, architectural abstractions, and custom resources.

This page breaks down core concepts across KubeStellar Core, KubeStellar Console, KubeFlex, and A2A into plain English, accompanied by real-life analogies and direct links to authoritative documentation.

---

### Jump to Letter

[A](#a) · [B](#b) · [C](#c) · [D](#d) · [E](#e) · [F](#f) · [G](#g) · [H](#h) · [I](#i) · [K](#k) · [M](#m) · [O](#o) · [P](#p) · [S](#s) · [U](#u) · [V](#v) · [W](#w)

---

## A <a id="a"></a>

### [A2A — Agent-to-Agent Orchestration](a2a/intro.md) <a id="a2a"></a>

An autonomous multi-cluster agent orchestration protocol enabling AI coding and operations agents to discover Kubernetes resources across multiple clusters and coordinate complex workflows without human handoffs.

* **Real-Life Analogy:** Air-traffic controllers at regional airports communicating over an automated radio channel to coordinate flight handoffs smoothly.
* **Why It Matters:** Allows users to manage multi-cluster fleets through natural language commands rather than writing manual shell scripts.

### [ACMM — Advanced Cluster Management Module](console/acmm-dashboard.md) <a id="acmm"></a>

A specialized Console monitoring card and dashboard that aggregates real-time fleet telemetry, quota compliance, and capacity utilization charts across all connected clusters.

* **Real-Life Analogy:** A hospital's central electrical board displaying power consumption and backup battery reserves across all wings on one screen.
* **Why It Matters:** Gives operators instant visibility into cluster resource exhaustion without requiring manual cluster-by-cluster logins.

### [AI Missions — Autonomous Remediation](console/ai-missions-setup.md) <a id="ai-missions"></a>

An automated troubleshooting and remediation workflow in KubeStellar Console that continuously detects cluster anomalies, pinpoints root causes, and generates executable multi-step repair playbooks.

* **Real-Life Analogy:** An automated roadside assistance unit that diagnoses an engine belt fault, retrieves the replacement part, and asks for your one-tap approval.
* **Why It Matters:** Drastically reduces mean time to recovery (MTTR) during cluster outages by automating routine debugging steps.

### [AppliedManifestWork — OCM Applied Resource](kubestellar/architecture.md) <a id="appliedmanifestwork"></a>

An Open Cluster Management resource generated on a Workload Execution Cluster (WEC) verifying that all resources packaged in a ManifestWork have been unpacked and applied locally.

* **Real-Life Analogy:** A signed and stamped delivery acknowledgment slip confirming every crate has arrived and been placed on store shelves.
* **Why It Matters:** Proves to the central control plane that the application is running on the target cluster rather than lost in transit.

### [ArgoCD to WDS — GitOps Multi-Cluster Integration](kubestellar/argo-to-wds1.md) <a id="argocd-to-wds"></a>

A GitOps integration pattern where ArgoCD commits repository manifests into KubeStellar's Workload Description Space (WDS), allowing KubeStellar to fan out distribution across target clusters.

* **Real-Life Analogy:** An author delivering their master manuscript to a central publisher who handles printing and global distribution to 500 bookstores.
* **Why It Matters:** Removes the complexity of configuring ArgoCD to manage credentials for dozens of individual remote clusters.

---

## B <a id="b"></a>

### [Binding — Resolved Binding Object](kubestellar/binding.md) <a id="binding"></a>

An internal compiled object created by the KubeStellar Controller Manager listing the exact resolved workloads and the exact target clusters selected by an active BindingPolicy.

* **Real-Life Analogy:** A finalized shipping manifest listing carton IDs paired with specific truck license plates ready for departure.
* **Why It Matters:** Serves as the concrete order used by transport controllers to deliver manifests to execution clusters.

### [BindingPolicy — Multi-Cluster Placement Rule](kubestellar/control.md) <a id="bindingpolicy"></a>

A Kubernetes Custom Resource (CRD) (`bindingpolicies.kubestellar.io`) specifying which application workloads should be deployed to which target clusters based on cluster label selectors.

* **Real-Life Analogy:** Fulfillment center routing rules — "All packages labeled 'Refrigerated' must automatically be placed in temperature-controlled trucks."
* **Why It Matters:** Enables dynamic deployment — when a new cluster with matching labels is registered, workloads deploy to it automatically without manual commands.

### [BindingPolicyResolution — Policy Evaluation Process](kubestellar/architecture.md) <a id="bindingpolicyresolution"></a>

The controller reconciliation process that matches cluster inventory labels against policy rules to produce active bindings.

* **Real-Life Analogy:** An automated conveyor belt scanner reading barcodes on incoming boxes and flipping mechanical switches to slide each box into the correct loading bay.
* **Why It Matters:** Dynamically adapts application routing whenever clusters join, leave, or change labels.

---

## C <a id="c"></a>

### [Claude Code Plugin — Anthropic CLI Agent Integration](kubestellar/claude-code.md) <a id="claude-code"></a>

An MCP-based CLI plugin connecting Anthropic's Claude Code agent to KubeStellar for natural language multi-cluster deployments and troubleshooting.

* **Real-Life Analogy:** A licensed bilingual interpreter sitting next to a chief engineer, translating spoken English instructions into precise machine blueprints.
* **Why It Matters:** Gives developers an AI pair-programmer that can directly inspect and fix multi-cluster issues from the terminal.

### [clusteradm — OCM Administration CLI](kubestellar/pre-reqs.md) <a id="clusteradm"></a>

The CLI utility for Open Cluster Management (OCM) used to initialize hubs, generate join tokens, and register spoke clusters (WECs) with an ITS space.

* **Real-Life Analogy:** A corporate security officer's badge-issuing desk that verifies and registers new branch offices into the central directory.
* **Why It Matters:** Required to establish the cluster inventory and communication channels in an ITS space.

### [CombinedStatus — Aggregated Workload Status](kubestellar/combined-status.md) <a id="combinedstatus"></a>

A custom status aggregation mechanism in KubeStellar that rolls up workload execution states from dozens of clusters into a single unified summary inside the WDS.

* **Real-Life Analogy:** A national election tally board consolidating precinct votes into a single summary percentage on live television.
* **Why It Matters:** Eliminates the need for engineers to inspect pod statuses across 50 clusters individually.

### [ControlPlane — KubeFlex Virtual API Server](kubeflex/architecture.md) <a id="controlplane"></a>

A custom resource managed by KubeFlex representing a dedicated, virtual Kubernetes API server instance running inside the hosting cluster.

* **Real-Life Analogy:** An independent virtual private office inside a co-working space that has its own reception desk and filing cabinet while sharing utilities.
* **Why It Matters:** The underlying building block that powers KubeStellar's isolated WDS and ITS spaces.

### [CustomTransform — Per-Cluster Manifest Mutation](kubestellar/transforming.md) <a id="customtransform"></a>

Rules enabling manifest modifications before delivery, allowing cluster-specific adjustments (such as storage classes or replica counts) without altering the source manifest.

* **Real-Life Analogy:** A universal electrical travel adapter — the appliance stays the same, but the plug adapts to local socket standards automatically.
* **Why It Matters:** Removes the burden of maintaining separate, near-identical YAML files for every cluster environment.

---

## D <a id="d"></a>

### [DCO — Developer Certificate of Origin](contributing/contributing.md) <a id="dco"></a>

A legal verification standard in open-source projects asserting that a contributor created the code and has rights to submit it, indicated via `git commit -s`.

* **Real-Life Analogy:** Signing an authenticity waiver on an artwork before donating it to a museum, affirming you painted it yourself.
* **Why It Matters:** Mandatory for all code and documentation pull requests submitted to KubeStellar.

### [Downsync — Manifest Distribution Process](kubestellar/architecture.md) <a id="downsync"></a>

The automated process of pushing desired application manifests from the central WDS down to target execution clusters (WECs).

* **Real-Life Analogy:** A restaurant franchise headquarters transmitting new seasonal recipes downstream to all local restaurant kitchens.
* **Why It Matters:** The primary delivery mechanism that keeps all your remote clusters synchronized with the desired state.

### [Drasi Integration — Continuous Change Detection](console/drasi-dashboard.md) <a id="drasi"></a>

A continuous change-detection system integrated into KubeStellar Console for tracking event streams and real-time state changes across multi-cluster environments.

* **Real-Life Analogy:** An intelligent motion-sensor security alarm that stays completely silent during normal operations, but instantly chimes the second an unexpected door is opened.
* **Why It Matters:** Delivers instant reactive updates to the Console without constant, resource-heavy polling loops.

### [Drift Detection — State Discrepancy Monitoring](console/security-model.md) <a id="drift-detection"></a>

Continuous background monitoring that detects any divergence between the defined manifest in WDS and the live state running on remote clusters.

* **Real-Life Analogy:** A quality auditor checking retail store shelves against the corporate planogram to catch unauthorized local changes.
* **Why It Matters:** Prevents unauthorized modifications and configuration drift across distributed environments.

---

## E <a id="e"></a>

### [Edge Cluster — Remote Offline-Capable Cluster](kubestellar/architecture.md) <a id="edge-cluster"></a>

A small-footprint Kubernetes cluster located physically close to data sources (e.g., factories, cell towers, retail stores) with intermittent network connectivity.

* **Real-Life Analogy:** A self-checkout register in a rural grocery store that keeps scanning items and printing receipts even when the main internet line is temporarily cut.
* **Why It Matters:** KubeStellar's asynchronous transport natively supports edge clusters without requiring uninterrupted connectivity.

---

## F <a id="f"></a>

### [Fleet Management — Multi-Cluster Operations](console/readme.md) <a id="fleet-management"></a>

The operational practice of deploying, configuring, and monitoring dozens or hundreds of distributed Kubernetes clusters as a unified system rather than one-by-one.

* **Real-Life Analogy:** An airline's central dispatch center overseeing maintenance, routes, and fuel levels for 500 airplanes across 50 airports from one room.
* **Why It Matters:** Allows lean engineering teams to operate massive distributed footprints without scaling headcount proportionally.

---

## G <a id="g"></a>

### [GVRC Discovery — Group-Version-Resource-Cluster](a2a/intro.md) <a id="gvrc"></a>

The discovery mechanism used by KubeStellar A2A agents to resolve Kubernetes API types across multiple clusters simultaneously.

* **Real-Life Analogy:** A universal electronic directory at the United Nations that automatically looks up official titles and departments across 190 member nations.
* **Why It Matters:** Enables AI agents to find custom resources dynamically without hardcoding schema names.

---

## H <a id="h"></a>

### [Hosting Cluster — KubeFlex Base Cluster](kubestellar/acquire-hosting-cluster.md) <a id="hosting-cluster"></a>

The base Kubernetes cluster on which KubeFlex and the core KubeStellar controllers run. It hosts the virtual spaces (WDS, ITS) without running user workloads itself.

* **Real-Life Analogy:** The main corporate headquarters building that houses executive offices and planning departments, distinct from regional manufacturing plants.
* **Why It Matters:** Serves as the control hub running management controllers while keeping compute workloads separated on execution clusters.

---

## I <a id="i"></a>

### [ITS — Inventory and Transport Space](kubestellar/its.md) <a id="its"></a>

A dedicated control space that tracks registered clusters, evaluates inventory, and coordinates manifest delivery to execution clusters via OCM.

* **Real-Life Analogy:** A central postal sorting depot and delivery garage — it doesn't write letters, but it maintains all branch addresses and runs delivery trucks.
* **Why It Matters:** Provides the reliable, decoupled transport layer between workload definitions and remote execution clusters.

---

## K <a id="k"></a>

### [KAgenti — Multi-LLM Provider Layer](console/kagenti-llm-provider-setup.md) <a id="kagenti"></a>

An LLM provider abstraction layer in KubeStellar Console allowing connection to private and public AI inference endpoints.

* **Real-Life Analogy:** A universal payment terminal that accepts Visa, Mastercard, or local bank cards without changing card readers.
* **Why It Matters:** Enables users to swap between OpenAI, Claude, Gemini, or local models without rewriting code.

### [kc-agent — Kubeconfig Bridge Daemon](console/architecture.md) <a id="kc-agent"></a>

A local background helper that bridges the web-based Console browser to your local cluster credentials safely.

* **Real-Life Analogy:** An authorized bank teller at a drive-through window who takes your paper slip through a tube and accesses the vault without giving you the vault key.
* **Why It Matters:** Enforces security by preventing the web browser from directly accessing or exposing sensitive credentials over external networks.

### [KubeFlex — Virtual Control Plane Platform](kubeflex/readme.md) <a id="kubeflex"></a>

A platform that runs multiple lightweight, virtual Kubernetes control planes inside a single hosting cluster without needing separate physical machines.

* **Real-Life Analogy:** A modern co-working building that partitions a single floor into private, locked office suites sharing the same power and plumbing.
* **Why It Matters:** Drastically cuts infrastructure costs by hosting WDS and ITS spaces as virtual control planes on a single machine.

### [KubeStellar Console — Web Management Interface](console/readme.md) <a id="kubestellar-console"></a>

The web-based visual management interface for KubeStellar featuring fleet health monitoring, interactive cards, and AI Mission control.

* **Real-Life Analogy:** An airport air-traffic control tower displaying live radars and flight paths of all incoming and outgoing planes on unified screens.
* **Why It Matters:** Allows non-coders, managers, and platform engineers to operate multi-cluster fleets with intuitive graphical controls rather than raw terminals.

### [KubeStellar Core — Foundational Controller Engine](kubestellar/architecture.md) <a id="kubestellar-core"></a>

The core multi-cluster orchestration engine consisting of the controller managers, pluggable transport controllers, and CRDs that deliver declarative multi-cluster automation.

* **Real-Life Analogy:** An aircraft's jet engine and automated hydraulic systems — invisible to passengers in the cabin, but doing the mechanical work keeping the plane flying.
* **Why It Matters:** Runs headless in the background to guarantee that desired states are continuously reconciled across clusters.

### [KubeStellar-MCP — Model Context Protocol Suite](kubestellar-mcp/index.md) <a id="kubestellar-mcp"></a>

The Model Context Protocol plugin suite (`kubestellar-ops` and `kubestellar-deploy`) allowing AI coding agents to discover cluster topologies and perform deployments.

* **Real-Life Analogy:** A universal diagnostic cable that allows any computer to plug directly into an engine's internal sensor computer.
* **Why It Matters:** Connects AI agents like Claude Code directly to KubeStellar operations safely.

### [KubeVirt Support — Virtual Machine Management](kubestellar/architecture.md) <a id="kubevirt"></a>

KubeStellar capability to distribute and manage virtual machines running via KubeVirt alongside containerized workloads across multi-cluster environments.

* **Real-Life Analogy:** A freight carrier engineered to transport standard shipping containers and antique crated automobiles on the exact same ship deck.
* **Why It Matters:** Enables hybrid modernization without needing separate tools for legacy VMs and modern containers.

---

## M <a id="m"></a>

### [Mailbox Namespace — Per-WEC Delivery Inbox](kubestellar/architecture.md) <a id="mailbox-namespace"></a>

A dedicated namespace created inside the ITS for each registered WEC where manifests destined for that cluster are placed as ManifestWork objects.

* **Real-Life Analogy:** A dedicated, labeled pigeonhole cubby in an office mailroom designated for a specific branch office's mail.
* **Why It Matters:** Isolates cluster delivery pipelines so clusters cannot interfere with or see each other's workloads.

### [ManagedCluster — OCM Registered Spoke Cluster](kubestellar/architecture.md) <a id="managedcluster"></a>

An OCM custom resource inside the ITS representing a registered spoke cluster and holding its metadata, labels, and connection status.

* **Real-Life Analogy:** An official employee personnel file in HR listing employee qualifications, work location, and badge status.
* **Why It Matters:** Where cluster labels reside for BindingPolicy selectors to evaluate.

### [ManifestWork — OCM Transport Package Envelope](kubestellar/architecture.md) <a id="manifestwork"></a>

An Open Cluster Management resource created in the mailbox namespace packaging Kubernetes manifests for delivery to a target spoke cluster.

* **Real-Life Analogy:** A sealed, tamper-evident courier envelope containing the blueprints and assembly instructions for a local machine.
* **Why It Matters:** Bundles individual Kubernetes YAML manifests into an atomic unit for reliable transmission.

### [Model Context Protocol (MCP)](kubestellar-mcp/index.md) <a id="mcp"></a>

An open standard communication protocol that allows AI assistants (Claude, Cursor, Gemini) to call tools and retrieve cluster telemetry safely.

* **Real-Life Analogy:** Standard electrical wall sockets — ensuring any appliance can plug in and draw power without custom rewiring.
* **Why It Matters:** Powers the AI capabilities of both the KubeStellar Console and external AI agents.

### [MCP Bridge — Console In-Process Tool Host](console/architecture.md) <a id="mcp-bridge"></a>

The in-process server inside the KubeStellar Console binary that runs `kubestellar-ops` and `kubestellar-deploy` tools over HTTP/MCP.

* **Real-Life Analogy:** An internal voltage transformer built into an appliance converting wall current into delicate chip power.
* **Why It Matters:** Allows the Console backend to query cluster state using the exact same tools that AI agents use.

### [Multi-WEC Aggregated Status — Cross-Cluster Rollup](kubestellar/multi-wec-aggregated-status.md) <a id="multi-wec-aggregated-status"></a>

A feature that rolls up workload status across multiple execution clusters into concise conditions within the WDS.

* **Real-Life Analogy:** A school principal's attendance screen showing "98% present" instead of listing 1,500 individual student names.
* **Why It Matters:** Protects the management plane from being flooded by thousands of raw status events.

---

## O <a id="o"></a>

### [Open Cluster Management (OCM)](kubestellar/architecture.md) <a id="ocm"></a>

A CNCF sandbox project providing modular multi-cluster infrastructure, used by KubeStellar as its default pluggable transport layer.

* **Real-Life Analogy:** The national highway system and postal truck fleet that provides roads and vehicles between cities.
* **Why It Matters:** Supplies the underlying spoke registration and manifest distribution protocols.

### [OCM Agent — Klusterlet Spoke Worker](kubestellar/architecture.md) <a id="ocm-agent"></a>

An agent running on each Workload Execution Cluster that pulls `ManifestWork` resources from its ITS mailbox namespace and applies them locally.

* **Real-Life Analogy:** The local dockmaster at a seaport who unloads incoming cargo containers and stores them in local warehouses.
* **Why It Matters:** Enables execution clusters to pull workloads asynchronously without opening inbound firewall ports.

### [OCM Status Add-On — OSA Status Telemetry Agent](kubestellar/ocm-status-addon-intro.md) <a id="ocm-status-addon"></a>

An add-on controller and agent that extracts pod execution statuses from WECs and writes `WorkStatus` updates back to the ITS.

* **Real-Life Analogy:** A field reporter stationed at a regional news desk filing nightly dispatches back to the capital headquarters.
* **Why It Matters:** Provides feedback so the management cluster knows whether containers are healthy.

### [OpenZiti Network Mesh — Zero-Trust Cluster Overlay](kubestellar/architecture.md) <a id="openziti"></a>

A programmable Zero Trust network overlay supported by KubeStellar to connect clusters securely across diverse clouds without public IP exposure or VPNs.

* **Real-Life Analogy:** A private, cloaked subterranean tunnel connecting bank branches across town, completely hidden from street traffic.
* **Why It Matters:** Connects edge clusters behind strict firewalls without open ports.

---

## P <a id="p"></a>

### [Pluggable Transport Controller — Modular Delivery Coordinator](kubestellar/architecture.md) <a id="pluggable-transport"></a>

A modular controller in KubeStellar that decouples the workload definition API from the underlying transport mechanism, allowing alternative transport backends beyond OCM.

* **Real-Life Analogy:** A modular dispatch manager who can hand parcels to FedEx, DHL, or rail freight without changing box labels.
* **Why It Matters:** Ensures KubeStellar's architecture is not locked into any single transport provider.

### [Post Office Model — Asynchronous Mailbox Architecture](kubestellar/architecture.md) <a id="post-office-model"></a>

The asynchronous delivery pattern where management clusters and execution clusters communicate exclusively through mailbox namespaces rather than synchronous RPC calls.

* **Real-Life Analogy:** Dropping outgoing envelopes into a roadside mailbox for couriers to collect rather than driving to each recipient's house.
* **Why It Matters:** Prevents cluster network hiccups from freezing the central management plane.

### [PostCreateHook — Automated Space Initialization Hook](kubeflex/architecture.md) <a id="postcreatehook"></a>

A KubeFlex hook executed automatically after a new virtual control plane is created to install initial CRDs, charts, and controllers.

* **Real-Life Analogy:** A smart-home welcome sequence that automatically turns on the refrigerator, sets AC, and unlocks doors when a new tenant arrives.
* **Why It Matters:** Fully automates the bootstrapping of WDS and ITS spaces.

---

## S <a id="s"></a>

### [Space — Virtual API Server Abstraction](kubestellar/architecture.md) <a id="space"></a>

An abstraction representing a Kubernetes API service that behaves like a standard kube-apiserver without managing containers directly (e.g., WDS or ITS).

* **Real-Life Analogy:** A virtual digital whiteboard where you can write and organize project sticky notes without buying physical bulletin boards.
* **Why It Matters:** Allows KubeStellar to maintain separate workspaces for definition and transport.

### [StatusCollector — Status Extraction Specification](kubestellar/combined-status.md) <a id="statuscollector"></a>

A KubeStellar custom resource defining which specific fields from workloads running on remote clusters should be reported back into the WDS.

* **Real-Life Analogy:** A medical checklist for visiting nurses specifying: "Only report blood pressure and heart rate back to the doctor; ignore room temperature."
* **Why It Matters:** Keeps reporting lightweight by filtering out unneeded status noise.

---

## U <a id="u"></a>

### [Upsync — Status Upward Reporting](kubestellar/combined-status.md) <a id="upsync"></a>

The upward transmission of live pod health, container execution statuses, and errors from remote clusters back to the central WDS.

* **Real-Life Analogy:** Regional retail store managers uploading their daily sales reports and equipment health logs back to headquarters every evening.
* **Why It Matters:** Gives operators centralized visibility to know if an application is running smoothly or failing across remote clusters without logging in manually.

---

## V <a id="v"></a>

### [vcluster — Virtual Kubernetes Cluster](console/vcluster-setup.md) <a id="vcluster"></a>

A fully functional virtual Kubernetes cluster running inside a regular Kubernetes namespace, used within KubeFlex hosting environments for lightweight control planes.

* **Real-Life Analogy:** A flight simulator cockpit inside an airplane hangar — you get the authentic cockpit controls without needing another runway.
* **Why It Matters:** Powers cost-effective local and production hosting of KubeStellar spaces.

---

## W <a id="w"></a>

### [wantSingletonReportedState — Single Cluster Pass-Through Rule](kubestellar/binding.md) <a id="wantsingletonreportedstate"></a>

A configuration field in a `BindingPolicy` specifying that if a workload is deployed to exactly one cluster, that cluster's full status should be copied directly into the WDS object's status.

* **Real-Life Analogy:** A live video feed from a solitary satellite — because there is only one camera, you stream it directly to the monitor without merging.
* **Why It Matters:** Makes single-cluster test deployments behave identically to native vanilla Kubernetes.

### [WDS — Workload Description Space](kubestellar/wds.md) <a id="wds"></a>

A central staging notepad where developers author and store application definitions (deployments, services) in standard Kubernetes YAML without worrying about target servers.

* **Real-Life Analogy:** An architect's master drafting table — this is where the blueprint is designed once, before being copied to individual construction sites.
* **Why It Matters:** Eliminates the tedious task of manually logging into 50 different clusters to paste the same configuration 50 times.

### [WEC — Workload Execution Cluster](kubestellar/wec.md) <a id="wec"></a>

The actual physical, cloud, or edge Kubernetes clusters where application containers are scheduled, executed, and served to end users.

* **Real-Life Analogy:** Regional factory floors and restaurant branches where goods are physically manufactured and served to customers.
* **Why It Matters:** These are the destination compute targets that KubeStellar automatically coordinates and synchronizes.

### [WorkStatus — Execution Condition Record](kubestellar/architecture.md) <a id="workstatus"></a>

A resource generated in the ITS mailbox namespace capturing the execution condition and sync status of an applied workload inside a WEC.

* **Real-Life Analogy:** A machine status beacon on a factory floor that signals green (running) or red (error) back to the maintenance dispatch room.
* **Why It Matters:** Serves as the raw telemetry source that feeds into CombinedStatus and health monitoring dashboards.
