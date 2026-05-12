---
title: "vCluster Setup for KubeStellar Console"
linkTitle: "vCluster Setup"
weight: 26
description: >
  Deploy KubeStellar Console into a vCluster, wire the required secrets, work around common PVC and port-forward issues, and iterate with a local build-push-upgrade workflow.
keywords:
  - kubestellar console vcluster
  - kubestellar console helm install
  - kubestellar console local deployment
  - kubectl port-forward 8080 conflict
  - vcluster setup
---

# vCluster Setup for KubeStellar Console

This guide covers the two workflows most people need when running KubeStellar Console in a vCluster:

1. **Fresh install** — deploy the console into a vCluster from the upstream OCI Helm chart.
2. **Local dev / iterate** — build a custom image, push it to your registry, and upgrade the in-cluster Helm release.

If you only need a general Helm install guide, see [Installation](./installation.md). If you already have a running in-cluster deployment and only need the image-upgrade flow, see [Local Deployment](./local-deployment.md).

## Prerequisites

Install the vCluster CLI:

```bash
curl -L -o vcluster "https://github.com/loft-sh/vcluster/releases/latest/download/vcluster-linux-amd64"
chmod +x vcluster && sudo mv vcluster /usr/local/bin/
vcluster version
```

You will also need:

- `kubectl`
- `helm`
- Docker or another OCI image builder
- Push access to a container registry for local dev iterations

## Create the vClusters

Create an outer vCluster and then the inner vCluster that will host the console:

```bash
# Create outer (layer 1) vCluster
kubectl create namespace ks-dev-ns
vcluster create ks-dev -n ks-dev-ns

# Create inner (console) vCluster
kubectl create namespace ks-console-vc
vcluster create ks-console -n ks-console-vc
```

## Connect to the correct vCluster

Use the host-cluster context first, then connect layer by layer until you reach the console vCluster:

```bash
# Reset to host cluster
kubectl config use-context kind-demo1

# Connect to outer layer
vcluster connect ks-dev -n ks-dev-ns

# Connect to inner layer (run again if needed)
vcluster connect ks-dev -n ks-dev-ns

# Connect to the console vCluster
vcluster connect ks-console -n ks-console-vc

# Verify namespace
kubectl get ns kubestellar-console
```

Adjust `kind-demo1`, namespaces, and vCluster names to match your environment.

## Set up the required secrets

Create the namespace and the secrets before installing or upgrading the chart:

```bash
kubectl create namespace kubestellar-console

# GitHub OAuth
kubectl -n kubestellar-console create secret generic kc-github \
  --from-literal=github-client-id=<GITHUB_CLIENT_ID> \
  --from-literal=github-client-secret=<GITHUB_CLIENT_SECRET>

# GitHub PAT for CI/missions/rewards/feedback (.env key: FEEDBACK_GITHUB_TOKEN)
kubectl -n kubestellar-console create secret generic kc-feedback-token \
  --from-literal=feedback-github-token=<FEEDBACK_GITHUB_TOKEN>

# Verify
kubectl -n kubestellar-console get secrets
```

The chart values reference both the **secret names** and the **keys inside those secrets**:

| Purpose | Secret name | Required key |
|---|---|---|
| GitHub OAuth client ID | `kc-github` | `github-client-id` |
| GitHub OAuth client secret | `kc-github` | `github-client-secret` |
| GitHub PAT for feedback / missions / rewards | `kc-feedback-token` | `feedback-github-token` |

## Fresh Helm install from the upstream OCI chart

```bash
helm upgrade --install ks-console \
  oci://ghcr.io/kubestellar/charts/kubestellar-console \
  --namespace kubestellar-console \
  --create-namespace \
  --set github.existingSecret=kc-github \
  --set feedbackGithubToken.existingSecret=kc-feedback-token \
  --set ingress.enabled=true \
  --set "ingress.hosts[0].host=console.local" \
  --set "ingress.hosts[0].paths[0].path=/" \
  --set "ingress.hosts[0].paths[0].pathType=Prefix"
```

### Optional Claude secret

`claude.existingSecret` is optional. Leave it unset unless you have already created the referenced secret.

- **Safe default:** do not set `claude.existingSecret`.
- **Expected behavior:** the chart should continue to run without Claude configured.
- **Important current caveat:** if you point `claude.existingSecret` at a secret that does not exist, the pod may fail with `CreateContainerConfigError`.

## PVC troubleshooting

If the console PVCs stay `Pending` because the vCluster has no usable default `StorageClass`, disable persistence and backups for that environment:

```bash
helm upgrade ks-console oci://ghcr.io/kubestellar/charts/kubestellar-console \
  -n kubestellar-console \
  --reuse-values \
  --set persistence.enabled=false \
  --set backup.enabled=false
```

For more installation failure modes, see [Troubleshooting](./troubleshooting.md#pod-stuck-pending-on-a-persistentvolumeclaim).

## Access the console

Port-forward the service after the deployment is Ready:

```bash
kubectl -n kubestellar-console port-forward svc/ks-console-kubestellar-console 8081:8080
```

Then open <http://localhost:8081>.

> Port `8080` is commonly already in use locally, especially if you are also running `make dev`. If `:8080` is occupied, use an alternate local port such as `8081:8080` or `18080:8080`.

## Local dev: build, push, and upgrade in one command

Run this from a local checkout of the `kubestellar/console` repository when iterating on source changes against the in-cluster vCluster deployment:

```bash
TAG="dev-$(date +%Y%m%d-%H%M%S)" && \
docker build -t docker.io/<YOUR_REGISTRY>/kubestellar-console:$TAG . && \
docker push docker.io/<YOUR_REGISTRY>/kubestellar-console:$TAG && \
helm upgrade --install ks-console ./deploy/helm/kubestellar-console \
  -n kubestellar-console \
  --reuse-values \
  --set github.existingSecret=kc-github \
  --set github.existingSecretKeys.clientId=github-client-id \
  --set github.existingSecretKeys.clientSecret=github-client-secret \
  --set feedbackGithubToken.existingSecret=kc-feedback-token \
  --set feedbackGithubToken.existingSecretKey=feedback-github-token \
  --set image.repository=docker.io/<YOUR_REGISTRY>/kubestellar-console \
  --set image.tag=$TAG \
  --set extraEnv[0].name=FRONTEND_URL \
  --set extraEnv[0].value=http://localhost:8080 \
  --wait --timeout 300s && \
kubectl -n kubestellar-console rollout status deploy/ks-console-kubestellar-console --timeout=300s && \
echo "DEPLOYED_TAG=$TAG"
```

This one-liner keeps the existing Helm values, updates the image, waits for the rollout to finish, and prints the deployed tag.

## Upgrade the Helm release later

Use the upstream chart when you want the latest published release, or the local chart when testing source changes:

```bash
# Upgrade from upstream OCI chart (keep existing secret refs)
helm upgrade ks-console \
  oci://ghcr.io/kubestellar/charts/kubestellar-console \
  -n kubestellar-console \
  --reuse-values

# Upgrade from local chart
helm upgrade ks-console ./deploy/helm/kubestellar-console \
  -n kubestellar-console \
  --reuse-values
```

## Summary

For vCluster-based installs, the key things to get right are:

- create the `kc-github` and `kc-feedback-token` secrets with the exact keys the chart expects
- leave `claude.existingSecret` unset unless that secret really exists
- use an alternate local port when `kubectl port-forward` would conflict with `make dev` on `:8080`
- keep the build-push-upgrade one-liner handy for fast local iteration
