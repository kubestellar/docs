---
title: "Architecture"
linkTitle: "Architecture"
weight: 3
description: >
  System design and component overview
---

# Architecture

KubeStellar Console uses a modern, modular architecture designed for extensibility and real-time updates.

## The 6 Components

The console consists of 6 components working together. See [Installation](installation.md) for how to set up each one.

| # | Component | Purpose |
|---|-----------|---------|
| 1 | **GitHub OAuth App** | GitHub OAuth Client registration used to authenticate console users |
| 2 | **Frontend** | React SPA - dashboards, cards, AI UI |
| 3 | **Backend** | Go server - API, auth, data storage |
| 4 | **MCP Bridge** | Connects backend to kubestellar-mcp tools |
| 5 | **Claude Code Plugins** | kubestellar-ops + kubestellar-deploy ([docs](/docs/kubestellar-mcp/overview/introduction)) |
| 6 | **Kubeconfig** | Your cluster credentials |

> **Note on "GitHub OAuth App":**
> - This is a *registration*, not a running process.
> - In [OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc6749) terms: GitHub is the **Authorization Server**, the user is the **Resource Owner**, and the **Backend** is the **OAuth Client** that exchanges the authorization code for a token.
> - The registration provides a `client_id` and `client_secret` that the Backend uses during the [Authorization Code flow](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1).
> - GitHub login is only used to establish *who you are* inside the console (user authentication). Accessing Kubernetes clusters is handled separately via **kubeconfig**; cluster credentials are never sent to GitHub.

## System Overview

```
  ┌──────────────────┐
  │  GitHub OAuth    │  ← OAuth Authorization Server (user identity only)
  │  (Authorization  │
  │   Server)        │
  └────────┬─────────┘
           │ 3. issues access token
           │ (in exchange for auth code)
           │
┌──────────▼──────────────────────────────────────────────────────┐
│                  KubeStellar Console Backend                     │
│                                                                  │
│   API Handlers    Auth (OAuth Client)   Claude AI   WebSocket    │
│   (REST/WS)       exchanges code→token  (Proactive) Events       │
│                   issues session JWT                             │
└──────────┬──────────────────────────┬───────────────────────────┘
           │ 1. initiates OAuth flow   │
           │    + REST/WebSocket API   │ uses kubeconfig credentials
           ▼                           ▼
┌────────────────────┐    ┌────────────────────────────────────────┐
│   User Browser     │    │           MCP Bridge                   │
│   React + Vite SPA │    │  kubestellar-ops + kubestellar-deploy  │
│                    │    │  (Claude Code Plugins)                 │
│  2. user authorizes│    └───────────────────┬────────────────────┘
│     on GitHub,     │                        │
│     gets JWT back  │                        │ kubeconfig
└────────────────────┘                        ▼
                           ┌────────────────────────────────────────┐
                           │          Kubernetes Clusters           │
                           │  [cluster-1]  [cluster-2]  ...         │
                           └────────────────────────────────────────┘
```

**Credential flows:**
- **GitHub OAuth** (user identity): Browser → GitHub → Backend. The user (Resource Owner) authorizes the console to read their GitHub profile. The Backend (OAuth Client) exchanges the authorization code for a token, verifies identity, and issues a session JWT to the browser.
- **Kubeconfig** (cluster access): The kubeconfig file is read by the Backend and MCP Bridge on the server. Cluster credentials (certificates, tokens) never pass through the browser or GitHub.

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

A separate process (bundled in the console image) that exposes the kubestellar-mcp tools over HTTP/WebSocket so the Backend can query cluster state. The MCP Bridge uses the **kubeconfig** on the server to authenticate to Kubernetes clusters. It does not participate in the GitHub OAuth flow.

### Claude Code Plugins

The `kubestellar-ops` and `kubestellar-deploy` MCP tools that the MCP Bridge exposes. These are Claude Code extensions installed locally (on the server or developer machine) and invoked via the MCP protocol. See the [kubestellar-mcp documentation](/docs/kubestellar-mcp/overview/introduction) for details.

### Kubeconfig

Your standard Kubernetes credentials file (`~/.kube/config` or a path set via `KUBECONFIG`). The Backend and MCP Bridge read this file on the server to authenticate to your clusters. The kubeconfig credentials are **not** sent to the browser and are **not** involved in the GitHub OAuth flow; GitHub login is only used to establish your identity within the console.

### Data Flow

1. **Authentication** (GitHub OAuth 2.0 Authorization Code flow):
   1. User clicks "Sign in with GitHub" — Frontend redirects to GitHub
   2. User authorizes the console on GitHub
   3. GitHub redirects back to Backend with an authorization code
   4. Backend exchanges the code for a GitHub access token (using OAuth App `client_id`/`client_secret`)
   5. Backend fetches the user's GitHub profile to establish identity
   6. Backend issues a session JWT → stored in the browser
2. **Dashboard Load**: Frontend sends JWT → Backend validates JWT → Backend fetches user preferences → Backend queries MCP Bridge for cluster data (using kubeconfig) → render cards
3. **Real-time Updates**: WebSocket connection from Frontend → Backend forwards MCP Bridge event stream → card updates
4. **Card Recommendations**: Analyze cluster state via MCP Bridge → AI generates suggestions → user accepts/snoozes

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
