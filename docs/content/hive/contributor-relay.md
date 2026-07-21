# Contributor Relay

**The contributor relay lets anyone donate their own CLI and API tokens to a hive. A contributor runs a small relay process on their machine; the hive assigns it real work — issues from the project's queue — and the contributor's agent executes each task locally with the CLI and model of their choice, reporting results back over a WebSocket.**

The relay turns a hive from a fixed set of resident agents into an elastic swarm: the admin curates *what* is offered (which repos, which labels, which models are acceptable), and contributors decide *how* it gets done (their CLI, their model, their compute, their tokens).

---

## How it fits together

```
┌────────────────────┐          wss://<hive>/api/contribute/ws          ┌──────────────────────┐
│  Hive (admin side)  │ ◄──────────────────────────────────────────────► │ Contributor machine  │
│                    │   task assign → progress → result                │                      │
│  Governor Config → │                                                  │  contributor-relay   │
│  Hub tab curates   │                                                  │  + your CLI/model    │
│  the work queue    │                                                  │  (tmux session)      │
└────────────────────┘                                                  └──────────────────────┘
```

- The **work queue** is built from the hive's monitored repos: open, actionable issues that pass the admin's filters. The current depth is visible on the Hub tab (`N items in queue`) and at `GET /api/contribute/status`.
- The **relay** (`bin/contributor-relay.sh`, started by `just contribute-hive`) authenticates with a registration token, receives one task at a time, drives the local CLI inside a tmux session, injects a short-lived GitHub token for the PR, and reports the result. It heartbeats every 30 s and reconnects with exponential backoff; a task is abandoned if it exceeds 30 minutes.
- Every contributor has a **trust tier** with per-tier rate limits. Tiers promote automatically with completed tasks.

---

## Admin: configuring the queue (Governor Config → Hub)

Everything an admin controls lives on one tab: **Governor Config → Hub**, below the hub registration settings. The queue-count badge at the top of the section shows how many issues currently qualify.

### Kill switch

| Control | Effect |
|---|---|
| **Suspend Contributions** | Stops assigning tasks immediately. Connected contributors stay online but idle. Use this instead of revoking people when you need a pause (release freeze, incident). |

### What gets queued

Only issues that pass **all** of these filters are offered to contributors:

| Control | Behavior |
|---|---|
| **Repos for Contribute** | Per-repo toggle. Only enabled repos serve work. Newly added repos default to **on**. |
| **Allow Labels** | If non-empty, an issue must carry one of these labels to queue (e.g. `good-first-issue`, `help-wanted`). Empty = all issues eligible. |
| **Deny Labels** | Issues with any of these labels never queue (e.g. `hold`, `wontfix`, `duplicate`). |
| **Deny Titles** | Title patterns to exclude. Wildcards (`*dashboard*`, `epic:*`) and regex (`/renovate/i`) are supported. |
| **Deny Authors** | Issues opened by these authors are excluded (e.g. `dependabot*`, `renovate[bot]`). Same wildcard/regex syntax. |

### Which models are acceptable

Contributors declare their CLI backend and model when the relay connects. The **Model Filter** decides whether that connection is accepted:

| Control | Behavior |
|---|---|
| **Allowed Models** | Patterns for acceptable models — one-click presets (`claude-opus*`, `claude-sonnet*`, `gpt-4o*`, `gemini*`, `deepseek*`, …) or custom wildcards/regex. **Empty list = all models accepted.** |
| **Reject Unknown Models** | When on (and the allowlist is non-empty), a contributor whose model matches nothing on the list is rejected **at connect time**. The rejection message echoes the accepted patterns, so the contributor knows what to switch to. |

This is the admin's quality floor: a hive doing subtle refactors can require `claude-opus*`/`claude-sonnet*`, while a hive full of `good-first-issue` label work can accept anything, including local Ollama models.

### Tier access and rate limits

Each trust tier can be toggled on/off and given its own limits (`0` = unlimited):

| Tier | How you get it | Default limits (tasks/hr · tasks/day · concurrent) |
|---|---|---|
| `newcomer` | On registration | 3 · 10 · 1 |
| `contributor` | Auto-promoted after **5** completed tasks | 5 · 20 · 2 |
| `trusted` | Auto-promoted after **20** completed tasks | 10 · 50 · 3 |
| `advisor` | Assigned manually by the admin | unlimited |

