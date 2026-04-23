---
title: "ACMM Leaderboard"
linkTitle: "ACMM Leaderboard"
weight: 15
description: >
  AI Codebase Maturity Model leaderboard scores for 289 CNCF & cloud-native projects
---

# ACMM Leaderboard — CNCF & Cloud-Native Projects

The [AI Codebase Maturity Model (ACMM)](https://console.kubestellar.io/acmm) measures how well a codebase adopts AI-assisted engineering practices. Scores are computed automatically by scanning repository structure, CI/CD patterns, and AI instruction files.

> **Snapshot generated:** 2026-04-22 · **Projects scanned:** 289
>
> This leaderboard is a point-in-time snapshot. Visit the [ACMM Dashboard](https://console.kubestellar.io/acmm) to scan any repository interactively for the latest score.

## How Scoring Works

The full ACMM model defines **33 feedback loops** across 5 maturity levels. This leaderboard evaluates **26 publicly detectable signals** from repository metadata, CI/CD configuration, and AI instruction files.

| Level | Emoji | Name | Description |
|:-----:|:-----:|------|-------------|
| L1 | ⚫ | Assisted | No AI-assisted development signals detected |
| L2 | ⚪ | Instructed | Has AI instruction files (CLAUDE.md, .cursorrules, etc.) |
| L3 | 🟡 | Measured | PR review rubric, quality dashboard, CI matrix |
| L4 | 🔵 | Adaptive | Auto-QA tuning, nightly compliance, AI-fix workflows |
| L5 | 🟢 | Semi-Automated | GitHub Actions AI, auto-QA self-tuning, public metrics |

Scores show **detected / 26** publicly detectable signals (out of the full 33 ACMM feedback loops).
Learn more: [ACMM on arXiv](https://arxiv.org/abs/2604.09388) · [Full ACMM Dashboard](https://console.kubestellar.io/acmm)

## Leaderboard

### Top 10 (with live badges)

| Rank | Project | Level | Score | Badge |
|-----:|---------|:-----:|------:|-------|
| 1 | [kubestellar/console](https://github.com/kubestellar/console) | L5 | 20/26 | [![ACMM](https://img.shields.io/endpoint?url=https%3A%2F%2Fconsole.kubestellar.io%2Fapi%2Facmm%2Fbadge%3Frepo%3Dkubestellar%2Fconsole)](https://console.kubestellar.io/acmm?repo=kubestellar%2Fconsole) |
| 2 | [chaos-mesh/chaos-mesh](https://github.com/chaos-mesh/chaos-mesh) | L2 | 6/26 | [![ACMM](https://img.shields.io/endpoint?url=https%3A%2F%2Fconsole.kubestellar.io%2Fapi%2Facmm%2Fbadge%3Frepo%3Dchaos-mesh%2Fchaos-mesh)](https://console.kubestellar.io/acmm?repo=chaos-mesh%2Fchaos-mesh) |
| 3 | [cilium/cilium](https://github.com/cilium/cilium) | L2 | 6/26 | [![ACMM](https://img.shields.io/endpoint?url=https%3A%2F%2Fconsole.kubestellar.io%2Fapi%2Facmm%2Fbadge%3Frepo%3Dcilium%2Fcilium)](https://console.kubestellar.io/acmm?repo=cilium%2Fcilium) |
| 4 | [backstage/backstage](https://github.com/backstage/backstage) | L2 | 5/26 | [![ACMM](https://img.shields.io/endpoint?url=https%3A%2F%2Fconsole.kubestellar.io%2Fapi%2Facmm%2Fbadge%3Frepo%3Dbackstage%2Fbackstage)](https://console.kubestellar.io/acmm?repo=backstage%2Fbackstage) |
| 5 | [containerd/containerd](https://github.com/containerd/containerd) | L2 | 5/26 | [![ACMM](https://img.shields.io/endpoint?url=https%3A%2F%2Fconsole.kubestellar.io%2Fapi%2Facmm%2Fbadge%3Frepo%3Dcontainerd%2Fcontainerd)](https://console.kubestellar.io/acmm?repo=containerd%2Fcontainerd) |
| 6 | [cri-o/cri-o](https://github.com/cri-o/cri-o) | L2 | 5/26 | [![ACMM](https://img.shields.io/endpoint?url=https%3A%2F%2Fconsole.kubestellar.io%2Fapi%2Facmm%2Fbadge%3Frepo%3Dcri-o%2Fcri-o)](https://console.kubestellar.io/acmm?repo=cri-o%2Fcri-o) |
| 7 | [meshery/meshery](https://github.com/meshery/meshery) | L2 | 5/26 | [![ACMM](https://img.shields.io/endpoint?url=https%3A%2F%2Fconsole.kubestellar.io%2Fapi%2Facmm%2Fbadge%3Frepo%3Dmeshery%2Fmeshery)](https://console.kubestellar.io/acmm?repo=meshery%2Fmeshery) |
| 8 | [runatlantis/atlantis](https://github.com/runatlantis/atlantis) | L2 | 5/26 | [![ACMM](https://img.shields.io/endpoint?url=https%3A%2F%2Fconsole.kubestellar.io%2Fapi%2Facmm%2Fbadge%3Frepo%3Drunatlantis%2Fatlantis)](https://console.kubestellar.io/acmm?repo=runatlantis%2Fatlantis) |
| 9 | [alibaba/higress](https://github.com/alibaba/higress) | L2 | 4/26 | [![ACMM](https://img.shields.io/endpoint?url=https%3A%2F%2Fconsole.kubestellar.io%2Fapi%2Facmm%2Fbadge%3Frepo%3Dalibaba%2Fhigress)](https://console.kubestellar.io/acmm?repo=alibaba%2Fhigress) |
| 10 | [armadaproject/armada](https://github.com/armadaproject/armada) | L2 | 4/26 | [![ACMM](https://img.shields.io/endpoint?url=https%3A%2F%2Fconsole.kubestellar.io%2Fapi%2Facmm%2Fbadge%3Frepo%3Darmadaproject%2Farmada)](https://console.kubestellar.io/acmm?repo=armadaproject%2Farmada) |

### All Projects

| Rank | Project | Level | Score | Details |
|-----:|---------|:-----:|------:|---------|
| 1 | [kubestellar/console](https://github.com/kubestellar/console) | 🟢 L5 | 20/26 | [View](https://console.kubestellar.io/acmm?repo=kubestellar%2Fconsole) |
| 2 | [chaos-mesh/chaos-mesh](https://github.com/chaos-mesh/chaos-mesh) | ⚪ L2 | 6/26 | [View](https://console.kubestellar.io/acmm?repo=chaos-mesh%2Fchaos-mesh) |
| 3 | [cilium/cilium](https://github.com/cilium/cilium) | ⚪ L2 | 6/26 | [View](https://console.kubestellar.io/acmm?repo=cilium%2Fcilium) |
| 4 | [backstage/backstage](https://github.com/backstage/backstage) | ⚪ L2 | 5/26 | [View](https://console.kubestellar.io/acmm?repo=backstage%2Fbackstage) |
| 5 | [containerd/containerd](https://github.com/containerd/containerd) | ⚪ L2 | 5/26 | [View](https://console.kubestellar.io/acmm?repo=containerd%2Fcontainerd) |
| 6 | [cri-o/cri-o](https://github.com/cri-o/cri-o) | ⚪ L2 | 5/26 | [View](https://console.kubestellar.io/acmm?repo=cri-o%2Fcri-o) |
| 7 | [meshery/meshery](https://github.com/meshery/meshery) | ⚪ L2 | 5/26 | [View](https://console.kubestellar.io/acmm?repo=meshery%2Fmeshery) |
| 8 | [runatlantis/atlantis](https://github.com/runatlantis/atlantis) | ⚪ L2 | 5/26 | [View](https://console.kubestellar.io/acmm?repo=runatlantis%2Fatlantis) |
| 9 | [alibaba/higress](https://github.com/alibaba/higress) | ⚪ L2 | 4/26 | [View](https://console.kubestellar.io/acmm?repo=alibaba%2Fhigress) |
| 10 | [armadaproject/armada](https://github.com/armadaproject/armada) | ⚪ L2 | 4/26 | [View](https://console.kubestellar.io/acmm?repo=armadaproject%2Farmada) |
| 11 | [bootc-dev/bootc](https://github.com/bootc-dev/bootc) | ⚪ L2 | 4/26 | [View](https://console.kubestellar.io/acmm?repo=bootc-dev%2Fbootc) |
| 12 | [containers/podman](https://github.com/containers/podman) | ⚪ L2 | 4/26 | [View](https://console.kubestellar.io/acmm?repo=containers%2Fpodman) |
| 13 | [distribution/distribution](https://github.com/distribution/distribution) | ⚪ L2 | 4/26 | [View](https://console.kubestellar.io/acmm?repo=distribution%2Fdistribution) |
| 14 | [kagent-dev/kagent](https://github.com/kagent-dev/kagent) | ⚪ L2 | 4/26 | [View](https://console.kubestellar.io/acmm?repo=kagent-dev%2Fkagent) |
| 15 | [kubestellar/kubestellar](https://github.com/kubestellar/kubestellar) | ⚪ L2 | 4/26 | [View](https://console.kubestellar.io/acmm?repo=kubestellar%2Fkubestellar) |
| 16 | [radius-project/radius](https://github.com/radius-project/radius) | ⚪ L2 | 4/26 | [View](https://console.kubestellar.io/acmm?repo=radius-project%2Fradius) |
| 17 | [runmedev/runme](https://github.com/runmedev/runme) | ⚪ L2 | 4/26 | [View](https://console.kubestellar.io/acmm?repo=runmedev%2Frunme) |
| 18 | [shipwright-io/build](https://github.com/shipwright-io/build) | ⚪ L2 | 4/26 | [View](https://console.kubestellar.io/acmm?repo=shipwright-io%2Fbuild) |
| 19 | [WasmEdge/WasmEdge](https://github.com/WasmEdge/WasmEdge) | ⚪ L2 | 4/26 | [View](https://console.kubestellar.io/acmm?repo=WasmEdge%2FWasmEdge) |
| 20 | [cloud-custodian/cloud-custodian](https://github.com/cloud-custodian/cloud-custodian) | ⚫ L1 | 3/26 | [View](https://console.kubestellar.io/acmm?repo=cloud-custodian%2Fcloud-custodian) |
| 21 | [clusterpedia-io/clusterpedia](https://github.com/clusterpedia-io/clusterpedia) | ⚪ L2 | 3/26 | [View](https://console.kubestellar.io/acmm?repo=clusterpedia-io%2Fclusterpedia) |
| 22 | [cortexproject/cortex](https://github.com/cortexproject/cortex) | ⚪ L2 | 3/26 | [View](https://console.kubestellar.io/acmm?repo=cortexproject%2Fcortex) |
| 23 | [cubeFS/cubefs](https://github.com/cubeFS/cubefs) | ⚪ L2 | 3/26 | [View](https://console.kubestellar.io/acmm?repo=cubeFS%2Fcubefs) |
| 24 | [dapr/dapr](https://github.com/dapr/dapr) | ⚪ L2 | 3/26 | [View](https://console.kubestellar.io/acmm?repo=dapr%2Fdapr) |
| 25 | [drasi-project/drasi-platform](https://github.com/drasi-project/drasi-platform) | ⚪ L2 | 3/26 | [View](https://console.kubestellar.io/acmm?repo=drasi-project%2Fdrasi-platform) |
| 26 | [flomesh-io/fsm](https://github.com/flomesh-io/fsm) | ⚪ L2 | 3/26 | [View](https://console.kubestellar.io/acmm?repo=flomesh-io%2Ffsm) |
| 27 | [grpc/grpc](https://github.com/grpc/grpc) | ⚪ L2 | 3/26 | [View](https://console.kubestellar.io/acmm?repo=grpc%2Fgrpc) |
| 28 | [harvester/harvester](https://github.com/harvester/harvester) | ⚪ L2 | 3/26 | [View](https://console.kubestellar.io/acmm?repo=harvester%2Fharvester) |
| 29 | [istio/istio](https://github.com/istio/istio) | ⚪ L2 | 3/26 | [View](https://console.kubestellar.io/acmm?repo=istio%2Fistio) |
| 30 | [k8gb-io/k8gb](https://github.com/k8gb-io/k8gb) | ⚫ L1 | 3/26 | [View](https://console.kubestellar.io/acmm?repo=k8gb-io%2Fk8gb) |
| 31 | [karmada-io/karmada](https://github.com/karmada-io/karmada) | ⚪ L2 | 3/26 | [View](https://console.kubestellar.io/acmm?repo=karmada-io%2Fkarmada) |
| 32 | [kedacore/keda](https://github.com/kedacore/keda) | ⚪ L2 | 3/26 | [View](https://console.kubestellar.io/acmm?repo=kedacore%2Fkeda) |
| 33 | [kitops-ml/kitops](https://github.com/kitops-ml/kitops) | ⚪ L2 | 3/26 | [View](https://console.kubestellar.io/acmm?repo=kitops-ml%2Fkitops) |
| 34 | [kserve/kserve](https://github.com/kserve/kserve) | ⚪ L2 | 3/26 | [View](https://console.kubestellar.io/acmm?repo=kserve%2Fkserve) |
| 35 | [kubernetes-sigs/external-dns](https://github.com/kubernetes-sigs/external-dns) | ⚪ L2 | 3/26 | [View](https://console.kubestellar.io/acmm?repo=kubernetes-sigs%2Fexternal-dns) |
| 36 | [kubesphere/kubesphere](https://github.com/kubesphere/kubesphere) | ⚪ L2 | 3/26 | [View](https://console.kubestellar.io/acmm?repo=kubesphere%2Fkubesphere) |
| 37 | [kumahq/kuma](https://github.com/kumahq/kuma) | ⚪ L2 | 3/26 | [View](https://console.kubestellar.io/acmm?repo=kumahq%2Fkuma) |
| 38 | [oauth2-proxy/oauth2-proxy](https://github.com/oauth2-proxy/oauth2-proxy) | ⚫ L1 | 3/26 | [View](https://console.kubestellar.io/acmm?repo=oauth2-proxy%2Foauth2-proxy) |
| 39 | [open-cluster-management-io/ocm](https://github.com/open-cluster-management-io/ocm) | ⚪ L2 | 3/26 | [View](https://console.kubestellar.io/acmm?repo=open-cluster-management-io%2Focm) |
| 40 | [ovn-kubernetes/ovn-kubernetes](https://github.com/ovn-kubernetes/ovn-kubernetes) | ⚪ L2 | 3/26 | [View](https://console.kubestellar.io/acmm?repo=ovn-kubernetes%2Fovn-kubernetes) |
| 41 | [ratify-project/ratify](https://github.com/ratify-project/ratify) | ⚫ L1 | 3/26 | [View](https://console.kubestellar.io/acmm?repo=ratify-project%2Fratify) |
| 42 | [sealerio/sealer](https://github.com/sealerio/sealer) | ⚪ L2 | 3/26 | [View](https://console.kubestellar.io/acmm?repo=sealerio%2Fsealer) |
| 43 | [slimtoolkit/slim](https://github.com/slimtoolkit/slim) | ⚪ L2 | 3/26 | [View](https://console.kubestellar.io/acmm?repo=slimtoolkit%2Fslim) |
| 44 | [antrea-io/antrea](https://github.com/antrea-io/antrea) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=antrea-io%2Fantrea) |
| 45 | [athenz/athenz](https://github.com/athenz/athenz) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=athenz%2Fathenz) |
| 46 | [buildpacks/pack](https://github.com/buildpacks/pack) | ⚫ L1 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=buildpacks%2Fpack) |
| 47 | [cdk8s-team/cdk8s](https://github.com/cdk8s-team/cdk8s) | ⚫ L1 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=cdk8s-team%2Fcdk8s) |
| 48 | [chaosblade-io/chaosblade](https://github.com/chaosblade-io/chaosblade) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=chaosblade-io%2Fchaosblade) |
| 49 | [devspace-sh/devspace](https://github.com/devspace-sh/devspace) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=devspace-sh%2Fdevspace) |
| 50 | [dexidp/dex](https://github.com/dexidp/dex) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=dexidp%2Fdex) |
| 51 | [dragonflyoss/dragonfly](https://github.com/dragonflyoss/dragonfly) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=dragonflyoss%2Fdragonfly) |
| 52 | [emissary-ingress/emissary](https://github.com/emissary-ingress/emissary) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=emissary-ingress%2Femissary) |
| 53 | [external-secrets/external-secrets](https://github.com/external-secrets/external-secrets) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=external-secrets%2Fexternal-secrets) |
| 54 | [fluxcd/flux2](https://github.com/fluxcd/flux2) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=fluxcd%2Fflux2) |
| 55 | [green-coding-solutions/green-metrics-tool](https://github.com/green-coding-solutions/green-metrics-tool) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=green-coding-solutions%2Fgreen-metrics-tool) |
| 56 | [HolmesGPT/holmesgpt](https://github.com/HolmesGPT/holmesgpt) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=HolmesGPT%2Fholmesgpt) |
| 57 | [hwameistor/hwameistor](https://github.com/hwameistor/hwameistor) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=hwameistor%2Fhwameistor) |
| 58 | [hyperlight-dev/hyperlight](https://github.com/hyperlight-dev/hyperlight) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=hyperlight-dev%2Fhyperlight) |
| 59 | [in-toto/in-toto](https://github.com/in-toto/in-toto) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=in-toto%2Fin-toto) |
| 60 | [jaegertracing/jaeger](https://github.com/jaegertracing/jaeger) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=jaegertracing%2Fjaeger) |
| 61 | [k8up-io/k8up](https://github.com/k8up-io/k8up) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=k8up-io%2Fk8up) |
| 62 | [kai-scheduler/KAI-Scheduler](https://github.com/kai-scheduler/KAI-Scheduler) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=kai-scheduler%2FKAI-Scheduler) |
| 63 | [kcl-lang/kcl](https://github.com/kcl-lang/kcl) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=kcl-lang%2Fkcl) |
| 64 | [kedgeproject/kedge](https://github.com/kedgeproject/kedge) | ⚫ L1 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=kedgeproject%2Fkedge) |
| 65 | [keycloak/keycloak](https://github.com/keycloak/keycloak) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=keycloak%2Fkeycloak) |
| 66 | [knative/eventing](https://github.com/knative/eventing) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=knative%2Feventing) |
| 67 | [kube-logging/logging-operator](https://github.com/kube-logging/logging-operator) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=kube-logging%2Flogging-operator) |
| 68 | [kubean-io/kubean](https://github.com/kubean-io/kubean) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=kubean-io%2Fkubean) |
| 69 | [kubecost/opencost](https://github.com/kubecost/opencost) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=kubecost%2Fopencost) |
| 70 | [kubeedge/kubeedge](https://github.com/kubeedge/kubeedge) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=kubeedge%2Fkubeedge) |
| 71 | [kubefirst/kubefirst](https://github.com/kubefirst/kubefirst) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=kubefirst%2Fkubefirst) |
| 72 | [kubefleet-dev/kubefleet](https://github.com/kubefleet-dev/kubefleet) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=kubefleet-dev%2Fkubefleet) |
| 73 | [kubernetes-sigs/kubebuilder](https://github.com/kubernetes-sigs/kubebuilder) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=kubernetes-sigs%2Fkubebuilder) |
| 74 | [kubevirt/kubevirt](https://github.com/kubevirt/kubevirt) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=kubevirt%2Fkubevirt) |
| 75 | [kubewarden/kubewarden-controller](https://github.com/kubewarden/kubewarden-controller) | ⚫ L1 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=kubewarden%2Fkubewarden-controller) |
| 76 | [lima-vm/lima](https://github.com/lima-vm/lima) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=lima-vm%2Flima) |
| 77 | [microcks/microcks](https://github.com/microcks/microcks) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=microcks%2Fmicrocks) |
| 78 | [nats-io/nats-server](https://github.com/nats-io/nats-server) | ⚫ L1 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=nats-io%2Fnats-server) |
| 79 | [notaryproject/notation](https://github.com/notaryproject/notation) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=notaryproject%2Fnotation) |
| 80 | [open-policy-agent/opa](https://github.com/open-policy-agent/opa) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=open-policy-agent%2Fopa) |
| 81 | [open-telemetry/community](https://github.com/open-telemetry/community) | ⚫ L1 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=open-telemetry%2Fcommunity) |
| 82 | [open-telemetry/opentelemetry-collector](https://github.com/open-telemetry/opentelemetry-collector) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=open-telemetry%2Fopentelemetry-collector) |
| 83 | [openclarity/openclarity](https://github.com/openclarity/openclarity) | ⚫ L1 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=openclarity%2Fopenclarity) |
| 84 | [opencost/opencost](https://github.com/opencost/opencost) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=opencost%2Fopencost) |
| 85 | [openfga/openfga](https://github.com/openfga/openfga) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=openfga%2Fopenfga) |
| 86 | [openGemini/openGemini](https://github.com/openGemini/openGemini) | ⚫ L1 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=openGemini%2FopenGemini) |
| 87 | [opentofu/opentofu](https://github.com/opentofu/opentofu) | ⚫ L1 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=opentofu%2Fopentofu) |
| 88 | [oxia-db/oxia](https://github.com/oxia-db/oxia) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=oxia-db%2Foxia) |
| 89 | [parallaxsecond/parsec](https://github.com/parallaxsecond/parsec) | ⚫ L1 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=parallaxsecond%2Fparsec) |
| 90 | [pipe-cd/pipecd](https://github.com/pipe-cd/pipecd) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=pipe-cd%2Fpipecd) |
| 91 | [podman-desktop/podman-desktop](https://github.com/podman-desktop/podman-desktop) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=podman-desktop%2Fpodman-desktop) |
| 92 | [project-copacetic/copacetic](https://github.com/project-copacetic/copacetic) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=project-copacetic%2Fcopacetic) |
| 93 | [project-dalec/dalec](https://github.com/project-dalec/dalec) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=project-dalec%2Fdalec) |
| 94 | [prometheus/prometheus](https://github.com/prometheus/prometheus) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=prometheus%2Fprometheus) |
| 95 | [sealos-ci-robot/sealos](https://github.com/sealos-ci-robot/sealos) | ⚫ L1 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=sealos-ci-robot%2Fsealos) |
| 96 | [strimzi/strimzi-kafka-operator](https://github.com/strimzi/strimzi-kafka-operator) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=strimzi%2Fstrimzi-kafka-operator) |
| 97 | [tektoncd/pipeline](https://github.com/tektoncd/pipeline) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=tektoncd%2Fpipeline) |
| 98 | [telepresenceio/telepresence](https://github.com/telepresenceio/telepresence) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=telepresenceio%2Ftelepresence) |
| 99 | [tikv/tikv](https://github.com/tikv/tikv) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=tikv%2Ftikv) |
| 100 | [trickstercache/trickster](https://github.com/trickstercache/trickster) | ⚫ L1 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=trickstercache%2Ftrickster) |
| 101 | [virtual-kubelet/virtual-kubelet](https://github.com/virtual-kubelet/virtual-kubelet) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=virtual-kubelet%2Fvirtual-kubelet) |
| 102 | [vitessio/vitess](https://github.com/vitessio/vitess) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=vitessio%2Fvitess) |
| 103 | [werf/werf](https://github.com/werf/werf) | ⚪ L2 | 2/26 | [View](https://console.kubestellar.io/acmm?repo=werf%2Fwerf) |
| 104 | [agones-dev/agones](https://github.com/agones-dev/agones) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=agones-dev%2Fagones) |
| 105 | [argoproj/argo-cd](https://github.com/argoproj/argo-cd) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=argoproj%2Fargo-cd) |
| 106 | [artifacthub/hub](https://github.com/artifacthub/hub) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=artifacthub%2Fhub) |
| 107 | [bank-vaults/bank-vaults](https://github.com/bank-vaults/bank-vaults) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=bank-vaults%2Fbank-vaults) |
| 108 | [bfenetworks/bfe](https://github.com/bfenetworks/bfe) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=bfenetworks%2Fbfe) |
| 109 | [bpfman/bpfman](https://github.com/bpfman/bpfman) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=bpfman%2Fbpfman) |
| 110 | [cadence-workflow/cadence](https://github.com/cadence-workflow/cadence) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=cadence-workflow%2Fcadence) |
| 111 | [cartography-cncf/cartography](https://github.com/cartography-cncf/cartography) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=cartography-cncf%2Fcartography) |
| 112 | [cedar-policy/cedar](https://github.com/cedar-policy/cedar) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=cedar-policy%2Fcedar) |
| 113 | [cert-manager/cert-manager](https://github.com/cert-manager/cert-manager) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=cert-manager%2Fcert-manager) |
| 114 | [clusternet/clusternet](https://github.com/clusternet/clusternet) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=clusternet%2Fclusternet) |
| 115 | [cni-genie/CNI-Genie](https://github.com/cni-genie/CNI-Genie) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=cni-genie%2FCNI-Genie) |
| 116 | [confidential-containers/cloud-api-adaptor](https://github.com/confidential-containers/cloud-api-adaptor) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=confidential-containers%2Fcloud-api-adaptor) |
| 117 | [containerssh/containerssh](https://github.com/containerssh/containerssh) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=containerssh%2Fcontainerssh) |
| 118 | [cozystack/cozystack](https://github.com/cozystack/cozystack) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=cozystack%2Fcozystack) |
| 119 | [crossplane/crossplane](https://github.com/crossplane/crossplane) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=crossplane%2Fcrossplane) |
| 120 | [devfile/api](https://github.com/devfile/api) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=devfile%2Fapi) |
| 121 | [easegress-io/easegress](https://github.com/easegress-io/easegress) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=easegress-io%2Feasegress) |
| 122 | [envoyproxy/envoy](https://github.com/envoyproxy/envoy) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=envoyproxy%2Fenvoy) |
| 123 | [eraser-dev/eraser](https://github.com/eraser-dev/eraser) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=eraser-dev%2Feraser) |
| 124 | [falcosecurity/falco](https://github.com/falcosecurity/falco) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=falcosecurity%2Ffalco) |
| 125 | [fluent/fluentd](https://github.com/fluent/fluentd) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=fluent%2Ffluentd) |
| 126 | [fluid-cloudnative/fluid](https://github.com/fluid-cloudnative/fluid) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=fluid-cloudnative%2Ffluid) |
| 127 | [glasskube/glasskube](https://github.com/glasskube/glasskube) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=glasskube%2Fglasskube) |
| 128 | [goharbor/harbor](https://github.com/goharbor/harbor) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=goharbor%2Fharbor) |
| 129 | [headlamp-k8s/headlamp](https://github.com/headlamp-k8s/headlamp) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=headlamp-k8s%2Fheadlamp) |
| 130 | [helm/helm](https://github.com/helm/helm) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=helm%2Fhelm) |
| 131 | [hexa-org/policy-orchestrator](https://github.com/hexa-org/policy-orchestrator) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=hexa-org%2Fpolicy-orchestrator) |
| 132 | [inspektor-gadget/inspektor-gadget](https://github.com/inspektor-gadget/inspektor-gadget) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=inspektor-gadget%2Finspektor-gadget) |
| 133 | [k0sproject/k0s](https://github.com/k0sproject/k0s) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=k0sproject%2Fk0s) |
| 134 | [k8sgpt-ai/k8sgpt](https://github.com/k8sgpt-ai/k8sgpt) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=k8sgpt-ai%2Fk8sgpt) |
| 135 | [kanisterio/kanister](https://github.com/kanisterio/kanister) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=kanisterio%2Fkanister) |
| 136 | [kcp-dev/kcp](https://github.com/kcp-dev/kcp) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=kcp-dev%2Fkcp) |
| 137 | [keptn/lifecycle-toolkit](https://github.com/keptn/lifecycle-toolkit) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=keptn%2Flifecycle-toolkit) |
| 138 | [keylime/keylime](https://github.com/keylime/keylime) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=keylime%2Fkeylime) |
| 139 | [kgateway-dev/kgateway](https://github.com/kgateway-dev/kgateway) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=kgateway-dev%2Fkgateway) |
| 140 | [knative/serving](https://github.com/knative/serving) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=knative%2Fserving) |
| 141 | [konveyor/tackle2-ui](https://github.com/konveyor/tackle2-ui) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=konveyor%2Ftackle2-ui) |
| 142 | [kptdev/kpt](https://github.com/kptdev/kpt) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=kptdev%2Fkpt) |
| 143 | [krator-rs/krator](https://github.com/krator-rs/krator) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=krator-rs%2Fkrator) |
| 144 | [krkn-chaos/krkn](https://github.com/krkn-chaos/krkn) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=krkn-chaos%2Fkrkn) |
| 145 | [krustlet/krustlet](https://github.com/krustlet/krustlet) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=krustlet%2Fkrustlet) |
| 146 | [kuadrant/kuadrant-operator](https://github.com/kuadrant/kuadrant-operator) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=kuadrant%2Fkuadrant-operator) |
| 147 | [kuasar-io/kuasar](https://github.com/kuasar-io/kuasar) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=kuasar-io%2Fkuasar) |
| 148 | [kube-rs/kube](https://github.com/kube-rs/kube) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=kube-rs%2Fkube) |
| 149 | [kubearchive/kubearchive](https://github.com/kubearchive/kubearchive) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=kubearchive%2Fkubearchive) |
| 150 | [kubedl-io/kubedl](https://github.com/kubedl-io/kubedl) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=kubedl-io%2Fkubedl) |
| 151 | [kubeovn/kube-ovn](https://github.com/kubeovn/kube-ovn) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=kubeovn%2Fkube-ovn) |
| 152 | [kubernetes-sigs/headlamp](https://github.com/kubernetes-sigs/headlamp) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=kubernetes-sigs%2Fheadlamp) |
| 153 | [kubeshop/testkube](https://github.com/kubeshop/testkube) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=kubeshop%2Ftestkube) |
| 154 | [kubevela/kubevela](https://github.com/kubevela/kubevela) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=kubevela%2Fkubevela) |
| 155 | [kubewarden/policy-server](https://github.com/kubewarden/policy-server) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=kubewarden%2Fpolicy-server) |
| 156 | [kyverno/kyverno](https://github.com/kyverno/kyverno) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=kyverno%2Fkyverno) |
| 157 | [linkerd/linkerd2](https://github.com/linkerd/linkerd2) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=linkerd%2Flinkerd2) |
| 158 | [litmuschaos/litmus](https://github.com/litmuschaos/litmus) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=litmuschaos%2Flitmus) |
| 159 | [metal3-io/baremetal-operator](https://github.com/metal3-io/baremetal-operator) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=metal3-io%2Fbaremetal-operator) |
| 160 | [metallb/metallb](https://github.com/metallb/metallb) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=metallb%2Fmetallb) |
| 161 | [mittwald/kubernetes-replicator](https://github.com/mittwald/kubernetes-replicator) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=mittwald%2Fkubernetes-replicator) |
| 162 | [nocalhost/nocalhost](https://github.com/nocalhost/nocalhost) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=nocalhost%2Fnocalhost) |
| 163 | [opcr-io/policy](https://github.com/opcr-io/policy) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=opcr-io%2Fpolicy) |
| 164 | [openebs/openebs](https://github.com/openebs/openebs) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=openebs%2Fopenebs) |
| 165 | [openeverest/openeverest](https://github.com/openeverest/openeverest) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=openeverest%2Fopeneverest) |
| 166 | [OpenObservability/OpenMetrics](https://github.com/OpenObservability/OpenMetrics) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=OpenObservability%2FOpenMetrics) |
| 167 | [operator-framework/operator-sdk](https://github.com/operator-framework/operator-sdk) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=operator-framework%2Foperator-sdk) |
| 168 | [oras-project/oras](https://github.com/oras-project/oras) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=oras-project%2Foras) |
| 169 | [piraeusdatastore/piraeus-operator](https://github.com/piraeusdatastore/piraeus-operator) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=piraeusdatastore%2Fpiraeus-operator) |
| 170 | [pixie-io/pixie](https://github.com/pixie-io/pixie) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=pixie-io%2Fpixie) |
| 171 | [pravega/pravega](https://github.com/pravega/pravega) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=pravega%2Fpravega) |
| 172 | [Project-HAMi/HAMi](https://github.com/Project-HAMi/HAMi) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=Project-HAMi%2FHAMi) |
| 173 | [projectcalico/calico](https://github.com/projectcalico/calico) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=projectcalico%2Fcalico) |
| 174 | [projectcontour/contour](https://github.com/projectcontour/contour) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=projectcontour%2Fcontour) |
| 175 | [rook/rook](https://github.com/rook/rook) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=rook%2Frook) |
| 176 | [sermant-io/Sermant](https://github.com/sermant-io/Sermant) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=sermant-io%2FSermant) |
| 177 | [serverless-devs/serverless-devs](https://github.com/serverless-devs/serverless-devs) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=serverless-devs%2Fserverless-devs) |
| 178 | [serverlessworkflow/specification](https://github.com/serverlessworkflow/specification) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=serverlessworkflow%2Fspecification) |
| 179 | [service-mesh-performance/service-mesh-performance](https://github.com/service-mesh-performance/service-mesh-performance) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=service-mesh-performance%2Fservice-mesh-performance) |
| 180 | [SlimPlanet/SlimFaas](https://github.com/SlimPlanet/SlimFaas) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=SlimPlanet%2FSlimFaas) |
| 181 | [spidernet-io/spiderpool](https://github.com/spidernet-io/spiderpool) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=spidernet-io%2Fspiderpool) |
| 182 | [spiffe/spire](https://github.com/spiffe/spire) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=spiffe%2Fspire) |
| 183 | [spinframework/spin](https://github.com/spinframework/spin) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=spinframework%2Fspin) |
| 184 | [submariner-io/submariner](https://github.com/submariner-io/submariner) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=submariner-io%2Fsubmariner) |
| 185 | [sustainable-computing-io/kepler](https://github.com/sustainable-computing-io/kepler) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=sustainable-computing-io%2Fkepler) |
| 186 | [tellerops/teller](https://github.com/tellerops/teller) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=tellerops%2Fteller) |
| 187 | [theupdateframework/python-tuf](https://github.com/theupdateframework/python-tuf) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=theupdateframework%2Fpython-tuf) |
| 188 | [traefik/traefik](https://github.com/traefik/traefik) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=traefik%2Ftraefik) |
| 189 | [urunc-dev/urunc](https://github.com/urunc-dev/urunc) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=urunc-dev%2Furunc) |
| 190 | [v6d-io/v6d](https://github.com/v6d-io/v6d) | ⚫ L1 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=v6d-io%2Fv6d) |
| 191 | [vscode-kubernetes-tools/vscode-kubernetes-tools](https://github.com/vscode-kubernetes-tools/vscode-kubernetes-tools) | ⚪ L2 | 1/26 | [View](https://console.kubestellar.io/acmm?repo=vscode-kubernetes-tools%2Fvscode-kubernetes-tools) |
| 192 | [aeraki-mesh/aeraki](https://github.com/aeraki-mesh/aeraki) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=aeraki-mesh%2Faeraki) |
| 193 | [brigadecore/brigade](https://github.com/brigadecore/brigade) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=brigadecore%2Fbrigade) |
| 194 | [carina-io/carina](https://github.com/carina-io/carina) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=carina-io%2Fcarina) |
| 195 | [carvel-dev/ytt](https://github.com/carvel-dev/ytt) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=carvel-dev%2Fytt) |
| 196 | [cloudevents/spec](https://github.com/cloudevents/spec) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=cloudevents%2Fspec) |
| 197 | [cloudfoundry/korifi](https://github.com/cloudfoundry/korifi) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=cloudfoundry%2Fkorifi) |
| 198 | [cloudnative-pg/cloudnative-pg](https://github.com/cloudnative-pg/cloudnative-pg) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=cloudnative-pg%2Fcloudnative-pg) |
| 199 | [confidential-containers/confidential-containers](https://github.com/confidential-containers/confidential-containers) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=confidential-containers%2Fconfidential-containers) |
| 200 | [connectrpc/connect-go](https://github.com/connectrpc/connect-go) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=connectrpc%2Fconnect-go) |
| 201 | [container2wasm/container2wasm](https://github.com/container2wasm/container2wasm) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=container2wasm%2Fcontainer2wasm) |
| 202 | [containernetworking/cni](https://github.com/containernetworking/cni) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=containernetworking%2Fcni) |
| 203 | [containers/composefs](https://github.com/containers/composefs) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=containers%2Fcomposefs) |
| 204 | [coredns/coredns](https://github.com/coredns/coredns) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=coredns%2Fcoredns) |
| 205 | [devstream-io/devstream](https://github.com/devstream-io/devstream) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=devstream-io%2Fdevstream) |
| 206 | [etcd-io/etcd](https://github.com/etcd-io/etcd) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=etcd-io%2Fetcd) |
| 207 | [fabedge/fabedge](https://github.com/fabedge/fabedge) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=fabedge%2Ffabedge) |
| 208 | [flatcar/Flatcar](https://github.com/flatcar/Flatcar) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=flatcar%2FFlatcar) |
| 209 | [foniod/foniod](https://github.com/foniod/foniod) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=foniod%2Ffoniod) |
| 210 | [foniod/redbpf](https://github.com/foniod/redbpf) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=foniod%2Fredbpf) |
| 211 | [getporter/porter](https://github.com/getporter/porter) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=getporter%2Fporter) |
| 212 | [getsops/sops](https://github.com/getsops/sops) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=getsops%2Fsops) |
| 213 | [inclavare-containers/inclavare-containers](https://github.com/inclavare-containers/inclavare-containers) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=inclavare-containers%2Finclavare-containers) |
| 214 | [interlink-hq/interLink](https://github.com/interlink-hq/interLink) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=interlink-hq%2FinterLink) |
| 215 | [k3s-io/k3s](https://github.com/k3s-io/k3s) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=k3s-io%2Fk3s) |
| 216 | [kairos-io/kairos](https://github.com/kairos-io/kairos) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=kairos-io%2Fkairos) |
| 217 | [kaito-project/kaito](https://github.com/kaito-project/kaito) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=kaito-project%2Fkaito) |
| 218 | [kmesh-net/kmesh](https://github.com/kmesh-net/kmesh) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=kmesh-net%2Fkmesh) |
| 219 | [ko-build/ko](https://github.com/ko-build/ko) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=ko-build%2Fko) |
| 220 | [konveyor/analyzer-lsp](https://github.com/konveyor/analyzer-lsp) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=konveyor%2Fanalyzer-lsp) |
| 221 | [konveyor/operator](https://github.com/konveyor/operator) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=konveyor%2Foperator) |
| 222 | [koordinator-sh/koordinator](https://github.com/koordinator-sh/koordinator) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=koordinator-sh%2Fkoordinator) |
| 223 | [kube-burner/kube-burner](https://github.com/kube-burner/kube-burner) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=kube-burner%2Fkube-burner) |
| 224 | [kube-vip/kube-vip](https://github.com/kube-vip/kube-vip) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=kube-vip%2Fkube-vip) |
| 225 | [kubearmor/KubeArmor](https://github.com/kubearmor/KubeArmor) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=kubearmor%2FKubeArmor) |
| 226 | [kubeclipper/kubeclipper](https://github.com/kubeclipper/kubeclipper) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=kubeclipper%2Fkubeclipper) |
| 227 | [kubeflow/kubeflow](https://github.com/kubeflow/kubeflow) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=kubeflow%2Fkubeflow) |
| 228 | [kubereboot/kured](https://github.com/kubereboot/kured) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=kubereboot%2Fkured) |
| 229 | [kuberhealthy/kuberhealthy](https://github.com/kuberhealthy/kuberhealthy) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=kuberhealthy%2Fkuberhealthy) |
| 230 | [kubernetes-sigs/cluster-api](https://github.com/kubernetes-sigs/cluster-api) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=kubernetes-sigs%2Fcluster-api) |
| 231 | [kubernetes-sigs/gateway-api](https://github.com/kubernetes-sigs/gateway-api) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=kubernetes-sigs%2Fgateway-api) |
| 232 | [kubernetes-sigs/kind](https://github.com/kubernetes-sigs/kind) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=kubernetes-sigs%2Fkind) |
| 233 | [kubernetes-sigs/kustomize](https://github.com/kubernetes-sigs/kustomize) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=kubernetes-sigs%2Fkustomize) |
| 234 | [kubernetes-sigs/kwok](https://github.com/kubernetes-sigs/kwok) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=kubernetes-sigs%2Fkwok) |
| 235 | [kubernetes-sigs/secrets-store-csi-driver](https://github.com/kubernetes-sigs/secrets-store-csi-driver) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=kubernetes-sigs%2Fsecrets-store-csi-driver) |
| 236 | [kubernetes/kubernetes](https://github.com/kubernetes/kubernetes) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=kubernetes%2Fkubernetes) |
| 237 | [kubescape/kubescape](https://github.com/kubescape/kubescape) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=kubescape%2Fkubescape) |
| 238 | [kubeslice/kubeslice](https://github.com/kubeslice/kubeslice) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=kubeslice%2Fkubeslice) |
| 239 | [kudobuilder/kudo](https://github.com/kudobuilder/kudo) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=kudobuilder%2Fkudo) |
| 240 | [KusionStack/kusion](https://github.com/KusionStack/kusion) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=KusionStack%2Fkusion) |
| 241 | [layotto/layotto](https://github.com/layotto/layotto) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=layotto%2Flayotto) |
| 242 | [longhorn/longhorn](https://github.com/longhorn/longhorn) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=longhorn%2Flonghorn) |
| 243 | [loxilb-io/loxilb](https://github.com/loxilb-io/loxilb) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=loxilb-io%2Floxilb) |
| 244 | [merbridge/merbridge](https://github.com/merbridge/merbridge) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=merbridge%2Fmerbridge) |
| 245 | [modelpack/model-spec](https://github.com/modelpack/model-spec) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=modelpack%2Fmodel-spec) |
| 246 | [networkservicemesh/api](https://github.com/networkservicemesh/api) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=networkservicemesh%2Fapi) |
| 247 | [networkservicemesh/cmd-nse-icmp-responder](https://github.com/networkservicemesh/cmd-nse-icmp-responder) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=networkservicemesh%2Fcmd-nse-icmp-responder) |
| 248 | [nmstate/nmstate](https://github.com/nmstate/nmstate) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=nmstate%2Fnmstate) |
| 249 | [open-feature/spec](https://github.com/open-feature/spec) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=open-feature%2Fspec) |
| 250 | [open-gitops/project](https://github.com/open-gitops/project) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=open-gitops%2Fproject) |
| 251 | [openchoreo/openchoreo](https://github.com/openchoreo/openchoreo) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=openchoreo%2Fopenchoreo) |
| 252 | [opencurve/curve](https://github.com/opencurve/curve) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=opencurve%2Fcurve) |
| 253 | [openelb/openelb](https://github.com/openelb/openelb) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=openelb%2Fopenelb) |
| 254 | [openfunction/openfunction](https://github.com/openfunction/openfunction) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=openfunction%2Fopenfunction) |
| 255 | [openkruise/kruise](https://github.com/openkruise/kruise) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=openkruise%2Fkruise) |
| 256 | [openservicemesh/osm](https://github.com/openservicemesh/osm) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=openservicemesh%2Fosm) |
| 257 | [opentracing/opentracing-go](https://github.com/opentracing/opentracing-go) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=opentracing%2Fopentracing-go) |
| 258 | [openyurtio/openyurt](https://github.com/openyurtio/openyurt) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=openyurtio%2Fopenyurt) |
| 259 | [oscal-compass/compliance-trestle](https://github.com/oscal-compass/compliance-trestle) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=oscal-compass%2Fcompliance-trestle) |
| 260 | [paralus/paralus](https://github.com/paralus/paralus) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=paralus%2Fparalus) |
| 261 | [perses/perses](https://github.com/perses/perses) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=perses%2Fperses) |
| 262 | [project-akri/akri](https://github.com/project-akri/akri) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=project-akri%2Fakri) |
| 263 | [project-stacker/stacker](https://github.com/project-stacker/stacker) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=project-stacker%2Fstacker) |
| 264 | [project-zot/zot](https://github.com/project-zot/zot) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=project-zot%2Fzot) |
| 265 | [projectcapsule/capsule](https://github.com/projectcapsule/capsule) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=projectcapsule%2Fcapsule) |
| 266 | [rancher/rancher](https://github.com/rancher/rancher) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=rancher%2Francher) |
| 267 | [rkt/rkt](https://github.com/rkt/rkt) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=rkt%2Frkt) |
| 268 | [schemahero/schemahero](https://github.com/schemahero/schemahero) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=schemahero%2Fschemahero) |
| 269 | [score-spec/spec](https://github.com/score-spec/spec) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=score-spec%2Fspec) |
| 270 | [servicemeshinterface/smi-spec](https://github.com/servicemeshinterface/smi-spec) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=servicemeshinterface%2Fsmi-spec) |
| 271 | [skooner-k8s/skooner](https://github.com/skooner-k8s/skooner) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=skooner-k8s%2Fskooner) |
| 272 | [spiffe/spiffe](https://github.com/spiffe/spiffe) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=spiffe%2Fspiffe) |
| 273 | [spinframework/spin-operator](https://github.com/spinframework/spin-operator) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=spinframework%2Fspin-operator) |
| 274 | [superedge/superedge](https://github.com/superedge/superedge) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=superedge%2Fsuperedge) |
| 275 | [superproj/onex](https://github.com/superproj/onex) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=superproj%2Fonex) |
| 276 | [thanos-io/thanos](https://github.com/thanos-io/thanos) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=thanos-io%2Fthanos) |
| 277 | [tinkerbell/tink](https://github.com/tinkerbell/tink) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=tinkerbell%2Ftink) |
| 278 | [tinkerbell/tinkerbell](https://github.com/tinkerbell/tinkerbell) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=tinkerbell%2Ftinkerbell) |
| 279 | [tokenetes/tokenetes](https://github.com/tokenetes/tokenetes) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=tokenetes%2Ftokenetes) |
| 280 | [tremor-rs/tremor-runtime](https://github.com/tremor-rs/tremor-runtime) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=tremor-rs%2Ftremor-runtime) |
| 281 | [truefoundry/KubeElasti](https://github.com/truefoundry/KubeElasti) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=truefoundry%2FKubeElasti) |
| 282 | [volcano-sh/kthena](https://github.com/volcano-sh/kthena) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=volcano-sh%2Fkthena) |
| 283 | [volcano-sh/volcano](https://github.com/volcano-sh/volcano) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=volcano-sh%2Fvolcano) |
| 284 | [wasmCloud/wasmCloud](https://github.com/wasmCloud/wasmCloud) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=wasmCloud%2FwasmCloud) |
| 285 | [wayfair-incubator/telefonistka](https://github.com/wayfair-incubator/telefonistka) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=wayfair-incubator%2Ftelefonistka) |
| 286 | [xline-kv/xline](https://github.com/xline-kv/xline) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=xline-kv%2Fxline) |
| 287 | [xregistry/server](https://github.com/xregistry/server) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=xregistry%2Fserver) |
| 288 | [youki-dev/youki](https://github.com/youki-dev/youki) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=youki-dev%2Fyouki) |
| 289 | [zalando/postgres-operator](https://github.com/zalando/postgres-operator) | ⚫ L1 | 0/26 | [View](https://console.kubestellar.io/acmm?repo=zalando%2Fpostgres-operator) |

## Add Your Project

To add the ACMM badge to your project README:

```markdown
[![ACMM](https://img.shields.io/endpoint?url=https%3A%2F%2Fconsole.kubestellar.io%2Fapi%2Facmm%2Fbadge%3Frepo%3DOWNER%2FREPO)](https://console.kubestellar.io/acmm?repo=OWNER%2FREPO)
```

Replace `OWNER` and `REPO` with your GitHub organization and repository name.

## Methodology

Scores are generated by the [KubeStellar Console](https://console.kubestellar.io) ACMM scanner, which checks each repository for 26 publicly detectable signals derived from the full 33-loop ACMM framework across five maturity levels. The scanner inspects:

- AI instruction files (CLAUDE.md, .cursorrules, AGENTS.md, copilot-instructions.md)
- CI/CD pipeline configuration (GitHub Actions, quality gates)
- PR review automation and rubrics
- Auto-QA and compliance workflows
- Multi-agent orchestration patterns

Results are cached and refreshed periodically. Visit the [ACMM Dashboard](https://console.kubestellar.io/acmm) to scan any repository interactively.
