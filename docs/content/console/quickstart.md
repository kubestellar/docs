---
title: "Quick Start — Get the Multi-Cluster Kubernetes Dashboard Running in Minutes"
linkTitle: "Quick Start"
weight: 1
description: >
  Get KubeStellar Console running in minutes. Start managing multi-cluster Kubernetes operations with AI Missions, 120+ monitoring cards, and fleet-wide deployment automation — no complex setup required.
keywords:
  - kubernetes quick start
  - multi-cluster kubernetes setup
  - kubernetes dashboard quick start
  - kubernetes management tool getting started
  - AI kubernetes operations setup
---

# Quick Start — Multi-Cluster Kubernetes in Minutes

Get KubeStellar Console running locally for development or evaluation.

> **Try it first!** See a live preview at [console.kubestellar.io](https://console.kubestellar.io) - no installation needed.

!!! info "Claude Code is optional (recommended for AI features)"
    This Quick Start optionally uses **[Claude Code](https://docs.anthropic.com/en/docs/claude-code/overview)**, Anthropic's CLI tool, for AI Missions. Claude Code requires an Anthropic API subscription.

    **What requires Claude Code:**

    - AI Missions (automated issue detection and remediation)
    - Registering kubestellar-mcp plugins in Claude Code's plugin system

    **What works without Claude Code:**

    - The console dashboard, cards, and multi-cluster views all work without Claude Code
    - The kubestellar-mcp binaries are installed via **Homebrew** (required for all users)
    - The `curl` quickstart and source builds do not require Claude Code themselves

## Fastest Path (curl)

> **Prerequisites**: You must install the kubestellar-mcp plugins **before** running this command — they are not installed by `start.sh`. See [Step 1](#step-1-install-kubestellar-mcp-tools) below.

One command — downloads pre-built binaries, starts the backend + agent, and opens your browser:

```bash
curl -sSL https://raw.githubusercontent.com/kubestellar/console/main/start.sh | bash
```

This downloads and starts the console only. It does **not** install kubestellar-mcp plugins. Typically under 45 seconds. No GitHub OAuth credentials required — a local `dev-user` session is created automatically.

## What You Need

| Component | What it is | Required? |
|-----------|------------|-----------|
| kubestellar-mcp plugins | Connect to your clusters | Yes — install separately (Step 1) |
| kubeconfig | Your cluster credentials | Yes |
| Frontend + Backend | The console itself | Yes (included in the console executable) |
| GitHub OAuth App | Lets users sign in via GitHub | Optional |

See the [Architecture](architecture.md) page for the full system diagram and component details.

## Prerequisites

- kubectl configured with at least one cluster
- [Claude Code](https://claude.com/product/claude-code) CLI installed
- kubestellar-mcp plugins (see below)
- For source builds: Go 1.24+ and Node.js 20+

### Windows / WSL Setup

KubeStellar Console runs inside [WSL 2](https://learn.microsoft.com/en-us/windows/wsl/install) on Windows. All commands below should be executed in a WSL terminal.

```powershell
# From PowerShell (one-time setup)
wsl --install
```

Then inside WSL:

```bash
# Install Node.js and Go (if building from source)
sudo apt update && sudo apt install -y nodejs npm golang-go

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -sL https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl && sudo mv kubectl /usr/local/bin/

# Install Homebrew (for kubestellar-mcp plugins)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

After this, follow the standard Linux instructions below.

## Step 1: Install kubestellar-mcp Tools

The console uses kubestellar-mcp plugins to talk to your clusters. **This step is required and must be done before running the console.** See [kubestellar-mcp documentation](/docs/kubestellar-mcp/overview/introduction) for full details.

**Install the binaries (required):**

```bash
brew tap kubestellar/tap
brew install kubestellar-ops kubestellar-deploy
```

This puts the tools on your PATH so the console's MCP bridge can find them.

**Additionally, register with Claude Code (needed for AI Missions):**

If you use [Claude Code](https://docs.anthropic.com/en/docs/claude-code/overview) and want AI Missions, also register the plugins in Claude Code:

```
/plugin marketplace add kubestellar/claude-plugins
```

Then go to `/plugin` → **Discover** tab and install **kubestellar-ops** and **kubestellar-deploy**.

Verify installation:

```bash
# Check binaries are on PATH (required)
which kubestellar-ops && which kubestellar-deploy

# If using Claude Code, type /mcp to see both plugins connected (optional)
```

## Step 2: Run the Console

### Option A: Pre-built binaries (recommended)

```bash
curl -sSL https://raw.githubusercontent.com/kubestellar/console/main/start.sh | bash
```

This downloads the console binary, starts the backend (port 8080), and opens your browser. It does **not** install kubestellar-mcp plugins — complete Step 1 first.

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

Open http://localhost:8080 and sign in with GitHub.

!!! note "Port difference between startup scripts"
    `startup-oauth.sh` serves both the API and pre-built frontend on **port 8080** (Go backend). There is no separate Vite dev server.
    `start-dev.sh` uses a Vite dev server on **port 5174** for hot-reload during development.

## Step 3: Access the Console

Open http://localhost:8080 (curl quickstart or `startup-oauth.sh`) or http://localhost:5174 (`start-dev.sh` source builds).

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
helm install ksc oci://ghcr.io/kubestellar/charts/kubestellar-console \
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

## Cleanup / Uninstall

### Curl quickstart (`start.sh`)

The script downloads a binary to a local directory (typically `~/.kubestellar/`). To remove it:

```bash
# Stop the running console:
# - Press Ctrl+C in the terminal where it's running, OR
# - Kill processes on the specific ports:
kill $(lsof -ti:8080) 2>/dev/null || true
kill $(lsof -ti:5174) 2>/dev/null || true

# Remove downloaded files
rm -rf ~/.kubestellar/
```

The kubestellar-mcp plugins are managed separately by Claude Code — use `/plugin` → your plugin manager to uninstall them, or via Homebrew:

```bash
brew uninstall kubestellar-ops kubestellar-deploy
```

### Source build

```bash
# Stop the running processes (Ctrl+C), then remove the cloned directory
rm -rf ./console
```

### Helm / Kubernetes deployment

```bash
helm uninstall ksc --namespace ksc
kubectl delete namespace ksc
```

## Next Steps

- [Installation](installation.md) - Full deployment options (Helm, Docker, OpenShift)
- [Configuration](configuration.md) - Customize AI mode, token limits, and more
- [Architecture](architecture.md) - Understand how the 7 components work together
- [Dashboards](dashboards.md) - Explore the 20+ dashboard pages
- [Cards](all-cards.md) - See all 120+ card types
- [kubestellar-mcp Documentation](/docs/kubestellar-mcp/overview/introduction) - Deep dive into kubestellar-ops and kubestellar-deploy
