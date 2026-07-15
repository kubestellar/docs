# Governor

**The governor is hive's scheduler. It watches the GitHub work queue and decides, on a fixed interval, which agents to kick and how often — running agents harder when there is more work and easing off when the queue is quiet.**

Agents do not schedule themselves. Every enabled agent is driven by the governor: on each evaluation cycle the governor measures the queue, picks a mode, and kicks each agent on the cadence that mode assigns it. This page is the full reference. For the agent-side view — cadence syntax in an agent's own config — see [Agent Configuration](agent-configuration.md#cadences-and-the-governor).

---

## The evaluation cycle

Once per `eval_interval_s` (default **300** seconds), the governor:

1. Enumerates actionable GitHub work across `project.repos` — open issues, open PRs, held items, and SLA violations.
2. Refreshes the token budget from lifetime usage and fires any budget alerts.
3. Computes a **mode** from the actionable-issue count.
4. For each enabled, non-`on_demand` agent, checks whether its per-mode cadence has elapsed since its last kick, and kicks it if so.

The cycle runs continuously as one of the container's processes. Changing `eval_interval_s` at runtime (including via an ACMM pack apply) takes effect on the next tick — the ticker resets itself. The valid range is **10–86400** seconds.

> **Note:** mode is driven by the **actionable-issue count only**. Open PRs, held items, and SLA violations are recorded and shown on the dashboard, but they do not change the mode.

---

## Modes and thresholds

The governor has four modes. Queue depth (actionable issues) selects the highest mode whose threshold it exceeds:

| Mode | Default threshold | Meaning |
|---|---|---|
| `surge` | depth > 20 | queue is deep — kick agents most aggressively |
| `busy` | depth > 10 | steady workload |
| `quiet` | depth > 2 | light workload |
| `idle` | depth ≤ 2 | little or no work; slowest cadences |

Thresholds are overridable per mode. A threshold left unset (or set to `0`) falls back to its built-in default, so an unset value never accidentally makes the queue surge:

```yaml
governor:
  eval_interval_s: 300
  modes:
    busy:
      threshold: 16        # queue depth that activates this mode
      supervisor: 5m       # per-agent kick interval in this mode
      scanner: 15m
      ci-maintainer: 1h
      architect: pause     # suspend kicks for this agent in this mode
```

---

## Per-mode, per-agent cadences

Inside each mode block, every entry other than `threshold` is a **cadence** for one agent: `agent-name: duration`. The duration is anything Go's duration parser accepts — `5m`, `30m`, `2h`, `4h`.

- An agent listed under a mode is kicked on that interval while the hive is in that mode.
- An agent with no entry for the current mode is not kicked in that mode.
- Cadences are independent per mode, so an agent can be busy in `surge` and slow in `idle`.

An agent is **due** for a kick when the time since its last kick is at least its cadence interval. At startup every eligible agent is kicked once so the hive doesn't idle waiting out a full cadence.

### Pausing an agent in a mode

The value `pause` (or `paused`) suspends kicks for that agent **in that mode only**:

```yaml
governor:
  modes:
    surge:
      architect: pause     # don't kick architect while the queue is deep
```

> **Note:** `pause` here only stops governor kicks. It is not a process pause and it does not disable the agent — the agent stays running and can still be triggered by other means. To keep an agent configured but off entirely, use `enabled: false` in the agent's config.

---

## On-demand agents

An agent with `on_demand: true` is skipped by the governor timer completely. It runs only when something triggers it explicitly — for example, the inception workflow drives the `brainstorm` agent this way. On-demand agents never appear in a mode's cadence list. See the agent `channels:` block in [Agent Configuration](agent-configuration.md#declarative-extensions) for the other non-timer trigger types (webhook, schedule, bead).

---

## The budget system

The governor enforces a rolling **token budget** so a hive cannot run up unbounded API cost. It is off by default.

```yaml
governor:
  budget:
    total_tokens: 50000000   # 0 (the default) disables budgeting entirely
    period_days: 7
    critical_pct: 90
```

- **Window.** Spend accrues over a rolling 7-day window. When the window rolls over, spend re-baselines and the one-shot alerts reset.
- **Warn.** At 90% of the limit the governor emits a one-time warning for the window.
- **Exhaustion.** At 100%, kicks are suppressed hive-wide until the window rolls over — the queue keeps filling, but agents stop being kicked.

| Signal | Threshold | Effect |
|---|---|---|
| warn | 90% of limit | one-time warning alert |
| exhausted | 100% of limit | kicks suppressed for all non-exempt agents |
| rollover | window elapses | spend re-baselines, alerts reset |

Two escape hatches keep critical agents running under exhaustion:

- **Ignored agents** — a per-agent exemption. Exempt agents keep getting kicked even when the budget is exhausted.
- **Ignore-all** — a global toggle that opens the kick gate for everyone while keeping the limit, window, and alerts intact (useful for a temporary override without discarding budget tracking).

The budget also interacts with model selection: for an **unpinned** agent, the governor may auto-select a cheaper model as spend grows. Pin the model to opt out — see [model pinning](agent-configuration.md#model-pinning-and-auto-switching).

---

## ACMM pack integration

You rarely hand-write the `governor:` block. The six [ACMM packs](acmm-policy-matrix.md) ship governor tuning alongside their agent rosters, and the tuning tightens as the level rises:

| Level | `eval_interval_s` | Posture |
|---|---|---|
| L1 | 600 | advisory only — `quiet`/`idle` cadences, no surge |
| L3 | 300 | full four modes, hold-gated PRs |
| L6 | 120 | fastest cadences, lowest thresholds, auto-merge |

Applying a level reconciles the governor config: a fresh apply or level change writes the pack's `eval_interval_s`, thresholds, and cadences; a merge onto an existing roster fills only the gaps, preserving your customizations. See the [ACMM Policy Matrix](acmm-policy-matrix.md) for the full per-level cadence table and the L5 worked example.

---

## Tuning guidance

- **Keep `stale_timeout` above the longest cadence.** An agent kicked every 4h with a 30-minute stale timeout looks dead between kicks. The shipped packs use "longest cadence × 2."
- **Match cadence to repo velocity.** A hot repo may want `scanner: 15m`; a quiet one `4h`.
- **Pause the noisy agent at depth.** If an agent adds churn exactly when the queue is deep, `pause` it in `surge` and let the workers drain the backlog.
- **Adjust thresholds, not just cadences.** Lower the `surge` threshold to reach maximum cadence sooner on a busy project; raise it to hold steady longer.

---

## See also

- [Agent Configuration](agent-configuration.md) — the agent-side config, including the cadence and kick-template fields the governor drives.
- [ACMM Policy Matrix](acmm-policy-matrix.md) — per-level, per-agent policy and cadence tables.
- [Variable Substitution](variable-substitution.md) — how kick prompts are built each cycle.
- [Architecture](architecture.md) — where the governor sits among the container's processes.
- [Troubleshooting](troubleshooting.md) — stuck sessions and agents that look dead between kicks.
