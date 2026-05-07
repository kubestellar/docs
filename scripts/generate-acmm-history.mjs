#!/usr/bin/env node
/**
 * ACMM history generator — runs Mon/Wed/Fri/Sun.
 *
 * Scans every project on the leaderboard via the console scan API
 * (GitHub Tree API, no clone), records {date, score} per repo, and
 * appends to a rolling 26-week history file used by the sparkline
 * column on the leaderboard page.
 *
 * Usage:
 *   GITHUB_TOKEN=ghp_xxx node scripts/generate-acmm-history.mjs
 *
 * The GITHUB_TOKEN is passed through to the scan API which uses it
 * for GitHub tree fetches (5 000 req/hr vs 60 unauthenticated).
 */

import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCAN_API = 'https://console.kubestellar.io/api/acmm/scan'
const HISTORY_PATH = resolve(__dirname, '../public/data/acmm-history.json')
const SCANS_PER_WEEK = 4 // Mon, Wed, Fri, Sun
const MAX_WEEKS = 26
const MAX_DATA_POINTS = MAX_WEEKS * SCANS_PER_WEEK
const INTER_REQUEST_DELAY_MS = 250
const REQUEST_TIMEOUT_MS = 20_000
const MAX_RETRIES = 2

// ---------------------------------------------------------------------------
// Repo list — mirrors ACMM_PROJECTS in acmm-leaderboard/page.tsx
// ---------------------------------------------------------------------------

