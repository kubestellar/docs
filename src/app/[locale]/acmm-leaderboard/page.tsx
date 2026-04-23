"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  GridLines,
  StarField,
  Navbar,
  Footer,
} from "../../../components/index";

// ── Types ─────────────────────────────────────────────────────────────

interface AcmmProject {
  rank: number;
  repo: string;
  level: number;
  score: number;
}

// ── Level metadata ────────────────────────────────────────────────────

interface LevelMeta {
  emoji: string;
  name: string;
  description: string;
  bg: string;
  text: string;
  border: string;
}

const LEVELS: Record<number, LevelMeta> = {
  0: { emoji: "🔴", name: "Prerequisites",    description: "No AI-related signals detected (baseline)",                  bg: "bg-red-500/20",    text: "text-red-400",    border: "border-red-500/30" },
  1: { emoji: "⚫", name: "Assisted",         description: "Basic AI tooling signals (Copilot, formatters)",             bg: "bg-gray-500/20",   text: "text-gray-400",   border: "border-gray-500/30" },
  2: { emoji: "⚪", name: "Instructed",       description: "Has AI instruction files (CLAUDE.md, .cursorrules, etc.)",   bg: "bg-white/10",      text: "text-gray-300",   border: "border-white/20" },
  3: { emoji: "🟡", name: "Measured",         description: "PR review rubric, quality dashboard, CI matrix",             bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30" },
  4: { emoji: "🔵", name: "Adaptive",         description: "Auto-QA tuning, nightly compliance, AI-fix workflows",      bg: "bg-blue-500/20",   text: "text-blue-400",   border: "border-blue-500/30" },
  5: { emoji: "🟢", name: "Semi-Automated",   description: "GitHub Actions AI, auto-QA self-tuning, public metrics",    bg: "bg-green-500/20",  text: "text-green-400",  border: "border-green-500/30" },
  6: { emoji: "🟣", name: "Autonomous",       description: "Fully autonomous AI-driven development and operations",     bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30" },
};

// ── Medal icons ───────────────────────────────────────────────────────

function RankDisplay({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xl" title="1st place">🥇</span>;
  if (rank === 2) return <span className="text-xl" title="2nd place">🥈</span>;
  if (rank === 3) return <span className="text-xl" title="3rd place">🥉</span>;
  return <span className="text-sm text-gray-400 tabular-nums">#{rank}</span>;
}

// ── Level badge ───────────────────────────────────────────────────────

function LevelBadge({ level }: { level: number }) {
  const meta = LEVELS[level] || LEVELS[1];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${meta.bg} ${meta.text} ${meta.border}`}
    >
      <span>{meta.emoji}</span>
      <span>L{level}</span>
    </span>
  );
}

// ── Score bar ─────────────────────────────────────────────────────────

function ScoreBar({ score, max = 26 }: { score: number; max?: number }) {
  const pct = Math.round((score / max) * 100);
  const barColor =
    pct >= 60 ? "bg-green-500" :
    pct >= 30 ? "bg-blue-500" :
    pct >= 10 ? "bg-yellow-500" :
    "bg-gray-600";
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-2 bg-gray-700/50 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-gray-400 w-10 text-right">
        {score}/{max}
      </span>
    </div>
  );
}

// ── Sort options ──────────────────────────────────────────────────────

type SortField = "rank" | "name" | "level" | "score";
type SortDir = "asc" | "desc";

// ── Project data (289 CNCF projects, snapshot 2026-04-22) ─────────────

const ACMM_PROJECTS: AcmmProject[] = [
  { rank: 1, repo: "kubestellar/console", level: 5, score: 20 },
  { rank: 2, repo: "chaos-mesh/chaos-mesh", level: 2, score: 6 },
  { rank: 3, repo: "cilium/cilium", level: 2, score: 6 },
  { rank: 4, repo: "backstage/backstage", level: 2, score: 5 },
  { rank: 5, repo: "containerd/containerd", level: 2, score: 5 },
  { rank: 6, repo: "cri-o/cri-o", level: 2, score: 5 },
  { rank: 7, repo: "meshery/meshery", level: 2, score: 5 },
  { rank: 8, repo: "runatlantis/atlantis", level: 2, score: 5 },
  { rank: 9, repo: "alibaba/higress", level: 2, score: 4 },
  { rank: 10, repo: "armadaproject/armada", level: 2, score: 4 },
  { rank: 11, repo: "bootc-dev/bootc", level: 2, score: 4 },
  { rank: 12, repo: "containers/podman", level: 2, score: 4 },
  { rank: 13, repo: "distribution/distribution", level: 2, score: 4 },
  { rank: 14, repo: "kagent-dev/kagent", level: 2, score: 4 },
  { rank: 15, repo: "kubestellar/kubestellar", level: 2, score: 4 },
  { rank: 16, repo: "radius-project/radius", level: 2, score: 4 },
  { rank: 17, repo: "runmedev/runme", level: 2, score: 4 },
  { rank: 18, repo: "shipwright-io/build", level: 2, score: 4 },
  { rank: 19, repo: "WasmEdge/WasmEdge", level: 2, score: 4 },
  { rank: 20, repo: "cloud-custodian/cloud-custodian", level: 1, score: 3 },
  { rank: 21, repo: "clusterpedia-io/clusterpedia", level: 2, score: 3 },
  { rank: 22, repo: "cortexproject/cortex", level: 2, score: 3 },
  { rank: 23, repo: "cubeFS/cubefs", level: 2, score: 3 },
  { rank: 24, repo: "dapr/dapr", level: 2, score: 3 },
  { rank: 25, repo: "drasi-project/drasi-platform", level: 2, score: 3 },
  { rank: 26, repo: "flomesh-io/fsm", level: 2, score: 3 },
  { rank: 27, repo: "grpc/grpc", level: 2, score: 3 },
  { rank: 28, repo: "harvester/harvester", level: 2, score: 3 },
  { rank: 29, repo: "istio/istio", level: 2, score: 3 },
  { rank: 30, repo: "k8gb-io/k8gb", level: 1, score: 3 },
  { rank: 31, repo: "karmada-io/karmada", level: 2, score: 3 },
  { rank: 32, repo: "kedacore/keda", level: 2, score: 3 },
  { rank: 33, repo: "kitops-ml/kitops", level: 2, score: 3 },
  { rank: 34, repo: "kserve/kserve", level: 2, score: 3 },
  { rank: 35, repo: "kubernetes-sigs/external-dns", level: 2, score: 3 },
  { rank: 36, repo: "kubesphere/kubesphere", level: 2, score: 3 },
  { rank: 37, repo: "kumahq/kuma", level: 2, score: 3 },
  { rank: 38, repo: "oauth2-proxy/oauth2-proxy", level: 1, score: 3 },
  { rank: 39, repo: "open-cluster-management-io/ocm", level: 2, score: 3 },
  { rank: 40, repo: "ovn-kubernetes/ovn-kubernetes", level: 2, score: 3 },
  { rank: 41, repo: "ratify-project/ratify", level: 1, score: 3 },
  { rank: 42, repo: "sealerio/sealer", level: 2, score: 3 },
  { rank: 43, repo: "slimtoolkit/slim", level: 2, score: 3 },
  { rank: 44, repo: "antrea-io/antrea", level: 2, score: 2 },
  { rank: 45, repo: "athenz/athenz", level: 2, score: 2 },
  { rank: 46, repo: "buildpacks/pack", level: 1, score: 2 },
  { rank: 47, repo: "cdk8s-team/cdk8s", level: 1, score: 2 },
  { rank: 48, repo: "chaosblade-io/chaosblade", level: 2, score: 2 },
  { rank: 49, repo: "devspace-sh/devspace", level: 2, score: 2 },
  { rank: 50, repo: "dexidp/dex", level: 2, score: 2 },
  { rank: 51, repo: "dragonflyoss/dragonfly", level: 2, score: 2 },
  { rank: 52, repo: "emissary-ingress/emissary", level: 2, score: 2 },
  { rank: 53, repo: "external-secrets/external-secrets", level: 2, score: 2 },
  { rank: 54, repo: "fluxcd/flux2", level: 2, score: 2 },
  { rank: 55, repo: "green-coding-solutions/green-metrics-tool", level: 2, score: 2 },
  { rank: 56, repo: "HolmesGPT/holmesgpt", level: 2, score: 2 },
  { rank: 57, repo: "hwameistor/hwameistor", level: 2, score: 2 },
  { rank: 58, repo: "hyperlight-dev/hyperlight", level: 2, score: 2 },
  { rank: 59, repo: "in-toto/in-toto", level: 2, score: 2 },
  { rank: 60, repo: "jaegertracing/jaeger", level: 2, score: 2 },
  { rank: 61, repo: "k8up-io/k8up", level: 2, score: 2 },
  { rank: 62, repo: "kai-scheduler/KAI-Scheduler", level: 2, score: 2 },
  { rank: 63, repo: "kcl-lang/kcl", level: 2, score: 2 },
  { rank: 64, repo: "kedgeproject/kedge", level: 1, score: 2 },
  { rank: 65, repo: "keycloak/keycloak", level: 2, score: 2 },
  { rank: 66, repo: "knative/eventing", level: 2, score: 2 },
  { rank: 67, repo: "kube-logging/logging-operator", level: 2, score: 2 },
  { rank: 68, repo: "kubean-io/kubean", level: 2, score: 2 },
  { rank: 69, repo: "kubecost/opencost", level: 2, score: 2 },
  { rank: 70, repo: "kubeedge/kubeedge", level: 2, score: 2 },
  { rank: 71, repo: "kubefirst/kubefirst", level: 2, score: 2 },
  { rank: 72, repo: "kubefleet-dev/kubefleet", level: 2, score: 2 },
  { rank: 73, repo: "kubernetes-sigs/kubebuilder", level: 2, score: 2 },
  { rank: 74, repo: "kubevirt/kubevirt", level: 2, score: 2 },
  { rank: 75, repo: "kubewarden/kubewarden-controller", level: 1, score: 2 },
  { rank: 76, repo: "lima-vm/lima", level: 2, score: 2 },
  { rank: 77, repo: "microcks/microcks", level: 2, score: 2 },
  { rank: 78, repo: "nats-io/nats-server", level: 1, score: 2 },
  { rank: 79, repo: "notaryproject/notation", level: 2, score: 2 },
  { rank: 80, repo: "open-policy-agent/opa", level: 2, score: 2 },
  { rank: 81, repo: "open-telemetry/community", level: 1, score: 2 },
  { rank: 82, repo: "open-telemetry/opentelemetry-collector", level: 2, score: 2 },
  { rank: 83, repo: "openclarity/openclarity", level: 1, score: 2 },
  { rank: 84, repo: "opencost/opencost", level: 2, score: 2 },
  { rank: 85, repo: "openfga/openfga", level: 2, score: 2 },
  { rank: 86, repo: "openGemini/openGemini", level: 1, score: 2 },
  { rank: 87, repo: "opentofu/opentofu", level: 1, score: 2 },
  { rank: 88, repo: "oxia-db/oxia", level: 2, score: 2 },
  { rank: 89, repo: "parallaxsecond/parsec", level: 1, score: 2 },
  { rank: 90, repo: "pipe-cd/pipecd", level: 2, score: 2 },
  { rank: 91, repo: "podman-desktop/podman-desktop", level: 2, score: 2 },
  { rank: 92, repo: "project-copacetic/copacetic", level: 2, score: 2 },
  { rank: 93, repo: "project-dalec/dalec", level: 2, score: 2 },
  { rank: 94, repo: "prometheus/prometheus", level: 2, score: 2 },
  { rank: 95, repo: "sealos-ci-robot/sealos", level: 1, score: 2 },
  { rank: 96, repo: "strimzi/strimzi-kafka-operator", level: 2, score: 2 },
  { rank: 97, repo: "tektoncd/pipeline", level: 2, score: 2 },
  { rank: 98, repo: "telepresenceio/telepresence", level: 2, score: 2 },
  { rank: 99, repo: "tikv/tikv", level: 2, score: 2 },
  { rank: 100, repo: "trickstercache/trickster", level: 1, score: 2 },
  { rank: 101, repo: "virtual-kubelet/virtual-kubelet", level: 2, score: 2 },
  { rank: 102, repo: "vitessio/vitess", level: 2, score: 2 },
  { rank: 103, repo: "werf/werf", level: 2, score: 2 },
  { rank: 104, repo: "agones-dev/agones", level: 1, score: 1 },
  { rank: 105, repo: "argoproj/argo-cd", level: 2, score: 1 },
  { rank: 106, repo: "artifacthub/hub", level: 1, score: 1 },
  { rank: 107, repo: "bank-vaults/bank-vaults", level: 2, score: 1 },
  { rank: 108, repo: "bfenetworks/bfe", level: 1, score: 1 },
  { rank: 109, repo: "bpfman/bpfman", level: 1, score: 1 },
  { rank: 110, repo: "cadence-workflow/cadence", level: 2, score: 1 },
  { rank: 111, repo: "cartography-cncf/cartography", level: 2, score: 1 },
  { rank: 112, repo: "cedar-policy/cedar", level: 1, score: 1 },
  { rank: 113, repo: "cert-manager/cert-manager", level: 1, score: 1 },
  { rank: 114, repo: "clusternet/clusternet", level: 1, score: 1 },
  { rank: 115, repo: "cni-genie/CNI-Genie", level: 2, score: 1 },
  { rank: 116, repo: "confidential-containers/cloud-api-adaptor", level: 1, score: 1 },
  { rank: 117, repo: "containerssh/containerssh", level: 1, score: 1 },
  { rank: 118, repo: "cozystack/cozystack", level: 2, score: 1 },
  { rank: 119, repo: "crossplane/crossplane", level: 1, score: 1 },
  { rank: 120, repo: "devfile/api", level: 2, score: 1 },
  { rank: 121, repo: "easegress-io/easegress", level: 1, score: 1 },
  { rank: 122, repo: "envoyproxy/envoy", level: 2, score: 1 },
  { rank: 123, repo: "eraser-dev/eraser", level: 1, score: 1 },
  { rank: 124, repo: "falcosecurity/falco", level: 1, score: 1 },
  { rank: 125, repo: "fluent/fluentd", level: 1, score: 1 },
  { rank: 126, repo: "fluid-cloudnative/fluid", level: 2, score: 1 },
  { rank: 127, repo: "glasskube/glasskube", level: 2, score: 1 },
  { rank: 128, repo: "goharbor/harbor", level: 1, score: 1 },
  { rank: 129, repo: "headlamp-k8s/headlamp", level: 2, score: 1 },
  { rank: 130, repo: "helm/helm", level: 2, score: 1 },
  { rank: 131, repo: "hexa-org/policy-orchestrator", level: 1, score: 1 },
  { rank: 132, repo: "inspektor-gadget/inspektor-gadget", level: 2, score: 1 },
  { rank: 133, repo: "k0sproject/k0s", level: 2, score: 1 },
  { rank: 134, repo: "k8sgpt-ai/k8sgpt", level: 1, score: 1 },
  { rank: 135, repo: "kanisterio/kanister", level: 2, score: 1 },
  { rank: 136, repo: "kcp-dev/kcp", level: 1, score: 1 },
  { rank: 137, repo: "keptn/lifecycle-toolkit", level: 1, score: 1 },
  { rank: 138, repo: "keylime/keylime", level: 1, score: 1 },
  { rank: 139, repo: "kgateway-dev/kgateway", level: 2, score: 1 },
  { rank: 140, repo: "knative/serving", level: 2, score: 1 },
  { rank: 141, repo: "konveyor/tackle2-ui", level: 2, score: 1 },
  { rank: 142, repo: "kptdev/kpt", level: 2, score: 1 },
  { rank: 143, repo: "krator-rs/krator", level: 1, score: 1 },
  { rank: 144, repo: "krkn-chaos/krkn", level: 2, score: 1 },
  { rank: 145, repo: "krustlet/krustlet", level: 1, score: 1 },
  { rank: 146, repo: "kuadrant/kuadrant-operator", level: 2, score: 1 },
  { rank: 147, repo: "kuasar-io/kuasar", level: 1, score: 1 },
  { rank: 148, repo: "kube-rs/kube", level: 1, score: 1 },
  { rank: 149, repo: "kubearchive/kubearchive", level: 2, score: 1 },
  { rank: 150, repo: "kubedl-io/kubedl", level: 1, score: 1 },
  { rank: 151, repo: "kubeovn/kube-ovn", level: 2, score: 1 },
  { rank: 152, repo: "kubernetes-sigs/headlamp", level: 2, score: 1 },
  { rank: 153, repo: "kubeshop/testkube", level: 2, score: 1 },
  { rank: 154, repo: "kubevela/kubevela", level: 1, score: 1 },
  { rank: 155, repo: "kubewarden/policy-server", level: 1, score: 1 },
  { rank: 156, repo: "kyverno/kyverno", level: 2, score: 1 },
  { rank: 157, repo: "linkerd/linkerd2", level: 2, score: 1 },
  { rank: 158, repo: "litmuschaos/litmus", level: 1, score: 1 },
  { rank: 159, repo: "metal3-io/baremetal-operator", level: 2, score: 1 },
  { rank: 160, repo: "metallb/metallb", level: 2, score: 1 },
  { rank: 161, repo: "mittwald/kubernetes-replicator", level: 1, score: 1 },
  { rank: 162, repo: "nocalhost/nocalhost", level: 1, score: 1 },
  { rank: 163, repo: "opcr-io/policy", level: 1, score: 1 },
  { rank: 164, repo: "openebs/openebs", level: 1, score: 1 },
  { rank: 165, repo: "openeverest/openeverest", level: 1, score: 1 },
  { rank: 166, repo: "OpenObservability/OpenMetrics", level: 2, score: 1 },
  { rank: 167, repo: "operator-framework/operator-sdk", level: 1, score: 1 },
  { rank: 168, repo: "oras-project/oras", level: 1, score: 1 },
  { rank: 169, repo: "piraeusdatastore/piraeus-operator", level: 1, score: 1 },
  { rank: 170, repo: "pixie-io/pixie", level: 1, score: 1 },
  { rank: 171, repo: "pravega/pravega", level: 1, score: 1 },
  { rank: 172, repo: "Project-HAMi/HAMi", level: 1, score: 1 },
  { rank: 173, repo: "projectcalico/calico", level: 2, score: 1 },
  { rank: 174, repo: "projectcontour/contour", level: 1, score: 1 },
  { rank: 175, repo: "rook/rook", level: 1, score: 1 },
  { rank: 176, repo: "sermant-io/Sermant", level: 1, score: 1 },
  { rank: 177, repo: "serverless-devs/serverless-devs", level: 1, score: 1 },
  { rank: 178, repo: "serverlessworkflow/specification", level: 1, score: 1 },
  { rank: 179, repo: "service-mesh-performance/service-mesh-performance", level: 1, score: 1 },
  { rank: 180, repo: "SlimPlanet/SlimFaas", level: 2, score: 1 },
  { rank: 181, repo: "spidernet-io/spiderpool", level: 2, score: 1 },
  { rank: 182, repo: "spiffe/spire", level: 1, score: 1 },
  { rank: 183, repo: "spinframework/spin", level: 1, score: 1 },
  { rank: 184, repo: "submariner-io/submariner", level: 2, score: 1 },
  { rank: 185, repo: "sustainable-computing-io/kepler", level: 2, score: 1 },
  { rank: 186, repo: "tellerops/teller", level: 1, score: 1 },
  { rank: 187, repo: "theupdateframework/python-tuf", level: 1, score: 1 },
  { rank: 188, repo: "traefik/traefik", level: 2, score: 1 },
  { rank: 189, repo: "urunc-dev/urunc", level: 1, score: 1 },
  { rank: 190, repo: "v6d-io/v6d", level: 1, score: 1 },
  { rank: 191, repo: "vscode-kubernetes-tools/vscode-kubernetes-tools", level: 2, score: 1 },
  { rank: 192, repo: "aeraki-mesh/aeraki", level: 1, score: 0 },
  { rank: 193, repo: "brigadecore/brigade", level: 1, score: 0 },
  { rank: 194, repo: "carina-io/carina", level: 1, score: 0 },
  { rank: 195, repo: "carvel-dev/ytt", level: 1, score: 0 },
  { rank: 196, repo: "cloudevents/spec", level: 1, score: 0 },
  { rank: 197, repo: "cloudfoundry/korifi", level: 1, score: 0 },
  { rank: 198, repo: "cloudnative-pg/cloudnative-pg", level: 1, score: 0 },
  { rank: 199, repo: "confidential-containers/confidential-containers", level: 1, score: 0 },
  { rank: 200, repo: "connectrpc/connect-go", level: 1, score: 0 },
  { rank: 201, repo: "container2wasm/container2wasm", level: 1, score: 0 },
  { rank: 202, repo: "containernetworking/cni", level: 1, score: 0 },
  { rank: 203, repo: "containers/composefs", level: 1, score: 0 },
  { rank: 204, repo: "coredns/coredns", level: 1, score: 0 },
  { rank: 205, repo: "devstream-io/devstream", level: 1, score: 0 },
  { rank: 206, repo: "etcd-io/etcd", level: 1, score: 0 },
  { rank: 207, repo: "fabedge/fabedge", level: 1, score: 0 },
  { rank: 208, repo: "flatcar/Flatcar", level: 1, score: 0 },
  { rank: 209, repo: "foniod/foniod", level: 1, score: 0 },
  { rank: 210, repo: "foniod/redbpf", level: 1, score: 0 },
  { rank: 211, repo: "getporter/porter", level: 1, score: 0 },
  { rank: 212, repo: "getsops/sops", level: 1, score: 0 },
  { rank: 213, repo: "inclavare-containers/inclavare-containers", level: 1, score: 0 },
  { rank: 214, repo: "interlink-hq/interLink", level: 1, score: 0 },
  { rank: 215, repo: "k3s-io/k3s", level: 1, score: 0 },
  { rank: 216, repo: "kairos-io/kairos", level: 1, score: 0 },
  { rank: 217, repo: "kaito-project/kaito", level: 1, score: 0 },
  { rank: 218, repo: "kmesh-net/kmesh", level: 1, score: 0 },
  { rank: 219, repo: "ko-build/ko", level: 1, score: 0 },
  { rank: 220, repo: "konveyor/analyzer-lsp", level: 1, score: 0 },
  { rank: 221, repo: "konveyor/operator", level: 1, score: 0 },
  { rank: 222, repo: "koordinator-sh/koordinator", level: 1, score: 0 },
  { rank: 223, repo: "kube-burner/kube-burner", level: 1, score: 0 },
  { rank: 224, repo: "kube-vip/kube-vip", level: 1, score: 0 },
  { rank: 225, repo: "kubearmor/KubeArmor", level: 1, score: 0 },
  { rank: 226, repo: "kubeclipper/kubeclipper", level: 1, score: 0 },
  { rank: 227, repo: "kubeflow/kubeflow", level: 1, score: 0 },
  { rank: 228, repo: "kubereboot/kured", level: 1, score: 0 },
  { rank: 229, repo: "kuberhealthy/kuberhealthy", level: 1, score: 0 },
  { rank: 230, repo: "kubernetes-sigs/cluster-api", level: 1, score: 0 },
  { rank: 231, repo: "kubernetes-sigs/gateway-api", level: 1, score: 0 },
  { rank: 232, repo: "kubernetes-sigs/kind", level: 1, score: 0 },
  { rank: 233, repo: "kubernetes-sigs/kustomize", level: 1, score: 0 },
  { rank: 234, repo: "kubernetes-sigs/kwok", level: 1, score: 0 },
  { rank: 235, repo: "kubernetes-sigs/secrets-store-csi-driver", level: 1, score: 0 },
  { rank: 236, repo: "kubernetes/kubernetes", level: 1, score: 0 },
  { rank: 237, repo: "kubescape/kubescape", level: 1, score: 0 },
  { rank: 238, repo: "kubeslice/kubeslice", level: 1, score: 0 },
  { rank: 239, repo: "kudobuilder/kudo", level: 1, score: 0 },
  { rank: 240, repo: "KusionStack/kusion", level: 1, score: 0 },
  { rank: 241, repo: "layotto/layotto", level: 1, score: 0 },
  { rank: 242, repo: "longhorn/longhorn", level: 1, score: 0 },
  { rank: 243, repo: "loxilb-io/loxilb", level: 1, score: 0 },
  { rank: 244, repo: "merbridge/merbridge", level: 1, score: 0 },
  { rank: 245, repo: "modelpack/model-spec", level: 1, score: 0 },
  { rank: 246, repo: "networkservicemesh/api", level: 1, score: 0 },
  { rank: 247, repo: "networkservicemesh/cmd-nse-icmp-responder", level: 1, score: 0 },
  { rank: 248, repo: "nmstate/nmstate", level: 1, score: 0 },
  { rank: 249, repo: "open-feature/spec", level: 1, score: 0 },
  { rank: 250, repo: "open-gitops/project", level: 1, score: 0 },
  { rank: 251, repo: "openchoreo/openchoreo", level: 1, score: 0 },
  { rank: 252, repo: "opencurve/curve", level: 1, score: 0 },
  { rank: 253, repo: "openelb/openelb", level: 1, score: 0 },
  { rank: 254, repo: "openfunction/openfunction", level: 1, score: 0 },
  { rank: 255, repo: "openkruise/kruise", level: 1, score: 0 },
  { rank: 256, repo: "openservicemesh/osm", level: 1, score: 0 },
  { rank: 257, repo: "opentracing/opentracing-go", level: 1, score: 0 },
  { rank: 258, repo: "openyurtio/openyurt", level: 1, score: 0 },
  { rank: 259, repo: "oscal-compass/compliance-trestle", level: 1, score: 0 },
  { rank: 260, repo: "paralus/paralus", level: 1, score: 0 },
  { rank: 261, repo: "perses/perses", level: 1, score: 0 },
  { rank: 262, repo: "project-akri/akri", level: 1, score: 0 },
  { rank: 263, repo: "project-stacker/stacker", level: 1, score: 0 },
  { rank: 264, repo: "project-zot/zot", level: 1, score: 0 },
  { rank: 265, repo: "projectcapsule/capsule", level: 1, score: 0 },
  { rank: 266, repo: "rancher/rancher", level: 1, score: 0 },
  { rank: 267, repo: "rkt/rkt", level: 1, score: 0 },
  { rank: 268, repo: "schemahero/schemahero", level: 1, score: 0 },
  { rank: 269, repo: "score-spec/spec", level: 1, score: 0 },
  { rank: 270, repo: "servicemeshinterface/smi-spec", level: 1, score: 0 },
  { rank: 271, repo: "skooner-k8s/skooner", level: 1, score: 0 },
  { rank: 272, repo: "spiffe/spiffe", level: 1, score: 0 },
  { rank: 273, repo: "spinframework/spin-operator", level: 1, score: 0 },
  { rank: 274, repo: "superedge/superedge", level: 1, score: 0 },
  { rank: 275, repo: "superproj/onex", level: 1, score: 0 },
  { rank: 276, repo: "thanos-io/thanos", level: 1, score: 0 },
  { rank: 277, repo: "tinkerbell/tink", level: 1, score: 0 },
  { rank: 278, repo: "tinkerbell/tinkerbell", level: 1, score: 0 },
  { rank: 279, repo: "tokenetes/tokenetes", level: 1, score: 0 },
  { rank: 280, repo: "tremor-rs/tremor-runtime", level: 1, score: 0 },
  { rank: 281, repo: "truefoundry/KubeElasti", level: 1, score: 0 },
  { rank: 282, repo: "volcano-sh/kthena", level: 1, score: 0 },
  { rank: 283, repo: "volcano-sh/volcano", level: 1, score: 0 },
  { rank: 284, repo: "wasmCloud/wasmCloud", level: 1, score: 0 },
  { rank: 285, repo: "wayfair-incubator/telefonistka", level: 1, score: 0 },
  { rank: 286, repo: "xline-kv/xline", level: 1, score: 0 },
  { rank: 287, repo: "xregistry/server", level: 1, score: 0 },
  { rank: 288, repo: "youki-dev/youki", level: 1, score: 0 },
  { rank: 289, repo: "zalando/postgres-operator", level: 1, score: 0 },
];

// ── Summary stats ─────────────────────────────────────────────────────

const SNAPSHOT_DATE = "2026-04-22";
const TOTAL_SIGNALS = 26;

// ── Page component ────────────────────────────────────────────────────

export default function AcmmLeaderboardPage() {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<number | null>(null);
  const [sortField, setSortField] = useState<SortField>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showInfo, setShowInfo] = useState(false);

  const levelCounts = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const p of ACMM_PROJECTS) counts[p.level] = (counts[p.level] || 0) + 1;
    return counts;
  }, []);

  const filtered = useMemo(() => {
    let items = ACMM_PROJECTS;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((p) => p.repo.toLowerCase().includes(q));
    }
    if (levelFilter !== null) {
      items = items.filter((p) => p.level === levelFilter);
    }
    const sorted = [...items].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "rank":  cmp = a.rank - b.rank; break;
        case "score": cmp = a.score - b.score; break;
        case "level": cmp = a.level - b.level; break;
        case "name":  cmp = a.repo.localeCompare(b.repo); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [search, levelFilter, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "name" ? "asc" : "desc");
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-600 ml-1">↕</span>;
    return <span className="text-blue-400 ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      <Navbar />

      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <GridLines columns={20} rows={20} color="rgba(255,255,255,0.03)" />
        <StarField count={100} />
      </div>

      {/* Hero section */}
      <section className="relative pt-32 pb-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 bg-clip-text text-transparent mb-4">
            ACMM Leaderboard
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-2">
            AI Codebase Maturity Model scores for {ACMM_PROJECTS.length} CNCF &amp; cloud-native projects
          </p>
          <p className="text-gray-600 text-sm">
            Snapshot: {SNAPSHOT_DATE} · {TOTAL_SIGNALS} publicly detectable signals out of 33 ACMM feedback loops
          </p>

          {/* Quick stats */}
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            {[6, 5, 4, 3, 2, 1, 0].map((lvl) => {
              const meta = LEVELS[lvl];
              return (
                <button
                  key={lvl}
                  onClick={() => setLevelFilter(levelFilter === lvl ? null : lvl)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    levelFilter === lvl
                      ? `${meta.bg} ${meta.text} ${meta.border} ring-2 ring-offset-1 ring-offset-[#0a0a0f] ring-current`
                      : `${meta.bg} ${meta.text} ${meta.border} opacity-70 hover:opacity-100`
                  }`}
                >
                  <span>{meta.emoji}</span>
                  <span>L{lvl}</span>
                  <span className="text-xs opacity-70">({levelCounts[lvl]})</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Controls + Table */}
      <section className="relative flex-1 px-4 sm:px-6 pb-16">
        <div className="max-w-6xl mx-auto">

          {/* Search + info toggle */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search projects…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800/60 backdrop-blur-md border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm"
              />
            </div>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="px-4 py-2.5 bg-gray-800/60 backdrop-blur-md border border-white/10 rounded-lg text-gray-400 hover:text-white hover:border-white/20 transition-colors text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              How Scoring Works
            </button>
          </div>

          {/* Info panel */}
          {showInfo && (
            <div className="mb-6 bg-gray-800/40 backdrop-blur-md rounded-xl border border-white/10 p-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">
                ACMM Maturity Levels
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-4">
                {[0, 1, 2, 3, 4, 5, 6].map((lvl) => {
                  const meta = LEVELS[lvl];
                  return (
                    <div key={lvl} className={`p-3 rounded-lg border ${meta.bg} ${meta.border}`}>
                      <div className={`text-sm font-semibold ${meta.text} mb-1`}>
                        {meta.emoji} L{lvl} — {meta.name}
                      </div>
                      <div className="text-xs text-gray-400">{meta.description}</div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500">
                The full ACMM model defines <strong className="text-gray-400">33 feedback loops</strong> across 7 maturity levels (L0–L6). This leaderboard evaluates <strong className="text-gray-400">26 publicly detectable signals</strong> from repository metadata, CI/CD configuration, and AI instruction files.{" "}
                <a href="https://arxiv.org/abs/2604.09388" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                  Read the paper →
                </a>
              </p>
            </div>
          )}

          {/* Results count */}
          <div className="text-xs text-gray-500 mb-3">
            Showing {filtered.length} of {ACMM_PROJECTS.length} projects
            {levelFilter !== null && (
              <button onClick={() => setLevelFilter(null)} className="ml-2 text-blue-400 hover:underline">
                Clear filter
              </button>
            )}
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-gray-400">No projects match your search</p>
            </div>
          ) : (
            <div className="bg-gray-800/40 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
              {/* Table header */}
              <div className="hidden sm:grid sm:grid-cols-[60px_1fr_100px_180px_100px] gap-4 px-6 py-3 border-b border-white/5 text-xs text-gray-500 uppercase tracking-wider">
                <button onClick={() => toggleSort("rank")} className="text-center flex items-center justify-center cursor-pointer hover:text-gray-300">
                  Rank <SortIcon field="rank" />
                </button>
                <button onClick={() => toggleSort("name")} className="text-left flex items-center cursor-pointer hover:text-gray-300">
                  Project <SortIcon field="name" />
                </button>
                <button onClick={() => toggleSort("level")} className="text-center flex items-center justify-center cursor-pointer hover:text-gray-300">
                  Level <SortIcon field="level" />
                </button>
                <button onClick={() => toggleSort("score")} className="text-left flex items-center cursor-pointer hover:text-gray-300">
                  Score <SortIcon field="score" />
                </button>
                <div className="text-center">Scan</div>
              </div>

              {/* Table rows */}
              {filtered.map((project) => (
                <div
                  key={project.repo}
                  className="grid grid-cols-1 sm:grid-cols-[60px_1fr_100px_180px_100px] gap-2 sm:gap-4 px-4 sm:px-6 py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors items-center"
                >
                  {/* Rank */}
                  <div className="hidden sm:flex justify-center">
                    <RankDisplay rank={project.rank} />
                  </div>

                  {/* Project name */}
                  <div className="flex items-center gap-3">
                    <div className="sm:hidden flex-shrink-0 w-8 text-center">
                      <RankDisplay rank={project.rank} />
                    </div>
                    <a
                      href={`https://github.com/${project.repo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-white hover:text-blue-400 transition-colors truncate"
                    >
                      {project.repo}
                    </a>
                    <a
                      href={`https://github.com/${project.repo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-gray-400 transition-colors flex-shrink-0"
                      title="View on GitHub"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                    </a>
                  </div>

                  {/* Level */}
                  <div className="flex justify-start sm:justify-center pl-11 sm:pl-0">
                    <LevelBadge level={project.level} />
                  </div>

                  {/* Score */}
                  <div className="pl-11 sm:pl-0">
                    <ScoreBar score={project.score} />
                  </div>

                  {/* Scan link */}
                  <div className="flex justify-start sm:justify-center pl-11 sm:pl-0">
                    <a
                      href={`https://console.kubestellar.io/acmm?repo=${encodeURIComponent(project.repo)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/30 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Scan
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-8 bg-gray-800/30 backdrop-blur-md rounded-lg border border-white/5 p-6 text-center">
            <h3 className="text-lg font-semibold text-white mb-2">
              Scan any repository
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Use the interactive ACMM Dashboard to scan any GitHub repository and get a detailed maturity breakdown.
            </p>
            <a
              href="https://console.kubestellar.io/acmm"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Open ACMM Dashboard
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
