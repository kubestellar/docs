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

**Step 1: Install the plugins** via the Claude Code Marketplace or Homebrew:

=== "Claude Code Marketplace (recommended)"

    ```bash
    # In Claude Code, run:
    /plugin marketplace add kubestellar/claude-plugins
    ```

    Then install `kubestellar-ops` and `kubestellar-deploy` from the Discover tab.

=== "Homebrew"

    ```bash
    brew tap kubestellar/tap
    brew install kubestellar-ops kubestellar-deploy
    ```

**Step 2: Verify** both plugins are installed:

```bash
which kubestellar-ops && which kubestellar-deploy
```

See the [kubestellar-mcp documentation](../kubestellar-mcp/overview/intro.md) for details.

---


## Windows/WSL Setup

For Windows users, we recommend using **Windows Subsystem for Linux (WSL2)** for the best experience.

For source-build-specific fixes, see [Windows 11 Local Source Build Troubleshooting](windows-11-local-source-build-troubleshooting.md).

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
   curl -H "Cache-Control: no-cache" -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs

   # Install Go
   wget https://go.dev/dl/go1.25.0.linux-amd64.tar.gz
   sudo tar -C /usr/local -xzf go1.25.0.linux-amd64.tar.gz
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

```bash
./startup-oauth.sh              # Production build (recommended)
./startup-oauth.sh --dev        # Vite dev server with hot reload
```

The `--dev` flag uses the Vite dev server (port 5174) with live module replacement instead of the production build. This is useful for frontend development but requires a GitHub OAuth app and `.env` file.

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
./startup-oauth.sh              # Production build (recommended)
./startup-oauth.sh --dev        # Dev mode with Vite server
```

#### Production Build (default)

This script:

1. Loads environment variables from `.env`
2. Kills any processes using ports 8080, 8081, 8585, and 5174
3. Starts the kc-agent (MCP + WebSocket server on port 8585)
4. Builds the frontend (`cd web && npm run build`)
5. Starts a **watchdog on port 8080** that manages the Go backend on port 8081
6. The watchdog survives restarts, so users never see "connection refused" errors
7. Opens **http://localhost:8080**

The watchdog architecture improves reliability by keeping a stable frontend connection through backend restarts during development. The actual backend API runs on port 8081 but is transparent to the user.

> **Note**: With `startup-oauth.sh`, the watchdog on port 8080 proxies requests to the backend on port 8081, which serves both the API and the pre-built frontend. This architecture allows the console to survive backend restarts without disconnecting users. There is no separate Vite dev server (port 5174 is not used).

#### Dev Mode (`--dev` flag)

```bash
./startup-oauth.sh --dev
```

Uses the Vite dev server instead of the production build:

1. Loads environment variables from `.env`
2. Starts the kc-agent (MCP + WebSocket server on port 8585)
3. Starts the Go backend on port 8080 (no watchdog)
4. Starts Vite dev server on port 5174 with hot module replacement
5. Opens **http://localhost:5174**

Use this for frontend development with live reload.

> **Note**: This is useful when iterating on frontend features with OAuth enabled. For pure frontend development without authentication, use `./start-dev.sh` instead.

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
| 8080 | Watchdog/Frontend entrance (OAuth mode) or Go backend (dev mode) | `startup-oauth.sh` |
| 8081 | Go backend (OAuth mode with watchdog) | `startup-oauth.sh` (production build) |
| 5174 | Vite dev server (dev mode) | `start-dev.sh` or `startup-oauth.sh --dev` |
| 8585 | kc-agent (MCP + WebSocket) | Both scripts |

---

## Watchdog Architecture

The `startup-oauth.sh` script includes a **watchdog process** that improves the development experience:

### Problem Solved
Without the watchdog, restarting the backend causes "connection refused" errors in the browser, forcing manual page refreshes.

### How It Works
1. **Watchdog (port 8080)**: A lightweight proxy that listens on port 8080 and survives restarts
2. **Backend (port 8081)**: The actual Go backend process running the API and serving the frontend
3. **kc-agent (port 8585)**: The MCP + WebSocket server, independent of the backend

### Restart Behavior
- When you restart the backend (e.g., after code changes), the watchdog stays alive
- The watchdog detects the backend restart and automatically reconnects
- Browser connections remain stable — no "connection refused" errors
- This makes development faster and smoother

### Port Resolution
The backend resolves its actual port through this priority:
1. `BACKEND_PORT` environment variable (set by the watchdog)
2. Port 8081 if the watchdog PID file exists
3. Port 8080 for legacy deployments without the watchdog

---

## Startup Scripts Comparison

| Feature | `start-dev.sh` | `startup-oauth.sh` | `startup-oauth.sh --dev` |
|---------|----------------|--------------------|------------------------|
| GitHub login | No (local `dev-user`) | Yes (OAuth) | Yes (OAuth) |
| Frontend served by | Vite dev server (:5174) | Watchdog → Backend (:8080→8081) | Vite dev server (:5174) |
| Hot reload | Yes (Vite HMR) | No (must rebuild) | Yes (Vite HMR) |
| `.env` required | No | Yes | Yes |
| kc-agent started | Yes (port 8585) | Yes (port 8585) | Yes (port 8585) |
| Watchdog proxy | No | Yes (survives restarts) | No |
| Best for | Development/coding | Testing OAuth, production-like setup | Frontend development with OAuth |

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
4. Review [Cluster Registration](cluster-registration.md) for kubeconfig format, multi-context behavior, and auth expectations

### Stale Frontend After Code Changes

If using `start-dev.sh`, the Vite dev server provides hot module replacement. If using `startup-oauth.sh`, you must restart the script after changing frontend code (it rebuilds on startup).

---

## Next Steps

- [Features Guide](console-features.md) -- Explore all console features
- [Architecture](architecture.md) -- Understand how the components work together
- [Authentication](authentication.md) -- Deep dive into OAuth and session behavior
- [Configuration](configuration.md) -- Customize AI mode, themes, and more
