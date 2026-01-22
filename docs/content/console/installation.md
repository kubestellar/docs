---
title: "Installation"
linkTitle: "Installation"
weight: 2
description: >
  Detailed deployment options for kkc
---

# Installation

This guide covers all deployment options for KubeStellar Klaude Console.

> **Try it first!** See a live preview at [kubestellarklaudeconsole.netlify.app](https://kubestellarklaudeconsole.netlify.app)

---

## System Components

KubeStellar Klaude Console has **6 components** that work together:

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
│  │  │    klaude-ops        │     │    klaude-deploy     │         ││          │
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
| 5 | **Claude Code Plugins** | klaude-ops + klaude-deploy tools | [Claude Marketplace](#step-1-install-claude-code-plugins) or Homebrew |
| 6 | **Kubeconfig** | Your cluster credentials | Your existing `~/.kube/config` |

---

## Installation Steps

### Step 1: Install Claude Code Plugins

The console uses klaude plugins to talk to your clusters. See the full [klaude documentation](/docs/klaude/overview/introduction) for details.

**Option A: Install from Claude Code Marketplace (recommended)**

```bash
# In Claude Code, run:
/plugin marketplace add kubestellar/claude-plugins
```

Then:
1. Go to `/plugin` → **Marketplaces** tab → click **Update**
2. Go to `/plugin` → **Discover** tab
3. Install **klaude-ops** and **klaude-deploy**

Verify with `/mcp` - you should see:
```
plugin:klaude-ops:klaude-ops · ✓ connected
plugin:klaude-deploy:klaude-deploy · ✓ connected
```

**Option B: Install via Homebrew** (source: [homebrew-tap](https://github.com/kubestellar/homebrew-tap))

```bash
brew tap kubestellar/tap
brew install klaude-ops klaude-deploy
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
| OpenShift | `https://kkc.apps.your-cluster.com/auth/github/callback` |

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

## Local Development

For contributing to the console or running from source:

### Prerequisites

- Go 1.23+
- Node.js 20+
- klaude-ops and klaude-deploy installed (see [Step 1](#step-1-install-claude-code-plugins))

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

**Cause**: `klaude-ops` or `klaude-deploy` plugins are not installed.

**Solution**: Follow [Step 1: Install Claude Code Plugins](#step-1-install-claude-code-plugins) or see the full [klaude documentation](/docs/klaude/overview/introduction).

```bash
# Via Homebrew
brew tap kubestellar/tap
brew install klaude-ops klaude-deploy
```

### GitHub OAuth 404 or Blank Page

**Cause**: OAuth credentials not configured correctly.

**Solutions**:
1. Verify the secret contains correct credentials
2. Check callback URL matches exactly (see [Step 3](#step-3-create-github-oauth-app))
3. View pod logs: `kubectl logs -n kkc deployment/kkc`

### Clusters Not Showing

**Cause**: kubeconfig not mounted or MCP bridge not running.

**Solutions**:
1. Verify kubeconfig is mounted in the pod
2. Check MCP bridge status in logs
3. Verify klaude tools are installed: `which klaude-ops klaude-deploy`

### Plugin Shows Disconnected

**Cause**: Binary not in PATH or not working.

**Solutions**:
1. Verify binary is installed: `which klaude-ops`
2. Verify binary works: `klaude-ops version`
3. Restart Claude Code

See [klaude troubleshooting](/docs/klaude/overview/introduction#troubleshooting) for more details.

---

## Related Documentation

- **[klaude Documentation](/docs/klaude/overview/introduction)** - Full guide to klaude-ops and klaude-deploy plugins
- **[Architecture](architecture.md)** - How the console components work together
- **[Configuration](configuration.md)** - AI mode, token limits, and customization
- **[Quick Start](quickstart.md)** - Get running in 5 minutes
