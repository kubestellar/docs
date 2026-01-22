---
title: "Quick Start"
linkTitle: "Quick Start"
weight: 1
description: >
  Get KubeStellar Klaude Console running in minutes
---

# Quick Start

Get kkc running locally for development or evaluation.

> **Try it first!** See a live preview at [kubestellarklaudeconsole.netlify.app](https://kubestellarklaudeconsole.netlify.app) - no installation needed.

## What You Need

The console has 6 components. This quick start covers getting them all running:

| Component | What it is |
|-----------|------------|
| GitHub OAuth App | Lets users sign in |
| Frontend + Backend | The console itself |
| klaude plugins | Connect to your clusters |
| kubeconfig | Your cluster credentials |

See [Installation](installation.md) for the full architecture diagram.

## Prerequisites

- Go 1.23+
- Node.js 20+
- Docker (for containerized deployment)
- kubectl configured with at least one cluster
- GitHub OAuth App credentials
- [Claude Code](https://claude.ai/claude-code) CLI installed
- klaude plugins (see below)

## Local Development

### 1. Install klaude Tools

The console uses klaude plugins to talk to your clusters. See [klaude documentation](/docs/klaude/overview/introduction) for full details.

**Option A: From Claude Code Marketplace (recommended)**

In Claude Code, run:
```
/plugin marketplace add kubestellar/claude-plugins
```

Then go to `/plugin` → **Discover** tab and install **klaude-ops** and **klaude-deploy**.

**Option B: Via Homebrew**
```bash
brew tap kubestellar/tap
brew install klaude-ops klaude-deploy
```

Verify installation with `/mcp` in Claude Code - you should see both plugins connected.

### 2. Clone the Repository

```bash
git clone https://github.com/kubestellar/console.git
cd console
```

### 3. Create a GitHub OAuth App

Go to [GitHub Developer Settings](https://github.com/settings/developers) → OAuth Apps → New OAuth App

- **Application name**: `KubeStellar Klaude Console (dev)`
- **Homepage URL**: `http://localhost:5174`
- **Authorization callback URL**: `http://localhost:8080/auth/github/callback`

### 4. Configure Environment

Create a `.env` file in the project root:

```bash
# .env file
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
DEV_MODE=false
FRONTEND_URL=http://localhost:5174
JWT_SECRET=your-secret-key-here
DATABASE_PATH=./data/console.db
```

Or export directly:

```bash
export GITHUB_CLIENT_ID=your_client_id
export GITHUB_CLIENT_SECRET=your_client_secret
```

### 5. Run the Development Server

```bash
./dev.sh
```

This starts both the backend (port 8080) and frontend (port 5174).

### 6. Access the Console

Open http://localhost:5174 and sign in with GitHub.

## Kubernetes Deployment

### Using Helm

```bash
# Create namespace
kubectl create namespace kkc

# Create secrets
kubectl create secret generic kkc-secrets \
  --namespace kkc \
  --from-literal=github-client-id=$GITHUB_CLIENT_ID \
  --from-literal=github-client-secret=$GITHUB_CLIENT_SECRET

# Install chart
helm install kkc ./deploy/helm/kubestellar-console \
  --namespace kkc \
  --set github.existingSecret=kkc-secrets
```

### OpenShift

```bash
helm install kkc ./deploy/helm/kubestellar-console \
  --namespace kkc \
  --set github.existingSecret=kkc-secrets \
  --set route.enabled=true \
  --set route.host=kkc.apps.your-cluster.com
```

## Next Steps

- [Installation](installation.md) - Full deployment options (Helm, Docker, OpenShift)
- [Configuration](configuration.md) - Customize AI mode, token limits, and more
- [Architecture](architecture.md) - Understand how the 6 components work together
- [Dashboards](dashboards.md) - Explore the 20 dashboard pages
- [Cards](all-cards.md) - See all 60 card types
- [klaude Documentation](/docs/klaude/overview/introduction) - Deep dive into klaude-ops and klaude-deploy
