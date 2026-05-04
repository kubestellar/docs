---
title: "Architecture — Multi-Cluster Kubernetes Dashboard System Design"
linkTitle: "Architecture"
weight: 3
description: >
  System design and component architecture of KubeStellar Console — the multi-cluster Kubernetes dashboard with AI Missions. Learn how the agent proxy, WebSocket data pipeline, and AI integration work together to provide fleet-wide Kubernetes operations.
keywords:
  - kubernetes dashboard architecture
  - multi-cluster kubernetes architecture
  - kubernetes management tool design
  - AI kubernetes system design
---

# Architecture

> This is the canonical architecture reference for KubeStellar Console. The [console README](https://github.com/kubestellar/console#architecture) links here.

KubeStellar Console uses a modern, modular architecture designed for extensibility and real-time updates.

## The 7 Components

The console consists of 7 components working together. The [Installation](installation.md#component-summary) page has the authoritative component table including whether each is required or optional. See [Configuration](configuration.md) for how to set up each one.

| # | Component | Purpose |
|---|-----------|---------|
| 1 | **GitHub OAuth App** | GitHub OAuth Client registration used to authenticate console users |
| 2 | **Frontend** | React SPA - dashboards, cards, AI UI |
| 3 | **Backend** | Go server - API, auth, data storage |
| 4 | **MCP Bridge** | Hosts the kubestellar-ops and kubestellar-deploy **MCP servers** in-process; Backend queries them via HTTP/MCP to get cluster data |
| 5 | **AI Coding Agent + Plugins** | **(Optional — AI features only)** Any MCP-compatible AI coding agent (Claude Code, Copilot, Cursor, Gemini CLI, etc.) acts as an **MCP client**. The kubestellar-ops and kubestellar-deploy **plugins** launch their respective MCP servers as **stdio child processes** and add skills/hooks ([docs](/docs/kubestellar-mcp/overview/introduction)). Not required for the core dashboard experience. |
| 6 | **kc-agent** | **(Optional — kubectl/AI features only)** Local MCP+WebSocket server on port 8585; bridges the browser to your local kubeconfig for kubectl execution (WebSocket) and provides MCP tools for AI coding agents. Not required for read-only dashboard viewing. |
| 7 | **Kubeconfig** | Your cluster credentials |

> **Note on "GitHub OAuth App":**
> - This is a *registration*, not a running process.
> - In [OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc6749) terms: GitHub is the **Authorization Server**, the user is the **Resource Owner**, and the **Backend** is the **OAuth Client** that exchanges the authorization code for a token.
> - The registration provides a `client_id` and `client_secret` that the Backend uses during the [Authorization Code flow](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1).
> - GitHub login is only used to establish *who you are* inside the console (user authentication). Accessing Kubernetes clusters is handled separately via **kubeconfig**; cluster credentials are never sent to GitHub.

## System Overview

{% include-markdown "_architecture-diagram.md" %}

**Credential flows:**

- **GitHub OAuth** (user identity): Browser → GitHub → Backend. The user (Resource Owner) authorizes the console to read their GitHub profile. The Backend (OAuth Client) exchanges the authorization code for a token, verifies identity, and issues a session JWT to the browser.
- **Kubeconfig** (cluster access): The kubeconfig file is read by the MCP Bridge and kc-agent on the server/local machine. Cluster credentials (certificates, tokens) never pass through the browser or GitHub.

**AI Provider API:** The "AI Provider API" in the diagram is the OpenAI-compatible chat completions endpoint (`/v1/chat/completions`) used for AI features (card recommendations, AI Missions). The console supports multiple AI providers — Anthropic (Claude), OpenAI (GPT-4o), and Google (Gemini) — all accessed through this same API format. The Backend sends chat completion requests to whichever provider the user has configured. Claude Code also uses this API for its own AI reasoning, independently of the console. See [AI Missions Setup](ai-missions-setup.md) for supported models and configuration.

## Components

### GitHub OAuth App

A registration in GitHub's OAuth application settings that provides a `client_id` and `client_secret`. These credentials are configured in the Backend and are used during the [OAuth 2.0 Authorization Code flow](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1) to verify the console user's GitHub identity. Without this registration the console falls back to a local `dev-user` session (no GitHub login required).

### Frontend (React + Vite)

| Component | Purpose |
|-----------|---------|
| `Dashboard` | Main card grid with drag-and-drop |
| `CardWrapper` | Unified card container with swap controls |
| `CardRecommendations` | AI suggestion panel |
| `Settings` | AI mode and token limit configuration |
| `Clusters` | Cluster list with detail modals |
| `Events` | Filterable event stream |

### Backend (Go)

The Backend is the OAuth Client in the OAuth 2.0 flow. It receives the authorization code redirect from GitHub, exchanges it for an access token (using the GitHub OAuth App credentials), retrieves the user's GitHub profile, and issues a session JWT that the Frontend stores in the browser.

| Package | Purpose |
|---------|---------|
| `pkg/api` | HTTP server and handlers |
| `pkg/mcp` | MCP bridge for cluster data |
| `pkg/claude` | AI integration (future) |
| `pkg/store` | SQLite database layer |
| `pkg/models` | Data structures |
| `pkg/auth` | Authentication middleware, session management |

#### kc-agent migration (Apr 2026)

The console is actively migrating cluster-mutating operations from the pod ServiceAccount backend to **kc-agent** running on the user's machine. This means operations like Helm rollback/uninstall/upgrade, ArgoCD sync, drift detection, kubectl sync, GPU health cronjob management, and namespace create/delete now route through kc-agent instead of the backend's pod-SA. The backend retains pod-SA only for bootstrap, GPU reservation, and self-upgrade (the "pod-SA rule" — see [Security Model](security-model.md)).

This migration landed across PRs #8028, #8033, #8036, #8038, #8039, #8044 (phases 2–4 of the #7993 meta-issue). A `Privileged Client Lint` CI check (#8161) now enforces the boundary — new backend code that tries to use the pod-SA for cluster mutations will fail CI.

Additionally, `pods/exec` now has an explicit RBAC authorization check (#8134) — the backend verifies the user has `pods/exec` permission before opening an exec stream, closing a privilege-escalation gap.

### MCP Bridge

A separate process that is spawned by the console executable at startup. The MCP Bridge code is compiled into the same binary as the Backend, but runs as its own child process. It hosts the kubestellar-ops MCP server and kubestellar-deploy MCP server **in-process** and exposes them over HTTP/MCP so the Backend can query cluster state. The Backend sends MCP tool calls to the MCP Bridge (e.g., "list nodes", "get workloads") and the MCP Bridge executes them against your Kubernetes clusters using your kubeconfig.

> **Why does the Backend use MCP?** MCP (Model Context Protocol) is a standard protocol for calling tools. The Backend uses it to invoke the same kubestellar-ops/kubestellar-deploy tool implementations that Claude Code uses, so cluster data flows through a single, consistent interface. The MCP Bridge is not related to AI inference — it is purely a tool execution layer.
>
> **How is this different from Claude Code's connection?** The MCP Bridge runs the MCP servers in-process (linked into the console binary). Claude Code, by contrast, launches the MCP servers as separate stdio child processes. Both approaches execute the same underlying tool code.

The MCP Bridge authenticates to Kubernetes clusters using the kubeconfig file on the machine running the console backend (this could be your laptop for local installs, or a remote server for Helm/Kubernetes deployments). It does not participate in the GitHub OAuth flow.

### AI Coding Agents + Plugins

> **Naming clarification:** The names `kubestellar-ops` and `kubestellar-deploy` each refer to two distinct things:
>
> 1. **MCP servers** — the tool implementations (Go binaries) that query Kubernetes clusters. Each binary can run as an MCP server in two ways: (a) as a **stdio child process** launched by an AI coding agent, or (b) **in-process** inside the MCP Bridge for the Console Backend.
> 2. **Agent plugins** — extensions that tell the AI coding agent how to launch the MCP servers and that add skills (slash commands) and hooks (event triggers).
>
> This document uses **"kubestellar-ops MCP server"** for the tool implementation and **"kubestellar-ops plugin"** for the agent extension. The same convention applies to kubestellar-deploy.

**Supported AI coding agents:** The console's MCP servers work with any MCP-compatible AI coding agent, including:

- **Claude Code** — Anthropic's CLI agent (`claude` command, VS Code/JetBrains extensions, GitHub Action)
- **GitHub Copilot** — via MCP server configuration
- **Cursor** — via MCP server configuration
- **Gemini CLI** — Google's CLI agent
- **Google Anti-Gravity / OpenCode** — via MCP server configuration

All of these act as **MCP clients** — they connect to MCP servers and invoke their tools.

**How the plugins work:** When the kubestellar-ops and kubestellar-deploy plugins are installed, the AI coding agent **launches each MCP server as a stdio child process** (e.g., `kubestellar-ops --mcp-server`). The agent communicates with these child processes over stdin/stdout using the MCP protocol. This is a direct, local connection — the MCP servers are **not** accessed through kc-agent or the MCP Bridge.

Each plugin provides:

- A set of MCP **tools** (e.g., list clusters, get nodes, deploy workloads)
- Optionally, **skills** (slash commands) and **hooks** (event triggers) for agents that support them

**Two paths to the same tools:** The Console Backend and AI coding agents both use the same kubestellar-ops/kubestellar-deploy tool implementations, but through different paths:

| Consumer | Path to MCP servers |
|----------|-------------------|
| **Console Backend** | Calls tools via HTTP/MCP on the **MCP Bridge** (which hosts the MCP servers in-process) |
| **AI Coding Agent** | Launches the MCP servers as **stdio child processes** directly (via the plugins) |

Both paths execute the same Go code and read the same kubeconfig, so they return identical cluster data.

**kc-agent is separate:** AI coding agents also connect to kc-agent (port 8585) as an MCP client for kubectl execution. kc-agent is a distinct MCP server — it does not host the kubestellar-ops or kubestellar-deploy tools.

See the [kubestellar-mcp documentation](/docs/kubestellar-mcp/overview/introduction) for the kubestellar-ops and kubestellar-deploy tool listing. For kc-agent tools and configuration, see the [kc-agent section below](#kc-agent-local-agent).

### kc-agent (Local Agent)

A lightweight WebSocket + MCP server (port 8585) that runs on the **user's machine**.

**Source code:** [`cmd/kc-agent`](https://github.com/kubestellar/console/tree/main/cmd/kc-agent) (entry point) and [`pkg/agent`](https://github.com/kubestellar/console/tree/main/pkg/agent) (core package) in the [kubestellar/console](https://github.com/kubestellar/console) repository.

It has two roles:

1. **Browser bridge**: In **self-hosted, local, or Helm-installed** console deployments, the browser-based console connects to a kc-agent running on the same machine (or network) via WebSocket to execute `kubectl` commands using the local kubeconfig.

2. **MCP server for AI coding agents**: kc-agent exposes kubectl-based MCP tools that any AI coding agent (acting as an MCP client) can call. The agent connects **to** kc-agent — not the other way around.

#### Hosted demo vs. self-hosted: kubectl capability boundary

The hosted demo at [`console.kubestellar.io`](https://console.kubestellar.io) and a self-hosted / local / Helm install behave differently with respect to `kubectl` execution. The hosted demo is **read-only** and does **not** connect to a local kc-agent; there is no mechanism for a browser pointing at `console.kubestellar.io` to reach a kc-agent on your workstation.

| Capability | Hosted demo (`console.kubestellar.io`) | Self-hosted / local / Helm install |
|---|---|---|
| Browse demo dashboards and cards | Yes | Yes |
| Connect to a local kc-agent | **No** | Yes (port 8585) |
| Execute `kubectl` commands from the browser | **No** (read-only) | Yes (via kc-agent) |
| Run AI Missions that apply changes to clusters | **No** | Yes |

> **In short:** kubectl execution via kc-agent is a **self-hosted-only** feature. To use it, install the console locally (from source, via `startup-oauth.sh`, or via Helm) and run `kc-agent` on the same machine as your kubeconfig. The hosted demo exists to showcase the UI against demo data and cannot drive real clusters.

> **kc-agent vs. kubestellar-ops/kubestellar-deploy:** kc-agent provides low-level kubectl execution. The kubestellar-ops and kubestellar-deploy MCP servers provide higher-level multi-cluster tools (diagnostics, deployment, RBAC analysis, etc.). AI coding agents connect to all three as separate MCP servers — kc-agent over TCP (port 8585), and kubestellar-ops/kubestellar-deploy over stdio.

> **In-cluster AI agents (kagent/kagenti):** For clusters that have [kagent](https://github.com/kagent-dev/kagent) or kagenti deployed, the console discovers and connects to these in-cluster AI agents. Unlike the local MCP servers above, kagent/kagenti run inside the Kubernetes cluster and provide cluster-native AI capabilities (agent orchestration, tool execution within the cluster context). The console's kagent integration is separate from the local MCP plugin architecture.

| Aspect | Detail |
|--------|--------|
| **Port** | 8585 (configurable via `--port`) |
| **Protocols** | WebSocket (browser) + MCP (Claude Code) |
| **Origin validation** | Localhost by default; extend via `--allowed-origins` flag or `KC_ALLOWED_ORIGINS` env var |
| **Capabilities** | kubectl execution, local cluster detection, hardware tracking, AI provider integration |

See [Configuration](configuration.md#kc-agent-configuration) for all CLI flags and environment variables.

### Kubeconfig

Your standard Kubernetes credentials file (`~/.kube/config` or a path set via `KUBECONFIG`). The MCP Bridge reads this file on the machine running the console backend (your laptop for local installs, or a remote server for Kubernetes/Helm deployments) to authenticate to your clusters when the console queries cluster data. The kc-agent reads it on your local machine for local kubectl execution. The kubeconfig credentials are **not** sent to the browser and are **not** involved in the GitHub OAuth flow; GitHub login is only used to establish your identity within the console.

> **Why does the Backend not directly read kubeconfig?** The Backend delegates all cluster access to the MCP Bridge. The Backend sends high-level queries ("get all nodes across all clusters") to the MCP Bridge, which handles the kubeconfig loading, API server connections, and parallel cluster queries. This separation keeps cluster credentials out of the Backend's HTTP layer.

### Data Flow

1. **Authentication** (GitHub OAuth 2.0 Authorization Code flow):
   1. User clicks "Sign in with GitHub" — Frontend redirects to GitHub
   2. User authorizes the console on GitHub
   3. GitHub redirects back to Backend with an authorization code
   4. Backend exchanges the code for a GitHub access token (using OAuth App `client_id`/`client_secret`)
   5. Backend fetches the user's GitHub profile to establish identity
   6. Backend issues a session JWT → stored in the browser
2. **Dashboard Load**: Frontend sends JWT → Backend validates JWT → Backend fetches user preferences → Backend calls MCP Bridge tools for cluster data (MCP Bridge uses kubeconfig to authenticate) → render cards
3. **Real-time Updates**: WebSocket connection from Frontend → Backend forwards MCP Bridge event stream → card updates
4. **Local Agent (kc-agent)** *(self-hosted / local / Helm installs only)*: Browser connects to kc-agent (:8585) via WebSocket → kc-agent executes kubectl commands using local kubeconfig → results streamed back to browser. Claude Code also connects to kc-agent as an MCP client for kubectl execution. The hosted demo at `console.kubestellar.io` does **not** use this path and cannot execute `kubectl`.
5. **Claude Code → MCP servers**: Claude Code launches the kubestellar-ops MCP server and kubestellar-deploy MCP server as stdio child processes. It sends MCP tool calls (e.g., "list clusters", "find pod issues") over stdin/stdout. The MCP servers query Kubernetes clusters using the local kubeconfig and return results to Claude Code.
6. **Card Recommendations**: Analyze cluster state via MCP Bridge → AI generates suggestions → user accepts/snoozes
7. **Caching Layer**: All cards use `useCachedData` hooks with category-based TTL refresh (GPU: 45s, Helm: 120s, Operators: 300s). Data persists in localStorage for instant revisit loads. Stale-while-revalidate pattern keeps UI responsive while fetching fresh data in the background.
8. **SSE Streaming**: Progressive loading endpoints (`/mcp/workloads/stream`, `/mcp/pods/stream`, etc.) stream per-cluster results as Server-Sent Events so data appears incrementally instead of blocking until all clusters respond.

## AI Mode Levels

| Mode | Token Usage | Features |
|------|-------------|----------|
| **Low** | ~10% | Direct kubectl, AI only on explicit request |
| **Medium** | ~50% | AI analysis and summaries on demand |
| **High** | ~100% | Proactive suggestions, auto-analysis |

## State Storage

The console persists state in three places: a **server-side SQLite database**, **browser localStorage**, and (for curl-to-bash installs) a **local data directory**.

### Local Data Directory (curl-to-bash installs)

When you install the console using the `curl | bash` one-liner (`start.sh`), the console creates a data directory in the current working directory where you ran the command. This directory stores:

| Path | Contents |
|------|----------|
| `./data/console.db` | SQLite database (same as described below) |
| `./data/backups/` | Automatic database backup snapshots |
| `./bin/` | Downloaded console and kc-agent binaries |

The data directory is relative to **wherever you ran the curl command**. If you want a fixed location, `cd` to your preferred directory first:

```bash
# Store console data in a dedicated directory
mkdir -p ~/kubestellar-console && cd ~/kubestellar-console
curl -sSL https://raw.githubusercontent.com/kubestellar/console/main/start.sh | bash
```

> **Tip:** If you re-run the curl installer from the same directory, it reuses the existing database and preserves your dashboards and settings.

### SQLite Database (Server-Side)

The Backend stores structured data in a SQLite database file. The default path is `./data/console.db` (relative to the working directory where the console process starts). You can override this with:

- **Environment variable**: `DATABASE_PATH=/path/to/console.db`
- **CLI flag**: `--db /path/to/console.db`

The Backend creates the database file and its parent directories automatically on first run. The database uses WAL (Write-Ahead Logging) mode for concurrent read performance.

**Database schema:**

- `users` — GitHub user info and preferences
- `dashboards` — User dashboard configurations
- `cards` — Card instances with positions and config
- `onboarding_responses` — Initial setup answers

### Browser localStorage (Client-Side)

The Frontend stores ephemeral UI state and caches in the browser's `localStorage`. This data is per-browser and is not synced between devices or users. Key categories:

| Category | Examples | Persistence |
|----------|----------|-------------|
| **AI Missions** | Active mission definitions, mission history, mission cache | Survives page reload; cleared when browser storage is cleared |
| **Dashboard caches** | Cluster data, security scan results, compliance data | TTL-based (45s–5min depending on category); stale-while-revalidate |
| **UI preferences** | Theme, cluster layout mode, navigation history | Permanent until manually cleared |
| **Wizard state** | Mission Control wizard progress | Expires after 7 days of inactivity |

**AI Missions are stored entirely in localStorage**, not in the SQLite database. Mission definitions (including the mission name, type, target clusters, and deployment state) are written to `localStorage` keys such as `kubestellar-missions-active` and `kubestellar-missions-history`. The mission catalog cache (fetched from the console-kb repository) is stored under `kc-mission-cache` with a 6-hour TTL. Because this data lives in the browser, missions are **not shared between users or devices** — each browser maintains its own set of active and historical missions.

## Multi-cluster data flow — the short version

If you only read one section of this page, read this one. The console
reaches **your** clusters through a clear split of responsibilities:

1. **Your browser** talks to the **Frontend** (React SPA) — only over
   HTTPS. No kubeconfig lives in the browser.
2. The **Backend** (Go) handles API, auth, and the SQLite store. It does
   **not** talk to your clusters directly.
3. The **MCP Bridge** (in-process with the Backend) hosts the
   `kubestellar-ops` / `kubestellar-deploy` MCP servers and reads the
   server-side kubeconfig to answer cluster-data queries.
4. **kc-agent** runs on **your workstation**, reads *your* local
   kubeconfig, and exposes kubectl execution over WebSocket (to the
   browser) and MCP (to AI coding agents). When running the console
   locally (via `startup-oauth.sh` or `start-dev.sh`), this is how
   the browser can execute `kubectl` against clusters that only *you*
   can reach. Note: the hosted demo at `console.kubestellar.io` does
   **not** connect to kc-agent — it only displays demo/cached data.

**Control plane vs data plane:**

| Plane | What flows through it | Components |
|---|---|---|
| **Control plane** (read) | Cluster inventory, pod/node/workload listings, metrics snapshots — displayed in cards and dashboards | Backend ↔ MCP Bridge ↔ `kubestellar-ops` / `kubestellar-deploy` ↔ your clusters |
| **Data plane** (write + interactive) | Terminal `kubectl`, AI Mission apply steps, interactive edits | Browser ↔ kc-agent (WebSocket) ↔ your kubeconfig ↔ your clusters |

This split is why **in-cluster Helm installs need you to run `kc-agent`
locally**: the cluster can query itself through the MCP Bridge, but it
cannot reach *other* clusters on your laptop network without the local
agent. See [Installation → kc-agent health](installation.md#kc-agent-health-helm--in-cluster-mode-only).

## Demo data vs real cluster data

The console deliberately ships with **demo data** so every feature has
something to render even when no real cluster is wired up. It's important
to know which one you're looking at.

### When you see demo data

- You opened `https://console.kubestellar.io` (hosted demo — **always**
  demo data).
- You ran a local install with no kubeconfig, no OAuth, and no
  `GOOGLE_DRIVE_API_KEY` / `CLAUDE_API_KEY` — many cards fall back to
  demo mode individually.
- A card's upstream API returned an error or timed out and the card's
  hook fell back to the bundled fixture.

### How the UI tells you

Every card that can fall back to demo data surfaces the state explicitly:

- A yellow **"Demo"** badge in the card header.
- A yellow dashed outline around the card body.
- In the Developer panel (profile avatar → Developer), a per-card
  "demo / live" indicator.

If a card shows neither the badge nor the outline, it is rendering **live
data** from the cluster it is labeled with. Cards never silently mix demo
and live data within a single view.

### Hosted demo capability boundary

`console.kubestellar.io` is a **strict read-only demonstration** of the
UI. It is not a degraded version of the product — it is a different
product surface with a hard capability ceiling:

| Feature | Hosted demo | Local / Helm install |
|---|---|---|
| Click through every card, dashboard, wizard | Yes | Yes |
| See AI Mission plans | Yes (plan only) | Yes |
| **Apply** an AI Mission | **No** | Yes |
| **Execute** `kubectl` in the terminal | **No** | Yes (via kc-agent) |
| Edit / install / uninstall anything | **No** | Yes |
| Persistent session | **No** (periodic forced logout) | Yes |
| Real cluster inventory | **No** (fixtures only) | Yes |

The periodic forced logout on the hosted demo is **intentional** — it
resets state so the next visitor sees a clean demo. If any of the "No"
rows above are a problem for you, follow the
[Quick Start](quickstart.md) or [Installation](installation.md) path
instead.
