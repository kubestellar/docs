---
title: "Local Setup Guide"
linkTitle: "Local Setup"
weight: 4
description: >
  Complete guide to running KubeStellar Console locally for development, including startup scripts, environment variables, and troubleshooting.
---

# Local Setup Guide

This guide walks you through running KubeStellar Console from source on your local machine for development or evaluation. For production deployments, see the [Installation](installation.md) page.

## Prerequisites

| Requirement | Version | Check |
|------------|---------|-------|
| Go | 1.25+ | `go version` |
| Node.js | 20+ | `node --version` |
| npm | 10+ | `npm --version` |
| kubectl | Latest | `kubectl version --client` |
| kubeconfig | At least one cluster | `kubectl config get-contexts` |
| kubestellar-mcp plugins | Latest | `which kubestellar-ops kubestellar-deploy` |

### Install kubestellar-mcp Plugins

The console requires kubestellar-ops and kubestellar-deploy MCP plugins. Install them via the Claude Code Marketplace or Homebrew:

**Option A: Claude Code Marketplace (recommended)**

```bash
# In Claude Code, run:
/plugin marketplace add kubestellar/claude-plugins
```

Then install `kubestellar-ops` and `kubestellar-deploy` from the Discover tab.

**Option B: Homebrew**

```bash
brew tap kubestellar/tap
brew install kubestellar-ops kubestellar-deploy
```

See the [kubestellar-mcp documentation](/docs/kubestellar-mcp/overview/introduction) for details.

---


## Windows/WSL Setup

For Windows users, we recommend using **Windows Subsystem for Linux (WSL2)** for the best experience:

### WSL2 Setup Steps

1. **Install WSL2** (if not already installed):
   ```powershell
   wsl --install
   ```

2. **Install Ubuntu** (or your preferred distribution):
   ```powershell
   wsl --install -d Ubuntu
   ```

3. **Update packages** inside WSL:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

4. **Install prerequisites** inside WSL:
   ```bash
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs

   # Install Go
   wget https://go.dev/dl/go1.24.0.linux-amd64.tar.gz
   sudo tar -C /usr/local -xzf go1.24.0.linux-amd64.tar.gz
   echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
   source ~/.bashrc

   # Install kubectl
   curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
   sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
   ```

5. **Follow the standard setup instructions** from within your WSL environment.

**Note**: Access your kubeconfig from Windows by mounting the Windows file system at `/mnt/c/` in WSL.

## Clone the Repository

```bash
git clone https://github.com/kubestellar/console.git
cd console
```

---

## Option 1: Without OAuth (Development Mode)

The simplest way to run the console locally. No GitHub credentials needed -- a local `dev-user` session is created automatically.

```bash
./start-dev.sh
```

This script:

1. Checks for Go and Node.js prerequisites
2. Kills any processes using ports 8080 and 5174
3. Compiles and starts the Go backend on port 8080
4. Installs npm dependencies (`cd web && npm install`)
5. Starts the Vite dev server on port 5174
6. Creates a local `dev-user` session (no GitHub login)

Open **http://localhost:5174**

The Vite dev server proxies API requests to the Go backend on port 8080.

---

## Option 2: With GitHub OAuth (Full Auth Flow)

For multi-user deployments or to test the complete authentication flow.

> **💡 Missing `.env`?**
>
> `startup-oauth.sh` requires a `.env` file with `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`. If the file is missing or incomplete, the script will **exit with an error** and print instructions for creating the `.env` file.
>
> If you don't need OAuth, use `./start-dev.sh` instead — it runs without any credentials using a local `dev-user` session.
>
> The manual steps below explain how to create the GitHub OAuth App and `.env` file.

### Step 1: Create a GitHub OAuth App

