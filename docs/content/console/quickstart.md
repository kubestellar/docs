---
title: "Quick Start"
linkTitle: "Quick Start"
weight: 1
description: >
  Get KubeStellar Console running in minutes
---

# Quick Start

Get KubeStellar Console running locally for development or evaluation.

> **Try it first!** See a live preview at [kubestellarconsole.netlify.app](https://kubestellarconsole.netlify.app) - no installation needed.

## Fastest Path (curl)

One command — downloads pre-built binaries, starts the backend + agent, and opens your browser:

```bash
curl -sSL https://raw.githubusercontent.com/kubestellar/console/main/start.sh | bash
```

Typically under 45 seconds. No GitHub OAuth credentials required — a local `dev-user` session is created automatically.

## What You Need

| Component | What it is | Required? |
|-----------|------------|-----------|
| kubestellar-mcp plugins | Connect to your clusters | Yes |
| kubeconfig | Your cluster credentials | Yes |
| Frontend + Backend | The console itself | Yes (bundled) |
| GitHub OAuth App | Lets users sign in via GitHub | Optional |

See [Installation](installation.md) for the full architecture diagram.

## Prerequisites

- kubectl configured with at least one cluster
- [Claude Code](https://claude.ai/claude-code) CLI installed
- kubestellar-mcp plugins (see below)
- For source builds: Go 1.24+ and Node.js 20+

## Step 1: Install kubestellar-mcp Tools

The console uses kubestellar-mcp plugins to talk to your clusters. See [kubestellar-mcp documentation](/docs/kubestellar-mcp/overview/introduction) for full details.

**Option A: From Claude Code Marketplace (recommended)**

In Claude Code, run:
```
/plugin marketplace add kubestellar/claude-plugins
```

Then go to `/plugin` → **Discover** tab and install **kubestellar-ops** and **kubestellar-deploy**.

**Option B: Via Homebrew**
```bash
brew tap kubestellar/tap
brew install kubestellar-ops kubestellar-deploy
```

Verify installation with `/mcp` in Claude Code - you should see both plugins connected.

## Step 2: Run the Console

### Option A: Pre-built binaries (recommended)

```bash
curl -sSL https://raw.githubusercontent.com/kubestellar/console/main/start.sh | bash
```

### Option B: Run from source (no OAuth)

```bash
git clone https://github.com/kubestellar/console.git
cd console
./start-dev.sh
```

Compiles from source and starts a Vite dev server on port 5174. No GitHub credentials needed.

### Option C: Run from source with GitHub OAuth

If you want GitHub login (for multi-user or testing the full auth flow):

1. Create a GitHub OAuth App at [GitHub Developer Settings](https://github.com/settings/developers) → OAuth Apps → New OAuth App:
   - **Application name**: `KubeStellar Console (dev)`
   - **Homepage URL**: `http://localhost:8080`
   - **Authorization callback URL**: `http://localhost:8080/auth/github/callback`

2. Create a `.env` file in the project root:
   ```bash
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   ```

3. Start the console:
   ```bash
   git clone https://github.com/kubestellar/console.git
   cd console
   ./startup-oauth.sh
   ```

Open http://localhost:5174 and sign in with GitHub.

## Step 3: Access the Console

Open http://localhost:5174 (source builds) or http://localhost:8080 (curl quickstart).

Your clusters from `~/.kube/config` appear automatically. If running with OAuth, sign in with GitHub. Without OAuth, you're logged in as `dev-user`.

## Kubernetes Deployment

### Using Helm

```bash
# Create namespace and secrets
kubectl create namespace ksc

kubectl create secret generic ksc-secrets \
  --namespace ksc \
  --from-literal=github-client-id=$GITHUB_CLIENT_ID \
  --from-literal=github-client-secret=$GITHUB_CLIENT_SECRET

# Install chart
helm install ksc oci://ghcr.io/kubestellar/charts/console \
  --namespace ksc \
  --set github.existingSecret=ksc-secrets
```

### Using deploy script

```bash
curl -sSL https://raw.githubusercontent.com/kubestellar/console/main/deploy.sh | bash
```

Supports `--context`, `--openshift`, `--ingress <host>`, and `--github-oauth` flags.

### OpenShift

```bash
helm install ksc ./deploy/helm/kubestellar-console \
  --namespace ksc \
  --set github.existingSecret=ksc-secrets \
  --set route.enabled=true \
  --set route.host=ksc.apps.your-cluster.com
```

## Next Steps

- [Installation](installation.md) - Full deployment options (Helm, Docker, OpenShift)
- [Configuration](configuration.md) - Customize AI mode, token limits, and more
- [Architecture](architecture.md) - Understand how the 6 components work together
- [Dashboards](dashboards.md) - Explore the 20+ dashboard pages
- [Cards](all-cards.md) - See all 110+ card types
- [kubestellar-mcp Documentation](/docs/kubestellar-mcp/overview/introduction) - Deep dive into kubestellar-ops and kubestellar-deploy
