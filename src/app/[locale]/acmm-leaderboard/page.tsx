"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  GridLines,
  StarField,
  Navbar,
  Footer,
} from "../../../components/index";
import { gtagEvent } from "../../../components/GoogleAnalytics";

// ── Types ─────────────────────────────────────────────────────────────

interface AcmmProject {
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

// ── Scannable criteria per level (from acmm.ts source of truth) ────────
// L2 OR-groups 4 instruction files → 1, so effective counts differ from raw.
// 65 total criteria, 34 effective scannable.

const SCANNABLE_PER_LEVEL: Record<number, number> = {
  0: 8,   // prereq-test-suite, prereq-e2e, prereq-cicd, etc.
  2: 3,   // agent-instructions (OR-group), prompts-catalog, editor-config
  3: 4,   // pr-acceptance-metric, pr-review-rubric, quality-dashboard, ci-matrix
  4: 7,   // auto-qa-tuning, nightly-compliance, copilot-review-apply, etc.
  5: 6,   // github-actions-ai, auto-qa-self-tuning, public-metrics, etc.
  6: 6,   // auto-issue-gen, multi-agent-orchestration, merge-queue, etc.
};

/** Cumulative scannable criteria at each level (L0 through given level). */
const CUMULATIVE_SCANNABLE: Record<number, number> = {};
{
  let cumul = 0;
  for (const lvl of [0, 1, 2, 3, 4, 5, 6]) {
    cumul += SCANNABLE_PER_LEVEL[lvl] || 0;
    CUMULATIVE_SCANNABLE[lvl] = cumul;
  }
}

const TOTAL_CRITERIA = 65;
const TOTAL_SCANNABLE = 34;

// ── Level computation (mirrors computeLevel.ts from console) ─────────
// Scannable criterion IDs per level — L2 uses the virtual OR-group.
// Must stay in sync with scannableIdsByLevel.ts in kubestellar/console.

const AGENT_INSTRUCTION_IDS = new Set([
  "acmm:claude-md", "acmm:copilot-instructions",
  "acmm:agents-md", "acmm:cursor-rules",
]);

const SCANNABLE_IDS_BY_LEVEL: Record<number, string[]> = {
  2: ["acmm:agent-instructions", "acmm:prompts-catalog", "acmm:editor-config"],
  3: ["acmm:pr-acceptance-metric", "acmm:pr-review-rubric", "acmm:quality-dashboard", "acmm:ci-matrix"],
  4: ["acmm:auto-qa-tuning", "acmm:nightly-compliance", "acmm:copilot-review-apply", "acmm:layered-safety", "acmm:risk-assessment-config", "acmm:auto-schema-lint", "acmm:copilot-workspace"],
  5: ["acmm:github-actions-ai", "acmm:auto-qa-self-tuning", "acmm:public-metrics", "acmm:auto-deprecation-enforcer", "acmm:pipeline-as-code", "acmm:self-healing-ci"],
  6: ["acmm:auto-issue-gen", "acmm:multi-agent-orchestration", "acmm:merge-queue", "acmm:auto-rollback", "acmm:dependency-auto-upgrade", "acmm:auto-changelog"],
};

const LEVEL_COMPLETION_THRESHOLD = 0.7;
const MIN_LEVEL = 1;
const MAX_LEVEL = 6;

function levelFromDetectedIds(rawIds: string[]): number {
  const detected = new Set(rawIds);
  // Synthesise virtual OR-group: any instruction file → virtual ID
  for (const id of AGENT_INSTRUCTION_IDS) {
    if (detected.has(id)) { detected.add("acmm:agent-instructions"); break; }
  }
  // Threshold walk L2–L6
  let level = MIN_LEVEL;
  for (let n = MIN_LEVEL + 1; n <= MAX_LEVEL; n++) {
    const required = SCANNABLE_IDS_BY_LEVEL[n];
    if (!required?.length) continue;
    const met = required.filter((id) => detected.has(id)).length;
    const threshold = n === 2 ? 1 / required.length : LEVEL_COMPLETION_THRESHOLD;
    if (met / required.length >= threshold) {
      level = n;
    } else {
      break;
    }
  }
  return level;
}

/** Fallback: estimate level from score count when detectedIds unavailable. */
function levelFromScore(score: number): number {
  const levels = [6, 5, 4, 3, 2, 1, 0] as const;
  for (const lvl of levels) {
    if (score >= (CUMULATIVE_SCANNABLE[lvl] || 0) && (CUMULATIVE_SCANNABLE[lvl] || 0) > 0) {
      return lvl;
    }
  }
  return score > 0 ? 1 : 0;
}

// ── Score bar ─────────────────────────────────────────────────────────

function ScoreBar({ score, level }: { score: number; level: number }) {
  const max = CUMULATIVE_SCANNABLE[level] || TOTAL_SCANNABLE;
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
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
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-gray-400 w-10 text-right">
        {score}/{max}
      </span>
    </div>
  );
}