const REPOS = [
  "kubestellar/console",
  "chaos-mesh/chaos-mesh",
  "cilium/cilium",
  "backstage/backstage",
  "containerd/containerd",
  "cri-o/cri-o",
  "meshery/meshery",
  "runatlantis/atlantis",
  "alibaba/higress",
  "armadaproject/armada",
  "bootc-dev/bootc",
  "containers/podman",
  "distribution/distribution",
  "kagent-dev/kagent",
  "kubestellar/kubestellar",
  "radius-project/radius",
  "runmedev/runme",
  "shipwright-io/build",
  "WasmEdge/WasmEdge",
  "cloud-custodian/cloud-custodian",
  "clusterpedia-io/clusterpedia",
  "cortexproject/cortex",
  "cubeFS/cubefs",
  "dapr/dapr",
  "drasi-project/drasi-platform",
  "flomesh-io/fsm",
  "grpc/grpc",
  "harvester/harvester",
  "istio/istio",
  "k8gb-io/k8gb",
  "karmada-io/karmada",
  "kedacore/keda",
  "kitops-ml/kitops",
  "kserve/kserve",
  "kubernetes-sigs/external-dns",
  "kubesphere/kubesphere",
  "kumahq/kuma",
  "oauth2-proxy/oauth2-proxy",
  "open-cluster-management-io/ocm",
  "ovn-kubernetes/ovn-kubernetes",
  "ratify-project/ratify",
  "sealerio/sealer",
  "slimtoolkit/slim",
  "antrea-io/antrea",
  "athenz/athenz",
  "buildpacks/pack",
  "cdk8s-team/cdk8s",
  "chaosblade-io/chaosblade",
  "devspace-sh/devspace",
  "dexidp/dex",
  "dragonflyoss/dragonfly",
  "emissary-ingress/emissary",
  "external-secrets/external-secrets",
  "fluxcd/flux2",
  "green-coding-solutions/green-metrics-tool",
  "HolmesGPT/holmesgpt",
  "hwameistor/hwameistor",
  "hyperlight-dev/hyperlight",
  "in-toto/in-toto",
  "jaegertracing/jaeger",
  "k8up-io/k8up",
  "kai-scheduler/KAI-Scheduler",
  "kcl-lang/kcl",
  "kedgeproject/kedge",
  "keycloak/keycloak",
  "knative/eventing",
  "kube-logging/logging-operator",
  "kubean-io/kubean",
  "kubecost/opencost",
  "kubeedge/kubeedge",
  "kubefirst/kubefirst",
  "kubefleet-dev/kubefleet",
  "kubernetes-sigs/kubebuilder",
  "kubevirt/kubevirt",
  "kubewarden/kubewarden-controller",
  "lima-vm/lima",
  "microcks/microcks",
  "nats-io/nats-server",
  "notaryproject/notation",
  "open-policy-agent/opa",
  "open-telemetry/community",
  "open-telemetry/opentelemetry-collector",
  "openclarity/openclarity",
  "opencost/opencost",
  "openfga/openfga",
  "openGemini/openGemini",
  "opentofu/opentofu",
  "oxia-db/oxia",
  "parallaxsecond/parsec",
  "pipe-cd/pipecd",
  "podman-desktop/podman-desktop",
  "project-copacetic/copacetic",
  "project-dalec/dalec",
  "prometheus/prometheus",
  "sealos-ci-robot/sealos",
  "strimzi/strimzi-kafka-operator",
  "tektoncd/pipeline",
  "telepresenceio/telepresence",
  "tikv/tikv",
  "trickstercache/trickster",
  "virtual-kubelet/virtual-kubelet",
  "vitessio/vitess",
  "werf/werf",
  "agones-dev/agones",
  "argoproj/argo-cd",
  "artifacthub/hub",
  "bank-vaults/bank-vaults",
  "bfenetworks/bfe",
  "bpfman/bpfman",
  "cadence-workflow/cadence",
  "cartography-cncf/cartography",
  "cedar-policy/cedar",
  "cert-manager/cert-manager",
  "clusternet/clusternet",
  "cni-genie/CNI-Genie",
  "confidential-containers/cloud-api-adaptor",
  "containerssh/containerssh",
  "cozystack/cozystack",
  "crossplane/crossplane",
  "devfile/api",
  "easegress-io/easegress",
  "envoyproxy/envoy",
  "eraser-dev/eraser",
  "falcosecurity/falco",
  "fluent/fluentd",
  "fluid-cloudnative/fluid",
  "glasskube/glasskube",
  "goharbor/harbor",
  "headlamp-k8s/headlamp",
  "helm/helm",
  "hexa-org/policy-orchestrator",
  "inspektor-gadget/inspektor-gadget",
  "k0sproject/k0s",
  "k8sgpt-ai/k8sgpt",
  "kanisterio/kanister",
  "kcp-dev/kcp",
  "keptn/lifecycle-toolkit",
  "keylime/keylime",
  "kgateway-dev/kgateway",
  "knative/serving",
  "konveyor/tackle2-ui",
  "kptdev/kpt",
  "krator-rs/krator",
  "krkn-chaos/krkn",
  "krustlet/krustlet",
  "kuadrant/kuadrant-operator",
  "kuasar-io/kuasar",
  "kube-rs/kube",
  "kubearchive/kubearchive",
  "kubedl-io/kubedl",
  "kubeovn/kube-ovn",
  "kubernetes-sigs/headlamp",
  "kubeshop/testkube",
  "kubevela/kubevela",
  "kubewarden/policy-server",
  "kyverno/kyverno",
  "linkerd/linkerd2",
  "litmuschaos/litmus",
  "metal3-io/baremetal-operator",
  "metallb/metallb",
  "mittwald/kubernetes-replicator",
  "nocalhost/nocalhost",
  "opcr-io/policy",
  "openebs/openebs",
  "openeverest/openeverest",
  "openfeature/flagd",
  "openkruise/kruise",
  "openservicemesh/osm",
  "operator-framework/operator-lifecycle-manager",
  "oras-project/oras",
  "piraeus-datastore/piraeus-operator",
  "porter-dev/porter",
  "pravega/pravega",
  "projectcapsule/capsule",
  "projectcontour/contour",
  "rook/rook",
  "schemahero/schemahero",
  "sigstore/cosign",
  "spiffe/spire",
  "submariner-io/submariner",
  "sustainable-computing-io/kepler",
  "theupdateframework/python-tuf",
  "tinkerbell/tink",
  "tremor-rs/tremor-runtime",
  "trickstercache/trickster",
  "volcano-sh/volcano",
  "wasmcloud/wasmcloud",
  "getporter/porter",
  "longhorn/longhorn",
  "pixie-io/pixie",
  "project-zot/zot",
  "vectordotdev/vector",
  "brigadecore/brigade",
  "chaos-mesh/chaos-mesh",
  "cloud-bulldozer/kube-burner",
  "cncf/tag-security",
  "confidential-containers/guest-components",
  "containernetworking/cni",
  "containerssh/containerssh",
  "cri-o/cri-o",
  "curvefs/curvefs",
  "devstream-io/devstream",
  "etcd-io/etcd",
  "foniod/redbpf",
  "grpc-ecosystem/grpc-gateway",
  "kube-vip/kube-vip",
  "kubearmor/KubeArmor",
  "kubereboot/kured",
  "kubernetes-sigs/cluster-api",
  "kubernetes-sigs/kustomize",
  "kubernetes-sigs/network-policy-api",
  "kubernetes-sigs/security-profiles-operator",
  "kubernetes/kubernetes",
  "kubescape/kubescape",
  "kubeslice/kubeslice",
  "kueue-dev/kueue",
  "layer5io/meshplay",
  "longhorn/longhorn-manager",
  "meshplay/meshplay",
  "networkservicemesh/networkservicemesh",
  "open-telemetry/opentelemetry-go",
  "open-telemetry/opentelemetry-java",
  "open-telemetry/opentelemetry-js",
  "open-telemetry/opentelemetry-python",
  "openyurtio/openyurt",
  "paralus/paralus",
  "percona/percona-xtradb-cluster-operator",
  "project-akri/akri",
  "project-codeflare/codeflare-operator",
  "service-mesh-performance/service-mesh-performance",
  "skooner-k8s/skooner",
  "slok/sloth",
  "superedge/superedge",
  "thanos-io/thanos",
  "vmware-tanzu/velero",
  "wayfair-incubator/telefonistka",
  "xline-kv/xline",
  "xregistry/server",
  "youki-dev/youki",
  "zalando/postgres-operator",
  "kmesh-net/kmesh",
]

