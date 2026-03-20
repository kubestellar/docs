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
| 4 | **MCP Bridge** | Runs the kubestellar-mcp tools; Backend queries it via HTTP/MCP to get cluster data |
| 5 | **Claude Code Plugins** | kubestellar-ops + kubestellar-deploy ([docs](/docs/kubestellar-mcp/overview/introduction)) |
| 6 | **kc-agent** | Local MCP+WebSocket server on port 8585; Claude Code connects to it as an MCP client to execute kubectl commands |
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

A separate process that is spawned by the console executable at startup. The MCP Bridge code is compiled into the same binary as the Backend, but runs as its own child process. It hosts the kubestellar-mcp tools (`kubestellar-ops`, `kubestellar-deploy`) and exposes them over HTTP/MCP so the Backend can query cluster state. The Backend sends MCP tool calls to the MCP Bridge (e.g., "list nodes", "get workloads") and the MCP Bridge executes them against your Kubernetes clusters using your kubeconfig.

> **Why does the Backend use MCP?** MCP (Model Context Protocol) is a standard protocol for calling tools. The Backend uses it to invoke the same kubestellar-ops/kubestellar-deploy tools that Claude Code uses, so cluster data flows through a single, consistent interface. The MCP Bridge is not related to AI inference — it is purely a tool execution layer.

The MCP Bridge authenticates to Kubernetes clusters using the kubeconfig file on the server. It does not participate in the GitHub OAuth flow.

### Claude Code Plugins

The `kubestellar-ops` and `kubestellar-deploy` plugins are Claude Code extensions that each provide:
- A set of MCP **tools** (e.g., list clusters, get nodes, deploy workloads)
- Optionally, skills and hooks

These plugins are installed locally on the server or developer machine. The MCP Bridge loads them and exposes their tools to the Backend. Claude Code can also connect to these tools directly. See the [kubestellar-mcp documentation](/docs/kubestellar-mcp/overview/introduction) for the full tool listing.

### kc-agent (Local Agent)

A lightweight WebSocket + MCP server (port 8585) that runs on the **user's machine**. It has two roles:

1. **Browser bridge**: The browser-based console connects to kc-agent via WebSocket to execute `kubectl` commands using the local kubeconfig. This allows the console to access clusters on the user's machine when the console itself is hosted remotely (e.g., `console.kubestellar.io`).

2. **MCP server for Claude Code**: kc-agent exposes MCP tools that Claude Code (acting as an MCP client) can call. Claude Code connects **to** kc-agent — not the other way around. This lets Claude Code invoke kubectl-based tools on the user's machine without requiring the user to configure a separate MCP server.

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
4. **Local Agent**: Browser connects to kc-agent (:8585) via WebSocket → kc-agent executes kubectl commands using local kubeconfig → results streamed back to browser. Separately, Claude Code connects to kc-agent as an MCP client to invoke kubectl-based tools.
5. **Card Recommendations**: Analyze cluster state via MCP Bridge → AI generates suggestions → user accepts/snoozes
6. **Caching Layer**: All cards use `useCachedData` hooks with category-based TTL refresh (GPU: 45s, Helm: 120s, Operators: 300s). Data persists in localStorage for instant revisit loads. Stale-while-revalidate pattern keeps UI responsive while fetching fresh data in the background.
7. **SSE Streaming**: Progressive loading endpoints (`/mcp/workloads/stream`, `/mcp/pods/stream`, etc.) stream per-cluster results as Server-Sent Events so data appears incrementally instead of blocking until all clusters respond.

## AI Mode Levels

| Mode | Token Usage | Features |
|------|-------------|----------|
| **Low** | ~10% | Direct kubectl, AI only on explicit request |
| **Medium** | ~50% | AI analysis and summaries on demand |
| **High** | ~100% | Proactive suggestions, auto-analysis |

## Database Schema

The console uses SQLite for persistence:

- `users` - GitHub user info and preferences
- `dashboards` - User dashboard configurations
- `cards` - Card instances with positions and config
- `onboarding_responses` - Initial setup answers