// ── Sparkline ────────────────────────────────────────────────────────

interface AcmmHistory {
  dates: string[];
  scores: Record<string, number[]>;
  /** Detected criterion IDs from the latest scan (used for proper level computation). */
  detectedIds?: Record<string, string[]>;
  generated_at?: string;
}

const SPARKLINE_WIDTH = 64;
const SPARKLINE_HEIGHT = 20;
const SPARKLINE_STROKE_WIDTH = 1.5;
const MIN_DATA_POINTS_FOR_SPARKLINE = 2;

function Sparkline({ values }: { values: number[] }) {
  if (values.length < MIN_DATA_POINTS_FOR_SPARKLINE) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * SPARKLINE_WIDTH;
      const y = SPARKLINE_HEIGHT - ((v - min) / range) * (SPARKLINE_HEIGHT - 2) - 1;
      return `${x},${y}`;
    })
    .join(" ");

  const first = values[0];
  const last = values[values.length - 1];
  const color = last > first ? "#22c55e" : last < first ? "#ef4444" : "#6b7280";

  return (
    <svg
      width={SPARKLINE_WIDTH}
      height={SPARKLINE_HEIGHT}
      viewBox={`0 0 ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT}`}
      className="inline-block"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={SPARKLINE_STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Participants — projects displaying the ACMM badge on their README ─

const BADGE_PARTICIPANTS = new Set([
  "kubestellar/console",
  "kubestellar/kubestellar",
  "kitops-ml/kitops",
  "cadence-workflow/cadence",
  "easegress-io/easegress",
  "kmesh-net/kmesh",
  "kube-vip/kube-vip",
]);

// ── Sort options ──────────────────────────────────────────────────────

type SortField = "name" | "level" | "score";
type SortDir = "asc" | "desc";

// ── Project data (289 CNCF projects, snapshot 2026-04-22) ─────────────

const ACMM_PROJECTS: AcmmProject[] = [
  { repo: "kubestellar/console", level: 5, score: 20 },
  { repo: "chaos-mesh/chaos-mesh", level: 2, score: 6 },
  { repo: "cilium/cilium", level: 2, score: 6 },
  { repo: "backstage/backstage", level: 2, score: 5 },
  { repo: "containerd/containerd", level: 2, score: 5 },
  { repo: "cri-o/cri-o", level: 2, score: 5 },
  { repo: "meshery/meshery", level: 2, score: 5 },
  { repo: "runatlantis/atlantis", level: 2, score: 5 },
  { repo: "alibaba/higress", level: 2, score: 4 },
  { repo: "armadaproject/armada", level: 2, score: 4 },
  { repo: "bootc-dev/bootc", level: 2, score: 4 },
  { repo: "containers/podman", level: 2, score: 4 },
  { repo: "distribution/distribution", level: 2, score: 4 },
  { repo: "kagent-dev/kagent", level: 2, score: 4 },
  { repo: "kubestellar/kubestellar", level: 2, score: 4 },
  { repo: "radius-project/radius", level: 2, score: 4 },
  { repo: "runmedev/runme", level: 2, score: 4 },
  { repo: "shipwright-io/build", level: 2, score: 4 },
  { repo: "WasmEdge/WasmEdge", level: 2, score: 4 },
  { repo: "cloud-custodian/cloud-custodian", level: 1, score: 3 },
  { repo: "clusterpedia-io/clusterpedia", level: 2, score: 3 },
  { repo: "cortexproject/cortex", level: 2, score: 3 },
  { repo: "cubeFS/cubefs", level: 2, score: 3 },
  { repo: "dapr/dapr", level: 2, score: 3 },
  { repo: "drasi-project/drasi-platform", level: 2, score: 3 },
  { repo: "flomesh-io/fsm", level: 2, score: 3 },
  { repo: "grpc/grpc", level: 2, score: 3 },
  { repo: "harvester/harvester", level: 2, score: 3 },
  { repo: "istio/istio", level: 2, score: 3 },
  { repo: "k8gb-io/k8gb", level: 1, score: 3 },
  { repo: "karmada-io/karmada", level: 2, score: 3 },
  { repo: "kedacore/keda", level: 2, score: 3 },
  { repo: "kitops-ml/kitops", level: 2, score: 3 },
  { repo: "kserve/kserve", level: 2, score: 3 },
  { repo: "kubernetes-sigs/external-dns", level: 2, score: 3 },
  { repo: "kubesphere/kubesphere", level: 2, score: 3 },
  { repo: "kumahq/kuma", level: 2, score: 3 },
  { repo: "oauth2-proxy/oauth2-proxy", level: 1, score: 3 },
  { repo: "open-cluster-management-io/ocm", level: 2, score: 3 },
  { repo: "ovn-kubernetes/ovn-kubernetes", level: 2, score: 3 },
  { repo: "ratify-project/ratify", level: 1, score: 3 },
  { repo: "sealerio/sealer", level: 2, score: 3 },
  { repo: "slimtoolkit/slim", level: 2, score: 3 },
  { repo: "antrea-io/antrea", level: 2, score: 2 },
  { repo: "athenz/athenz", level: 2, score: 2 },
  { repo: "buildpacks/pack", level: 1, score: 2 },
  { repo: "cdk8s-team/cdk8s", level: 1, score: 2 },
  { repo: "chaosblade-io/chaosblade", level: 2, score: 2 },
  { repo: "devspace-sh/devspace", level: 2, score: 2 },
  { repo: "dexidp/dex", level: 2, score: 2 },
  { repo: "dragonflyoss/dragonfly", level: 2, score: 2 },
  { repo: "emissary-ingress/emissary", level: 2, score: 2 },
  { repo: "external-secrets/external-secrets", level: 2, score: 2 },
  { repo: "fluxcd/flux2", level: 2, score: 2 },
  { repo: "green-coding-solutions/green-metrics-tool", level: 2, score: 2 },
  { repo: "HolmesGPT/holmesgpt", level: 2, score: 2 },
  { repo: "hwameistor/hwameistor", level: 2, score: 2 },
  { repo: "hyperlight-dev/hyperlight", level: 2, score: 2 },
  { repo: "in-toto/in-toto", level: 2, score: 2 },
  { repo: "jaegertracing/jaeger", level: 2, score: 2 },
  { repo: "k8up-io/k8up", level: 2, score: 2 },
  { repo: "kai-scheduler/KAI-Scheduler", level: 2, score: 2 },
  { repo: "kcl-lang/kcl", level: 2, score: 2 },
  { repo: "kedgeproject/kedge", level: 1, score: 2 },
  { repo: "keycloak/keycloak", level: 2, score: 2 },
  { repo: "knative/eventing", level: 2, score: 2 },
  { repo: "kube-logging/logging-operator", level: 2, score: 2 },
  { repo: "kubean-io/kubean", level: 2, score: 2 },
  { repo: "kubecost/opencost", level: 2, score: 2 },
  { repo: "kubeedge/kubeedge", level: 2, score: 2 },
  { repo: "kubefirst/kubefirst", level: 2, score: 2 },
  { repo: "kubefleet-dev/kubefleet", level: 2, score: 2 },
  { repo: "kubernetes-sigs/kubebuilder", level: 2, score: 2 },
  { repo: "kubevirt/kubevirt", level: 2, score: 2 },
  { repo: "kubewarden/kubewarden-controller", level: 1, score: 2 },
  { repo: "lima-vm/lima", level: 2, score: 2 },
  { repo: "microcks/microcks", level: 2, score: 2 },
  { repo: "nats-io/nats-server", level: 1, score: 2 },
  { repo: "notaryproject/notation", level: 2, score: 2 },
  { repo: "open-policy-agent/opa", level: 2, score: 2 },
  { repo: "open-telemetry/community", level: 1, score: 2 },
  { repo: "open-telemetry/opentelemetry-collector", level: 2, score: 2 },
  { repo: "openclarity/openclarity", level: 1, score: 2 },
  { repo: "opencost/opencost", level: 2, score: 2 },
  { repo: "openfga/openfga", level: 2, score: 2 },
  { repo: "openGemini/openGemini", level: 1, score: 2 },
  { repo: "opentofu/opentofu", level: 1, score: 2 },
  { repo: "oxia-db/oxia", level: 2, score: 2 },
  { repo: "parallaxsecond/parsec", level: 1, score: 2 },
  { repo: "pipe-cd/pipecd", level: 2, score: 2 },
  { repo: "podman-desktop/podman-desktop", level: 2, score: 2 },
  { repo: "project-copacetic/copacetic", level: 2, score: 2 },
  { repo: "project-dalec/dalec", level: 2, score: 2 },
  { repo: "prometheus/prometheus", level: 2, score: 2 },
  { repo: "sealos-ci-robot/sealos", level: 1, score: 2 },
  { repo: "strimzi/strimzi-kafka-operator", level: 2, score: 2 },
  { repo: "tektoncd/pipeline", level: 2, score: 2 },
  { repo: "telepresenceio/telepresence", level: 2, score: 2 },
  { repo: "tikv/tikv", level: 2, score: 2 },
  { repo: "trickstercache/trickster", level: 1, score: 2 },
  { repo: "virtual-kubelet/virtual-kubelet", level: 2, score: 2 },
  { repo: "vitessio/vitess", level: 2, score: 2 },
  { repo: "werf/werf", level: 2, score: 2 },
  { repo: "agones-dev/agones", level: 1, score: 1 },
  { repo: "argoproj/argo-cd", level: 2, score: 1 },
  { repo: "artifacthub/hub", level: 1, score: 1 },
  { repo: "bank-vaults/bank-vaults", level: 2, score: 1 },
  { repo: "bfenetworks/bfe", level: 1, score: 1 },
  { repo: "bpfman/bpfman", level: 1, score: 1 },
  { repo: "cadence-workflow/cadence", level: 2, score: 1 },
  { repo: "cartography-cncf/cartography", level: 2, score: 1 },
  { repo: "cedar-policy/cedar", level: 1, score: 1 },
  { repo: "cert-manager/cert-manager", level: 1, score: 1 },
  { repo: "clusternet/clusternet", level: 1, score: 1 },
  { repo: "cni-genie/CNI-Genie", level: 2, score: 1 },
  { repo: "confidential-containers/cloud-api-adaptor", level: 1, score: 1 },
  { repo: "containerssh/containerssh", level: 1, score: 1 },
  { repo: "cozystack/cozystack", level: 2, score: 1 },
  { repo: "crossplane/crossplane", level: 1, score: 1 },
  { repo: "devfile/api", level: 2, score: 1 },
  { repo: "easegress-io/easegress", level: 1, score: 1 },
  { repo: "envoyproxy/envoy", level: 2, score: 1 },
  { repo: "eraser-dev/eraser", level: 1, score: 1 },
  { repo: "falcosecurity/falco", level: 1, score: 1 },
  { repo: "fluent/fluentd", level: 1, score: 1 },
  { repo: "fluid-cloudnative/fluid", level: 2, score: 1 },
  { repo: "glasskube/glasskube", level: 2, score: 1 },
  { repo: "goharbor/harbor", level: 1, score: 1 },
  { repo: "headlamp-k8s/headlamp", level: 2, score: 1 },
  { repo: "helm/helm", level: 2, score: 1 },
  { repo: "hexa-org/policy-orchestrator", level: 1, score: 1 },
  { repo: "inspektor-gadget/inspektor-gadget", level: 2, score: 1 },
  { repo: "k0sproject/k0s", level: 2, score: 1 },
  { repo: "k8sgpt-ai/k8sgpt", level: 1, score: 1 },
  { repo: "kanisterio/kanister", level: 2, score: 1 },
  { repo: "kcp-dev/kcp", level: 1, score: 1 },
  { repo: "keptn/lifecycle-toolkit", level: 1, score: 1 },
  { repo: "keylime/keylime", level: 1, score: 1 },
  { repo: "kgateway-dev/kgateway", level: 2, score: 1 },
  { repo: "knative/serving", level: 2, score: 1 },
  { repo: "konveyor/tackle2-ui", level: 2, score: 1 },
  { repo: "kptdev/kpt", level: 2, score: 1 },
  { repo: "krator-rs/krator", level: 1, score: 1 },
  { repo: "krkn-chaos/krkn", level: 2, score: 1 },
  { repo: "krustlet/krustlet", level: 1, score: 1 },
  { repo: "kuadrant/kuadrant-operator", level: 2, score: 1 },
  { repo: "kuasar-io/kuasar", level: 1, score: 1 },
  { repo: "kube-rs/kube", level: 1, score: 1 },
  { repo: "kubearchive/kubearchive", level: 2, score: 1 },
  { repo: "kubedl-io/kubedl", level: 1, score: 1 },
  { repo: "kubeovn/kube-ovn", level: 2, score: 1 },
  { repo: "kubernetes-sigs/headlamp", level: 2, score: 1 },
  { repo: "kubeshop/testkube", level: 2, score: 1 },
  { repo: "kubevela/kubevela", level: 1, score: 1 },
  { repo: "kubewarden/policy-server", level: 1, score: 1 },
  { repo: "kyverno/kyverno", level: 2, score: 1 },
  { repo: "linkerd/linkerd2", level: 2, score: 1 },
  { repo: "litmuschaos/litmus", level: 1, score: 1 },
  { repo: "metal3-io/baremetal-operator", level: 2, score: 1 },
  { repo: "metallb/metallb", level: 2, score: 1 },
  { repo: "mittwald/kubernetes-replicator", level: 1, score: 1 },
  { repo: "nocalhost/nocalhost", level: 1, score: 1 },
  { repo: "opcr-io/policy", level: 1, score: 1 },
  { repo: "openebs/openebs", level: 1, score: 1 },
  { repo: "openeverest/openeverest", level: 1, score: 1 },
  { repo: "OpenObservability/OpenMetrics", level: 2, score: 1 },
  { repo: "operator-framework/operator-sdk", level: 1, score: 1 },
  { repo: "oras-project/oras", level: 1, score: 1 },
  { repo: "piraeusdatastore/piraeus-operator", level: 1, score: 1 },
  { repo: "pixie-io/pixie", level: 1, score: 1 },
  { repo: "pravega/pravega", level: 1, score: 1 },
  { repo: "Project-HAMi/HAMi", level: 1, score: 1 },
  { repo: "projectcalico/calico", level: 2, score: 1 },
  { repo: "projectcontour/contour", level: 1, score: 1 },
  { repo: "rook/rook", level: 1, score: 1 },
  { repo: "sermant-io/Sermant", level: 1, score: 1 },
  { repo: "serverless-devs/serverless-devs", level: 1, score: 1 },
  { repo: "serverlessworkflow/specification", level: 1, score: 1 },
  { repo: "service-mesh-performance/service-mesh-performance", level: 1, score: 1 },
  { repo: "SlimPlanet/SlimFaas", level: 2, score: 1 },
  { repo: "spidernet-io/spiderpool", level: 2, score: 1 },
  { repo: "spiffe/spire", level: 1, score: 1 },
  { repo: "spinframework/spin", level: 1, score: 1 },
  { repo: "submariner-io/submariner", level: 2, score: 1 },
  { repo: "sustainable-computing-io/kepler", level: 2, score: 1 },
  { repo: "tellerops/teller", level: 1, score: 1 },
  { repo: "theupdateframework/python-tuf", level: 1, score: 1 },
  { repo: "traefik/traefik", level: 2, score: 1 },
  { repo: "urunc-dev/urunc", level: 1, score: 1 },
  { repo: "v6d-io/v6d", level: 1, score: 1 },
  { repo: "vscode-kubernetes-tools/vscode-kubernetes-tools", level: 2, score: 1 },
  { repo: "aeraki-mesh/aeraki", level: 1, score: 0 },
  { repo: "brigadecore/brigade", level: 1, score: 0 },
  { repo: "carina-io/carina", level: 1, score: 0 },
  { repo: "carvel-dev/ytt", level: 1, score: 0 },
  { repo: "cloudevents/spec", level: 1, score: 0 },
  { repo: "cloudfoundry/korifi", level: 1, score: 0 },
  { repo: "cloudnative-pg/cloudnative-pg", level: 1, score: 0 },
  { repo: "confidential-containers/confidential-containers", level: 1, score: 0 },
  { repo: "connectrpc/connect-go", level: 1, score: 0 },
  { repo: "container2wasm/container2wasm", level: 1, score: 0 },
  { repo: "containernetworking/cni", level: 1, score: 0 },
  { repo: "containers/composefs", level: 1, score: 0 },
  { repo: "coredns/coredns", level: 1, score: 0 },
  { repo: "devstream-io/devstream", level: 1, score: 0 },
  { repo: "etcd-io/etcd", level: 1, score: 0 },
  { repo: "fabedge/fabedge", level: 1, score: 0 },
  { repo: "flatcar/Flatcar", level: 1, score: 0 },
  { repo: "foniod/foniod", level: 1, score: 0 },
  { repo: "foniod/redbpf", level: 1, score: 0 },
  { repo: "getporter/porter", level: 1, score: 0 },
  { repo: "getsops/sops", level: 1, score: 0 },
  { repo: "inclavare-containers/inclavare-containers", level: 1, score: 0 },
  { repo: "interlink-hq/interLink", level: 1, score: 0 },
  { repo: "k3s-io/k3s", level: 1, score: 0 },
  { repo: "kairos-io/kairos", level: 1, score: 0 },
  { repo: "kaito-project/kaito", level: 1, score: 0 },
  { repo: "kmesh-net/kmesh", level: 1, score: 0 },
  { repo: "ko-build/ko", level: 1, score: 0 },
  { repo: "konveyor/analyzer-lsp", level: 1, score: 0 },
  { repo: "konveyor/operator", level: 1, score: 0 },
  { repo: "koordinator-sh/koordinator", level: 1, score: 0 },
  { repo: "kube-burner/kube-burner", level: 1, score: 0 },
  { repo: "kube-vip/kube-vip", level: 1, score: 0 },
  { repo: "kubearmor/KubeArmor", level: 1, score: 0 },
  { repo: "kubeclipper/kubeclipper", level: 1, score: 0 },
  { repo: "kubeflow/kubeflow", level: 1, score: 0 },
  { repo: "kubereboot/kured", level: 1, score: 0 },
  { repo: "kuberhealthy/kuberhealthy", level: 1, score: 0 },
  { repo: "kubernetes-sigs/cluster-api", level: 1, score: 0 },
  { repo: "kubernetes-sigs/gateway-api", level: 1, score: 0 },
  { repo: "kubernetes-sigs/kind", level: 1, score: 0 },
  { repo: "kubernetes-sigs/kustomize", level: 1, score: 0 },
  { repo: "kubernetes-sigs/kwok", level: 1, score: 0 },
  { repo: "kubernetes-sigs/secrets-store-csi-driver", level: 1, score: 0 },
  { repo: "kubernetes/kubernetes", level: 1, score: 0 },
  { repo: "kubescape/kubescape", level: 1, score: 0 },
  { repo: "kubeslice/kubeslice", level: 1, score: 0 },
  { repo: "kudobuilder/kudo", level: 1, score: 0 },
  { repo: "KusionStack/kusion", level: 1, score: 0 },
  { repo: "layotto/layotto", level: 1, score: 0 },
  { repo: "longhorn/longhorn", level: 1, score: 0 },
  { repo: "loxilb-io/loxilb", level: 1, score: 0 },
  { repo: "merbridge/merbridge", level: 1, score: 0 },
  { repo: "modelpack/model-spec", level: 1, score: 0 },
  { repo: "networkservicemesh/api", level: 1, score: 0 },
  { repo: "networkservicemesh/cmd-nse-icmp-responder", level: 1, score: 0 },
  { repo: "nmstate/nmstate", level: 1, score: 0 },
  { repo: "open-feature/spec", level: 1, score: 0 },
  { repo: "open-gitops/project", level: 1, score: 0 },
  { repo: "openchoreo/openchoreo", level: 1, score: 0 },
  { repo: "opencurve/curve", level: 1, score: 0 },
  { repo: "openelb/openelb", level: 1, score: 0 },
  { repo: "openfunction/openfunction", level: 1, score: 0 },
  { repo: "openkruise/kruise", level: 1, score: 0 },
  { repo: "openservicemesh/osm", level: 1, score: 0 },
  { repo: "opentracing/opentracing-go", level: 1, score: 0 },
  { repo: "openyurtio/openyurt", level: 1, score: 0 },
  { repo: "oscal-compass/compliance-trestle", level: 1, score: 0 },
  { repo: "paralus/paralus", level: 1, score: 0 },
  { repo: "perses/perses", level: 1, score: 0 },
  { repo: "project-akri/akri", level: 1, score: 0 },
  { repo: "project-stacker/stacker", level: 1, score: 0 },
  { repo: "project-zot/zot", level: 1, score: 0 },
  { repo: "projectcapsule/capsule", level: 1, score: 0 },
  { repo: "rancher/rancher", level: 1, score: 0 },
  { repo: "rkt/rkt", level: 1, score: 0 },
  { repo: "schemahero/schemahero", level: 1, score: 0 },
  { repo: "score-spec/spec", level: 1, score: 0 },
  { repo: "servicemeshinterface/smi-spec", level: 1, score: 0 },
  { repo: "skooner-k8s/skooner", level: 1, score: 0 },
  { repo: "spiffe/spiffe", level: 1, score: 0 },
  { repo: "spinframework/spin-operator", level: 1, score: 0 },
  { repo: "superedge/superedge", level: 1, score: 0 },
  { repo: "superproj/onex", level: 1, score: 0 },
  { repo: "thanos-io/thanos", level: 1, score: 0 },
  { repo: "tinkerbell/tink", level: 1, score: 0 },
  { repo: "tinkerbell/tinkerbell", level: 1, score: 0 },
  { repo: "tokenetes/tokenetes", level: 1, score: 0 },
  { repo: "tremor-rs/tremor-runtime", level: 1, score: 0 },
  { repo: "truefoundry/KubeElasti", level: 1, score: 0 },
  { repo: "volcano-sh/kthena", level: 1, score: 0 },
  { repo: "volcano-sh/volcano", level: 1, score: 0 },
  { repo: "wasmCloud/wasmCloud", level: 1, score: 0 },
  { repo: "wayfair-incubator/telefonistka", level: 1, score: 0 },
  { repo: "xline-kv/xline", level: 1, score: 0 },
  { repo: "xregistry/server", level: 1, score: 0 },
  { repo: "youki-dev/youki", level: 1, score: 0 },
  { repo: "zalando/postgres-operator", level: 1, score: 0 },
];

// ── Summary stats ─────────────────────────────────────────────────────

const SNAPSHOT_DATE = "2026-04-22";

// ── Page component ────────────────────────────────────────────────────

export default function AcmmLeaderboardPage() {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<number | null>(null);
  const [badgeOnly, setBadgeOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>("level");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showInfo, setShowInfo] = useState(false);
  const [history, setHistory] = useState<AcmmHistory | null>(null);

  useEffect(() => {
    fetch("/data/acmm-history.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.dates && data?.scores) setHistory(data);
      })
      .catch(() => {});
  }, []);

  // ── GA4 event helpers ──────────────────────────────────────────────

  const trackSearch = useCallback((query: string, resultCount: number) => {
    if (query.length >= 2) {
      gtagEvent("acmm_search", { query_length: query.length, result_count: resultCount });
    }
  }, []);

  const trackLevelFilter = useCallback((level: number | null) => {
    gtagEvent("acmm_level_filter", {
      level: level ?? -1,
      action: level !== null ? "select" : "clear",
    });
  }, []);

  const trackBadgeFilter = useCallback((enabled: boolean) => {
    gtagEvent("acmm_badge_filter", { action: enabled ? "on" : "off" });
  }, []);

  const trackSort = useCallback((field: SortField, direction: SortDir) => {
    gtagEvent("acmm_sort_change", { sort_field: field, sort_direction: direction });
  }, []);

  const trackScanClick = useCallback((repo: string, level: number, score: number) => {
    gtagEvent("acmm_scan_click", { repo, level, score });
  }, []);

  const trackRepoClick = useCallback((repo: string, level: number, rank: number) => {
    gtagEvent("acmm_repo_click", { repo, level, rank });
  }, []);

  const trackInfoToggle = useCallback((open: boolean) => {
    gtagEvent("acmm_info_toggle", { action: open ? "open" : "close" });
  }, []);

  const trackDashboardCTA = useCallback(() => {
    gtagEvent("acmm_dashboard_click", { source: "leaderboard_cta" });
  }, []);

  const trackPaperClick = useCallback(() => {
    gtagEvent("acmm_paper_click", { source: "info_panel" });
  }, []);

  // Merge hardcoded snapshot with live scan data when available
  const projects = useMemo(() => {
    if (!history?.scores) return ACMM_PROJECTS;
    return ACMM_PROJECTS.map((p) => {
      const scores = history.scores[p.repo];
      if (!scores?.length) return p;
      const latestScore = scores[scores.length - 1];
      const ids = history.detectedIds?.[p.repo];
      const level = ids?.length
        ? levelFromDetectedIds(ids)
        : levelFromScore(latestScore);
      return { ...p, score: latestScore, level };
    });
  }, [history]);

  const levelCounts = useMemo(() => {
    const counts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    for (const p of projects) counts[p.level] = (counts[p.level] || 0) + 1;
    return counts;
  }, [projects]);

  // Canonical ranking: level desc → score desc (no alpha — pure merit order)
  const canonicalRank = useMemo(() => {
    const ranked = [...projects].sort((a, b) =>
      b.level - a.level || b.score - a.score
    );
    const map = new Map<string, number>();
    ranked.forEach((p, i) => map.set(p.repo, i + 1));
    return map;
  }, [projects]);

  const filtered = useMemo(() => {
    let items = projects;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((p) => p.repo.toLowerCase().includes(q));
    }
    if (levelFilter !== null) {
      items = items.filter((p) => p.level === levelFilter);
    }
    if (badgeOnly) {
      items = items.filter((p) => BADGE_PARTICIPANTS.has(p.repo));
    }
    const sorted = [...items].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "score": cmp = a.score - b.score; break;
        case "level": cmp = a.level - b.level || a.score - b.score; break;
        case "name":  cmp = a.repo.localeCompare(b.repo); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [projects, search, levelFilter, badgeOnly, sortField, sortDir]);

  function toggleSort(field: SortField) {
    let newDir: SortDir;
    if (sortField === field) {
      newDir = sortDir === "asc" ? "desc" : "asc";
      setSortDir(newDir);
    } else {
      newDir = field === "name" ? "asc" : "desc";
      setSortField(field);
      setSortDir(newDir);
    }
    trackSort(field, newDir);
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
        <GridLines horizontalLines={20} verticalLines={20} strokeColor="rgba(255,255,255,0.03)" />
        <StarField density="medium" />
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
            {history?.generated_at
              ? `Last scanned: ${history.generated_at.slice(0, 10)}`
              : `Snapshot: ${SNAPSHOT_DATE}`}
            {" "}· {TOTAL_SCANNABLE} publicly detectable signals out of {TOTAL_CRITERIA} ACMM criteria
          </p>

          {/* Quick stats — level filters + badge filter */}
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            {[6, 5, 4, 3, 2, 1, 0].map((lvl) => {
              const meta = LEVELS[lvl];
              return (
                <button
                  key={lvl}
                  onClick={() => {
                    const newVal = levelFilter === lvl ? null : lvl;
                    setLevelFilter(newVal);
                    trackLevelFilter(newVal);
                  }}
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
            <button
              onClick={() => {
                const newVal = !badgeOnly;
                setBadgeOnly(newVal);
                trackBadgeFilter(newVal);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                badgeOnly
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/30 ring-2 ring-offset-1 ring-offset-[#0a0a0f] ring-amber-400"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20 opacity-70 hover:opacity-100"
              }`}
            >
              <span>✨</span>
              <span>Badge Participants</span>
              <span className="text-xs opacity-70">({BADGE_PARTICIPANTS.size})</span>
            </button>
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
                onChange={(e) => {
                  const val = e.target.value;
                  setSearch(val);
                  // Debounced search tracking (fires after typing settles)
                  const q = val.toLowerCase();
                  const count = val ? ACMM_PROJECTS.filter((p) => p.repo.toLowerCase().includes(q)).length : ACMM_PROJECTS.length;
                  trackSearch(val, count);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800/60 backdrop-blur-md border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm"
              />
            </div>
            <button
              onClick={() => {
                const newState = !showInfo;
                setShowInfo(newState);
                trackInfoToggle(newState);
              }}
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
                The full ACMM model defines <strong className="text-gray-400">{TOTAL_CRITERIA} criteria</strong> across 7 maturity levels (L0–L6). This leaderboard evaluates <strong className="text-gray-400">{TOTAL_SCANNABLE} publicly detectable signals</strong> from repository metadata, CI/CD configuration, and AI instruction files.{" "}
                <a href="https://arxiv.org/abs/2604.09388" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline" onClick={trackPaperClick}>
                  Read the paper →
                </a>
              </p>
            </div>
          )}

          {/* Results count + legend */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-gray-500 mb-3">
            <span>
              Showing {filtered.length} of {ACMM_PROJECTS.length} projects
              {(levelFilter !== null || badgeOnly) && (
                <button
                  onClick={() => { setLevelFilter(null); setBadgeOnly(false); }}
                  className="ml-2 text-blue-400 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </span>
            <span className="flex items-center gap-1">
              ✨ = displays ACMM badge on README · Score = detected / scannable for that level · Trend = 26-week score history
            </span>
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
              <div className="hidden sm:grid sm:grid-cols-[60px_1fr_100px_180px_80px_100px] gap-4 px-6 py-3 border-b border-white/5 text-xs text-gray-500 uppercase tracking-wider">
                <div className="text-center flex items-center justify-center text-gray-500">
                  Rank
                </div>
                <button onClick={() => toggleSort("name")} className="text-left flex items-center cursor-pointer hover:text-gray-300">
                  Project <SortIcon field="name" />
                </button>
                <button onClick={() => toggleSort("level")} className="text-center flex items-center justify-center cursor-pointer hover:text-gray-300">
                  Level <SortIcon field="level" />
                </button>
                <button onClick={() => toggleSort("score")} className="text-left flex items-center cursor-pointer hover:text-gray-300">
                  Score <SortIcon field="score" />
                </button>
                <div className="text-center">Trend</div>
                <div className="text-center">Scan</div>
              </div>

              {/* Table rows */}
              {filtered.map((project) => {
                const rank = canonicalRank.get(project.repo) ?? 0;
                return (
                <div
                  key={project.repo}
                  className="grid grid-cols-1 sm:grid-cols-[60px_1fr_100px_180px_80px_100px] gap-2 sm:gap-4 px-4 sm:px-6 py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors items-center"
                >
                  {/* Rank */}
                  <div className="hidden sm:flex justify-center">
                    <RankDisplay rank={rank} />
                  </div>

                  {/* Project name */}
                  <div className="flex items-center gap-3">
                    <div className="sm:hidden flex-shrink-0 w-8 text-center">
                      <RankDisplay rank={rank} />
                    </div>
                    <a
                      href={`https://github.com/${project.repo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-white hover:text-blue-400 transition-colors truncate"
                      onClick={() => trackRepoClick(project.repo, project.level, rank)}
                    >
                      {project.repo}
                    </a>
                    {BADGE_PARTICIPANTS.has(project.repo) && (
                      <span title="ACMM Participant — displays badge on README" className="flex-shrink-0 cursor-help">
                        ✨
                      </span>
                    )}
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
                    <ScoreBar score={project.score} level={project.level} />
                  </div>

                  {/* Trend sparkline */}
                  <div className="hidden sm:flex justify-center">
                    {history?.scores[project.repo]?.length && history.scores[project.repo].length >= MIN_DATA_POINTS_FOR_SPARKLINE ? (
                      <Sparkline values={history.scores[project.repo]} />
                    ) : (
                      <span className="text-xs text-gray-600">—</span>
                    )}
                  </div>

                  {/* Scan link */}
                  <div className="flex justify-start sm:justify-center pl-11 sm:pl-0">
                    <a
                      href={`https://console.kubestellar.io/acmm?repo=${encodeURIComponent(project.repo)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/30 transition-colors"
                      onClick={() => trackScanClick(project.repo, project.level, project.score)}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Scan
                    </a>
                  </div>
                </div>
                );
              })}
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
              onClick={trackDashboardCTA}
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
