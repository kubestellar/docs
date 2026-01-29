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
| 1 | **GitHub OAuth App** | User authentication via GitHub |
| 2 | **Frontend** | React SPA - dashboards, cards, AI UI |
| 3 | **Backend** | Go server - API, auth, data storage |
| 4 | **MCP Bridge** | Connects backend to kubestellar-mcp tools |
| 5 | **Claude Code Plugins** | kubestellar-ops + kubestellar-deploy ([docs](/docs/kubestellar-mcp/overview/introduction)) |
| 6 | **Kubeconfig** | Your cluster credentials |

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              User Browser                                    │
│                          React + Vite SPA                                    │
└─────────────────────────────┬───────────────────────────────────────────────┘
                              │ WebSocket + REST
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        KubeStellar Console Backend                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Auth       │  │   Dashboard  │  │   Claude     │  │   Events     │    │
│  │   Service    │  │   Service    │  │   Service    │  │   Stream     │    │
│  │  (GitHub SSO)│  │  (REST API)  │  │  (Proactive) │  │  (WebSocket) │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│         │                  │                  │                  │          │
│         ▼                  ▼                  ▼                  ▼          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         MCP Bridge Layer                             │   │
│  │    Wraps kubestellar-ops and kubestellar-deploy MCP servers as HTTP/WS APIs │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Kubernetes Clusters                                  │
│    [vllm-d]     [local-kind]     [prod-east]     [prod-west]    ...        │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components

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

| Package | Purpose |
|---------|---------|
| `pkg/api` | HTTP server and handlers |
| `pkg/mcp` | MCP bridge for cluster data |
| `pkg/claude` | AI integration (future) |
| `pkg/store` | SQLite database layer |
| `pkg/models` | Data structures |

### Data Flow

1. **Authentication**: GitHub OAuth → JWT token → stored in browser
2. **Dashboard Load**: Fetch user preferences → fetch cluster data via MCP → render cards
3. **Real-time Updates**: WebSocket connection → MCP event stream → card updates
4. **Card Recommendations**: Analyze cluster state → AI generates suggestions → user accepts/snoozes

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
