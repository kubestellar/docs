---
title: "Drasi Reactive Pipeline Dashboard"
linkTitle: "Drasi Dashboard"
weight: 18
description: >
  Visualize, manage, and consume Drasi reactive data pipelines — Sources, Continuous Queries, and Reactions — directly from the KubeStellar Console.
keywords:
  - drasi
  - reactive pipelines
  - continuous queries
  - server-sent events
  - SSE streaming
  - kubernetes event-driven
---

# Drasi Reactive Pipeline Dashboard

The `/drasi` dashboard provides a real-time visualization of [Drasi](https://drasi.io) reactive data pipelines — Sources, Continuous Queries, and Reactions — with full CRUD management, live SSE streaming, and per-language code samples for consuming query result streams.

Drasi is a CNCF Sandbox project by Microsoft that enables continuous, event-driven queries over changing data. The console integration supports all three Drasi deployment modes equally: **drasi-server** (standalone REST), **drasi-platform** (Kubernetes operator), and **drasi-lib** (embedded Rust, via drasi-server REST).

## Getting started

### Demo mode (no Drasi install required)

Navigate to `/drasi` on your console. Without any configuration, the card runs in **demo mode** with four pre-seeded Drasi connections (retail-analytics, iot-telemetry, fraud-detection, supply-chain) — each showing a different themed pipeline with three independent flows. Switch between servers and flows using the dropdowns at the top of the card.

### Live mode (real Drasi install)

1. Open the Drasi Reactive Graph card.
2. Click the ⚙ gear icon in the header strip → **"Drasi Connections"** modal.
3. Click **"+ Add Connection"**.
4. Choose mode:
   - **drasi-server (REST)** — enter the URL (e.g., `http://localhost:8090`).
   - **drasi-platform (Kubernetes)** — enter the kubeconfig context name (e.g., `prow`).
5. Save and select the new connection → the card fetches real Sources, Continuous Queries, and Reactions from your install.

If you don't have Drasi installed yet, click the **"Install Drasi"** banner at the top of the card → it deep-links to the `/missions/install-drasi` AI mission.

## Features

### Pipeline visualization

The card renders a 6-column grid layout:

- **Sources** (left) — HTTP, Postgres, CosmosDB, Gremlin, SQL data sources
- **Continuous Queries** (center) — Cypher/GQL queries that run continuously over the sources
- **Reactions** (right) — SSE, SignalR, Webhook, Kafka subscribers to query results

Animated SVG flow lines connect sources → queries → reactions with state-aware colors:
- Emerald = active flow
- Slate = idle
- Red = error
- Grey = stopped

Lines animate with traffic dots whose count and spacing vary per line (solo dot, tight cluster, even stream, burst + trail). Hover any node to highlight its connected subgraph and dim everything else.

### Flow discovery

The card automatically derives **flows** (connected components of the source→query→reaction graph) and exposes them in a **Flow** dropdown next to the server selector. Select a flow to focus the view on one pipeline at a time.

In demo mode each themed server has 3 disjoint flows — for example, `retail-analytics` has `abandoned-carts`, `low-stock-alerts`, and `vip-customer-activity`.

### Full CRUD

- **Create**: Click the **+** button next to any column header (Sources, Continuous Queries, Reactions) to add a new resource. Sources and Queries open a Configure modal; Reactions create a default SSE reaction.
- **Edit**: Click the ⚙ gear icon on any node card to open the Configure modal. The Continuous Query modal includes a **CodeMirror editor** with Cypher syntax highlighting.
- **Delete**: Click the 🗑 trash icon on any node card → a themed confirm dialog (not a browser `window.confirm`) asks for confirmation before calling DELETE through the proxy.
- **Download YAML**: Inside any Source or Query Configure modal (edit mode), click **"Download YAML"** to export the resource spec as a `.yaml` file.

All mutations route through the backend's generic `/api/drasi/proxy/*` reverse proxy, which forwards to either the drasi-server REST API or the drasi-platform in-cluster API based on the active connection.

### Live results streaming

When a drasi-server connection is active, clicking a Continuous Query populates a **live results table** via Server-Sent Events (SSE). The table:
- Shows dynamic columns derived from the query's result schema
- Updates in real-time as result deltas (`added`, `updated`, `deleted`) arrive
- Supports **column sorting** (click any header → asc → desc → clear)
- Supports **row detail drawer** (click any row → slide-in right panel with the full JSON)

For drasi-platform connections, an **"Enable live results"** button appears that one-click-creates a Result reaction scoped to the selected query.

### Code samples ("Consume this stream")

Click **"Consume stream"** in the header strip (or in the results-table header) to open a drawer with per-language snippets showing how to subscribe to the Drasi SSE output from external code:

- **JavaScript** (browser `EventSource`)
- **Node.js** (`eventsource` npm package)
- **Python** (`httpx` streaming)
- **curl**
- **Go** (`net/http` + `bufio`)
- **C# / .NET** (`HttpClient`)

Snippets are templated with the real stream URL in live mode, or a placeholder URL in demo mode. Each has a copy button.

### Pipeline KPIs

A strip above the graph shows four at-a-glance counters: Events/s, Result Rows, Sources, and Reactions. In live mode these track the SSE stream's row arrival rate; in demo mode they're derived from the rolling result set.

## Connection management

Connections are stored in the browser's `localStorage` — no backend persistence required. Environment variables (`VITE_DRASI_SERVER_URL`, `VITE_DRASI_PLATFORM_CLUSTER`) are auto-seeded into the list on first use so existing deployments keep working without manual setup.

The connections modal supports full CRUD (add, edit, delete, select) modeled after the AI/ML endpoint management pattern.

## Drasi deployment modes

| Mode | How the console reaches it | Configuration |
|---|---|---|
| **drasi-server** (standalone) | Direct REST calls via `/api/drasi/proxy?target=server&url=<url>` | Connection URL in the manager |
| **drasi-platform** (Kubernetes) | K8s API Service proxy via `/api/drasi/proxy?target=platform&cluster=<ctx>` | Connection cluster context in the manager |
| **drasi-lib** (embedded Rust) | Same as drasi-server — embedders expose the standard REST API | Connection URL pointing at the embedder's endpoint |

## Related

- [Drasi project](https://drasi.io) — official Drasi documentation
- Upstream issues filed during integration: [drasi-project/drasi-platform#425](https://github.com/drasi-project/drasi-platform/issues/425), [#426](https://github.com/drasi-project/drasi-platform/issues/426), [#427](https://github.com/drasi-project/drasi-platform/issues/427)
- Console PRs: #8158 (real integration), #8163 (visual polish), #8186 (Wave A — CRUD), #8199 (Wave B — CodeMirror + sorting), #8208 (Wave C — connections + stream samples), #8215 (flows + themes), #8222 (confirm modal + layout fixes)
