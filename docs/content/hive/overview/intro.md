# hive

**AI agent orchestration for open source projects. One container runs a team of AI agents that triage issues, write fixes, review PRs, and keep CI green — governed by queue depth and gated by maturity levels.**

Hive is a single Go binary that enumerates GitHub issues and PRs, classifies them by complexity, and dispatches work to AI agents (Claude, Copilot, Gemini, Goose, or self-hosted inference backends) on adaptive cadences.

Hive separates decisions into two layers: a **deterministic pipeline** of shell scripts handles filtering, classification, merge-gating, and enforcement before any LLM sees the work. Agents only handle judgment calls — reading code, reasoning about fixes, writing PRs.

> Evaluating whether hive is safe to run against your repos and API keys? See the [Security Model](../security-model.md).

---

## Quick Start (Docker Compose)

```bash
git clone -b v2 https://github.com/kubestellar/hive.git
cd hive/v2

cp hive.yaml.example hive.yaml
export HIVE_GITHUB_TOKEN=ghp_...
docker compose up -d
```

Dashboard at `http://localhost:3001`. The default `docker-compose.yaml` uses the pre-built image `ghcr.io/kubestellar/hive:v2-latest`; run `docker compose build` first to build from source instead.

---

## Deployment options

| Option | How |
|--------|-----|
| **Docker Compose** | `docker compose up -d` in `v2/` — quickest way to evaluate |
| **Kubernetes (self-hosted)** | Manifests in `v2/deploy/k8s/` — namespace, secrets, ConfigMap from `hive.yaml`, PVC, Deployment, Service, Ingress. The default PVC is `ReadWriteOnce` with a `Recreate` strategy; use an NFS-backed `ReadWriteMany` StorageClass for zero-downtime rolling upgrades. |
| **Hosted (Hive Hub)** | [hive.kubestellar.io](https://hive.kubestellar.io) provisions and hosts a hive for you — OAuth-protected dashboard, public registry, cross-hive leaderboards. No cluster required. |

### Ports

| Port | Purpose |
|------|---------|
| 3001 | Dashboard (supports auth token) |
| 3002 | Internal API |
| 7681 | ttyd web terminal |

### Volumes

| Mount Path | Purpose |
|------------|---------|
| `/etc/hive/hive.yaml` | Configuration (read-only, from ConfigMap) |
| `/data` | Persistent state: metrics, beads, logs, dashboard config overlay |
| `/secrets` | GitHub App key and other secrets (read-only) |

---

## Web Dashboard

The embedded dashboard (port 3001) is the primary control surface:

- **Live updates via SSE** — agent states, governor mode, repo counts, and beads refresh continuously
- **Getting Started dialog** — a welcome checklist that auto-checks steps as setup completes and deep-links into the relevant configuration; minimizes into the `?` button when dismissed
- **Per-agent method + model dropdowns** — each agent card shows its current backend and model as the button label; models are **live-discovered** per backend (see below)
- **Model pinning** — pin an agent's model so automatic reconciliation never changes it out from under you; an explicit switch on a pinned agent retargets the pin instead of failing
- **Test Connection** — live probe of inference gateways that reports the gateway's actual response (including auth errors) instead of masking failures behind fallback aliases
- **Real token tracking** — inference usage is captured from actual API responses per agent; totals surface on the dashboard and, for hub-registered hives, on the hub's My Hives page
- **Kick buttons** — one-click kick for any agent
- **ACMM level control** — apply a maturity level and the full agent roster that level defines is reconciled automatically
- **Web terminal** — ttyd access to agent tmux sessions

### Model discovery

Model lists are discovered live per backend rather than hardcoded:

| Backend | Discovery source |
|---------|-----------------|
| litellm / vllm / llm-d | The gateway's live `/v1/models` endpoint |
| copilot | Live per-plan model list (including enterprise API host discovery) using the stored OAuth token |
| gemini | Live models API when an API key is configured |
| claude / goose | Maintained model lists (no machine-readable source) |

Discovery is best-effort with caching and fallbacks, so dropdowns never come up empty. An agent's model is switched automatically in exactly one case: live discovery shows the currently selected model is no longer available (and the model is not pinned) — the agent moves to an available model and the dashboard shows a notice.

---

## How it works

The **governor** evaluates issue/PR queue depth across your repos on a configurable interval (default 300s) and switches between four modes — **SURGE**, **BUSY**, **QUIET**, **IDLE** — each with per-agent cadences (or `pause`). Thresholds and cadences are all set in `hive.yaml`:

```yaml
governor:
  eval_interval_s: 300
  modes:
    surge:
      threshold: 20
      scanner: 15m
      reviewer: pause
    busy:
      threshold: 10
      scanner: 15m
      reviewer: 1h
    quiet:
      threshold: 2
      scanner: 15m
      reviewer: 45m
    idle:
      threshold: 0
      scanner: 15m
      reviewer: 15m
```

Agents run inside tmux sessions managed by the Go binary. The container runs three processes: the `hive` binary (agent orchestration, governor loop, dashboard API, health and token tracking), a Node.js proxy (dashboard frontend with SSE), and ttyd (web terminal).

---

## ACMM levels

Hive uses an **AI-native Capability Maturity Model** (ACMM) with six levels that control what agents are allowed to do:

| Level | Name | Agents | What agents can do |
|-------|------|--------|-------------------|
| L1 | Assisted | 2 | Interactive advisor and project inception. Advisory beads only. |
| L2 | Instructed | 5 | Observe and report findings as dashboard beads. No GitHub interaction. |
| L3 | Measured | 6 | Quality agent opens issues and hold-gated PRs. Others remain advisory. |
| L4 | Adaptive | 7 | All agents file issues. Quality, sec-check, and CI open hold-gated PRs. |
| L5 | Semi-Automated | 9 | All agents open hold-gated PRs. Humans batch-review and approve. |
| L6 | Fully Autonomous | 10 | Agents open PRs and auto-merge on green CI. No hold label required. |

Each level defines per-agent **policy modes**: advisory (observe only), measured (file issues), holdgated (PRs with hold label), or full (auto-merge). Applying a level reconciles the entire agent roster that level defines — at L5 that is 9 agents, including architect and strategist.

---

## Deterministic pipeline

Hive separates work into two layers:

- **Deterministic layer** (shell scripts + JSON + config) — handles every decision where a human would give the same answer every time. Runs before agents wake up.
- **Non-deterministic layer** (LLM agents) — receives pre-computed data and focuses on judgment calls: reading code, reasoning about fixes, writing PRs.

The rule: **if a human would give the same answer every time, it belongs in infrastructure, not in a prompt.**

LLMs treat "NEVER" rules as suggestions. No amount of prompt engineering reliably prevents an agent from closing a hold-labeled issue or merging an untested PR. The deterministic pipeline removes those decisions from the agent entirely — enumerators fetch and filter the canonical work list, classifiers enrich items with metadata, gates pre-check eligibility, and enforcers block forbidden operations before any agent acts.

---

## Backends

Each agent picks its backend in `hive.yaml` (`agents.<name>.backend`):

| Backend | Type | Description |
|---------|------|-------------|
| `claude` | CLI | Anthropic's CLI — runs Claude models directly |
| `copilot` | Aggregate | GitHub Copilot — routes to Claude, GPT, Gemini, and other vendor models |
| `gemini` | CLI | Google's CLI — runs Gemini models directly |
| `goose` | Aggregate | Block's Goose — routes to any model via config (cloud or local) |
| `litellm` / `vllm` / `llm-d` | Inference | Self-hosted OpenAI-compatible gateways — the agent CLI runs in bare mode and an in-process Anthropic-to-OpenAI translator forwards requests to your gateway |

For inference backends, the gateway API key is entered once in the dashboard (obfuscated after entry) and stored to a Kubernetes Secret and an owner-only file on the PVC — never written into `hive.yaml`. See the [Security Model](../security-model.md) for how agents are kept away from real keys.

---

## Configuration

All config lives in a single `hive.yaml` with `${ENV_VAR}` interpolation for secrets. See `v2/hive.yaml.example` for the full reference.

```yaml
project:
  org: your-org
  repos:
    - repo-one
    - repo-two
  primary_repo: repo-one
  ai_author: your-bot-user

agents:
  scanner:
    enabled: true
    backend: claude
    model: claude-sonnet-4-6
    beads_dir: /data/beads/scanner
    clear_on_kick: true

github:
  token: ${HIVE_GITHUB_TOKEN}

hub:
  enabled: true
  url: https://hive.kubestellar.io
```

On Kubernetes the file is mounted read-only from a ConfigMap; changes made in the dashboard are persisted as an overlay on the `/data` PVC so they survive pod restarts.

### GitHub auth

Use a personal access token, or a GitHub App (recommended for production — permissions are scoped to the repos you install it on):

```yaml
github:
  app_id: 12345
  installation_id: 67890
  key_file: /secrets/gh-app-key.pem
```

---

## Notifications

Configure any combination of channels in `hive.yaml`:

```yaml
notifications:
  ntfy:
    server: https://ntfy.sh
    topic: my-hive-alerts
  # slack:
  #   webhook: ${SLACK_WEBHOOK_URL}
  # discord:
  #   webhook: ${DISCORD_WEBHOOK_URL}
```

An optional Discord bot (`discord.bot_token`) responds to `!hive` commands.

---

## Contribute to a Hive

Community members can contribute compute to any registered hive:

```bash
brew install just gh
git clone -b v2 https://github.com/kubestellar/hive && cd hive
just contribute-setup claude
just contribute-hive
```

Supported CLIs: Claude Code, GitHub Copilot, Pi, Goose, Bob. Contributors start as newcomer (rate-limited) and auto-promote based on completed tasks. Your credentials never leave your machine.

See the [Hive Hub](https://hive.kubestellar.io) to browse registered hives, view leaderboards, and find hives accepting contributions.

---

Apache 2.0  ·  [Architecture](../architecture.md)  ·  [Security Model](../security-model.md)
