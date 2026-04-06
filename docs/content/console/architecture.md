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

The console consists of 7 components working together. See [Configuration](configuration.md) for how to set up each one.

| # | Component | Purpose |
|---|-----------|---------|
| 1 | **GitHub OAuth App** | GitHub OAuth Client registration used to authenticate console users |
| 2 | **Frontend** | React SPA - dashboards, cards, AI UI |
| 3 | **Backend** | Go server - API, auth, data storage |
| 4 | **MCP Bridge** | Hosts the kubestellar-ops and kubestellar-deploy **MCP servers** in-process; Backend queries them via HTTP/MCP to get cluster data |
| 5 | **AI Coding Agent + Plugins** | Any MCP-compatible AI coding agent (Claude Code, Copilot, Cursor, Gemini CLI, etc.) acts as an **MCP client**. The kubestellar-ops and kubestellar-deploy **plugins** launch their respective MCP servers as **stdio child processes** and add skills/hooks ([docs](/docs/kubestellar-mcp/overview/introduction)). |
| 6 | **kc-agent** | Local MCP+WebSocket server on port 8585; provides kubectl execution for the browser (WebSocket) and for AI coding agents (MCP client) |
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

### MCP Bridge

A separate process that is spawned by the console executable at startup. The MCP Bridge code is compiled into the same binary as the Backend, but runs as its own child process. It hosts the kubestellar-ops MCP server and kubestellar-deploy MCP server **in-process** and exposes them over HTTP/MCP so the Backend can query cluster state. The Backend sends MCP tool calls to the MCP Bridge (e.g., "list nodes", "get workloads") and the MCP Bridge executes them against your Kubernetes clusters using your kubeconfig.

> **Why does the Backend use MCP?** MCP (Model Context Protocol) is a standard protocol for calling tools. The Backend uses it to invoke the same kubestellar-ops/kubestellar-deploy tool implementations that Claude Code uses, so cluster data flows through a single, consistent interface. The MCP Bridge is not related to AI inference — it is purely a tool execution layer.
>
> **How is this different from Claude Code's connection?** The MCP Bridge runs the MCP servers in-process (linked into the console binary). Claude Code, by contrast, launches the MCP servers as separate stdio child processes. Both approaches execute the same underlying tool code.

The MCP Bridge authenticates to Kubernetes clusters using the kubeconfig file on the server. It does not participate in the GitHub OAuth flow.

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

See the [kubestellar-mcp documentation](/docs/kubestellar-mcp/overview/introduction) for the full tool listing.

### kc-agent (Local Agent)

A lightweight WebSocket + MCP server (port 8585) that runs on the **user's machine**. It has two roles:

1. **Browser bridge**: The browser-based console connects to kc-agent via WebSocket to execute `kubectl` commands using the local kubeconfig. This allows the console to access clusters on the user's machine when the console itself is hosted remotely (e.g., `console.kubestellar.io`).

2. **MCP server for AI coding agents**: kc-agent exposes kubectl-based MCP tools that any AI coding agent (acting as an MCP client) can call. The agent connects **to** kc-agent — not the other way around.

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

Your standard Kubernetes credentials file (`~/.kube/config` or a path set via `KUBECONFIG`). The MCP Bridge reads this file on the server to authenticate to your clusters when the console queries cluster data. The kc-agent reads it on your local machine for local kubectl execution. The kubeconfig credentials are **not** sent to the browser and are **not** involved in the GitHub OAuth flow; GitHub login is only used to establish your identity within the console.

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
4. **Local Agent (kc-agent)**: Browser connects to kc-agent (:8585) via WebSocket → kc-agent executes kubectl commands using local kubeconfig → results streamed back to browser. Claude Code also connects to kc-agent as an MCP client for kubectl execution.
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

The console persists state in two places: a **server-side SQLite database** and **browser localStorage**.

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
