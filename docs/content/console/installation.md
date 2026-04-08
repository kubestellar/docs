---
title: "Installation — Deploy KubeStellar Console for Multi-Cluster Kubernetes Management"
linkTitle: "Installation"
weight: 2
description: >
  Install KubeStellar Console locally, in Kubernetes, or via Helm. Deploy the multi-cluster Kubernetes dashboard with AI Missions, 110+ monitoring cards, and fleet-wide observability in minutes.
keywords:
  - install kubernetes dashboard
  - kubernetes console installation
  - multi-cluster dashboard setup
  - kubernetes helm install dashboard
  - deploy kubernetes management tool
  - kubernetes fleet management setup
---

# Installation — Deploy KubeStellar Console

This guide covers all deployment options for KubeStellar Console, the multi-cluster Kubernetes dashboard with AI-powered operations.

> **Try it first!** See a live preview at [kubestellarconsole.netlify.app](https://kubestellarconsole.netlify.app)

---

## Fastest Path

> **Prerequisites**: You must install the kubestellar-mcp plugins **before** running this command — they are not installed by `start.sh`. See [Step 1: Install Claude Code Plugins](#step-1-install-claude-code-plugins) first.

One command downloads pre-built binaries, starts the backend + agent, and opens your browser:

```bash
curl -sSL https://raw.githubusercontent.com/kubestellar/console/main/start.sh | bash
```

This downloads and starts the console binary only. It does **not** install kubestellar-mcp plugins. Typically takes under 45 seconds. No OAuth or GitHub credentials required — you get a local `dev-user` session automatically.

---

## System Components

KubeStellar Console has **6 components** that work together. For the full architectural deep-dive, data flow diagrams, and component interactions, see the [Architecture](architecture.md) page.

{% include-markdown "_architecture-diagram.md" %}

### Component Summary

| # | Component | What it does | Required? |
|---|-----------|--------------|-----------|
| 1 | **GitHub OAuth App** | Lets users sign in with GitHub | Optional — without it, a local `dev-user` session is created |
| 2 | **Frontend** | React web app you see in browser | Yes — included in the console executable |
| 3 | **Backend** | Go server that handles API calls | Yes — included in the console executable |
| 4 | **Agent (MCP Bridge)** | Connects backend to your clusters | Yes — spawned as a child process by the console executable |
| 5 | **Claude Code Plugins** | kubestellar-ops + kubestellar-deploy tools | Yes — [Claude Marketplace](#step-1-install-claude-code-plugins) or Homebrew |
| 6 | **Kubeconfig** | Your cluster credentials | Yes — your existing `~/.kube/config` |

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

### Step 3: Deploy the Console

Choose your deployment method:

- [Curl one-liner](#curl-quickstart) - Fastest, downloads pre-built binaries
- [Run from source (no OAuth)](#run-from-source) - For development, no GitHub credentials needed
- [Run from source (with OAuth)](#run-from-source-with-oauth) - Full GitHub login experience
- [Helm (Kubernetes)](#helm-installation) - Production deployment
- [OpenShift](#openshift-installation) - OpenShift with Routes
- [Docker](#docker-installation) - Single-node or development

---

## Curl Quickstart

Downloads pre-built binaries and starts the console:

```bash
curl -sSL https://raw.githubusercontent.com/kubestellar/console/main/start.sh | bash
```

This starts the backend (port 8080) and opens the frontend in your browser. No OAuth credentials needed — a local `dev-user` session is created automatically.

---

## Run from Source

For contributors or if you want to build from source. No GitHub OAuth required.

### Prerequisites

- Go 1.24+
- Node.js 20+
- kubestellar-ops and kubestellar-deploy installed (see [Step 1](#step-1-install-claude-code-plugins))

### Setup

```bash
git clone https://github.com/kubestellar/console.git
cd console
./start-dev.sh
```

This compiles the Go backend, installs npm dependencies, starts a Vite dev server on port 5174, and creates a local `dev-user` session (no GitHub login needed).

Open http://localhost:5174

---

## Run from Source with OAuth

To enable GitHub login (for multi-user deployments or to test the full auth flow):

### 1. Create a GitHub OAuth App

1. Go to **[GitHub Developer Settings](https://github.com/settings/developers)** → **OAuth Apps** → **New OAuth App**

2. Fill in:
   - **Application name**: `KubeStellar Console`
   - **Homepage URL**: `http://localhost:8080`
   - **Authorization callback URL**: `http://localhost:8080/auth/github/callback`

3. Click **Register application**

4. Copy the **Client ID** and generate a **Client Secret**

### 2. Clone the Repository

```bash
git clone https://github.com/kubestellar/console.git
cd console
```

### 3. Configure Environment

Create a `.env` file **inside the cloned `console/` directory** (the repo root) with your OAuth credentials:

```bash
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
FEEDBACK_GITHUB_TOKEN=ghp_your_personal_access_token
```

> **Recommended**: `FEEDBACK_GITHUB_TOKEN` is a GitHub Personal Access Token (PAT) with `public_repo` scope that enables users to submit bug reports, feature requests, and feedback directly from the console. Without it, the in-app feedback and issue submission features are disabled. We strongly encourage setting this token so your users can contribute feedback seamlessly. You can create one at [GitHub Settings → Tokens](https://github.com/settings/tokens).

> **Important**: The `.env` file must be in the same directory as `startup-oauth.sh`. The script loads it from its own directory, so creating it elsewhere will not work.

### 4. Start the Console

```bash
./startup-oauth.sh
```

Open http://localhost:8080 and sign in with GitHub.

> **Tip**: Once running, click your profile avatar → the **Developer** panel shows your OAuth status, console version, and quick links.

| Environment | Callback URL |
|-------------|--------------|
| Local dev | `http://localhost:8080/auth/github/callback` |
| Kubernetes | `https://console.your-domain.com/auth/github/callback` |
| OpenShift | `https://ksc.apps.your-cluster.com/auth/github/callback` |

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

**Recommended**: Add a `FEEDBACK_GITHUB_TOKEN` to enable in-app feedback and issue submission. This is a GitHub Personal Access Token (PAT) with `public_repo` scope that allows users to submit bug reports, feature requests, and feedback directly from the console UI. Without it, these features are disabled. We strongly encourage including this token. You can create one at [GitHub Settings → Tokens](https://github.com/settings/tokens).

Optionally add Claude API key for AI features and the feedback token:

```bash
kubectl create secret generic ksc-secrets \
  --namespace ksc \
  --from-literal=github-client-id=YOUR_CLIENT_ID \
  --from-literal=github-client-secret=YOUR_CLIENT_SECRET \
  --from-literal=claude-api-key=YOUR_CLAUDE_API_KEY \
  --from-literal=feedback-github-token=YOUR_FEEDBACK_GITHUB_TOKEN
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
kubectl port-forward -n ksc svc/ksc-kubestellar-console 8080:8080
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

### 4. Run kc-agent Locally

The Helm chart deploys the console backend inside your cluster, but **kc-agent is not included in the Helm deployment**. kc-agent is a lightweight local process that bridges your browser to your local kubeconfig via WebSocket and MCP. You must run it separately on your workstation.

**Install kc-agent:**

```bash
# Via Homebrew
brew tap kubestellar/tap
brew install kc-agent
```

**Start kc-agent:**

```bash
kc-agent
```

This starts the agent on port 8585. It reads your local `~/.kube/config` and exposes kubectl execution over WebSocket (for the browser console) and MCP (for AI coding agents).

> **Why local?** kc-agent runs on your machine because it needs direct access to your kubeconfig and kubectl. The in-cluster console connects to kc-agent over WebSocket to execute commands against clusters that are only reachable from your workstation.

> **Without kc-agent:** The console will still load, but cluster interactions that require kubectl (terminal commands, AI missions that modify resources) will not work. If the console was deployed without OAuth, it will fall back to demo mode. See [Architecture](architecture.md#kc-agent-local-agent) for details.

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
  -e FEEDBACK_GITHUB_TOKEN=ghp_your_personal_access_token \
  -v ~/.kube:/root/.kube:ro \
  -v ksc-data:/app/data \
  ghcr.io/kubestellar/console:latest
```

## Kubernetes Deployment via Script

One command that handles helm, secrets, and ingress:

```bash
curl -sSL https://raw.githubusercontent.com/kubestellar/console/main/deploy.sh | bash
```

Supports `--context`, `--openshift`, `--ingress <host>`, and `--github-oauth` flags.

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
2. Check callback URL matches exactly (see [Run from Source with OAuth](#run-from-source-with-oauth))
3. View pod logs: `kubectl logs -n ksc deployment/ksc-kubestellar-console`

### "GITHUB_CLIENT_SECRET is not set"

**Cause**: You're running `startup-oauth.sh` without a `.env` file.

**Solutions**:
1. Create a `.env` file with `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` (see [Run from Source with OAuth](#run-from-source-with-oauth))
2. Or use `./start-dev.sh` instead — it doesn't require OAuth credentials

### "exchange_failed" After GitHub Login

**Cause**: The Client Secret is wrong or has been regenerated.

**Solutions**:
1. Go to [GitHub Developer Settings](https://github.com/settings/developers) → your OAuth App
2. Generate a new Client Secret
3. Update `GITHUB_CLIENT_SECRET` in your `.env` file
4. Restart the console

### "csrf_validation_failed"

**Cause**: The callback URL in GitHub doesn't match the console's URL.

**Solutions**:
1. Verify the **Authorization callback URL** in your GitHub OAuth App settings matches exactly: `http://localhost:8080/auth/github/callback`
2. Clear your browser cookies for `localhost`
3. Restart the console

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
- **[AI Missions Setup](ai-missions-setup.md)** - Configure AI providers, select a model, and run your first mission
- **[Architecture](architecture.md)** - How the console components work together
- **[Configuration](configuration.md)** - AI mode, token limits, and customization
- **[Quick Start](quickstart.md)** - Get running in 5 minutes
