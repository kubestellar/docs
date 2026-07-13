# Security Model

This page is for the evaluator asking: *is it safe to run hive — to host a hive on the hub, point agents at my repositories, and hand the system my AI subscription or API keys?*

Hive's answer is architectural, not aspirational. The project's core design rule — *if a human would give the same answer every time, it belongs in infrastructure, not in a prompt* — applies doubly to security: the controls below are enforced by code (authentication middleware, a policy proxy, scoped tokens, file permissions), not by asking an LLM to behave. Every mechanism described here is verifiable in the [hive v2 source](https://github.com/kubestellar/hive/tree/v2).

## What hive touches

A running hive holds three things you care about:

| Asset | How hive uses it |
|-------|------------------|
| **Your GitHub repositories** | Agents read issues/PRs and open branches, issues, and pull requests using a token or GitHub App you provide |
| **Your AI subscriptions / API keys** | Agent CLIs (Claude, Copilot, Gemini, Goose) authenticate with your provider accounts; self-hosted inference backends (litellm / vllm / llm-d) use a gateway API key you enter |
| **Your cluster (or the hosted platform)** | The hive pod runs agents, the dashboard, and persistent state on a PVC |

The threats that matter: an unauthorized person reaching your dashboard, an agent (or a prompt-injected agent) exfiltrating credentials or touching repos it shouldn't, one agent reading another's credentials, and the hosted platform mixing tenants. Each layer below addresses one of these.

---

## Layer 1 — Dashboard access control (hub route)

Hives hosted on or registered with the [Hive Hub](https://hive.kubestellar.io) are reached through `*.hive.kubestellar.io`, and every request passes the hub's authentication check before it reaches a spoke dashboard:

- **GitHub OAuth.** Users sign in to the hub with GitHub (`read:user` scope). The session cookie is `HttpOnly`, `Secure`, `SameSite=Lax`.
- **Per-user, per-hive authorization on every request.** The hub's auth-check endpoint (wired as an nginx `auth_request`) resolves the requesting user, looks up whether that specific hive is in the user's access map, and returns **403 if it isn't**. Only then does the request proceed to the spoke.
- **Identity injection.** On success, the hub injects the verified identity into the proxied request as `X-Hive-User` and `X-Hive-Role` headers. The spoke's role-enforcement middleware then blocks all write operations for `read`-role users.
- **Roles.** The hive owner has full read-write control. Owners can grant other GitHub users access to their hive; grants default to **read-only**. A grant can never confer a role equal to or higher than the granter's own.

## Layer 2 — Direct-route spoke authentication

Some hives run on clusters the hub cannot proxy (for example, an OpenShift route reached directly). These spokes cannot rely on the hub's auth check, so the dashboard enforces its own per-user authentication (shipped in [hive#1839](https://github.com/kubestellar/hive/pull/1839)):

- **GitHub device-flow login with a per-hive allowlist.** At provisioning, the hub injects the authorized user list (owner plus any grants) into the spoke as `HIVE_AUTHORIZED_USERS`. When someone completes device-flow login, the spoke validates the GitHub identity and checks it against the allowlist — a non-allowlisted user receives **403 before any session or token is persisted**.
- **Per-user opaque sessions.** Each authorized visitor gets their own session: a 256-bit cryptographically random session ID in an `HttpOnly` cookie, mapped server-side to their username and role. Two people viewing the same dashboard each see their own identity. The session deliberately does not store the user's GitHub token.
- **Forged identity headers are stripped.** On direct routes there is no trusted hub in front, so incoming `X-Hive-User` / `X-Hive-Role` headers are deleted by the authentication middleware before any handler sees them. A client cannot claim an identity by setting headers.
- **The shared bearer token grants no identity.** On direct-route spokes, the legacy shared dashboard token is not accepted for user authentication, and the endpoint that exposes it returns 404. Possessing the token does not let you impersonate a user.
- **A viewer's login cannot clobber the owner's credentials.** The spoke only persists a GitHub token and updates its GitHub client when the *owner* logs in. A read-only viewer authenticating (or logging out) never touches the owner's stored write credentials.
- **Write grants are deferred — and fail safe.** On direct routes, every non-owner grant is provisioned as **read-only**, even if the owner stored a read-write grant on the hub. Until per-user write credentials are implemented for direct routes, the system downgrades rather than over-granting.

## Layer 3 — API keys and credential isolation

The strongest isolation story is around inference-backend API keys — agents literally never possess them:

- **Per-agent placeholder keys.** An agent using a self-hosted inference backend (litellm / vllm / llm-d) is launched with `ANTHROPIC_API_KEY=sk-hive-<agent-name>` — a placeholder that authenticates the agent only to a local translator proxy bound to `127.0.0.1` inside the pod. Nothing outside the pod accepts that string.
- **Server-side key swap.** The translator identifies the agent from its placeholder, converts the request from Anthropic to OpenAI format, and attaches the **real** gateway key server-side before forwarding upstream. The real key never appears in any agent's environment, filesystem view, or prompt.
- **Secret storage chain.** The real key is resolved from, in order: a configured key file → the Kubernetes Secret mount (`/secrets/litellm_api_key`) → an owner-only PVC file (`/data/secrets/litellm_api_key`, mode `0600` in a `0700` directory) → environment variable. When you enter a key in the dashboard it is written to the PVC file and patched into the hive's own Kubernetes Secret.
- **Never in config files.** `hive.yaml` only ever records a key file *path* or an environment variable *name* — never a key value. The dashboard's persisted config overlay (`/data/hive.yaml.dashboard`) is secret-free by design: env-derived secrets are collapsed back to `${VAR}` references and the dashboard auth token is blanked before writing.
- **Obfuscated in the UI.** Key entry uses a password field; after entry the API never returns the value — only whether a key exists, a masked tail hint, and which store it resolved from. A log-scrubbing handler additionally redacts GitHub-token and JWT patterns from all log output.

**Honest scope:** this placeholder mechanism applies to inference backends. Agents using cloud CLI backends (Claude, Copilot, Gemini, Goose) authenticate with the provider credential you connected for that purpose — that credential is available to the CLI process, as it must be for the CLI to work. Cross-agent exposure of those credentials is limited by the sandboxing layer below.

## Layer 4 — Agent sandboxing

Agents are unprivileged, separated, and policed at the network layer:

- **Per-agent Unix UIDs.** Each agent runs as its own user (UIDs allocated from base 2001) via `su-exec`, with its own tmux server on a per-agent socket. One agent cannot attach to another's session or signal its processes.
- **Per-agent GitHub tokens, owner-readable only.** When GitHub App auth is used, each agent's scoped token is written to a per-agent cache file with `0600` permissions and `chown`ed to that agent's UID — if the chown fails, the file is deleted rather than left shared. Agents cannot read each other's GitHub tokens.
- **Per-agent tool denylists.** Declarative per-agent tool rules in `hive.yaml` become hard CLI flags at launch (`--disallowed-tools` for Claude, `--deny-tool` for Copilot), and lower ACMM modes automatically add GitHub-write denials.
- **A default-on GitHub policy proxy.** Every agent's `HTTPS_PROXY` points at an in-pod proxy that intercepts **GitHub API traffic** and enforces, deterministically, what the agent's current ACMM mode allows: REST method/path rules, GraphQL query-vs-mutation gating, and a **repository allowlist** — writes to any repo outside the hive's configured list are blocked with 403 at the network layer, regardless of what the agent was prompted (or prompt-injected) to do. The proxy inspects only GitHub API traffic; other destinations are tunneled without inspection. The same proxy also attributes traffic to agents by UID for token accounting.

## Layer 5 — GitHub blast-radius controls

What can agents actually do to your repositories? As little as you've dialed in:

- **GitHub App scoping.** The recommended auth is a GitHub App — its reach is inherently limited to the repositories you installed it on. On top of that, hive mints **per-tier installation tokens** matched to each agent's autonomy mode: advisory agents get metadata/PR read-only tokens that *cannot* create issues; mid-tier agents get issues-only tokens with no code access; only trusted tiers get contents/PR write.
- **Repo allowlist, enforced twice.** The configured repo list is enforced in the policy proxy (hard, network-level) and also injected into every agent kick as an explicit `AUTHORIZED REPOS` constraint (a prompt-level reinforcement of the hard control).
- **ACMM maturity levels gate autonomy.** Six levels (L1–L6) map to per-agent policy modes enforced end-to-end by token tiers and proxy rules: advisory (observe only) → measured (file issues) → hold-gated PRs → full. At **L5**, agent policies label every PR `hold` so humans batch-review and approve; the underlying guarantee is that **merge permission simply is not granted below L6** — an L5 agent's token and proxy rules do not allow merging, whatever its prompt says. The system proposes; humans approve.
- **DCO sign-off.** Agent policies require DCO-signed commits (`git commit -s`); pair this with a DCO check on your repos to make it a hard gate.

## Layer 6 — Hub↔spoke channel

Registered hives send periodic heartbeats to the hub:

- Heartbeats are authenticated with a bearer secret (`HIVE_HUB_SECRET`, provisioned by the hub) and validated with a constant-time comparison.
- The outbound payload carries operational telemetry only: health and cluster metrics, version/git info, agent and governor summaries, and 24-hour **token counts**. No API keys, GitHub tokens, or other credentials leave the spoke in heartbeats.
- The response channel is how the hub delivers configuration to hives it manages (including GitHub App credentials for hub-provisioned hives) — hub-to-spoke, never spoke-to-hub.

## Layer 7 — Hosted-platform isolation

On the hosted platform, each hive is single-tenant by construction:

- **One namespace, one pod, one PVC per hive.** Provisioning creates a dedicated `hive-hosted-<id>` namespace with its own PVC and a single-replica Deployment. There is no shared runtime between customers' hives.
- **Least-privilege RBAC.** The per-hive Role is namespace-scoped and limited to the hive's own `hive-secrets` Secret by name — a hive pod cannot read other namespaces' secrets.
- **Authenticated internal API.** Server-to-server calls inside the pod (the dashboard proxy to the Go API) carry an internal auth token header validated with a constant-time comparison; security headers (CSP, X-Frame-Options, etc.) are always active on the dashboard, and an optional bearer `auth_token` can be required on all API endpoints.
- **Zero-downtime upgrades.** Hosted hives roll updates with `maxSurge=1` / `maxUnavailable=0` on ReadWriteMany PVCs, so upgrades don't create a window where a half-started replacement serves requests.

---

## Scope and limitations, stated plainly

Security documentation that only lists strengths is marketing. The current, deliberate scoping:

- **Direct-route write grants are deferred.** Non-owner grants on direct-route spokes are always provisioned read-only, even if granted read-write on the hub. This fails safe (under-granting, never over-granting) until per-user write credentials land.
- **The heartbeat secret is hub-wide.** `HIVE_HUB_SECRET` authenticates spokes to the hub as a class, not per-hive. Heartbeat data is operational telemetry, not secrets, which bounds the impact.
- **The policy proxy covers GitHub API traffic.** It is a GitHub-policy enforcement point, not a general egress firewall. If you need full egress control, apply Kubernetes NetworkPolicies around the hive pod.
- **The L5 `hold` label is applied by agent policy;** the hard guarantee at L5 is the withheld merge permission (token tier + proxy rules), not the label itself.
- **Cloud CLI credentials are shared with the CLI.** Claude/Copilot/Gemini/Goose agents necessarily run with the provider credential you connected. The placeholder-key isolation applies to inference-gateway keys.
- **DCO is policy-driven** inside hive; enforce it repo-side (DCO check) for a hard guarantee.

Found something? Security reports are welcome on the [hive repository](https://github.com/kubestellar/hive/issues) — or see the KubeStellar [security policy](../contributing/security.md) for private disclosure contacts.
