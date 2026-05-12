---
title: "vCluster Setup"
linkTitle: "vCluster Setup"
description: >
  Deploy KubeStellar Console into nested vClusters, wire the required secrets, and iterate locally by building and upgrading a custom image.
---

# vCluster Setup

This guide covers two common KubeStellar Console workflows in a nested vCluster environment:

1. **Fresh install** using the upstream OCI Helm chart
2. **Local development** where you build a custom image and upgrade the in-cluster Helm release

---

## Prerequisites

Install the vCluster CLI and verify the version:

```bash
curl -L -o vcluster "https://github.com/loft-sh/vcluster/releases/latest/download/vcluster-linux-amd64"
chmod +x vcluster && sudo mv vcluster /usr/local/bin/
vcluster version
```

---

## Creating the vClusters

Create the outer development vCluster first, then create the inner console vCluster inside it:

```bash
# Create outer (layer 1) vCluster
kubectl create namespace ks-dev-ns
vcluster create ks-dev -n ks-dev-ns

# Create inner (console) vCluster
kubectl create namespace ks-console-vc
vcluster create ks-console -n ks-console-vc
```

- **Outer vCluster**: `ks-dev` in namespace `ks-dev-ns`
- **Inner console vCluster**: `ks-console` in namespace `ks-console-vc`

---

## Connecting to vClusters

Use the host-cluster context first, then connect to the outer layer, and finally connect to the inner console vCluster:

```bash
# Reset to host cluster
kubectl config use-context kind-demo1

# Connect to outer layer
vcluster connect ks-dev -n ks-dev-ns

# Reconnect to the outer layer if needed before drilling into the console vCluster
vcluster connect ks-dev -n ks-dev-ns

# Connect to the console vCluster
vcluster connect ks-console -n ks-console-vc

# Verify namespace
kubectl get ns kubestellar-console
```

> **Note**: The final namespace check succeeds after you create the `kubestellar-console` namespace in the next section.

---

## Setting Up Secrets

Create the application namespace and the required secrets inside the **inner** vCluster:

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

### Required secret keys

| Secret | Required key name |
|---|---|
| `kc-github` | `github-client-id` |
| `kc-github` | `github-client-secret` |
| `kc-feedback-token` | `feedback-github-token` |

These key names must match the chart values exactly.

---

## Fresh Helm Install (upstream OCI chart)

Install the console from the upstream OCI chart:

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

If the vCluster does not provide a usable `StorageClass` and PVCs stay `Pending`, disable persistence and backups:

```bash
helm upgrade ks-console oci://ghcr.io/kubestellar/charts/kubestellar-console \
  -n kubestellar-console \
  --reuse-values \
  --set persistence.enabled=false \
  --set backup.enabled=false
```

---

## Accessing the Console

Port **8080** is commonly already in use on your workstation, especially if you are also running `make dev`. Use an alternate local port when port-forwarding:

```bash
kubectl -n kubestellar-console port-forward svc/ks-console-kubestellar-console 8081:8080
# Open: http://localhost:8081
```

---

## Local Dev — Build, Push, and Upgrade

Use this one-liner when iterating on local source changes against the Helm deployment. Replace `<YOUR_REGISTRY>` with your registry namespace:

```bash
TAG="dev-$(date +%Y%m%d-%H%M%S)" && \
echo "$TAG" > /tmp/ksc_tag.txt && \
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

---

## Upgrading the Helm Release

Upgrade from the upstream OCI chart:

```bash
# Upgrade from upstream OCI chart (keep existing secret refs)
helm upgrade ks-console \
  oci://ghcr.io/kubestellar/charts/kubestellar-console \
  -n kubestellar-console \
  --reuse-values
```

Upgrade from the local chart in the console repo:

```bash
# Upgrade from local chart
helm upgrade ks-console ./deploy/helm/kubestellar-console \
  -n kubestellar-console \
  --reuse-values
```

---

## Important Notes

- `claude.existingSecret` is optional. Leave it unset unless you have created the referenced secret.
- There is a known chart behavior where setting `claude.existingSecret` to a missing secret can cause `CreateContainerConfigError`. As a workaround, do not set `claude.existingSecret` until that secret exists.
- The secret key names are part of the contract: `github-client-id`, `github-client-secret`, and `feedback-github-token` must be documented and used exactly as shown.
- If you are running `make dev`, local port `8080` is already occupied, so use `8081:8080` for port-forwarding.
- If your vCluster has no working storage class, reuse the release values and disable `persistence` plus `backup` to avoid PVCs stuck in `Pending`.
