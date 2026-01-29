---
title: "Installation"
linkTitle: "Installation"
weight: 2
description: >
  Detailed deployment options for KubeStellar Console
---

# Installation

This guide covers all deployment options for KubeStellar Console.

> **Try it first!** See a live preview at [kubestellarconsole.netlify.app](https://kubestellarconsole.netlify.app)

---

## System Components

KubeStellar Console has **6 components** that work together:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           YOUR SETUP                                             │
│                                                                                  │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│  │  1. GitHub  │     │ 2. Frontend │     │ 3. Backend  │     │  4. Agent   │   │
│  │   OAuth App │     │  (React UI) │     │    (Go)     │     │ (MCP Bridge)│   │
│  │             │────▶│             │◀───▶│             │────▶│             │   │
│  │  Login with │     │ Dashboard,  │     │ API server, │     │ Talks to    │   │
│  │   GitHub    │     │ cards, AI   │     │ auth, data  │     │ clusters    │   │
│  └─────────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘   │
│                                                                      │          │
│  ┌─────────────────────────────────────────────────────────────────┐│          │
│  │                    5. Claude Code Plugins                        ││          │
│  │  ┌──────────────────────┐     ┌──────────────────────┐         ││          │
│  │  │    kubestellar-ops        │     │    kubestellar-deploy     │         ││          │
│  │  │  - List clusters     │     │  - Deploy apps       │         ││          │
│  │  │  - Find pod issues   │     │  - GitOps sync       │         ││          │
│  │  │  - Check security    │     │  - Scale apps        │         ││          │
│  │  │  - Analyze RBAC      │     │  - Check drift       │         ││          │
│  │  └──────────────────────┘     └──────────────────────┘         ││          │
│  └─────────────────────────────────────────────────────────────────┘│          │
│                                                                      │          │
│  ┌───────────────────────────────────────────────────────────────────▼────────┐│
│  │                           6. Kubeconfig                                    ││
│  │     ~/.kube/config with access to your clusters                            ││
│  │     [cluster-1]    [cluster-2]    [cluster-3]    [cluster-n]              ││
│  └────────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Component Summary

| # | Component | What it does | Where to get it |
|---|-----------|--------------|-----------------|
| 1 | **GitHub OAuth App** | Lets users sign in with GitHub | [GitHub Developer Settings](https://github.com/settings/developers) |
| 2 | **Frontend** | React web app you see in browser | Bundled in console image |
| 3 | **Backend** | Go server that handles API calls | Bundled in console image |
| 4 | **Agent (MCP Bridge)** | Connects backend to your clusters | Bundled in console image |
| 5 | **Claude Code Plugins** | kubestellar-ops + kubestellar-deploy tools | [Claude Marketplace](#step-1-install-claude-code-plugins) or Homebrew |
| 6 | **Kubeconfig** | Your cluster credentials | Your existing `~/.kube/config` |

---

## Installation Steps

### Step 1: Install Claude Code Plugins

The console uses kubestellar-mcp plugins to talk to your clusters. See the full [kubestellar-mcp documentation](/docs/kubestellar-mcp/overview/introduction) for details.

**Option A: Install from Claude Code Marketplace (recommended)**

```bash
# In Claude Code, run:
/plugin marketplace add kubestellar/claude-plugins
```

Then:
1. Go to `/plugin` → **Marketplaces** tab → click **Update**
2. Go to `/plugin` → **Discover** tab
3. Install **kubestellar-ops** and **kubestellar-deploy**

Verify with `/mcp` - you should see:
```
plugin:kubestellar-ops:kubestellar-ops · ✓ connected
plugin:kubestellar-deploy:kubestellar-deploy · ✓ connected
```

**Option B: Install via Homebrew** (source: [homebrew-tap](https://github.com/kubestellar/homebrew-tap))

```bash
brew tap kubestellar/tap
brew install kubestellar-ops kubestellar-deploy
```

### Step 2: Set Up Kubeconfig

The console reads clusters from your kubeconfig. Make sure you have access:

```bash
# List your clusters
kubectl config get-contexts

# Test access to a cluster
kubectl --context=your-cluster get nodes
```

To add more clusters, merge kubeconfigs:
```bash
KUBECONFIG=~/.kube/config:~/.kube/cluster2.yaml kubectl config view --flatten > ~/.kube/merged
mv ~/.kube/merged ~/.kube/config
```

### Step 3: Create GitHub OAuth App

1. Go to **[GitHub Developer Settings](https://github.com/settings/developers)** → **OAuth Apps** → **New OAuth App**

2. Fill in:
   - **Application name**: `KubeStellar Console`
   - **Homepage URL**: Your console URL (e.g., `https://console.your-domain.com`)
   - **Authorization callback URL**: `https://console.your-domain.com/auth/github/callback`

3. Click **Register application**

4. Copy the **Client ID** and generate a **Client Secret**

| Environment | Callback URL |
|-------------|--------------|
| Local dev | `http://localhost:8080/auth/github/callback` |
| Kubernetes | `https://console.your-domain.com/auth/github/callback` |
| OpenShift | `https://ksc.apps.your-cluster.com/auth/github/callback` |

### Step 4: Deploy the Console

Choose your deployment method:

- [Helm (Kubernetes)](#helm-installation) - Production deployment
- [OpenShift](#openshift-installation) - OpenShift with Routes
- [Docker](#docker-installation) - Single-node or development
- [Local Development](#local-development) - For contributors

---

## Helm Installation

### 1. Add Secrets

Create a secret with your OAuth credentials:

```bash
kubectl create namespace ksc

kubectl create secret generic ksc-secrets \
  --namespace ksc \
  --from-literal=github-client-id=YOUR_CLIENT_ID \
  --from-literal=github-client-secret=YOUR_CLIENT_SECRET
```

Optionally add Claude API key for AI features:

```bash
kubectl create secret generic ksc-secrets \
  --namespace ksc \
  --from-literal=github-client-id=YOUR_CLIENT_ID \
  --from-literal=github-client-secret=YOUR_CLIENT_SECRET \
  --from-literal=claude-api-key=YOUR_CLAUDE_API_KEY
```

### 2. Install Chart

**From GitHub Container Registry:**

```bash
helm install ksc oci://ghcr.io/kubestellar/charts/console \
  --namespace ksc \
  --set github.existingSecret=ksc-secrets
```

**From source:**

```bash
git clone https://github.com/kubestellar/console.git
cd console

helm install ksc ./deploy/helm/kubestellar-console \
  --namespace ksc \
  --set github.existingSecret=ksc-secrets
```

### 3. Access the Console

**Port forward (development):**

```bash
kubectl port-forward -n ksc svc/ksc 8080:8080
```

Open http://localhost:8080

**Ingress (production):**

```bash
helm upgrade ksc ./deploy/helm/kubestellar-console \
  --namespace ksc \
  --set github.existingSecret=ksc-secrets \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=ksc.your-domain.com
```

## OpenShift Installation

OpenShift uses Routes instead of Ingress:

```bash
helm install ksc ./deploy/helm/kubestellar-console \
  --namespace ksc \
  --set github.existingSecret=ksc-secrets \
  --set route.enabled=true \
  --set route.host=ksc.apps.your-cluster.com
```

The console will be available at `https://ksc.apps.your-cluster.com`

## Docker Installation

For single-node or development deployments:

```bash
docker run -d \
  --name ksc \
  -p 8080:8080 \
  -e GITHUB_CLIENT_ID=your_client_id \
  -e GITHUB_CLIENT_SECRET=your_client_secret \
  -v ~/.kube:/root/.kube:ro \
  -v ksc-data:/app/data \
  ghcr.io/kubestellar/console:latest
```

## Multi-Cluster Access

The console reads clusters from your kubeconfig. To access multiple clusters:

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
helm upgrade ksc oci://ghcr.io/kubestellar/charts/console \
  --namespace ksc \
  --reuse-values
```

## Uninstalling

```bash
helm uninstall ksc --namespace ksc
kubectl delete namespace ksc
```

## Local Development

For contributing to the console or running from source:

### Prerequisites

- Go 1.23+
- Node.js 20+
- kubestellar-ops and kubestellar-deploy installed (see [Step 1](#step-1-install-claude-code-plugins))

### Setup

```bash
# Clone the repo
git clone https://github.com/kubestellar/console.git
cd console

# Create .env file
cat > .env << EOF
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
DEV_MODE=false
FRONTEND_URL=http://localhost:5174
JWT_SECRET=your-secret-key-here
DATABASE_PATH=./data/console.db
EOF

# Run both frontend and backend
./dev.sh
```

Open http://localhost:5174 and sign in with GitHub.

---

## Troubleshooting

### "MCP bridge failed to start"

**Cause**: `kubestellar-ops` or `kubestellar-deploy` plugins are not installed.

**Solution**: Follow [Step 1: Install Claude Code Plugins](#step-1-install-claude-code-plugins) or see the full [kubestellar-mcp documentation](/docs/kubestellar-mcp/overview/introduction).

```bash
# Via Homebrew
brew tap kubestellar/tap
brew install kubestellar-ops kubestellar-deploy
```

### GitHub OAuth 404 or Blank Page

**Cause**: OAuth credentials not configured correctly.

**Solutions**:
1. Verify the secret contains correct credentials
2. Check callback URL matches exactly (see [Step 3](#step-3-create-github-oauth-app))
3. View pod logs: `kubectl logs -n ksc deployment/ksc`

### Clusters Not Showing

**Cause**: kubeconfig not mounted or MCP bridge not running.

**Solutions**:
1. Verify kubeconfig is mounted in the pod
2. Check MCP bridge status in logs
3. Verify kubestellar-mcp tools are installed: `which kubestellar-ops kubestellar-deploy`

### Plugin Shows Disconnected

**Cause**: Binary not in PATH or not working.

**Solutions**:
1. Verify binary is installed: `which kubestellar-ops`
2. Verify binary works: `kubestellar-ops version`
3. Restart Claude Code

See [kubestellar-mcp troubleshooting](/docs/kubestellar-mcp/overview/introduction#troubleshooting) for more details.

---

## Related Documentation

- **[kubestellar-mcp Documentation](/docs/kubestellar-mcp/overview/introduction)** - Full guide to kubestellar-ops and kubestellar-deploy plugins
- **[Architecture](architecture.md)** - How the console components work together
- **[Configuration](configuration.md)** - AI mode, token limits, and customization
- **[Quick Start](quickstart.md)** - Get running in 5 minutes
