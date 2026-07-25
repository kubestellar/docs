# AgentDefinition YAML Reference

**The `AgentDefinition` YAML is hive's *portable* agent format — a single, self-contained document (`kind: AgentDefinition`) that describes one whole agent: its identity, its engine, its behavior, and even its work prompt. This is the file the dashboard's `+ agent → Import from URL` overlay points you at, and it is exactly the schema that overlay reads. This page documents every field, grouped to match the file's structure.**

If you clicked **+ agent** in the dashboard and were sent to [`v2/examples/agents/customized-agent.yaml`](https://github.com/kubestellar/hive/blob/v2/v2/examples/agents/customized-agent.yaml) for an example, this is the reference for that file. For the *other* way agents are configured — inline entries under `agents:` in `hive.yaml`, using snake_case keys — see [Agent Configuration](agent-configuration.md). The two describe the same underlying agent; they differ only in shape and casing (see [How this maps to `hive.yaml`](#how-this-maps-to-hiveyaml) below).

> **Which Hive does this document?** This page tracks the **Hive `v2` line** — the same line the dashboard, the `+ agent` overlay, and the example YAML come from. Hive's docs site currently publishes a single **main (Latest)** channel; there is no separate `v2` entry in the version selector even though the example file lives on the repo's `v2` branch. If a dashboard link sends you to `.../blob/v2/v2/examples/...`, that doubled `v2` is *branch* `v2` plus the in-repo *path* `v2/examples/...`, not a typo — it is the current, supported example.

## The document envelope

Every AgentDefinition starts with the same four top-level keys:

```yaml
apiVersion: hive.kubestellar.io/v1
kind: AgentDefinition
metadata:
  # identity & presentation
spec:
  # engine, behavior, triggers, tools, connections
```

| Field | Type | Required | Default | Meaning |
|---|---|---|---|---|
| `apiVersion` | string | recommended | — | Schema group/version. Use `hive.kubestellar.io/v1`. |
| `kind` | string | **required** | — | Must be exactly `AgentDefinition`, or the import is rejected. |
| `metadata` | map | **required** | — | Identity and dashboard presentation. `metadata.name` is required. |
| `spec` | map | required in practice | — | Everything the agent *does* — engine, behavior, triggers. |

## `metadata` — identity and presentation

```yaml
metadata:
  name: customized-agent
  displayName: "Customized Agent"
  description: "A template agent that demonstrates the portable agent definition format."
  emoji: "🛠"
  color: "#e67e22"
```

| Field | Type | Required | Default | Meaning |
|---|---|---|---|---|
| `name` | string | **required** | — | The agent's identifier and its key in the roster. Lowercase, no spaces (e.g. `customized-agent`). |
| `displayName` | string | optional | falls back to `name` | Human-readable label shown in the dashboard roster. |
| `description` | string | optional | empty | One-line summary of what the agent does; shown in the dashboard. |
| `emoji` | string | optional | none (well-known names get a default) | Badge shown next to the agent in the dashboard. A single emoji. |
| `color` | string | optional | none | Dashboard accent color as a hex string (e.g. `#e67e22`). |
| `specVersion` | int | optional | unset | Reserved for future schema evolution of the definition format. Leave unset unless a newer Hive tells you otherwise. |

## `spec` — engine, behavior, and triggers

Everything below lives under `spec:`.

### Engine — what powers the agent

```yaml
spec:
  backend: copilot
  model: claude-sonnet-4-6
```

| Field | Type | Required | Default | Meaning |
|---|---|---|---|---|
| `backend` | string | optional | `copilot` (applied on import) | The engine that runs the agent. See the value table below. |
| `model` | string | optional | engine-dependent | Model id for that engine (e.g. `claude-sonnet-4-6`). Leave empty to accept the engine's default / governor choice. |

**`backend` accepts one of three kinds of value:**

1. **A subscription CLI:** `claude`, `copilot`, `goose`, `codex`, `pi`, `bob`, or `aider`. You log in once per CLI from the dashboard, and every agent using that CLI shares the login. (`gemini` is also offered live in the dashboard; as a persisted value prefer the validated list here.)
2. **A self-hosted inference backend:** `vllm`, `llm-d`, or `litellm`. These are OpenAI-compatible endpoints you configure with a base URL and a key *reference*; the agent launches the Claude CLI routed through hive's inference translator, so there is no separate login.
3. **A configured Model Gateway name** (for example `openrouter`). When `backend` names a gateway you have configured, the agent is routed through that gateway's OpenAI-compatible endpoint. The gateway must exist in your hive configuration first; the name here simply selects it. If your hive has an OpenRouter / Model Gateway setup page, configure the gateway there before referencing it as a `backend`.

> The engine also decides how model discovery works and how pinning behaves. For the full comparison of subscription CLIs vs. inference backends, live model discovery, and the pin/auto-switch rules, see [Agent Configuration → Methods](agent-configuration.md#methods-subscription-clis-vs-self-hosted-inference).

### Identity & routing

```yaml
spec:
  role: custom
  sortOrder: 50
  beadRole: worker
  aliases:
    - cu
  laneKeywords:
    - custom
    - review
  detectKeywords:
    - customized
```

| Field | Type | Required | Default | Meaning |
|---|---|---|---|---|
| `role` | string | optional | the agent's `name` | Behavioral role tag. Well-known roles (`scanner`, `ci-maintainer`, …) carry built-in presentation defaults; `custom` marks a bespoke agent. |
| `sortOrder` | int | optional | `0` for supervisors, `100` otherwise | Position in the dashboard roster; lower sorts first. |
| `beadRole` | string | optional | `worker` (applied on import) | `worker` (does work) or `supervisor` (monitors other agents and sorts first). |
| `aliases` | list of string | optional | none | Short names accepted in dispatch and commands (e.g. `cu`). |
| `laneKeywords` | list of string | optional | none | Issues/PRs matching these keywords are routed into this agent's lane. |
| `detectKeywords` | list of string | optional | none | Attributes GitHub activity back to this agent for stats/attribution. |

### Behavior — what it may do, and when

```yaml
spec:
  mode: ADVISORY
  staleTimeout: 28800
  restartStrategy: immediate
  clearOnKick: true
  includeRepos: true
```

| Field | Type | Required | Default | Meaning |
|---|---|---|---|---|
| `mode` | string | optional | inherited from level/pack | GitHub interaction tier: `ADVISORY` \| `ISSUES_ONLY` \| `ISSUES_AND_PRS` \| `ISSUES_PRS_MERGE`. Controls how far the agent may go (comment only → open issues → open PRs → merge). The `tools` block (below) can override this. |
| `staleTimeout` | int (seconds) | optional | unset (engine default) | Seconds of silence before the agent counts as stale. Must exceed the agent's longest cadence — the shipped packs use "longest cadence × 2" (e.g. `28800` = 8h). |
| `restartStrategy` | string | optional | `immediate` (applied on import) | How a dead session is brought back. `immediate` reconnects as soon as the session is detected down. |
| `clearOnKick` | bool | optional | `true` | When `true`, the agent's session context is cleared before each kick (fresh start). `false` keeps context across kicks — rare, and context bloat is real. |
| `includeRepos` | bool | optional | `true` | When `true`, the project repo list is appended to every kick prompt. |

### `cadences` — how often the governor kicks it

```yaml
spec:
  cadences:
    idle: 4h
    quiet: 4h
    busy: 2h
    surge: "off"
```

`cadences` is a map from **governor mode** (`idle`, `quiet`, `busy`, `surge`) to the interval at which this agent is kicked in that mode. Any interval Go's duration parser accepts works (`5m`, `2h`, `4h`); `"off"` (or `pause`) suspends kicks for that mode without disabling the agent.

| Key | Type | Required | Meaning |
|---|---|---|---|
| `idle` / `quiet` / `busy` / `surge` | string (duration or `off`) | optional | Per-mode kick interval for this agent. |

The governor computes the mode from queue depth and kicks each agent on the cadence that mode assigns it. For the full model — evaluation cycle, thresholds, and budgets — see [Governor](governor.md).

### `promptTemplate` — the agent's work prompt

```yaml
spec:
  promptTemplate: |
    # ${AGENT_DISPLAY_NAME} — Custom Agent Policy

    ${GH_AUTH}

    You are the **${AGENT_NAME}** agent for ${PROJECT_ORG}/${PROJECT_PRIMARY_REPO}.

    ## Your Role
    Analyze the codebase and provide recommendations based on your expertise.

    ## Work List
    ISSUES: ${ISSUE_LIST}
    PRs: ${PR_LIST}

    ${KNOWLEDGE}
```

| Field | Type | Required | Default | Meaning |
|---|---|---|---|---|
| `promptTemplate` | string (multiline) | optional | falls back to the agent's `kick_template` / convention | The **periodic work prompt** bundled inline with the agent. On import it is written to the policies directory as `<name>.md` and the agent's kick template is pointed at it. |

`${VAR}` references are substituted on every kick (`${ISSUE_LIST}`, `${PR_LIST}`, `${AGENT_NAME}`, `${PROJECT_ORG}`, `${KNOWLEDGE}`, …). For the complete variable list and how to add your own, see [Variable Substitution](variable-substitution.md).

Bundling the prompt inline is what makes an AgentDefinition *portable*: config plus policy travel together in one importable file.

### `channels` — how the agent gets triggered

Channels declare how an agent is triggered. When omitted, the agent uses the default governor timer kick. Declaring channels lets you trigger on webhooks, schedules, Discord, or beads instead of (or in addition to) the timer.

```yaml
spec:
  channels:
    - type: kick
    - type: webhook
      events: ["issues.opened"]
    - type: schedule
      schedule: "0 */4 * * *"
```

| Field | Type | Required | Meaning |
|---|---|---|---|
| `type` | string | **required** | `kick` \| `webhook` \| `discord` \| `schedule` \| `bead`. |
| `enabled` | bool | optional | Defaults to `true`; set `false` to declare-but-disable a channel. |
| `events` | list of string | required for `webhook` | GitHub webhook events that fire this channel (e.g. `issues.opened`). |
| `patterns` | list of string | required for `discord` | Message patterns that fire a `discord` channel. |
| `schedule` | string (cron) | required for `schedule` | Cron expression (e.g. `0 */4 * * *`). |
| `match` | map | required for `bead` | Match criteria that fire a `bead` channel. |
| `repos` | list of string | optional | Restrict the channel to specific repositories. |

> **Note:** Channels are a **current, supported v2 feature.** (Older copies of the example labeled this `(v3 feature)`; that label is being removed — treat channels as available today.)

### `tools` — declarative tool permissions

The `tools` block replaces the coarse `mode` tier with an explicit permission preset plus per-tool overrides. When present, it governs instead of `mode`.

```yaml
spec:
  tools:
    preset: advisory
    rules:
      - pattern: "mcp__github__create_issue"
        action: allow
        reason: "allow creating advisory issues"
```

| Field | Type | Required | Meaning |
|---|---|---|---|
| `preset` | string | optional | Baseline permission set: `advisory` \| `issues-only` \| `issues-prs` \| `full`. Maps onto the `mode` tiers (`advisory` denies issue & PR creation; `issues-only` denies PRs; `issues-prs` and `full` deny nothing). |
| `rules` | list | optional | Per-tool overrides applied on top of the preset. |
| `rules[].pattern` | string | **required** | Tool pattern to match (e.g. `mcp__github__create_issue`). |
| `rules[].action` | string | **required** | `allow` or `deny`. An explicit `allow` overrides a preset `deny` for the same pattern. |
| `rules[].reason` | string | optional | Human-readable justification, shown for auditing. |

> **Note:** Tools are a **current, supported v2 feature.**

### `connections` — external service integrations

Connections attach external services (MCP servers, HTTP APIs, knowledge sources) to an agent.

```yaml
spec:
  connections:
    - name: github-mcp
      type: mcp
      uri: "stdio:///usr/local/bin/mcp-github"
```

| Field | Type | Required | Meaning |
|---|---|---|---|
| `name` | string | **required** | Unique name for the connection within the agent. |
| `type` | string | **required** | `mcp` \| `api` \| `knowledge`. |
| `uri` | string | required for `mcp` and `api` | Endpoint URI (e.g. a `stdio://` MCP command or an HTTP base URL). |
| `auth` | map | optional | Authentication: `auth.type`, and a key *reference* — `auth.env_var` (env var name) or `auth.file` (key-file path). Secret **values** never go in YAML. |
| `env_name` | string | optional | Environment variable name to expose to the connection. |
| `options` | map | optional | Free-form string options passed to the connection. |

> **Note:** Connections are a **current, supported v2 feature.**

## Complete annotated example

This mirrors the shipped [`v2/examples/agents/customized-agent.yaml`](https://github.com/kubestellar/hive/blob/v2/v2/examples/agents/customized-agent.yaml). Import it from the dashboard via **+ agent → Import from URL**, or copy it as a starting point and edit the fields above.

```yaml
apiVersion: hive.kubestellar.io/v1
kind: AgentDefinition
metadata:
  name: customized-agent                # required — roster key & identifier
  displayName: "Customized Agent"        # dashboard label
  description: "A template agent that demonstrates the portable agent definition format. Customize this to create your own specialized agent."
  emoji: "🛠"                            # dashboard badge
  color: "#e67e22"                       # dashboard accent
spec:
  backend: copilot                       # engine: CLI | inference backend | gateway name
  model: claude-sonnet-4-6               # model id for that engine
  role: custom                           # behavioral role tag
  mode: ADVISORY                         # GitHub tier: ADVISORY|ISSUES_ONLY|ISSUES_AND_PRS|ISSUES_PRS_MERGE
  sortOrder: 50                          # dashboard ordering (lower first)
  beadRole: worker                       # worker | supervisor
  staleTimeout: 28800                    # seconds of silence before "stale" (> longest cadence)
  restartStrategy: immediate             # reconnect a dead session immediately
  clearOnKick: true                      # fresh context on each kick
  includeRepos: true                     # append the project repo list to each kick
  laneKeywords:                          # route matching issues/PRs into this lane
    - custom
    - review
  detectKeywords:                        # attribute GitHub activity back to this agent
    - customized
  aliases:                               # short dispatch names
    - cu

  # Channels — how this agent gets triggered (supported v2 feature).
  # Omit to use governor timer kicks only.
  # channels:
  #   - type: kick
  #   - type: webhook
  #     events: ["issues.opened"]
  #   - type: schedule
  #     schedule: "0 */4 * * *"

  # Tools — declarative tool permissions (supported v2 feature).
  # Present = governs instead of `mode`.
  # tools:
  #   preset: advisory
  #   rules:
  #     - pattern: "mcp__github__create_issue"
  #       action: allow
  #       reason: "allow creating advisory issues"

  # Connections — external service integrations (supported v2 feature).
  # connections:
  #   - name: github-mcp
  #     type: mcp
  #     uri: "stdio:///usr/local/bin/mcp-github"

  cadences:                              # per-governor-mode kick intervals
    idle: 4h
    quiet: 4h
    busy: 2h
    surge: "off"                         # "off" (or pause) suspends kicks in this mode

  promptTemplate: |                      # inline periodic work prompt (${VAR} substituted per kick)
    # ${AGENT_DISPLAY_NAME} — Custom Agent Policy

    ${GH_AUTH}

    You are the **${AGENT_NAME}** agent for ${PROJECT_ORG}/${PROJECT_PRIMARY_REPO}.

    ## Your Role
    Analyze the codebase and provide recommendations based on your expertise.
    Focus on the repositories listed below and create advisory beads for your findings.

    ## Rules
    - Only work items from the kick message
    - Always sign commits with DCO: git commit -s
    - Respect hold labels
    - Write a bead for every finding

    ## Work List
    ISSUES: ${ISSUE_LIST}
    PRs: ${PR_LIST}

    ${KNOWLEDGE}
```

## Import defaults

When you import an AgentDefinition, a few fields get default values if you leave them out:

| Field | Default applied on import |
|---|---|
| `spec.backend` | `copilot` |
| `spec.restartStrategy` | `immediate` |
| `spec.beadRole` | `worker` |
| `enabled` (not a definition field) | `true` — the imported agent is enabled |

`enabled` and `paused` are **operator lifecycle state**, not definition fields: they are managed from the dashboard, not from the imported YAML, so an imported definition can never silently enable or un-pause an agent behind your back.

## How this maps to `hive.yaml`

An imported AgentDefinition becomes one entry under `agents:` in the running config. The portable format uses `apiVersion`/`kind`/`metadata`/`spec` with **camelCase** keys; the inline `hive.yaml` form uses **snake_case** keys directly under the agent name. The mapping is one-to-one:

| AgentDefinition (portable) | `hive.yaml` `agents:` (inline) |
|---|---|
| `metadata.name` | the agent's map key |
| `metadata.displayName` | `display_name` |
| `metadata.description` | `description` |
| `metadata.emoji` / `metadata.color` | `emoji` / `color` |
| `spec.backend` / `spec.model` | `backend` / `model` |
| `spec.role` / `spec.sortOrder` | `role` / `sort_order` |
| `spec.beadRole` | `bead_role` |
| `spec.mode` | `mode` |
| `spec.staleTimeout` | `stale_timeout` |
| `spec.restartStrategy` | `restart_strategy` |
| `spec.clearOnKick` | `clear_on_kick` |
| `spec.includeRepos` | `include_repos` |
| `spec.laneKeywords` / `spec.detectKeywords` | `lane_keywords` / `detect_keywords` |
| `spec.aliases` | `aliases` |
| `spec.cadences` | governor per-mode cadence entries |
| `spec.promptTemplate` | written to the policies dir; sets `kick_template` |
| `spec.channels` / `spec.tools` / `spec.connections` | `channels` / `tools` / `connections` |

For the inline `hive.yaml` form, the smallest-agent walkthrough, ACMM packs, and the governor, start at [Agent Configuration](agent-configuration.md).

## What to read next

- **[Agent Configuration](agent-configuration.md)** — the inline `hive.yaml` agent form, defaults, ACMM packs, and the full anatomy of an agent.
- **[Governor](governor.md)** — how cadences turn into kicks.
- **[Variable Substitution](variable-substitution.md)** — the `${VAR}` references used in `promptTemplate`.
