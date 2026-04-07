---
title: "Persistence & State Management"
linkTitle: "Persistence"
weight: 11
description: >
  How KubeStellar Console persists data across sessions using localStorage,
  SQLite WASM, IndexedDB, and sessionStorage.
keywords:
  - kubestellar console persistence
  - kubestellar console caching
  - kubestellar console state management
  - kubestellar console storage
---

# Persistence & State Management

KubeStellar Console uses a layered storage strategy to balance performance,
durability, and developer ergonomics. The layers — from fastest to most
durable — are **sessionStorage**, **localStorage**, **IndexedDB**, and
**SQLite WASM via OPFS**.

## Storage Layers at a Glance

| Layer | Scope | Survives Reload? | Survives Tab Close? | Purpose |
|---|---|---|---|---|
| **sessionStorage** | Single tab | Yes | No | Fast hydration snapshots for cache data |
| **localStorage** | Origin-wide | Yes | Yes | Settings, auth tokens, UI preferences, dashboard config |
| **IndexedDB** | Origin-wide | Yes | Yes | Fallback durable cache when SQLite WASM is unavailable |
| **SQLite WASM (OPFS)** | Origin-wide | Yes | Yes | Primary cache database — all I/O runs off-thread in a Web Worker |

## localStorage

localStorage is the primary store for user settings, authentication state,
and UI preferences. All keys are defined in a single constants file
([`web/src/lib/constants/storage.ts`](https://github.com/kubestellar/console/blob/main/web/src/lib/constants/storage.ts))
so they can be audited and renamed from one place.

### Key Categories

**Authentication**

| Key | Description |
|---|---|
| `token` | Session JWT returned by the backend after GitHub OAuth |
| `auth_token` | Token used by the notification API |

**Demo & Onboarding**

| Key | Description |
|---|---|
| `kc-demo-mode` | Whether the console is in demo mode |
| `demo-user-onboarded` | Whether the user completed onboarding |
| `demo-onboarding-responses` | Saved onboarding survey answers |

**Settings (synced to backend)**

Settings stored in localStorage are synced to the kc-agent backend so
they survive cache clears. If localStorage is empty on load, the console
restores settings from the backend. See
[`usePersistedSettings`](https://github.com/kubestellar/console/blob/main/web/src/hooks/usePersistedSettings.ts).

| Key | Description |
|---|---|
| `kubestellar-theme-id` | Active theme identifier |
| `kc-custom-themes` | User-installed custom themes from the marketplace |
| `kubestellar-ai-mode` | AI feature mode (off, assist, auto) |
| `kubestellar-prediction-settings` | AI prediction configuration |
| `accessibility-settings` | Accessibility preferences |
| `kc_notification_config` | Notification settings |
| `kc-analytics-opt-out` | Analytics opt-out flag |

**Dashboard Persistence**

| Key | Description |
|---|---|
| `kubestellar-main-dashboard-cards` | Card layout and ordering for the main dashboard |

**UI State**

| Key | Description |
|---|---|
| `sidebar-left-pinned` | Whether the sidebar is pinned open |
| `kubestellar-cluster-layout-mode` | Cluster view layout (grid, list, etc.) |
| `kubestellar-nav-history` | Navigation history for sidebar customisation |
| `kubestellar-cluster-order` | User-defined cluster sort order |
| `kubestellar-missions-active` | Active AI Missions |
| `kubestellar-missions-history` | AI Mission history |

**Engagement & Nudges**

Keys such as `kc-nudge-dismissed`, `kc-session-count`, `kc-visit-count`,
and `kc-nps-state` track user engagement milestones (e.g., whether the
getting-started banner has been dismissed or when the NPS survey last appeared).

**Component-specific Caches**

Several hooks cache API responses in localStorage with a timestamp to
avoid redundant network requests. These follow the pattern of storing data
under a cache key (e.g., `opa-statuses-cache`) alongside a timestamp key
(e.g., `opa-statuses-cache-time`).

| Key Prefix | Data Cached |
|---|---|
| `opa-statuses-cache` | OPA Gatekeeper policy status |
| `kc-kyverno-cache` | Kyverno policy status |
| `kc-kubescape-cache` | Kubescape scan results |
| `kc-trivy-cache` | Trivy vulnerability scan results |
| `kc-rbac-cache` | RBAC analysis results |

## SQLite WASM Cache (Primary)

The main caching layer uses **SQLite compiled to WebAssembly**, running in
a dedicated **Web Worker** so all I/O stays off the main thread. This
architecture is documented in
[`web/src/lib/cache/index.ts`](https://github.com/kubestellar/console/blob/main/web/src/lib/cache/index.ts)
and
[`web/src/lib/cache/worker.ts`](https://github.com/kubestellar/console/blob/main/web/src/lib/cache/worker.ts).

### How It Works

1. On startup, `main.tsx` calls `initCacheWorker()` which spawns a Web Worker
   that loads `@sqlite.org/sqlite-wasm`.
2. The worker opens a SQLite database backed by **OPFS** (Origin Private
   File System) at `/kc-cache.sqlite3`. OPFS provides true file-system
   persistence inside the browser.
3. All cache reads and writes go through an RPC layer (`CacheWorkerRpc`)
   that posts structured messages to the worker and awaits responses.
4. On first load, metadata from all cache entries is **preloaded into an
   in-memory `Map`** so `useCache()` calls can check freshness with a
   zero-cost `Map.get()` instead of an async round-trip.

### Cache Behaviour

- **Stale-while-revalidate**: cached data is shown immediately while a
  background fetch refreshes it.
- **Category-based refresh rates**: each data type has a configured
  interval (e.g., pods every 30 s, RBAC every 5 min). See
  `REFRESH_RATES` in `web/src/lib/cache/index.ts`.
- **Failure backoff**: consecutive fetch failures trigger exponential
  backoff up to 10 minutes.
- **Auto-refresh pause**: the dashboard "Auto" toggle globally pauses
  background refreshes without affecting manual refetch.

### Usage

```tsx
const { data, isLoading, isRefreshing, refetch } = useCache({
  key: 'pods',
  fetcher: () => api.getPods(),
  category: 'pods',
})
```

## IndexedDB (Fallback)

If OPFS is unavailable (e.g., non-secure context, unsupported browser),
the cache layer falls back to **IndexedDB** using a database named
`kc_cache` with a single object store named `cache`. The API surface is
identical — the fallback is transparent to consuming code.

## sessionStorage (Hydration Snapshots)

To eliminate the skeleton-screen flash on page reload, the cache layer
writes a snapshot of each entry to **sessionStorage** under the prefix
`kcc:`. On the next page load (same tab), the snapshot is read
**synchronously** in the `CacheStore` constructor so components render
with data immediately — before the async SQLite worker finishes
initialising.

Snapshots include a version number so they are automatically discarded
after deploys that change the cache schema.

sessionStorage is also used for chunk-load error recovery: if a code-split
chunk fails to load, the console records a reload timestamp in
sessionStorage to prevent infinite reload loops.

## Migration Between Storage Backends

On first load, `main.tsx` runs a one-time migration:

1. **localStorage to IndexedDB** (`migrateFromLocalStorage`): reads any
   cache entries stored under the legacy `kc_meta:` prefix in localStorage
   and moves them to IndexedDB.
2. **IndexedDB to SQLite** (`migrateIDBToSQLite`): reads all entries from
   the IndexedDB `kc_cache` store and inserts them into the SQLite database.

A flag (`kc-sqlite-migrated`) is set in localStorage after migration
completes so it runs only once.

## Clearing Storage

The console provides a "Clear Cache" action (available in Settings) that:

- Clears all cache entries from SQLite / IndexedDB.
- Removes all `kcc:` sessionStorage snapshots.
- Preserves authentication tokens and user settings so the user stays
  logged in.

## Source Files

| File | Purpose |
|---|---|
| [`web/src/lib/constants/storage.ts`](https://github.com/kubestellar/console/blob/main/web/src/lib/constants/storage.ts) | All localStorage key constants |
| [`web/src/lib/cache/index.ts`](https://github.com/kubestellar/console/blob/main/web/src/lib/cache/index.ts) | Cache layer entry point, `useCache` hook, refresh rates |
| [`web/src/lib/cache/worker.ts`](https://github.com/kubestellar/console/blob/main/web/src/lib/cache/worker.ts) | SQLite WASM Web Worker |
| [`web/src/lib/cache/workerRpc.ts`](https://github.com/kubestellar/console/blob/main/web/src/lib/cache/workerRpc.ts) | RPC layer between main thread and worker |
| [`web/src/lib/cache/workerMessages.ts`](https://github.com/kubestellar/console/blob/main/web/src/lib/cache/workerMessages.ts) | TypeScript message types for worker communication |
| [`web/src/hooks/usePersistedSettings.ts`](https://github.com/kubestellar/console/blob/main/web/src/hooks/usePersistedSettings.ts) | Settings sync between localStorage and backend |
| [`web/src/main.tsx`](https://github.com/kubestellar/console/blob/main/web/src/main.tsx) | Cache worker init and migration orchestration |
