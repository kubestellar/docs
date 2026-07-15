# Variable Substitution

**Hive substitutes `${VAR}` references in two different places: in `hive.yaml` at load time, and in an agent's kick prompt every time it is kicked. This page covers both, and how to add your own variables via config.**

The two systems share the `${VAR}` syntax but are otherwise independent — people conflate them, so it helps to see them side by side first.

| System | Where | Syntax | Resolved when | Example |
|---|---|---|---|---|
| Config interpolation | `hive.yaml` | `${ENV}` | at config load | `token: ${HIVE_GITHUB_TOKEN}` |
| Kick-template variables | policy `.md` templates | `${VAR}` | on every kick | `${ISSUE_LIST}`, `${AGENT_NAME}` |

---

## Config `${VAR}` — environment interpolation

When hive loads `hive.yaml`, it replaces `${VAR}` references with environment variables before parsing. This is how secrets and per-deployment endpoints get into the config without being written into it:

```yaml
github:
  token: ${HIVE_GITHUB_TOKEN}
notifications:
  slack_webhook: ${SLACK_WEBHOOK_URL}
```

An **unset** variable is left as the literal text `${VAR}` — substitution never blanks a value it can't resolve. A variable that is set but empty resolves to the empty string.

### The env-name-not-value rule

This is the load-bearing security invariant of hive's config:

> **Note:** `hive.yaml` stores only environment-variable *names* (`api_key_env`) and key-file *paths* (`api_key_file`) — never secret values. Because `Config.Save()` rewrites the whole file to disk, a literal secret in YAML would be persisted in plaintext, so the code refuses the pattern.

Where the values actually live:

- `/data/secrets/` — secrets entered through the dashboard (writable PVC).
- `/secrets/` — secrets from Kubernetes Secret mounts (read-only).

Inference backends follow the same rule: you configure a key *reference* (env var name or file path), and hive resolves it at runtime. See the [Security Model](security-model.md) for the full treatment.

> **Note:** never inline a secret value in `hive.yaml`. Use `${ENV}` or a `*_env` / `*_file` reference.

---

## Kick-template variables

An agent's [kick template](agent-configuration.md#kick-templates-what-an-agent-is-told-to-do) is its periodic work prompt. Every time the governor kicks the agent, hive loads the template, substitutes its variables from live runtime state, and dispatches the result to the agent's session. These variables are computed fresh on each kick — they are not environment variables.

The most-used variables:

| Variable | Injected value | Availability |
|---|---|---|
| `${AGENT_NAME}` | the agent's name | always |
| `${AGENT_DISPLAY_NAME}` | the agent's dashboard label | always |
| `${ISSUE_LIST}` | the open issues in this agent's lane | always |
| `${PR_LIST}` | the open pull requests | always |
| `${QUEUE_ISSUES}` / `${QUEUE_PRS}` / `${QUEUE_HOLD}` | current queue counts | always |
| `${SLA_VIOLATIONS}` | count of aged issues | always |
| `${KNOWLEDGE}` | relevant facts primed from git sources and the wiki | all levels |
| `${GH_AUTH}` | GitHub auth instructions for the agent | measured, hold-gated, and full templates only |
| `${PROJECT_ORG}` / `${PROJECT_NAME}` / `${PROJECT_PRIMARY_REPO}` / `${PROJECT_REPOS_LIST}` | project identity | always |
| `${AUTHORIZED_REPOS}` | the repo list the agent may act on | always |
| `${MERGE_ELIGIBLE}` / `${CI_FAILING}` | PRs ready to merge / with red CI | always |
| `${TIMESTAMP}` | the current time | always |

Additional variables cover the agent roster (`${AGENT_LIST}`, `${AGENT_ROLES}`, `${ENABLED_AGENTS}`) and the inception workflow (`${INCEPTION_IDEA}`, `${INCEPTION_PHASE}`, and related). See the [ACMM Policy Matrix](acmm-policy-matrix.md) for how variable availability tracks an agent's level.

### Template resolution order

Which template file a kick uses is resolved in order: the agent's explicit `kick_template` wins; otherwise the ACMM pack's template for that agent at the current level; otherwise convention (`/data/agents/<name>/CLAUDE.md`, then `<name>.md` in the policies checkout); otherwise the embedded default. This is covered in full under [Kick templates](agent-configuration.md#kick-templates-what-an-agent-is-told-to-do).

---

## Adding your own variables

> **Note:** the `variables:` block is new. The `env` and `static` variable types described below are available now. The `script` and `http` types are being rolled out; treat their syntax here as the shape under implementation.

You can define your own `${VAR}`s in a top-level `variables:` block in `hive.yaml`, without editing hive's code. A defined variable can be used in kick templates and — with the right scope — in the config itself.

```yaml
variables:
  defs:
    DEPLOY_ENV:
      type: static
      value: production
      scope: both
    REGION:
      type: env
      env: HIVE_REGION
      default: us-east-1     # used only when HIVE_REGION is unset
```

Each definition has:

- **`type`** — the resolver: `env`, `static`, `script`, or `http`.
- **`scope`** — where the variable applies: `template` (default, per-kick prompts), `config` (`hive.yaml` load), or `both`.
- **`default`** — a fallback used when the resolver would otherwise leave the variable unresolved (for `env`, when the variable is unset).

Built-in kick-template variables (the table above) always take precedence over a custom variable of the same name, so you cannot accidentally shadow `${ISSUE_LIST}`.

### `static` — a fixed value

```yaml
variables:
  defs:
    DEPLOY_ENV: { type: static, value: production, scope: both }
```

### `env` — an environment variable, with an optional default

```yaml
variables:
  defs:
    REGION: { type: env, env: HIVE_REGION, default: us-east-1 }
```

This also gives config interpolation the default-value behavior plain `${VAR}` never had.

### `script` — the output of a command (preview)

```yaml
variables:
  security:
    allow_exec: true          # required; disabled by default
    exec_timeout_s: 3
  defs:
    BUILD_SHA:
      type: script
      command: [git, rev-parse, --short, HEAD]   # argv, not a shell string
      scope: template
```

### `http` — a value fetched from a web service (preview)

```yaml
variables:
  security:
    allow_http: true                          # required; disabled by default
    http_allowlist: [vault.internal.example.com]
  defs:
    DB_HOST:
      type: http
      url: "https://vault.internal.example.com/v1/config/db-host"
      headers: { Authorization: "Bearer ${HIVE_VAULT_TOKEN}" }
      scope: config
```

### Security model for `script` and `http`

Because a resolver can execute a command or reach the network, the `script` and `http` types are **disabled by default** and gated behind `variables.security.allow_exec` / `allow_http`.

> **Note:** the `variables.security` block is honored only from the trusted config seed, never from the dashboard overlay. Because the overlay is user-writable, letting it enable execution would be a code-execution path — so an overlay can add `static`/`env` variables but can never turn on `script`/`http`.

Additional guardrails: `script` runs an argv slice (never a shell string, so there is no shell injection) under a timeout, with a non-zero exit leaving the variable unresolved rather than failing the kick. `http` is GET-only, restricted to a host allowlist, blocks private/loopback addresses, caps the response size, and times out. An unresolvable custom variable, like any other, is left as its literal `${VAR}`.

---

## See also

- [Agent Configuration](agent-configuration.md) — kick templates and the agent config surface.
- [Governor](governor.md) — how kick prompts are built each cycle; budget-driven model selection is a related automatic substitution.
- [Security Model](security-model.md) — the secret-handling and trust model in full.
- [ACMM Policy Matrix](acmm-policy-matrix.md) — per-level template-variable availability.