// Seed scores from the 2026-04-22 snapshot (used as week 0 on cold start)
const SEED_DATE = '2026-04-22'
const SEED_SCORES = {
  "kubestellar/console": 20, "chaos-mesh/chaos-mesh": 6, "cilium/cilium": 6,
  "backstage/backstage": 5, "containerd/containerd": 5, "cri-o/cri-o": 5,
  "meshery/meshery": 5, "runatlantis/atlantis": 5, "alibaba/higress": 4,
  "armadaproject/armada": 4, "bootc-dev/bootc": 4, "containers/podman": 4,
  "distribution/distribution": 4, "kagent-dev/kagent": 4, "kubestellar/kubestellar": 4,
  "radius-project/radius": 4, "runmedev/runme": 4, "shipwright-io/build": 4,
  "WasmEdge/WasmEdge": 4,
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayUTC(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function fetchWithRetry(url, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timeout)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      if (attempt === retries) return null
      await sleep(1000 * (attempt + 1))
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  let history = { dates: [], scores: {} }

  if (existsSync(HISTORY_PATH)) {
    try {
      const raw = JSON.parse(await readFile(HISTORY_PATH, 'utf8'))
      // Migrate legacy "weeks" key to "dates"
      if (raw.weeks && !raw.dates) {
        raw.dates = raw.weeks
        delete raw.weeks
      }
      history = raw
      if (!history.dates) history.dates = []
      if (!history.scores) history.scores = {}
    } catch {
      console.warn('Could not parse existing history, starting fresh')
    }
  }

  const today = todayUTC()

  // Cold start: seed with the April 22 snapshot as data point 0
  if (history.dates.length === 0) {
    console.log(`Cold start — seeding with ${SEED_DATE} snapshot`)
    history.dates.push(SEED_DATE)
    for (const repo of REPOS) {
      if (!history.scores[repo]) history.scores[repo] = []
      history.scores[repo].push(SEED_SCORES[repo] ?? 0)
    }
  }

  // Idempotency: skip if today already recorded
  if (history.dates[history.dates.length - 1] === today) {
    console.log(`Date ${today} already recorded, nothing to do`)
    process.exit(0)
  }

  console.log(`Scanning ${REPOS.length} repos for ${today}...`)
  const scores = {}
  let scanned = 0
  let failed = 0

  for (const repo of REPOS) {
    const data = await fetchWithRetry(`${SCAN_API}?repo=${encodeURIComponent(repo)}&force=true`)

    if (data?.detectedIds) {
      scores[repo] = data.detectedIds.length
    } else {
      const prev = history.scores[repo]
      scores[repo] = prev?.length ? prev[prev.length - 1] : 0
      failed++
    }

    scanned++
    if (scanned % 50 === 0) {
      console.log(`  ${scanned}/${REPOS.length} scanned (${failed} failed)`)
    }

    await sleep(INTER_REQUEST_DELAY_MS)
  }

  console.log(`Done: ${scanned} scanned, ${failed} failed (carried forward)`)

  // Append today's scan
  history.dates.push(today)
  for (const repo of REPOS) {
    if (!history.scores[repo]) history.scores[repo] = []
    history.scores[repo].push(scores[repo] ?? 0)
  }

  // Trim to MAX_DATA_POINTS (26 weeks × 4 scans/week = 104)
  while (history.dates.length > MAX_DATA_POINTS) {
    history.dates.shift()
    for (const repo of Object.keys(history.scores)) {
      history.scores[repo]?.shift()
    }
  }

  // Remove repos no longer in the list
  const repoSet = new Set(REPOS)
  for (const repo of Object.keys(history.scores)) {
    if (!repoSet.has(repo)) delete history.scores[repo]
  }

  history.generated_at = new Date().toISOString()

  await writeFile(HISTORY_PATH, JSON.stringify(history, null, 2) + '\n')
  console.log(`Wrote ${HISTORY_PATH} (${history.dates.length} data points, ${Object.keys(history.scores).length} repos)`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
