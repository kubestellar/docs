---
title: "Demo Mode Architecture"
linkTitle: "Demo Mode"
weight: 15
description: >
  How the KubeStellar Console demo mode works — when it activates,
  where demo data comes from, and how cards decide between live and
  synthetic data.
keywords:
  - kubestellar console demo mode
  - kubernetes dashboard demo
  - demo data architecture
---

# Demo Mode

When the console cannot reach a live backend or agent — for example on the
public site [console.kubestellar.io](https://console.kubestellar.io) — it
switches to **demo mode**.  In demo mode every dashboard card displays
synthetic data so visitors can explore the UI without a running Kubernetes
cluster.

Cards that are showing demo data are marked with a **Demo** badge and a
yellow outline.

## When Demo Mode Is Active

Demo mode is controlled by a three-level priority system
(source: `web/src/lib/demoMode.ts`):

| Priority | Condition | Can the user toggle it off? |
|----------|-----------|---------------------------|
| 1 — Forced | Running on a Netlify deployment (`console.kubestellar.io`, deploy previews) | No |
| 2 — User toggle | `localStorage['kc-demo-mode'] === 'true'` | Yes |
| 3 — Token fallback | No auth token or token equals `demo-token`, **and** the user has not explicitly disabled demo mode | Yes |

On the public site (Priority 1) demo mode is always forced on because
there is no backend or agent to serve real data.

When running a local development server with `./start-dev.sh` or
`./startup-oauth.sh`, demo mode is **off** by default and live cluster data
is used instead.  Users can still enable demo mode manually through the UI
toggle, which sets the localStorage key.

## Where Demo Data Comes From

Demo data is generated in two places:

### 1. Unified Demo Data Registry

`web/src/lib/unified/demo/demoDataRegistry.ts` is a central registry that
stores **generator functions** keyed by data type.  Generator functions are
registered at startup from
`web/src/lib/unified/demo/generators/registerDemoGenerators.ts`.

The registry produces data for clusters, pod issues, deployment issues,
events, security findings, GPU nodes, Helm releases, operators, and
services.  For example, the demo cluster list contains 12 realistic
clusters (EKS, GKE, AKS, OKE, OpenShift, etc.) with plausible
configurations.

### 2. Per-Hook Fallbacks

Each `useCached*` hook in `web/src/hooks/useCachedData.ts` defines an
inline demo-data generator that is used as a last-resort fallback when:

- Demo mode is active, **or**
- Three or more consecutive API fetches have failed.

These hook-level generators are intentionally small and self-contained so
that every card always has *some* data to display.

### 3. Per-Card Demo Files

A few cards ship their own `demoData.ts` alongside the component (for
example `web/src/components/cards/flatcar_status/demoData.ts`).  These are
used when the card's data shape is too specialised for the shared
generators.

## How a Card Decides What to Show

The decision path for each dashboard card is:

```
   ┌─────────────────────────────┐
   │  Card calls useCached*()    │
   │  hook for its data type     │
   └──────────┬──────────────────┘
              │
   ┌──────────▼──────────────────┐
   │  Is demo mode active?       │──Yes──▶ Return demo data
   │  (isDemoMode())             │         isDemoFallback = true
   └──────────┬──────────────────┘
              │ No
   ┌──────────▼──────────────────┐
   │  Fetch from API / agent     │
   └──────────┬──────────────────┘
              │
   ┌──────────▼──────────────────┐
   │  Fetch succeeded?           │──Yes──▶ Return live data
   └──────────┬──────────────────┘         isDemoFallback = false
              │ No (3+ failures)
              ▼
   Return demo data as fallback
   isDemoFallback = true
```

The card component then reports its state up to `CardWrapper` via the
`useCardLoadingState` or `useReportCardDataState` hook.  `CardWrapper`
reads the `isDemoData` flag and, when it is `true`, renders the yellow
outline and **Demo** badge.

### Loading vs. Demo Data

On first visit the card shows a **loading skeleton** while the API call is
in flight.  Demo data is never shown during this initial loading phase —
the skeleton appears instead.  On subsequent visits the card instantly
renders **cached data** from IndexedDB while a background refresh runs
(stale-while-revalidate pattern).

| Scenario | What the user sees |
|----------|-------------------|
| First visit, backend reachable | Loading skeleton → live data |
| Return visit, backend reachable | Cached data instantly → refresh spinner → updated data |
| No backend / demo mode | Demo data with Demo badge and yellow outline |
| Backend reachable, fetch fails | Loading skeleton → demo fallback after 3 failures |

## Cross-Tab Synchronisation

Toggling demo mode in one browser tab is picked up by all other open tabs
through the `storage` event on `localStorage` plus a custom
`kc-demo-mode-change` window event.  When the mode changes, all registered
caches are cleared so that every card transitions through a skeleton state
before loading the appropriate data source.

## Note on Data Consistency

Because demo data is generated independently by multiple sources (the
unified registry, per-hook fallbacks, and per-card files), the synthetic
values shown by different cards are **not guaranteed to be mutually
consistent**.  Two cards that each derive a summary from their own demo
dataset may display different totals for the same logical metric.  This is
expected: demo mode is designed to showcase the UI layout and card
interactions, not to present a coherent simulated cluster state.
