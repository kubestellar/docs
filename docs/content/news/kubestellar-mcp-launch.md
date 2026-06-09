# KubeStellar MCP: AI-Native Multi-Cluster Management for Claude Code

*June 2026*

If you use Claude Code to manage Kubernetes, you've always had to drop out of your AI session to run `kubectl` commands against multiple clusters. Copying context names, switching configs, translating single-cluster commands into multi-cluster workflows — it breaks flow.

`kubestellar-mcp` fixes that.

---

## What It Is

**kubestellar-mcp** is a set of Model Context Protocol (MCP) tools that gives Claude Code (and any MCP-compatible AI client) native multi-cluster Kubernetes capabilities. Instead of being a single-cluster tool that happens to be called from AI, it's designed from the ground up to let you work with your **applications** — not your clusters.

Two binaries, each with a focused purpose:

| Tool | What It Does |
|------|--------------|
| **kubestellar-ops** | Multi-cluster diagnostics, RBAC analysis, security posture checks across all clusters at once |
| **kubestellar-deploy** | App-centric deployment, GitOps workflows, intelligent workload placement using KubeStellar policies |

---

## Install in Under a Minute

```bash
brew tap kubestellar/tap
brew install kubestellar-ops kubestellar-deploy
```

Once installed, Claude Code picks them up automatically on next launch.

---

## What You Can Do

With `kubestellar-ops` active in your Claude Code session:

```text
"Check RBAC permissions for the payments service across all my clusters"
"Which clusters have pods in CrashLoopBackOff right now?"
"Show me the security posture diff between staging and production"
```

With `kubestellar-deploy`:

```text
"Deploy the payments service to all clusters in us-east with label env=prod"
"Set up GitOps sync for this repo across my fleet"
"Place the ML inference workload on clusters with GPU nodes"
```

The tools understand KubeStellar's multi-cluster placement model natively — you describe intent, they handle distribution.

---

## Why MCP for Multi-Cluster?

Single-cluster `kubectl` works fine for one cluster. At 5, 10, or 50 clusters, the cognitive load of managing contexts, aggregating state, and reasoning about placement becomes the bottleneck — not the work itself.

MCP tools run in the same context as your AI session. Claude can call `kubestellar-ops` to fetch cluster state, reason about it, and call `kubestellar-deploy` to act — all within a single conversation. The multi-cluster complexity is handled by the tools; you stay focused on the outcome.

---

## Try It and Tell Us What to Build Next

kubestellar-mcp is early. The tools work, but there's a lot more to build — better placement reasoning, Fleet visibility, policy recommendations, event streaming.

Try it, break it, and [open an issue](https://github.com/kubestellar/kubestellar-mcp/issues) or [join the conversation on Slack](https://cloud-native.slack.com/archives/C097094RZ3M) with what you need.

---

## Full Documentation

→ [kubestellar-mcp documentation](../kubestellar-mcp/index.md)

---
*The KubeStellar Team*
