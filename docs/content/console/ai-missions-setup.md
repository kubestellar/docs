---
title: "AI Missions Setup & Getting Started — Configure AI Providers and Run Your First Mission"
linkTitle: "AI Missions Setup"
weight: 10
description: >
  Set up AI Missions in KubeStellar Console: configure API keys for Claude, OpenAI, or Gemini, choose a model, understand demo mode, and run your first multi-cluster Kubernetes AI mission with step-by-step instructions.
keywords:
  - AI missions setup
  - kubernetes AI configuration
  - Claude API key kubernetes
  - OpenAI API key kubernetes
  - Gemini API key kubernetes
  - AI missions getting started
  - kubernetes AI troubleshooting
  - multi-cluster AI setup
  - AI provider configuration
  - kubernetes AI demo mode
---

# AI Missions Setup & Getting Started

This guide walks you through configuring AI providers, selecting a model, and running your first AI Mission in KubeStellar Console. For an overview of what AI Missions can do, see [AI Features](ai-features.md).

---

## Prerequisites

Before setting up AI Missions, ensure you have:

1. **KubeStellar Console running** -- Follow the [Installation](installation.md) guide to deploy the console locally, in Kubernetes, or via Helm.

2. **Kubernetes cluster access** -- At least one cluster configured in your kubeconfig. Verify with:
   ```bash
   kubectl config get-contexts
   kubectl --context=your-cluster get nodes
   ```

