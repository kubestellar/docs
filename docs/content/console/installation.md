---
title: "Installation"
linkTitle: "Installation"
weight: 2
description: >
  Detailed deployment options for kkc
---

# Installation

This guide covers all deployment options for KubeStellar Klaude Console.

## Prerequisites

- Kubernetes cluster (1.24+)
- Helm 3.x
- kubectl configured with cluster access
- GitHub OAuth App credentials (see [GitHub OAuth Setup](#github-oauth-setup))
- [Claude Code](https://claude.ai/claude-code) CLI installed (for local development)
- Klaude plugins from the [Claude Code Marketplace](https://marketplace.claude.ai) (source: [claude-plugins](https://github.com/kubestellar/claude-plugins)):
  - `klaude-ops` - Kubernetes operations tools
  - `klaude-deploy` - Multi-cluster deployment tools

## Quick Start - Plugin Installation

**Option 1: Install from Claude Code Marketplace (recommended)**

```bash
claude plugins install klaude-ops
claude plugins install klaude-deploy
```

**Option 2: Install via Homebrew** (source: [homebrew-tap](https://github.com/kubestellar/homebrew-tap))

```bash
brew tap kubestellar/tap
brew install klaude-ops klaude-deploy
```

## Helm Installation

### 1. Add Secrets

Create a secret with your OAuth credentials:

```bash
kubectl create namespace kkc

kubectl create secret generic kkc-secrets \
  --namespace kkc \
  --from-literal=github-client-id=YOUR_CLIENT_ID \
  --from-literal=github-client-secret=YOUR_CLIENT_SECRET
```

Optionally add Claude API key for AI features:

```bash
kubectl create secret generic kkc-secrets \
  --namespace kkc \
  --from-literal=github-client-id=YOUR_CLIENT_ID \
  --from-literal=github-client-secret=YOUR_CLIENT_SECRET \
  --from-literal=claude-api-key=YOUR_CLAUDE_API_KEY
```

### 2. Install Chart

**From GitHub Container Registry:**

```bash
helm install kkc oci://ghcr.io/kubestellar/charts/console \
  --namespace kkc \
  --set github.existingSecret=kkc-secrets
```

**From source:**

```bash
git clone https://github.com/kubestellar/console.git
cd console

helm install kkc ./deploy/helm/kubestellar-console \
  --namespace kkc \
  --set github.existingSecret=kkc-secrets
```

### 3. Access the Console

**Port forward (development):**

```bash
kubectl port-forward -n kkc svc/kkc 8080:8080
```

Open http://localhost:8080

**Ingress (production):**

```bash
helm upgrade kkc ./deploy/helm/kubestellar-console \
  --namespace kkc \
  --set github.existingSecret=kkc-secrets \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=kkc.your-domain.com
```

## OpenShift Installation

OpenShift uses Routes instead of Ingress:

```bash
helm install kkc ./deploy/helm/kubestellar-console \
  --namespace kkc \
  --set github.existingSecret=kkc-secrets \
  --set route.enabled=true \
  --set route.host=kkc.apps.your-cluster.com
```

The console will be available at `https://kkc.apps.your-cluster.com`

## Docker Installation

For single-node or development deployments:

```bash
docker run -d \
  --name kkc \
  -p 8080:8080 \
  -e GITHUB_CLIENT_ID=your_client_id \
  -e GITHUB_CLIENT_SECRET=your_client_secret \
  -v ~/.kube:/root/.kube:ro \
  -v kkc-data:/app/data \
  ghcr.io/kubestellar/console:latest
```

## Multi-Cluster Access

kkc reads clusters from your kubeconfig. To access multiple clusters:

1. **Merge kubeconfigs:**
   ```bash
   KUBECONFIG=~/.kube/config:~/.kube/cluster2.yaml kubectl config view --flatten > ~/.kube/merged
   mv ~/.kube/merged ~/.kube/config
   ```

2. **Mount merged config in container/pod**

3. **Verify access:**
   ```bash
   kubectl config get-contexts
   ```

## Upgrading

```bash
helm upgrade kkc oci://ghcr.io/kubestellar/charts/console \
  --namespace kkc \
  --reuse-values
```

## Uninstalling

```bash
helm uninstall kkc --namespace kkc
kubectl delete namespace kkc
```

## GitHub OAuth Setup

GitHub OAuth is **required** for authentication. Follow these steps:

### Creating a GitHub OAuth App

1. Go to **GitHub** → **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**

2. Fill in the application details:
   - **Application name**: `KubeStellar Console`
   - **Homepage URL**: Your console URL
   - **Authorization callback URL**: `https://your-console-url/auth/github/callback`

3. Click **Register application**

4. Copy the **Client ID** and generate a **Client Secret**

### Callback URL Reference

| Environment | Callback URL |
|-------------|--------------|
| Local dev | `http://localhost:8080/auth/github/callback` |
| Kubernetes | `https://console.your-domain.com/auth/github/callback` |
| OpenShift | `https://kkc.apps.your-cluster.com/auth/github/callback` |

### Helm Values for OAuth

```bash
# Option 1: Via --set flags
helm install kkc kubestellar/console \
  --set github.clientId=$GITHUB_CLIENT_ID \
  --set github.clientSecret=$GITHUB_CLIENT_SECRET

# Option 2: Via existing secret
kubectl create secret generic github-oauth \
  --from-literal=client-id=$GITHUB_CLIENT_ID \
  --from-literal=client-secret=$GITHUB_CLIENT_SECRET

helm install kkc kubestellar/console \
  --set github.existingSecret=github-oauth
```

## Troubleshooting

### "MCP bridge failed to start"

**Cause**: `klaude-ops` or `klaude-deploy` plugins are not installed.

**Solution**:
```bash
# Install from Claude Code Marketplace
claude plugins install klaude-ops
claude plugins install klaude-deploy

# Or via Homebrew
brew tap kubestellar/tap
brew install klaude-ops klaude-deploy
```

### GitHub OAuth 404 or Blank Page

**Cause**: OAuth credentials not configured correctly.

**Solutions**:
1. Verify the secret contains correct credentials
2. Check callback URL matches exactly
3. View pod logs: `kubectl logs -n kkc deployment/kkc`

### Clusters Not Showing

**Cause**: kubeconfig not mounted or MCP bridge not running.

**Solutions**:
1. Verify kubeconfig is mounted in the pod
2. Check MCP bridge status in logs
3. Verify klaude tools are installed
