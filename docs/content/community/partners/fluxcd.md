# KubeStellar + Flux CD

[Flux CD](https://fluxcd.io/) is a CNCF Graduated project for GitOps-based continuous delivery on Kubernetes. KubeStellar and Flux work naturally together: Flux manages the GitOps sync loop on individual clusters while KubeStellar handles multi-cluster placement and distribution of workloads.

## How They Work Together

Flux watches a Git repository and reconciles the desired state to one or more clusters. KubeStellar adds the multi-cluster distribution layer — defining *where* workloads run, not just *what* they look like.

A typical combined workflow:

1. Define workloads as Flux `Kustomization` or `HelmRelease` objects in Git
2. KubeStellar's `BindingPolicy` selects which clusters receive the workload
3. KubeStellar propagates the Flux objects to target clusters
4. Flux on each target cluster reconciles the workload from the same Git source

This gives you a single GitOps source of truth that scales across any number of clusters without per-cluster configuration.

## Prerequisites

- A running KubeStellar control plane (see [KubeStellar quickstart](../../kubestellar/get-started.md))
- Flux CLI installed: `curl -s https://fluxcd.io/install.sh | sudo bash`
- `kubectl` access to your WDS (Workload Description Space) and target clusters

## Bootstrap Flux on Target Clusters

Install Flux on each target cluster that KubeStellar will manage:

```shell
# Bootstrap Flux on a target cluster
flux bootstrap github \
  --owner=<your-github-org> \
  --repository=<your-gitops-repo> \
  --branch=main \
  --path=clusters/<cluster-name> \
  --personal
```

Repeat for each target cluster. KubeStellar will later distribute workload manifests to these clusters; Flux handles the actual reconciliation on each one.

## Define a GitRepository Source in the WDS

Create a Flux `GitRepository` source in your KubeStellar WDS. KubeStellar will propagate this to target clusters:

```yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: my-app-source
  namespace: default
spec:
  interval: 1m
  url: https://github.com/<your-org>/<your-gitops-repo>
  ref:
    branch: main
```

```shell
kubectl apply -f gitrepository.yaml --context <wds-context>
```

## Propagate a Kustomization Workload

Define a Flux `Kustomization` in the WDS:

```yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: my-app
  namespace: default
spec:
  interval: 5m
  path: ./apps/my-app
  prune: true
  sourceRef:
    kind: GitRepository
    name: my-app-source
  targetNamespace: my-app
```

```shell
kubectl apply -f kustomization.yaml --context <wds-context>
```

## Create a BindingPolicy

Use a KubeStellar `BindingPolicy` to select which clusters receive the Flux objects:

```yaml
apiVersion: control.kubestellar.io/v1alpha1
kind: BindingPolicy
metadata:
  name: flux-app-policy
  namespace: default
spec:
  clusterSelectors:
  - matchLabels:
      env: production
  downsync:
  - objectSelectors:
    - matchLabels: {}
    apiGroups: ["source.toolkit.fluxcd.io"]
    resources: ["gitrepositories"]
  - objectSelectors:
    - matchLabels: {}
    apiGroups: ["kustomize.toolkit.fluxcd.io"]
    resources: ["kustomizations"]
```

```shell
kubectl apply -f bindingpolicy.yaml --context <wds-context>
```

KubeStellar propagates both the `GitRepository` and `Kustomization` to all clusters labeled `env: production`. Flux on each target cluster takes over from there, pulling from Git and reconciling the workload.

## HelmRelease Example

The same approach works for Helm-based workloads using Flux's `HelmRelease`:

```yaml
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: nginx
  namespace: default
spec:
  interval: 5m
  chart:
    spec:
      chart: nginx
      version: ">=1.0.0"
      sourceRef:
        kind: HelmRepository
        name: bitnami
        namespace: default
  values:
    replicaCount: 2
```

Include `HelmRepository` and `HelmRelease` objects in your `BindingPolicy` `downsync` spec to distribute them across clusters.

## Verifying Propagation

Check that Flux objects reached target clusters:

```shell
# On a target cluster — verify GitRepository was propagated
flux get sources git --context <target-cluster-context>

# Check Kustomization status
flux get kustomizations --context <target-cluster-context>
```

## How to Get This Working with Your KubeStellar Instance

[Join the conversation on Slack](https://cloud-native.slack.com/archives/C097094RZ3M) in `#kubestellar-dev` — we're happy to help you set up a KubeStellar + Flux integration and document your use case here.

## Resources

- [Flux CD documentation](https://fluxcd.io/flux/)
- [KubeStellar BindingPolicy reference](../../kubestellar/binding.md)
- [Flux multi-tenancy guide](https://fluxcd.io/flux/guides/repository-structure/)

<style type="text/css">
.centerImage
{
 display: block;
 margin: auto;
}
</style>