3. **An AI provider API key** -- Obtain a key from one or more of these providers:

   | Provider | Where to get a key | Documentation |
   |----------|--------------------|---------------|
   | **Anthropic (Claude)** | [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) | [Anthropic API docs](https://docs.anthropic.com/) |
   | **OpenAI** | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | [OpenAI API docs](https://platform.openai.com/docs) |
   | **Google (Gemini)** | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | [Gemini API docs](https://ai.google.dev/docs) |

   You only need one provider to get started. You can add additional providers later.

4. **kubestellar-mcp plugins installed** -- The `kubestellar-ops` and `kubestellar-deploy` plugins enable the AI agent to interact with your clusters. See [Installation - Step 1](installation.md#step-1-install-claude-code-plugins) for setup instructions.

---

## API Key Setup via .env

The recommended approach for local deployments is to set API keys as environment variables in a `.env` file.

### 1. Create or Edit the .env File

In the root of your console directory (the same directory as `startup-oauth.sh`), add one or more API keys:

```bash
# AI provider keys (at least one required for AI features)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Alternatively, CLAUDE_API_KEY is also accepted for Anthropic
CLAUDE_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxx
```

You do not need all three providers. Set only the keys for the providers you intend to use.

> **Important**: The `.env` file must be in the same directory as `startup-oauth.sh`. The startup script loads it from its own directory. Never commit this file to version control -- it is already listed in `.gitignore`.

### 2. Start or Restart the Console

```bash
./startup-oauth.sh
```

The startup script reads the `.env` file and passes the keys to the backend. If the console is already running, restart it to pick up the new keys.

### 3. Verify

After the console loads, navigate to **Settings** (gear icon in the sidebar or `/settings`). Under the **AI & Intelligence** section, each configured provider should show a green checkmark indicating a valid key.

---

## API Key Setup via Settings UI

You can also add or update API keys directly in the browser without editing files.

### Steps

1. Open the console and navigate to **Settings** (gear icon in the sidebar or go to `/settings`).
2. Scroll to the **AI & Intelligence** section.
3. Click **API Keys**.
4. For each provider you want to configure:
   - Click the input field for that provider (Anthropic, OpenAI, or Gemini).
   - Paste your API key.
   - Click **Save** or press **Enter**.
5. The console validates the key immediately. You will see:
   - **Green checkmark** -- Key is valid and the provider is reachable.
   - **Red X with error message** -- Key is invalid, expired, or the provider returned an error. Double-check the key and try again.
   - **Yellow warning** -- Key is valid but the provider is experiencing degraded service.

Keys set via the Settings UI are stored locally and persist across browser sessions. They take effect immediately without restarting the console.

> **Note**: For Helm or Kubernetes deployments, configure API keys via Kubernetes secrets instead. See [Configuration - AI Configuration](configuration.md#ai-configuration) for Helm values.

---

## Demo Mode

Demo mode lets you explore AI Missions without an API key or live cluster connection. It uses pre-recorded responses and synthetic data.

### When to Use Demo Mode

- **Evaluating the console** before committing to an AI provider.
- **Training new team members** on how missions work.
- **Demos and presentations** where live cluster access is unavailable.
- **Offline environments** with no internet access.

### How to Toggle Demo Mode

1. Navigate to **Settings** > **AI & Intelligence**.
2. Toggle **Demo Mode** on or off.
3. When enabled, a **Demo** badge appears on AI-related cards and the missions panel to indicate you are seeing synthetic data.

You can also enable demo mode by setting the environment variable:

```bash
DEMO_MODE=true
```

### Differences from Live Mode

| Aspect | Demo Mode | Live Mode |
|--------|-----------|-----------|
| **Data source** | Pre-recorded responses | Real AI provider API calls |
| **Cluster interaction** | Simulated | Live kubectl commands |
| **API key required** | No | Yes (at least one provider) |
| **Token usage** | None | Counted against your provider quota |
| **Visual indicator** | Yellow outline + "Demo" badge on cards | No badge |
| **Response variability** | Fixed, repeatable | Dynamic, context-aware |
| **Repair/Apply actions** | Simulated (no real changes) | Real changes to clusters (with approval) |

---

## Model Selection

KubeStellar Console supports multiple AI models across providers. You can switch models at any time.

### Supported Providers and Models

| Provider | Models | Notes |
|----------|--------|-------|
| **Anthropic** | Claude Sonnet 4, Claude Opus 4, Claude Haiku 3.5 | Claude Sonnet 4 is the default. Opus 4 provides the highest quality for complex multi-step missions. Haiku 3.5 is faster and cheaper for simple queries. |
| **OpenAI** | GPT-4o, GPT-4o mini, o3 | GPT-4o is recommended. o3 is best for reasoning-heavy tasks. GPT-4o mini is the most cost-effective. |
| **Google** | Gemini 2.5 Pro, Gemini 2.5 Flash | Gemini 2.5 Pro handles long context well. Flash is faster and cheaper. |

### Changing the Model

1. Navigate to **Settings** > **AI & Intelligence** > **Model**.
2. Select your preferred provider from the dropdown.
3. Select the specific model.
4. Click **Save**. The change applies to all new missions immediately.

You can also set the default model via environment variable or Helm values:

```bash
# Environment variable
AI_MODEL=claude-sonnet-4-20250514
```

```yaml
# Helm values
ai:
  defaultModel: "claude-sonnet-4-20250514"
```

### Cost vs. Quality Considerations

- **Complex multi-cluster troubleshooting**: Use Claude Opus 4, GPT-4o, or Gemini 2.5 Pro. These models handle multi-step reasoning and large context windows effectively.
- **Routine queries and simple deployments**: Use Claude Haiku 3.5, GPT-4o mini, or Gemini 2.5 Flash. These are significantly cheaper per token while still capable for straightforward tasks.
- **Token-sensitive environments**: Set the AI mode to Low (see [AI Mode Configuration](configuration.md#ai-mode-configuration)) and use a cost-effective model. Monitor usage in **Settings** > **Token Usage**.

---

## Running Your First Mission

Once you have at least one API key configured and a cluster connected, you are ready to run a mission.

### Step 1: Open the Missions Panel

Click the **AI Missions** button in the bottom-right corner of the console. The missions panel slides open.

### Step 2: Create a New Mission

Click **Start Custom Mission** or select a mission type from the panel:

| Mission Type | Use for |
|--------------|---------|
| **Troubleshoot** | Diagnosing pod crashes, failed deployments, network issues |
| **Analyze** | Understanding resource usage patterns, security posture, cluster drift |
| **Repair** | Fixing identified problems with AI-generated patches |
| **Upgrade** | Planning and executing Kubernetes or application upgrades |
| **Deploy** | Deploying applications across one or more clusters |

### Step 3: Describe Your Task

Type your question or task in the input field. Be specific about the cluster, namespace, or resource if relevant. Press **Cmd+Enter** (macOS) or **Ctrl+Enter** (Linux/Windows) to submit.

### Step 4: Review AI Analysis

The AI reads your cluster state, runs commands, and presents its findings. This may include:

- Resource status and logs
- Root cause analysis
- Suggested actions

### Step 5: Approve or Reject Actions

When the AI proposes a change (scaling a deployment, restarting a pod, applying a patch), you see the exact action before it runs. Click **Approve** to proceed or **Reject** to skip that step. The AI never makes changes without your explicit approval.

### Example Prompts

Here are prompts to try for your first missions:

1. **Cluster health check**:
   ```
   Give me a health summary of all my connected clusters
   ```

2. **Troubleshoot a failing pod**:
   ```
   Why is the pod coredns-abc123 in namespace kube-system crash-looping on cluster prod-east?
   ```

3. **Analyze resource usage**:
   ```
   Which namespaces on my staging cluster are using the most memory, and are any close to their limits?
   ```

4. **Deploy an application**:
   ```
   Deploy nginx with 3 replicas to the default namespace on cluster dev-1
   ```

5. **Security audit**:
   ```
   Check for pods running as root or with privileged security contexts across all clusters
   ```

6. **Certificate check**:
   ```
   Are any TLS certificates expiring within the next 30 days on my production clusters?
   ```

7. **Cross-cluster comparison**:
   ```
   Compare the Helm releases installed on cluster staging vs cluster production and show me the differences
   ```

---

## Troubleshooting

### AI features not showing

**Symptoms**: No AI Missions button, no "Ask AI" icons on cards, no AI & Intelligence section in Settings.

**Causes and solutions**:

- **No API key configured**: Add at least one provider key via `.env` or Settings UI (see sections above). Restart the console if using `.env`.
- **kubestellar-mcp plugins not installed**: The AI agent requires `kubestellar-ops` and `kubestellar-deploy`. Verify installation:
  ```bash
  which kubestellar-ops kubestellar-deploy
  ```
  If missing, follow [Installation - Step 1](installation.md#step-1-install-claude-code-plugins).
- **AI mode set to Off**: Navigate to **Settings** > **AI & Intelligence** and confirm AI Mode is set to Low, Medium, or High.

### Invalid API key

**Symptoms**: Red X next to the provider name in Settings. Error message such as "Invalid API key" or "Authentication failed".

**Causes and solutions**:

- **Typo or extra whitespace**: Copy the key again from your provider dashboard. Ensure no leading or trailing spaces.
- **Expired key**: Some providers rotate keys or expire them after a period of inactivity. Generate a new key from your provider's dashboard and update it.
- **Wrong key type**: Ensure you are using an API key, not an OAuth token or session token. For Anthropic, the key starts with `sk-ant-`. For OpenAI, it starts with `sk-`.
- **Environment variable mismatch**: If using `.env`, verify the variable name matches exactly (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or `GEMINI_API_KEY`). Restart the console after changes.

### Provider unavailable

**Symptoms**: Yellow warning or timeout errors when submitting a mission. Provider Health card shows degraded status.

**Causes and solutions**:

- **Provider outage**: Check the Provider Health card on the dashboard or visit the provider's status page directly:
  - Anthropic: [status.anthropic.com](https://status.anthropic.com)
  - OpenAI: [status.openai.com](https://status.openai.com)
  - Google: [status.cloud.google.com](https://status.cloud.google.com)
- **Network issue**: Verify the console host can reach the provider's API endpoint. Test with:
  ```bash
  curl -s https://api.anthropic.com/v1/messages -H "x-api-key: $ANTHROPIC_API_KEY" -H "anthropic-version: 2023-06-01" -d '{}' | head -c 200
  ```
  If this times out, check firewalls, proxies, or DNS resolution.
- **Rate limiting**: If you are sending many requests, the provider may throttle you. Wait a few minutes and try again, or switch to a different provider temporarily.

### Demo mode stuck

**Symptoms**: Cards show "Demo" badge and yellow outline even after adding a valid API key. Missions return pre-recorded responses.

**Causes and solutions**:

- **Demo mode still enabled**: Navigate to **Settings** > **AI & Intelligence** and toggle Demo Mode off.
- **Environment variable override**: Check if `DEMO_MODE=true` is set in your `.env` file or as a system environment variable. Remove it and restart the console.
- **Browser cache**: Hard-refresh the page (**Cmd+Shift+R** on macOS, **Ctrl+Shift+R** on Linux/Windows) or open in an incognito window.

### Model not responding

**Symptoms**: Mission submitted but no response appears. Spinner runs indefinitely.

**Causes and solutions**:

- **Selected model is unavailable**: Some models may be deprecated or in limited preview. Go to **Settings** > **AI & Intelligence** > **Model** and switch to a different model (e.g., Claude Sonnet 4 or GPT-4o).
- **Token limit reached**: If you have token limits enabled, check **Settings** > **Token Usage**. If you are at or above the critical threshold, AI features are restricted. Increase the limit or wait for the next billing period.
- **Request too large**: Very large prompts or cluster states can exceed the model's context window. Try narrowing your request to a specific namespace or cluster instead of "all clusters".
- **Backend not running**: Check that the Go backend is running on port 8080. Look for errors in the terminal where `startup-oauth.sh` is running.

### Mission timeout

**Symptoms**: Error message "Mission timed out" or "Request exceeded maximum duration".

**Causes and solutions**:

- **Slow cluster response**: If kubectl commands against your cluster are slow, the AI mission may time out waiting for results. Test cluster responsiveness:
  ```bash
  time kubectl --context=your-cluster get pods -A
  ```
  If this takes more than a few seconds, the issue is cluster performance, not the AI.
- **Complex multi-cluster mission**: Missions that span many clusters take longer. Break the request into per-cluster missions or target a specific cluster.
- **Provider latency**: During peak usage, AI providers may respond slowly. Check the Provider Health card and consider switching providers.

### Agent not connected

**Symptoms**: "Agent disconnected" or "MCP bridge offline" message. AI missions cannot run commands.

**Causes and solutions**:

- **kc-agent not running**: The agent (`kc-agent`) must be running for the AI to interact with clusters. If you used `startup-oauth.sh`, it starts automatically. Check for the process:
  ```bash
  ps aux | grep kc-agent
  ```
  If not running, restart the console with `startup-oauth.sh`.
- **Port conflict**: The agent listens on port 8585 by default. Check if something else is using that port:
  ```bash
  lsof -i :8585
  ```
  If there is a conflict, stop the other process or configure a different port with `--port`.
- **Plugins not installed**: Verify `kubestellar-ops` and `kubestellar-deploy` are installed and accessible:
  ```bash
  kubestellar-ops version
  kubestellar-deploy version
  ```

### No clusters detected

**Symptoms**: The console shows zero clusters. AI missions report "No clusters available".

**Causes and solutions**:

- **kubeconfig not found**: The console reads `~/.kube/config` by default. Verify it exists and contains cluster entries:
  ```bash
  kubectl config get-contexts
  ```
- **kubeconfig not mounted (Kubernetes deployment)**: If running in a pod, ensure the kubeconfig is mounted as a volume. Check the Helm values for `kubeconfig` settings.
- **Cluster unreachable**: The kubeconfig may reference clusters that are offline or behind a VPN. Test connectivity:
  ```bash
  kubectl --context=your-cluster cluster-info
  ```
- **Stale kubeconfig**: If you recently changed clusters, the cached kubeconfig may be outdated. Refresh the console by clicking the refresh icon in the header or restarting the console.

---

## Next Steps

- **[AI Features](ai-features.md)** -- Full reference for AI Missions, Diagnose, Repair, Smart Suggestions, and Predictive Failure Detection.
- **[Configuration](configuration.md)** -- AI mode levels, token limits, Helm values, and environment variables.
- **[Installation](installation.md)** -- Deployment options including Helm, Docker, and OpenShift.
- **[Quick Start](quickstart.md)** -- Get the console running in 5 minutes.
