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

// Seed scores from the 2026-04-22 snapshot (used as data point 0 on cold start)
const SEED_DATE = '2026-04-22'
const SEED_SCORES = {
  "HolmesGPT/holmesgpt": 2, "OpenObservability/OpenMetrics": 1,
  "Project-HAMi/HAMi": 1, "SlimPlanet/SlimFaas": 1, "WasmEdge/WasmEdge": 4,
  "agones-dev/agones": 1, "alibaba/higress": 4, "antrea-io/antrea": 2,
  "argoproj/argo-cd": 1, "armadaproject/armada": 4, "artifacthub/hub": 1,
  "athenz/athenz": 2, "backstage/backstage": 5, "bank-vaults/bank-vaults": 1,
  "bfenetworks/bfe": 1, "bootc-dev/bootc": 4, "bpfman/bpfman": 1,
  "buildpacks/pack": 2, "cadence-workflow/cadence": 1,
  "cartography-cncf/cartography": 1, "cdk8s-team/cdk8s": 2,
  "cedar-policy/cedar": 1, "cert-manager/cert-manager": 1,
  "chaos-mesh/chaos-mesh": 6, "chaosblade-io/chaosblade": 2,
  "cilium/cilium": 6, "cloud-custodian/cloud-custodian": 3,
  "clusternet/clusternet": 1, "clusterpedia-io/clusterpedia": 3,
  "cni-genie/CNI-Genie": 1, "confidential-containers/cloud-api-adaptor": 1,
  "containerd/containerd": 5, "containers/podman": 4,
  "containerssh/containerssh": 1, "cortexproject/cortex": 3,
  "cozystack/cozystack": 1, "cri-o/cri-o": 5, "crossplane/crossplane": 1,
  "cubeFS/cubefs": 3, "dapr/dapr": 3, "devfile/api": 1,
  "devspace-sh/devspace": 2, "dexidp/dex": 2, "distribution/distribution": 4,
  "dragonflyoss/dragonfly": 2, "drasi-project/drasi-platform": 3,
  "easegress-io/easegress": 1, "emissary-ingress/emissary": 2,
  "envoyproxy/envoy": 1, "eraser-dev/eraser": 1,
  "external-secrets/external-secrets": 2, "falcosecurity/falco": 1,
  "flomesh-io/fsm": 3, "fluent/fluentd": 1, "fluid-cloudnative/fluid": 1,
  "fluxcd/flux2": 2, "glasskube/glasskube": 1, "goharbor/harbor": 1,
  "green-coding-solutions/green-metrics-tool": 2, "grpc/grpc": 3,
  "harvester/harvester": 3, "headlamp-k8s/headlamp": 1, "helm/helm": 1,
  "hexa-org/policy-orchestrator": 1, "hwameistor/hwameistor": 2,
  "hyperlight-dev/hyperlight": 2, "in-toto/in-toto": 2,
  "inspektor-gadget/inspektor-gadget": 1, "istio/istio": 3,
  "jaegertracing/jaeger": 2, "k0sproject/k0s": 1, "k8gb-io/k8gb": 3,
  "k8sgpt-ai/k8sgpt": 1, "k8up-io/k8up": 2, "kagent-dev/kagent": 4,
  "kai-scheduler/KAI-Scheduler": 2, "kanisterio/kanister": 1,
  "karmada-io/karmada": 3, "kcl-lang/kcl": 2, "kcp-dev/kcp": 1,
  "kedacore/keda": 3, "kedgeproject/kedge": 2, "keptn/lifecycle-toolkit": 1,
  "keycloak/keycloak": 2, "keylime/keylime": 1, "kgateway-dev/kgateway": 1,
  "kitops-ml/kitops": 3, "knative/eventing": 2, "knative/serving": 1,
  "konveyor/tackle2-ui": 1, "kptdev/kpt": 1, "krator-rs/krator": 1,
  "krkn-chaos/krkn": 1, "krustlet/krustlet": 1, "kserve/kserve": 3,
  "kuadrant/kuadrant-operator": 1, "kuasar-io/kuasar": 1,
  "kube-logging/logging-operator": 2, "kube-rs/kube": 1,
  "kubean-io/kubean": 2, "kubearchive/kubearchive": 1,
  "kubecost/opencost": 2, "kubedl-io/kubedl": 1, "kubeedge/kubeedge": 2,
  "kubefirst/kubefirst": 2, "kubefleet-dev/kubefleet": 2,
  "kubeovn/kube-ovn": 1, "kubernetes-sigs/external-dns": 3,
  "kubernetes-sigs/headlamp": 1, "kubernetes-sigs/kubebuilder": 2,
  "kubeshop/testkube": 1, "kubesphere/kubesphere": 3,
  "kubestellar/console": 20, "kubestellar/kubestellar": 4,
  "kubevela/kubevela": 1, "kubevirt/kubevirt": 2,
  "kubewarden/kubewarden-controller": 2, "kubewarden/policy-server": 1,
  "kumahq/kuma": 3, "kyverno/kyverno": 1, "lima-vm/lima": 2,
  "linkerd/linkerd2": 1, "litmuschaos/litmus": 1, "meshery/meshery": 5,
  "metal3-io/baremetal-operator": 1, "metallb/metallb": 1,
  "microcks/microcks": 2, "mittwald/kubernetes-replicator": 1,
  "nats-io/nats-server": 2, "nocalhost/nocalhost": 1,
  "notaryproject/notation": 2, "oauth2-proxy/oauth2-proxy": 3,
  "opcr-io/policy": 1, "open-cluster-management-io/ocm": 3,
  "open-policy-agent/opa": 2, "open-telemetry/community": 2,
  "open-telemetry/opentelemetry-collector": 2, "openGemini/openGemini": 2,
  "openclarity/openclarity": 2, "opencost/opencost": 2,
  "openebs/openebs": 1, "openeverest/openeverest": 1,
  "openfga/openfga": 2, "opentofu/opentofu": 2,
  "operator-framework/operator-sdk": 1, "oras-project/oras": 1,
  "ovn-kubernetes/ovn-kubernetes": 3, "oxia-db/oxia": 2,
  "parallaxsecond/parsec": 2, "pipe-cd/pipecd": 2,
  "piraeusdatastore/piraeus-operator": 1, "pixie-io/pixie": 1,
  "podman-desktop/podman-desktop": 2, "pravega/pravega": 1,
  "project-copacetic/copacetic": 2, "project-dalec/dalec": 2,
  "projectcalico/calico": 1, "projectcontour/contour": 1,
  "prometheus/prometheus": 2, "radius-project/radius": 4,
  "ratify-project/ratify": 3, "rook/rook": 1, "runatlantis/atlantis": 5,
  "runmedev/runme": 4, "sealerio/sealer": 3, "sealos-ci-robot/sealos": 2,
  "sermant-io/Sermant": 1, "serverless-devs/serverless-devs": 1,
  "serverlessworkflow/specification": 1,
  "service-mesh-performance/service-mesh-performance": 1,
  "shipwright-io/build": 4, "slimtoolkit/slim": 3,
  "spidernet-io/spiderpool": 1, "spiffe/spire": 1, "spinframework/spin": 1,
  "strimzi/strimzi-kafka-operator": 2, "submariner-io/submariner": 1,
  "sustainable-computing-io/kepler": 1, "tektoncd/pipeline": 2,
  "telepresenceio/telepresence": 2, "tellerops/teller": 1,
  "theupdateframework/python-tuf": 1, "tikv/tikv": 2,
  "traefik/traefik": 1, "trickstercache/trickster": 2,
  "urunc-dev/urunc": 1, "v6d-io/v6d": 1,
  "virtual-kubelet/virtual-kubelet": 2, "vitessio/vitess": 2,
  "vscode-kubernetes-tools/vscode-kubernetes-tools": 1, "werf/werf": 2,
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
  const latestDetectedIds = {}
  let scanned = 0
  let failed = 0

  for (const repo of REPOS) {
    const data = await fetchWithRetry(`${SCAN_API}?repo=${encodeURIComponent(repo)}&force=true`)

    if (data?.detectedIds) {
      scores[repo] = data.detectedIds.length
      latestDetectedIds[repo] = data.detectedIds
    } else {
      const prev = history.scores[repo]
      scores[repo] = prev?.length ? prev[prev.length - 1] : 0
      latestDetectedIds[repo] = history.detectedIds?.[repo] ?? []
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

  // Store detectedIds for latest scan only (used for proper level computation)
  history.detectedIds = latestDetectedIds

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