Admins can also promote, demote, or revoke individual contributors from the dashboard's contributor list (`/api/contributors`); revoked contributors cannot reconnect. Completed-task counts and standings are public on the hive's `/leaderboard`.

---

## Contributor: connecting with your CLI and model

Visit **`https://<hive-dashboard>/contribute`** — every hive serves a landing page with live queue stats and copy-paste setup commands tailored to the CLI you pick. The short version:

```bash
brew install just gh
git clone -b v2 https://github.com/kubestellar/hive && cd hive
export HIVE_HUB=wss://<hive-host>/contribute
just contribute-setup claude     # one-time: register + authenticate GitHub + your CLI
just contribute-hive             # start contributing (Docker, recommended)
```

`contribute-setup` is one-time per hive: it registers you (your GitHub identity plus a registration token stored in `~/.config/hive/contributor.env`), authenticates `gh`, and authenticates the CLI you chose. If `HIVE_HUB` is unset, it looks up available hives from the public registry at `hive.kubestellar.io` and lets you pick one.

`contribute-hive` starts the relay. Two modes:

```bash
just contribute-hive               # containerized (recommended) — runs the relay + CLI in Docker
just contribute-hive claude local  # host mode — relay + CLI directly on your machine, in a tmux session
```

### Choosing a CLI backend

The relay speaks to whatever backend you set up — pass it to `contribute-setup` and (in host mode) to `contribute-hive`:

| Backend | Notes |
|---|---|
| `claude` | Claude Code (`npm i -g @anthropic-ai/claude-code`) |
| `copilot` | GitHub Copilot CLI |
| `pi` | Pi |
| `goose` | Goose with a local model via Ollama — fully local inference (`export GOOSE_PROVIDER=ollama GOOSE_MODEL=llama3.2:3b`) |
| `litellm` | Claude Code pointed at **your own LiteLLM proxy**: `export HIVE_LITELLM_ENDPOINT=… HIVE_LITELLM_API_KEY=…` (exported locally, never sent to the hive) |
| `bob` | Bob shell |
| other | Any CLI you can drive yourself, host mode only |

### Choosing a model

Set the model before starting the relay:

```bash
export AGENT_MODEL=claude-sonnet-4-6   # or gpt-4o, gemini-2.5-pro, …
just contribute-hive
```

(`GOOSE_MODEL` is honored for goose.) The model is declared to the hive when the relay connects. If the hive's Model Filter rejects it, the relay prints the hive's accepted patterns and exits — switch models and reconnect:

```
This hive accepts the following models:
  - claude-opus*
  - claude-sonnet*
Set your model: export AGENT_MODEL=<model>
```

### What happens on a task

1. The hive assigns an issue that fits your tier's rate limits.
2. The relay writes the task context, injects a short-lived GitHub token, and drives your CLI in a tmux session (attach to it to watch — or intervene).
3. Progress is reported back every 2 minutes; the result (PR opened, success/failure) is reported when the CLI finishes.
4. Completed tasks count toward your automatic tier promotion — and the hive's `/leaderboard`.

Relay environment reference:

| Variable | Meaning |
|---|---|
| `HIVE_HUB` | WebSocket URL of the hive (`wss://<host>/contribute`) |
| `HIVE_REGISTRATION_TOKEN` | Issued at setup; stored in `~/.config/hive/contributor.env` |
| `AGENT_BACKEND` | CLI backend (`claude`, `copilot`, `goose`, …) |
| `AGENT_MODEL` | Model to declare and run with (optional; empty = backend default) |
| `HIVE_AGENT_SESSION` | tmux session name (default `contributor`) |

---

## Operational notes

- **Suspending vs. revoking** — suspension idles everyone and is instant to undo; revocation is per-contributor and blocks reconnection.
- **Filters apply at queue time, the model filter at connect time.** Tightening label/title filters affects the *next* queue build; tightening the model filter affects the *next* connection, not agents mid-task.
- **Contributors never hold long-lived repo credentials.** The relay receives short-lived GitHub tokens per task; API keys for the contributor's own model provider never leave their machine.
