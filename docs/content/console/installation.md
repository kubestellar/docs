---
title: "Installation — Deploy KubeStellar Console for Multi-Cluster Kubernetes Management"
linkTitle: "Installation"
weight: 2
description: >
  Install KubeStellar Console locally, in Kubernetes, or via Helm. Deploy the multi-cluster Kubernetes dashboard with AI Missions, 120+ monitoring cards, and fleet-wide observability in minutes.
keywords:
  - install kubernetes dashboard
  - kubernetes console installation
  - multi-cluster dashboard setup
  - kubernetes helm install dashboard
  - deploy kubernetes management tool
  - kubernetes fleet management setup
---

# Installation — Deploy KubeStellar Console

This guide covers all deployment options for KubeStellar Console, the multi-cluster Kubernetes dashboard with AI-powered operations.

> **Try it first!** See a live preview at [console.kubestellar.io](https://console.kubestellar.io)

---

## Prerequisites and resource requirements

Before installing into a Kubernetes cluster, make sure your target meets
these requirements. For local-only evaluation (curl one-liner or run from
source) you only need the entries marked **Local**.

| Requirement | Minimum | Notes |
|---|---|---|
| Kubernetes version | **1.28+** | Matches the Pod Security `restricted` profile the chart targets. Tested on 1.28 – 1.31. |
| Default StorageClass | One must exist | Needed when `persistence.enabled=true` (the default). Disable persistence on clusters without one. See [Troubleshooting → PVC stuck Pending](troubleshooting.md#pod-stuck-pending-on-a-persistentvolumeclaim). |
| Node CPU (request) | 250 m | Burstable — no hard limit set by the chart. |
| Node memory (request) | 256 Mi | Startup probe takes ~30 s on cold start. |
| Node memory (recommended) | 512 Mi+ | Real clusters with many contexts. |
| Ephemeral / PVC storage | 1 Gi | SQLite database + backup snapshots. |
| Service port | **8080** | The service listens on 8080, not 80. Port-forward with `8080:8080`. |
| Namespace PodSecurity | `baseline` or `restricted` OK | The chart is compliant with `restricted` out of the box. |
| GitHub OAuth App | Optional | Only required for multi-user logins; omit for demo or single-user local. |
| **Local**: Go | 1.25+ | Only for "run from source". |
| **Local**: Node.js | 20+ | Only for "run from source". |
| **Local**: kubectl | latest | |
| **Local**: kubeconfig | ≥ 1 context | `kubectl config get-contexts` must list at least one context. |

---

## Fastest Path

> **Prerequisites**: You must install the kubestellar-mcp plugins **before** running this command if you want the MCP Bridge to query your clusters — they are not installed by `start.sh`. See [Step 1: Install Claude Code Plugins](#step-1-install-claude-code-plugins). Without them, the dashboard still works but displays demo data instead of live cluster data.

One command downloads pre-built binaries, starts the backend + agent, and opens your browser:

```bash
curl -H "Cache-Control: no-cache" -sSL https://raw.githubusercontent.com/kubestellar/console/main/start.sh | bash
```

This downloads and starts the console binary only. It does **not** install kubestellar-mcp plugins. Typically takes under 45 seconds. No OAuth or GitHub credentials required — you get a local `dev-user` session automatically.

---

## System Components

KubeStellar Console has **7 components** that work together. For the full architectural deep-dive, data flow diagrams, and component interactions, see the [Architecture](architecture.md) page.

{% include-markdown "_architecture-diagram.md" %}

### Component Summary

This is the authoritative component table — the [Architecture](architecture.md#the-7-components) page references this list.

| # | Component | What it does | Required? |
|---|-----------|--------------|-----------|
| 1 | **GitHub OAuth App** | Lets users sign in with GitHub | Optional — without it, a local `dev-user` session is created |
| 2 | **Frontend** | React web app you see in browser | Yes — included in the console executable |
| 3 | **Backend** | Go server that handles API calls | Yes — included in the console executable |
| 4 | **MCP Bridge** | Hosts kubestellar-ops and kubestellar-deploy MCP servers; Backend queries them for cluster data | Yes — spawned as a child process by the console executable |
| 5 | **AI Coding Agent + Plugins** | Any MCP-compatible AI coding agent (Claude Code, Copilot, Cursor, Gemini CLI) with kubestellar-ops/deploy plugins | **Optional** — only needed if you want AI Missions or AI-assisted operations. The core dashboard, monitoring cards, and cluster visibility work without any AI agent. Install via [Claude Marketplace](#step-1-install-claude-code-plugins) or Homebrew. |
| 6 | **kc-agent** | Local MCP+WebSocket server on port 8585 that bridges the browser to your kubeconfig for kubectl execution, and serves as an MCP server for AI coding agents | **Optional** — only needed if you want to execute kubectl commands from the browser or use AI-assisted cluster operations. The read-only dashboard (cluster inventory, pod listings, metrics cards) works without kc-agent. Auto-spawned in local dev mode (`startup-oauth.sh` / `start-dev.sh`); requires [manual setup](#4-run-kc-agent-locally) for Helm deployments. |
| 7 | **Kubeconfig** | Your cluster credentials | Yes — your existing `~/.kube/config` |

---

## Installation Steps

### Step 1: Install Claude Code Plugins

The console uses kubestellar-mcp plugins to talk to your clusters. See the full [kubestellar-mcp documentation](/docs/kubestellar-mcp/overview/introduction) for details.

**Install the binaries (required):**

```bash
brew tap kubestellar/tap
brew install kubestellar-ops kubestellar-deploy
```

This puts the tools on your PATH so the console's MCP bridge can find them.

**Additionally, register with Claude Code (needed for AI Missions):**

If you use [Claude Code](https://docs.anthropic.com/en/docs/claude-code/overview) and want AI Missions, also register the plugins:

```bash
# In Claude Code, run:
/plugin marketplace add kubestellar/claude-plugins
```

Then:
1. Go to `/plugin` → **Marketplaces** tab → click **Update**
2. Go to `/plugin` → **Discover** tab
3. Install **kubestellar-ops** and **kubestellar-deploy**

Verify with `/mcp` - you should see:
```
plugin:kubestellar-ops:kubestellar-ops · ✓ connected
plugin:kubestellar-deploy:kubestellar-deploy · ✓ connected
```

### Step 2: Set Up Kubeconfig

The console reads clusters from your kubeconfig. Make sure you have access:

```bash
# List your clusters
kubectl config get-contexts

# Test access to a cluster
kubectl --context=your-cluster get nodes
```

To add more clusters, merge kubeconfigs:
```bash
KUBECONFIG=~/.kube/config:~/.kube/cluster2.yaml kubectl config view --flatten > ~/.kube/merged
mv ~/.kube/merged ~/.kube/config
```

For the complete kubeconfig-driven registration flow, including required format, single vs. multiple context behavior, and authentication expectations, see [Cluster Registration](cluster-registration.md).

### Step 3: Deploy the Console

Choose your deployment method:

- [Curl one-liner](#curl-quickstart) - Fastest, downloads pre-built binaries
- [Run from source (no OAuth)](#run-from-source) - For development, no GitHub credentials needed
- [Run from source (with OAuth)](#run-from-source-with-oauth) - Full GitHub login experience
- [Helm (Kubernetes)](#helm-installation) - Production deployment
- [OpenShift](#openshift-installation) - OpenShift with Routes
- [Docker](#docker-installation) - Single-node or development

---

## Curl Quickstart

Downloads pre-built binaries and starts the console:

```bash
curl -H "Cache-Control: no-cache" -sSL https://raw.githubusercontent.com/kubestellar/console/main/start.sh | bash
```

This starts the backend (port 8080) and opens the frontend in your browser. No OAuth credentials needed — a local `dev-user` session is created automatically.

---

## Run from Source

For contributors or if you want to build from source. No GitHub OAuth required.

### Prerequisites

- Go 1.25+
- Node.js 20+
- kubestellar-ops and kubestellar-deploy installed (see [Step 1](#step-1-install-claude-code-plugins))

### Setup

```bash
git clone https://github.com/kubestellar/console.git
cd console
./start-dev.sh
```

This compiles the Go backend, installs npm dependencies, starts a Vite dev server on port 5174, and creates a local `dev-user` session (no GitHub login needed).

Open http://localhost:5174

---

## Run from Source with OAuth

To enable GitHub login (for multi-user deployments or to test the full auth flow):

### 1. Create a GitHub OAuth App

1. Go to **[GitHub Developer Settings](https://github.com/settings/developers)** → **OAuth Apps** → **New OAuth App**

2. Fill in:
   - **Application name**: `KubeStellar Console`
   - **Homepage URL**: `http://localhost:8080`
   - **Authorization callback URL**: `http://localhost:8080/auth/github/callback`

3. Click **Register application**

4. Copy the **Client ID** and generate a **Client Secret**

### 2. Clone the Repository

```bash
git clone https://github.com/kubestellar/console.git
cd console
```

### 3. Configure Environment

Create a `.env` file **inside the cloned `console/` directory** (the repo root) with your OAuth credentials:

```bash
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
FEEDBACK_GITHUB_TOKEN=ghp_your_personal_access_token
```

> **Recommended**: `FEEDBACK_GITHUB_TOKEN` is a GitHub Personal Access Token (PAT) with `public_repo` scope that enables users to submit bug reports, feature requests, and feedback directly from the console. Without it, the in-app feedback and issue submission features are disabled. We strongly encourage setting this token so your users can contribute feedback seamlessly. You can create one at [GitHub Settings → Tokens](https://github.com/settings/tokens).

> **Important**: The `.env` file must be in the same directory as `startup-oauth.sh`. The script loads it from its own directory, so creating it elsewhere will not work.

### 4. Start the Console

```bash
./startup-oauth.sh
```

Open http://localhost:8080 and sign in with GitHub.

> **Tip**: Once running, click your profile avatar → the **Developer** panel shows your OAuth status, console version, and quick links.

| Environment | Callback URL |
|-------------|--------------|
| Local dev | `http://localhost:8080/auth/github/callback` |
| Kubernetes | `https://console.your-domain.com/auth/github/callback` |
| OpenShift | `https://ksc.apps.your-cluster.com/auth/github/callback` |

---

## Helm Installation

### 1. Add Secrets

Create a secret with your OAuth credentials:

```bash
kubectl create namespace ksc

kubectl create secret generic ksc-secrets \
  --namespace ksc \
  --from-literal=github-client-id=YOUR_CLIENT_ID \
  --from-literal=github-client-secret=YOUR_CLIENT_SECRET
```

**Recommended**: Add a `FEEDBACK_GITHUB_TOKEN` to enable in-app feedback and issue submission. This is a GitHub Personal Access Token (PAT) with `public_repo` scope that allows users to submit bug reports, feature requests, and feedback directly from the console UI. Without it, these features are disabled. We strongly encourage including this token. You can create one at [GitHub Settings → Tokens](https://github.com/settings/tokens).

Optionally add Claude API key for AI features and the feedback token:

```bash
kubectl create secret generic ksc-secrets \
  --namespace ksc \
  --from-literal=github-client-id=YOUR_CLIENT_ID \
  --from-literal=github-client-secret=YOUR_CLIENT_SECRET \
  --from-literal=claude-api-key=YOUR_CLAUDE_API_KEY \
  --from-literal=feedback-github-token=YOUR_FEEDBACK_GITHUB_TOKEN
```

### 2. Install Chart

**From GitHub Container Registry:**

```bash
helm install ksc oci://ghcr.io/kubestellar/charts/kubestellar-console \
  --namespace ksc \
  --set github.existingSecret=ksc-secrets
```

**From source:**

```bash
git clone https://github.com/kubestellar/console.git
cd console

helm install ksc ./deploy/helm/kubestellar-console \
  --namespace ksc \
  --set github.existingSecret=ksc-secrets
```

### 3. Access the Console

**Port forward (development):**

Run the port-forward in the **foreground** in a dedicated terminal. This is the
simplest pattern — press `Ctrl+C` to stop it, and there is no orphaned
background process holding port `8080`.

```bash
kubectl port-forward -n ksc svc/ksc-kubestellar-console 8080:8080
```

Open <http://localhost:8080> in another terminal or your browser.

> **Do not** background the port-forward with a trailing `&` in copy-paste
> instructions (e.g. `kubectl port-forward ... 8080:8080 &`). It leaks the
> process, leaves port `8080` held after the shell exits, and causes
> "port already in use" errors on re-runs. If you genuinely need to run it
> in the background from a script, capture the PID and clean it up on exit:
>
> ```bash
> kubectl port-forward -n ksc svc/ksc-kubestellar-console 8080:8080 &
> PF_PID=$!
> trap 'kill "$PF_PID" 2>/dev/null || true' EXIT INT TERM
> # ... do work that needs the port-forward ...
> ```

**Ingress (production):**

```bash
helm upgrade ksc ./deploy/helm/kubestellar-console \
  --namespace ksc \
  --set github.existingSecret=ksc-secrets \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=ksc.your-domain.com
```

### 4. Run kc-agent Locally

The Helm chart deploys the console backend inside your cluster, but **kc-agent is not included in the Helm deployment**. kc-agent is a lightweight local process that bridges your browser to your local kubeconfig via WebSocket and MCP. You must run it separately on your workstation.

**Install kc-agent:**

```bash
# Via Homebrew
brew tap kubestellar/tap
brew install kc-agent
```

**Start kc-agent:**

```bash
kc-agent
```

This starts the agent on port 8585. It reads your local `~/.kube/config` and exposes kubectl execution over WebSocket (for the browser console) and MCP (for AI coding agents).

> **Why local?** kc-agent runs on your machine because it needs direct access to your kubeconfig and kubectl. The in-cluster console connects to kc-agent over WebSocket to execute commands against clusters that are only reachable from your workstation.

> **Without kc-agent:** The console will still load, but cluster interactions that require kubectl (terminal commands, AI missions that modify resources) will not work. If the console was deployed without OAuth, it will fall back to demo mode. See [Architecture](architecture.md#kc-agent-local-agent) for details.

## OpenShift Installation

OpenShift uses Routes instead of Ingress:

```bash
helm install ksc ./deploy/helm/kubestellar-console \
  --namespace ksc \
  --set github.existingSecret=ksc-secrets \
  --set route.enabled=true \
  --set route.host=ksc.apps.your-cluster.com
```

The console will be available at `https://ksc.apps.your-cluster.com`

## Docker Installation

For single-node or development deployments:

```bash
docker run -d \
  --name ksc \
  -p 8080:8080 \
  -e GITHUB_CLIENT_ID=your_client_id \
  -e GITHUB_CLIENT_SECRET=your_client_secret \
  -e FEEDBACK_GITHUB_TOKEN=ghp_your_personal_access_token \
  -v ~/.kube:/root/.kube:ro \
  -v ksc-data:/app/data \
  ghcr.io/kubestellar/console:latest
```

## Kubernetes Deployment via Script

One command that handles helm, secrets, and ingress:

```bash
curl -H "Cache-Control: no-cache" -sSL https://raw.githubusercontent.com/kubestellar/console/main/deploy.sh | bash
```

Supports `--context`, `--openshift`, `--ingress <host>`, and `--github-oauth` flags.

## Multi-Cluster Access

The console reads clusters from your kubeconfig. To access multiple clusters:

1. **Merge kubeconfigs:**
   ```bash
   KUBECONFIG=~/.kube/config:~/.kube/cluster2.yaml kubectl config view --flatten > ~/.kube/merged
   mv ~/.kube/merged ~/.kube/config
   ```

2. **Mount merged config in container/pod**

3. **Verify access:**
   ```bash
   kubectl config get-contexts
   ```

## Kind quickstart (zero to browser)

A full local path from nothing to a running console in a Kind cluster.
Tested on Kind v0.27 and Kubernetes 1.31.

```bash
# 1. Create a Kind cluster
kind create cluster --name kc-demo

# 2. Pre-pull the console image into Kind to avoid deploy.sh timeouts
docker pull ghcr.io/kubestellar/console:latest
kind load docker-image ghcr.io/kubestellar/console:latest --name kc-demo

# 3. Install the chart with no overrides — JWT secret auto-generates,
#    everything else falls back to demo mode.
kubectl create namespace kubestellar-console

helm install kc oci://ghcr.io/kubestellar/charts/kubestellar-console \
  -n kubestellar-console \
  --wait --timeout 10m

# 4. Verify (see "Verification commands" below for full checks)
kubectl -n kubestellar-console rollout status deploy \
  -l app.kubernetes.io/name=kubestellar-console --timeout=300s

# 5. Port-forward — service port is 8080, NOT 80
kubectl -n kubestellar-console port-forward svc/kc-kubestellar-console 8080:8080
```

Open [http://localhost:8080](http://localhost:8080). Because no GitHub OAuth
was configured, you'll land directly in demo mode.

**Tear down:**

```bash
helm uninstall kc -n kubestellar-console
kind delete cluster --name kc-demo
```

If `helm install` fails with `context deadline exceeded`, see
[Troubleshooting → deploy.sh timeouts](troubleshooting.md#deploysh-fails-with-context-deadline-exceeded)
— pre-pulling and loading the image (step 2 above) is the standard workaround.

## Minikube quickstart (zero to browser)

Same idea as Kind, on Minikube. Tested on Minikube v1.35 with the default
`docker` driver.

```bash
# 1. Create a Minikube profile
minikube start -p kc-demo --memory=4096 --cpus=2

# 2. Load the image into Minikube's Docker
minikube -p kc-demo image load ghcr.io/kubestellar/console:latest

# 3. Install the chart
kubectl create namespace kubestellar-console

helm install kc oci://ghcr.io/kubestellar/charts/kubestellar-console \
  -n kubestellar-console \
  --wait --timeout 10m

# 4. Verify
kubectl -n kubestellar-console rollout status deploy \
  -l app.kubernetes.io/name=kubestellar-console --timeout=300s

# 5. Port-forward
kubectl -n kubestellar-console port-forward svc/kc-kubestellar-console 8080:8080
```

Open [http://localhost:8080](http://localhost:8080).

Minikube ships with a default `standard` StorageClass, so the default
`persistence.enabled=true` works without any extra setup. If you're on a
stripped-down profile without storage, add `--set persistence.enabled=false`
and `--set backup.enabled=false`.

**Tear down:**

```bash
helm uninstall kc -n kubestellar-console
minikube delete -p kc-demo
```

## Verification commands

After any install, run these to confirm everything is healthy. These are
the same commands [Troubleshooting](troubleshooting.md#pre-port-forward-diagnostics)
tells you to run **before** opening a support issue.

```bash
NS=kubestellar-console

# 1. Deployment rolled out
kubectl -n "$NS" rollout status deploy \
  -l app.kubernetes.io/name=kubestellar-console --timeout=180s

# 2. Pods Ready 1/1
kubectl -n "$NS" get pods -l app.kubernetes.io/name=kubestellar-console

# 3. PVC bound (if persistence.enabled=true — the default)
kubectl -n "$NS" get pvc

# 4. Service exists on port 8080 and has at least one endpoint
kubectl -n "$NS" get svc,endpoints

# 5. No errors in the last 200 log lines
kubectl -n "$NS" logs -l app.kubernetes.io/name=kubestellar-console \
  --tail=200 --all-containers

# 6. HTTP health check through the port-forward
kubectl -n "$NS" port-forward svc/kc-kubestellar-console 8080:8080 &
sleep 2
curl -sSf http://localhost:8080/api/health && echo OK
```

### kc-agent health (Helm / in-cluster mode only)

kc-agent runs **on your workstation**, not in the cluster. After starting
`kc-agent`, verify it:

```bash
# Process is running and listening on 8585
lsof -nP -iTCP:8585 -sTCP:LISTEN

# Agent responds to a health probe
curl -sSf http://127.0.0.1:8585/health && echo OK
```

If kc-agent is not running, the console will show an "Agent Not Connected"
banner. See [Troubleshooting → Agent Not Connected](troubleshooting.md#agent-not-connected--cluster-actions-fail).

## Values and secrets reference

The chart accepts secret material in one of two modes. The full list lives
in the
[chart README](https://github.com/kubestellar/console/tree/main/deploy/helm/kubestellar-console#secrets-and-configuration);
the common keys are:

| Value | Default | `existingSecret` alternative | Auto-generated? |
|---|---|---|---|
| `github.clientId` / `github.clientSecret` | *(empty)* | `github.existingSecret` + `github.existingSecretKeys.clientId` / `.clientSecret` | No — OAuth disabled if unset |
| `jwt.secret` | *(empty)* | `jwt.existingSecret` + `jwt.existingSecretKey` (default `jwt-secret`) | **Yes** — chart generates a 64-char random value on first install |
| `googleDrive.apiKey` | *(empty)* | `googleDrive.existingSecret` + `googleDrive.existingSecretKey` | No — benchmark cards fall back to demo data |
| `claude.apiKey` | *(empty)* | `claude.existingSecret` + `claude.existingSecretKey` | No — AI features disabled |
| `feedbackGithubToken.token` | *(empty)* | `feedbackGithubToken.existingSecret` + `feedbackGithubToken.existingSecretKey` | No — in-app feedback disabled |

### Secret creation — mode 1: chart-managed

The chart renders a Secret named `{release-name}-kubestellar-console` for
you. Pass values inline:

```bash
helm install kc oci://ghcr.io/kubestellar/charts/kubestellar-console \
  -n kubestellar-console --create-namespace \
  --set github.clientId=YOUR_CLIENT_ID \
  --set github.clientSecret=YOUR_CLIENT_SECRET
```

The JWT secret is auto-generated; you don't need to set anything.

### Secret creation — mode 2: bring-your-own

Create the Secret **before** `helm install` — if you pass
`*.existingSecret` for a Secret that doesn't exist, the pod fails with
`CreateContainerConfigError`. The chart does **not** create it for you.

```bash
kubectl create namespace kubestellar-console

kubectl -n kubestellar-console create secret generic kc-oauth-secret \
  --from-literal=github-client-id="YOUR_CLIENT_ID" \
  --from-literal=github-client-secret="YOUR_CLIENT_SECRET" \
  --from-literal=jwt-secret="$(openssl rand -hex 32)"

helm install kc oci://ghcr.io/kubestellar/charts/kubestellar-console \
  -n kubestellar-console \
  --set github.existingSecret=kc-oauth-secret \
  --set jwt.existingSecret=kc-oauth-secret
```

The default key names the chart expects are `github-client-id`,
`github-client-secret`, and `jwt-secret`. If your Secret uses different
keys, override `github.existingSecretKeys.clientId`,
`github.existingSecretKeys.clientSecret`, and `jwt.existingSecretKey`
accordingly.

### JWT secret behavior (by mode)

| Scenario | What happens |
|---|---|
| Neither `jwt.secret` nor `jwt.existingSecret` set (default) | Chart generates a 64-char random JWT secret on first install and reuses it on upgrades. |
| `jwt.secret` set inline | Chart uses that value. Changing it rotates the key and invalidates active sessions. |
| `jwt.existingSecret` set | Chart reads key `jwt-secret` (or `jwt.existingSecretKey`) from the named Secret. The Secret must exist first. |

### `FEEDBACK_GITHUB_TOKEN` — enables in-app feedback

The in-app feedback / `/issue` flow posts to GitHub on the user's behalf.
It requires a GitHub Personal Access Token with `public_repo` scope. In
the Helm chart it's `feedbackGithubToken.token` (or
`feedbackGithubToken.existingSecret`). In local dev it's the
`FEEDBACK_GITHUB_TOKEN` environment variable or `.env` entry. Without it,
the feedback buttons in the UI are disabled.

## Data persistence and storage behavior

By default the chart sets:

- `persistence.enabled: true` — a PVC is created for the SQLite database
  that holds sessions, user preferences, and the feedback queue.
- `backup.enabled: true` — a CronJob periodically snapshots the SQLite
  database into a `backup` volume, and an init container restores the
  latest snapshot on pod startup.

**This means:**

- On clusters **without** a default StorageClass, the pod will stay `Pending`
  until the PVC is bound. Set `persistence.enabled=false` and
  `backup.enabled=false` for a stateless evaluation install.
- `helm uninstall` **does not** delete PVCs by default. Run
  `kubectl -n kubestellar-console delete pvc -l app.kubernetes.io/instance=kc`
  if you want a fresh install.
- On local clusters (Kind, Minikube) the default StorageClass uses
  `volumeBindingMode: WaitForFirstConsumer`, which means the PV is not
  provisioned until a pod requests it. This is **expected** and not a
  failure — only act if the PVC is still `Pending` after the pod exists.

See [Persistence](persistence.md) for the data model and backup CronJob
details.

## `deploy.sh` vs direct Helm

The `deploy.sh` convenience script wraps Helm plus a few extras. It is **not
a superset of Helm** — behavior differs in ways users have hit:

| Behavior | `deploy.sh` | Direct `helm install` |
|---|---|---|
| Installs the chart | Yes — wraps `helm install`/`upgrade` | Yes |
| Helm `--wait` | **Hardcoded `--timeout 120s`** | You control it |
| Creates namespace | Yes | Only with `--create-namespace` |
| Creates GitHub OAuth Secret | With `--github-oauth` | You create it yourself |
| Configures Ingress | With `--ingress <host>` | Via `--set ingress.*` |
| Configures OpenShift Route | With `--openshift` | Via `--set route.*` |
| Uses `--context` | Yes, respects it | Respects current kube context |
| Loads image into Kind | **No** | No |

**Practical rule of thumb:**

- On Kind / Minikube / anywhere image pull might exceed 120 s, **skip
  `deploy.sh`** and use direct Helm with `--wait --timeout 10m` (see the
  [Kind quickstart](#kind-quickstart-zero-to-browser)).
- On real clusters where the image is already cached on the node, the
  `deploy.sh --github-oauth --ingress` one-liner is genuinely the fastest
  path.
- In either case, `deploy.sh` abstracts **which** values it sets; read the
  script or pass the equivalent `--set` flags directly if you want the
  change visible in your shell history or GitOps diff.

## Upgrading

```bash
helm upgrade ksc oci://ghcr.io/kubestellar/charts/kubestellar-console \
  --namespace ksc \
  --reuse-values
```

## Uninstalling

```bash
helm uninstall ksc --namespace ksc
kubectl delete namespace ksc
```

---

## Troubleshooting

### "MCP bridge failed to start"

**Cause**: `kubestellar-ops` or `kubestellar-deploy` plugins are not installed.

**Solution**: Follow [Step 1: Install Claude Code Plugins](#step-1-install-claude-code-plugins) or see the full [kubestellar-mcp documentation](/docs/kubestellar-mcp/overview/introduction).

```bash
# Via Homebrew
brew tap kubestellar/tap
brew install kubestellar-ops kubestellar-deploy
```

### GitHub OAuth 404 or Blank Page

**Cause**: OAuth credentials not configured correctly.

**Solutions**:
1. Verify the secret contains correct credentials
2. Check callback URL matches exactly (see [Run from Source with OAuth](#run-from-source-with-oauth))
3. View pod logs: `kubectl logs -n ksc deployment/ksc-kubestellar-console`

### "GITHUB_CLIENT_SECRET is not set"

**Cause**: You're running `startup-oauth.sh` without a `.env` file.

**Solutions**:
1. Create a `.env` file with `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` (see [Run from Source with OAuth](#run-from-source-with-oauth))
2. Or use `./start-dev.sh` instead — it doesn't require OAuth credentials

### "exchange_failed" After GitHub Login

**Cause**: The Client Secret is wrong or has been regenerated.

**Solutions**:
1. Go to [GitHub Developer Settings](https://github.com/settings/developers) → your OAuth App
2. Generate a new Client Secret
3. Update `GITHUB_CLIENT_SECRET` in your `.env` file
4. Restart the console

### "csrf_validation_failed"

**Cause**: The callback URL in GitHub doesn't match the console's URL.

**Solutions**:
1. Verify the **Authorization callback URL** in your GitHub OAuth App settings matches exactly: `http://localhost:8080/auth/github/callback`
2. Clear your browser cookies for `localhost`
3. Restart the console

### Clusters Not Showing

**Cause**: kubeconfig not mounted or MCP bridge not running.

**Solutions**:
1. Verify kubeconfig is mounted in the pod
2. Check MCP bridge status in logs
3. Verify kubestellar-mcp tools are installed: `which kubestellar-ops kubestellar-deploy`

### Plugin Shows Disconnected

**Cause**: Binary not in PATH or not working.

**Solutions**:
1. Verify binary is installed: `which kubestellar-ops`
2. Verify binary works: `kubestellar-ops version`
3. Restart Claude Code

See [kubestellar-mcp troubleshooting](/docs/kubestellar-mcp/overview/introduction#troubleshooting) for more details.

---

## Related Documentation

- **[kubestellar-mcp Documentation](/docs/kubestellar-mcp/overview/introduction)** - Full guide to kubestellar-ops and kubestellar-deploy plugins
- **[AI Missions Setup](ai-missions-setup.md)** - Configure AI providers, select a model, and run your first mission
- **[Architecture](architecture.md)** - How the console components work together
- **[Configuration](configuration.md)** - AI mode, token limits, and customization
- **[Quick Start](quickstart.md)** - Get running in 5 minutes