1. Go to **[GitHub Developer Settings](https://github.com/settings/developers)** > **OAuth Apps** > **New OAuth App**
2. Fill in:
   - **Application name**: `KubeStellar Console`
   - **Homepage URL**: `http://localhost:8080`
   - **Authorization callback URL**: `http://localhost:8080/auth/github/callback`
3. Click **Register application**
4. Copy the **Client ID** and generate a **Client Secret**

### Step 2: Create `.env` File

Create a `.env` file in the **repository root** (same directory as `startup-oauth.sh`):

```bash
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
```

> **Important**: The `.env` file must be in the same directory as `startup-oauth.sh`. The script reads it from its own directory. The file is `.gitignore`d so your credentials are never committed.

### Step 3: Start the Console

```bash
./startup-oauth.sh
```

This script:

1. Loads environment variables from `.env`
2. Kills any processes using ports 8080 and 8585
3. Starts the kc-agent (MCP + WebSocket server on port 8585)
4. Builds the frontend (`cd web && npm run build`)
5. Starts the Go backend on port 8080, serving both the API and the built frontend

Open **http://localhost:8080** and sign in with GitHub.

> **Note**: With `startup-oauth.sh`, the Go backend serves both the API and the pre-built frontend on port 8080. There is no separate Vite dev server (port 5174 is not used).

---

## Environment Variables

### Required for OAuth Mode

| Variable | Description |
|----------|-------------|
| `GITHUB_CLIENT_ID` | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Client Secret |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `GOOGLE_DRIVE_API_KEY` | Enables benchmark cards (Latest Benchmark, Performance Explorer, Hardware Leaderboard, etc.) | Demo data fallback |
| `CLAUDE_API_KEY` | Enables server-side AI features | Client-side API keys only |
| `ENABLED_DASHBOARDS` | Comma-separated list of dashboards to enable (reduces bundle size) | All dashboards |

---

## Port Reference

| Port | Component | Script |
|------|-----------|--------|
| 8080 | Go backend (API + frontend in OAuth mode) | Both scripts |
| 5174 | Vite dev server (dev mode only) | `start-dev.sh` |
| 8585 | kc-agent (MCP + WebSocket) | `startup-oauth.sh` |

---

## Startup Scripts Comparison

| Feature | `start-dev.sh` | `startup-oauth.sh` |
|---------|----------------|---------------------|
| GitHub login | No (local `dev-user`) | Yes (OAuth) |
| Frontend served by | Vite dev server (:5174) | Go backend (:8080) |
| Hot reload | Yes (Vite HMR) | No (must rebuild) |
| `.env` required | No | Yes |
| kc-agent started | No | Yes |
| Best for | Development/coding | Testing OAuth, production-like setup |

---

## Working with Worktrees

If you are working on multiple feature branches simultaneously, use git worktrees to avoid conflicts:

```bash
cd /path/to/console
git worktree add /tmp/console-my-feature -b my-feature-branch
cd /tmp/console-my-feature/web
npm install  # worktrees share git but NOT node_modules
cd /tmp/console-my-feature
./startup-oauth.sh  # or ./start-dev.sh
```

---

## Troubleshooting

### Port Already in Use

If you see "address already in use" errors:

```bash
# Find and kill processes on the ports
lsof -i :8080 | grep LISTEN
lsof -i :5174 | grep LISTEN
kill -9 <PID>
```

Both startup scripts attempt to clean up stale port processes automatically.

### "MCP bridge failed to start"

The kubestellar-mcp plugins are not installed. Install them with Homebrew or the Claude Code Marketplace:

```bash
brew tap kubestellar/tap
brew install kubestellar-ops kubestellar-deploy
```

### "GITHUB_CLIENT_SECRET is not set"

You are running `startup-oauth.sh` without a `.env` file. Either:

1. Create a `.env` file with your OAuth credentials (see [Step 2](#step-2-create-env-file) above)
2. Or use `./start-dev.sh` instead -- it does not require OAuth credentials

### Clusters Not Showing

1. Verify your kubeconfig has accessible clusters: `kubectl config get-contexts`
2. Test connectivity: `kubectl --context=your-cluster get nodes`
3. Check that kubestellar-mcp binaries are in your PATH: `which kubestellar-ops`

### Stale Frontend After Code Changes

If using `start-dev.sh`, the Vite dev server provides hot module replacement. If using `startup-oauth.sh`, you must restart the script after changing frontend code (it rebuilds on startup).

---

## Next Steps

- [Features Guide](console-features.md) -- Explore all console features
- [Architecture](architecture.md) -- Understand how the components work together
- [Authentication](authentication.md) -- Deep dive into OAuth and session behavior
- [Configuration](configuration.md) -- Customize AI mode, themes, and more
