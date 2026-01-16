---
title: Introduction
description: AI-powered multi-cluster Kubernetes tools for Claude Code
---

# klaude

AI-powered multi-cluster Kubernetes tools for Claude Code.

**Single-cluster UX for multi-cluster reality** - work with your **apps**, not your **clusters**.

## Components

| Binary | Plugin | Description |
|--------|--------|-------------|
| **klaude-ops** | klaude-ops | Multi-cluster diagnostics, RBAC analysis, security checks |
| **klaude-deploy** | klaude-deploy | App-centric deployment, GitOps, smart workload placement |

## Quick Start

### 1. Install the Binaries

```bash
# Install via Homebrew
brew tap kubestellar/tap
brew install klaude-ops klaude-deploy

# Or install individually
brew install klaude-ops      # Diagnostics only
brew install klaude-deploy   # Deployment only
```

### 2. Install the Claude Code Plugins

```
/plugin marketplace add kubestellar/claude-plugins
```

Then go to `/plugin` → **Marketplaces** tab → click **Update** on kubestellar marketplace.

Go to `/plugin` → **Discover** tab and install:
- **klaude-ops** - for diagnostics, RBAC, security
- **klaude-deploy** - for deployment, GitOps

### 3. Verify Installation

Run `/mcp` in Claude Code - you should see:
```
plugin:klaude-ops:klaude-ops · ✓ connected
plugin:klaude-deploy:klaude-deploy · ✓ connected
```

### 4. Start Using

Ask Claude:
- "List my Kubernetes clusters"
- "Find pods with issues"
- "Where is nginx running?"
- "Check for security misconfigurations"

---

## Installation

### Homebrew (Recommended)

```bash
brew tap kubestellar/tap

# Install diagnostics tools
brew install klaude-ops

# Install deployment tools
brew install klaude-deploy

# Or install both
brew install klaude-ops klaude-deploy
```

### From Releases

Download from [GitHub Releases](https://github.com/kubestellar/klaude/releases).

### From Source

```bash
git clone https://github.com/kubestellar/klaude.git
cd klaude

# Build both binaries
go build -o bin/klaude-ops ./cmd/klaude-ops
go build -o bin/klaude-deploy ./cmd/klaude-deploy

sudo mv bin/klaude-* /usr/local/bin/
```

---

## Claude Code Plugin Setup

### Adding the Marketplace

1. In Claude Code, run:
   ```
   /plugin marketplace add kubestellar/claude-plugins
   ```

2. Go to `/plugin` → **Marketplaces** tab

3. Click **Update** on the kubestellar marketplace to refresh the plugin list

### Installing Plugins

1. Go to `/plugin` → **Discover** tab

2. Search for "klaude" or browse the list

3. Select and install:
   - **klaude-ops** - Multi-cluster diagnostics, RBAC analysis, security checks
   - **klaude-deploy** - App-centric deployment, GitOps, smart workload placement

4. The plugins will automatically connect to the installed binaries

### Verifying Connection

Run `/mcp` in Claude Code to see connected MCP servers:

```
plugin:klaude-ops:klaude-ops · ✓ connected
plugin:klaude-deploy:klaude-deploy · ✓ connected
```

If a plugin shows disconnected, ensure the binary is installed and in your PATH:
```bash
which klaude-ops
which klaude-deploy
```

### Allow Tools Without Prompts

To avoid permission prompts for each tool call, add to `~/.claude/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "mcp__plugin_klaude-ops_klaude-ops__*",
      "mcp__plugin_klaude-deploy_klaude-deploy__*"
    ]
  }
}
```

Or run in Claude Code:
```
/allowed-tools add mcp__plugin_klaude-ops_klaude-ops__*
/allowed-tools add mcp__plugin_klaude-deploy_klaude-deploy__*
```

### Troubleshooting

**Plugins not showing in Discover tab:**
1. Go to `/plugin` → **Marketplaces** tab
2. Click **Update** on the kubestellar marketplace
3. Return to **Discover** tab and search again

**Plugin shows disconnected:**
1. Verify binary is installed: `which klaude-ops`
2. Verify binary works: `klaude-ops version`
3. Restart Claude Code

**Marketplace not found:**
```
/plugin marketplace remove kubestellar
/plugin marketplace add kubestellar/claude-plugins
```

---

## klaude-ops

Multi-cluster Kubernetes diagnostics, RBAC analysis, and security checks.

### Example Usage

- "List my Kubernetes clusters"
- "Find pods with issues across all clusters"
- "Check for security misconfigurations"
- "What permissions does the admin service account have?"
- "Show me warning events in kube-system"
- "Analyze the default namespace"

### Tools

#### Cluster Management
| Tool | Description |
|------|-------------|
| `list_clusters` | Discover clusters from kubeconfig |
| `get_cluster_health` | Check cluster health status |
| `get_nodes` | List cluster nodes with status |
| `audit_kubeconfig` | Audit all clusters for connectivity and recommend cleanup |

#### Workload Tools
| Tool | Description |
|------|-------------|
| `get_pods` | List pods with filtering options |
| `get_deployments` | List deployments |
| `get_services` | List services |
| `get_events` | Get recent events |
| `describe_pod` | Get detailed pod information |
| `get_pod_logs` | Retrieve pod logs |

#### RBAC Analysis
| Tool | Description |
|------|-------------|
| `get_roles` | List Roles in a namespace |
| `get_cluster_roles` | List ClusterRoles |
| `get_role_bindings` | List RoleBindings |
| `get_cluster_role_bindings` | List ClusterRoleBindings |
| `can_i` | Check if you can perform an action |
| `analyze_subject_permissions` | Full RBAC analysis for any subject |
| `describe_role` | Detailed view of Role/ClusterRole rules |

#### Diagnostic Tools
| Tool | Description |
|------|-------------|
| `find_pod_issues` | Find CrashLoopBackOff, ImagePullBackOff, OOMKilled, pending pods |
| `find_deployment_issues` | Find stuck rollouts, unavailable replicas, ReplicaSet errors |
| `check_resource_limits` | Find pods without CPU/memory limits |
| `check_security_issues` | Find privileged containers, root users, host network |
| `analyze_namespace` | Comprehensive namespace analysis |
| `get_warning_events` | Get only Warning events |
| `find_resource_owners` | Find who owns/manages resources |

#### OPA Gatekeeper Policy Tools
| Tool | Description |
|------|-------------|
| `check_gatekeeper` | Check if OPA Gatekeeper is installed and healthy |
| `get_ownership_policy_status` | Get ownership policy configuration and violation count |
| `list_ownership_violations` | List resources missing required ownership labels |
| `install_ownership_policy` | Install ownership labels policy (dryrun/warn/enforce modes) |
| `set_ownership_policy_mode` | Change policy enforcement mode |
| `uninstall_ownership_policy` | Remove the ownership policy |

#### Upgrade Tools
| Tool | Description |
|------|-------------|
| `detect_cluster_type` | Detect cluster distribution (OpenShift, EKS, GKE, AKS, kubeadm, k3s, kind) |
| `get_cluster_version_info` | Get current version and available upgrades |
| `check_olm_operator_upgrades` | Check OLM operators for pending upgrades |
| `check_helm_release_upgrades` | List Helm releases and their versions |
| `get_upgrade_prerequisites` | Validate upgrade readiness |
| `trigger_openshift_upgrade` | Trigger OpenShift cluster upgrade (requires confirmation) |
| `get_upgrade_status` | Monitor upgrade progress |

### Slash Commands

| Command | Description |
|---------|-------------|
| `/k8s-health` | Check health of all clusters |
| `/k8s-issues` | Find pod and deployment issues |
| `/k8s-security` | Check for security misconfigurations |
| `/k8s-rbac` | Analyze RBAC permissions |
| `/k8s-analyze` | Comprehensive namespace analysis |
| `/k8s-audit-kubeconfig` | Audit kubeconfig clusters |
| `/k8s-ownership` | Manage ownership tracking with OPA Gatekeeper |
| `/k8s-upgrade-check` | Check for available upgrades (cluster, OLM, Helm) |
| `/k8s-upgrade` | Guided cluster upgrade with safety checks |

### Slash Command Examples

```
# Check health of all clusters
/k8s-health

# Find pod and deployment issues across all clusters
/k8s-issues

# Check for security misconfigurations (privileged containers, root users)
/k8s-security

# Analyze RBAC permissions for a user or service account
/k8s-rbac

# Check for available upgrades
/k8s-upgrade-check
```

---

## klaude-deploy

App-centric multi-cluster deployment and operations.

### Example Usage

- "Where is nginx running?"
- "Get logs from my api service"
- "Deploy my ML model to clusters with GPUs"
- "Are my clusters in sync with git?"
- "Scale my app to 5 replicas across all clusters"

### Tools

#### App Discovery & Status
| Tool | Description |
|------|-------------|
| `get_app_instances` | Find all instances of an app across clusters |
| `get_app_status` | Unified health view (healthy/degraded/failed) |
| `get_app_logs` | Aggregated logs with cluster labels |

#### Smart Deployment
| Tool | Description |
|------|-------------|
| `deploy_app` | Deploy to clusters matching criteria (GPU, memory, labels) |
| `scale_app` | Scale across all clusters where app runs |
| `patch_app` | Apply patches everywhere at once |

#### Cluster Resources
| Tool | Description |
|------|-------------|
| `list_cluster_capabilities` | GPU, CPU, memory per cluster |
| `find_clusters_for_workload` | Find clusters that can run a workload |

#### GitOps
| Tool | Description |
|------|-------------|
| `detect_drift` | Find clusters that diverged from git |
| `sync_from_git` | Apply manifests from git repository |
| `reconcile` | Bring clusters back in sync |
| `preview_changes` | Dry-run to see what would change |

### Slash Commands

| Command | Description |
|---------|-------------|
| `/app-status` | Show status of an app across all clusters |
| `/app-logs` | Get aggregated logs from an app |
| `/deploy` | Deploy or update an app |
| `/gitops-sync` | Sync clusters from git |
| `/gitops-drift` | Check for drift from git |

### Example Workflows

**"Where is my app running?"**
```
nginx is running on 3 clusters:
  - prod-east: 3 replicas, healthy
  - prod-west: 3 replicas, healthy
  - staging: 1 replica, healthy
```

**"Deploy to GPU clusters"**
```
Found 2 clusters with nvidia.com/gpu
Deployed to gpu-cluster-1, gpu-cluster-2
All healthy
```

**"Check for drift"**
```
Drift detected:
  - prod-west: ConfigMap/app-config differs
  - staging: Deployment/api has extra replicas
```

---

## CLI Usage

### klaude-ops

```bash
# Run as MCP server (for Claude Code)
klaude-ops --mcp-server

# List clusters
klaude-ops clusters list

# Check cluster health
klaude-ops clusters health

# Watch OpenShift upgrade with live progress bar
klaude-ops watch-upgrade
klaude-ops watch-upgrade --context=prod-cluster --interval=5s
```

#### Live Progress Bar

The `watch-upgrade` command displays a self-updating progress bar that overwrites itself:

```
⏳ 4.18.30 [###########---------------------------------------]  22% (200/906) cloud-controller-manager
```

When complete:
```
✅ 4.18.30 [##################################################] 100%
```

### klaude-deploy

```bash
# Run as MCP server (for Claude Code)
klaude-deploy --mcp-server
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `KUBECONFIG` | Path to kubeconfig file |

## Contributing

Contributions are welcome! Please read our [contributing guidelines](https://github.com/kubestellar/klaude/blob/main/CONTRIBUTING.md).

## License

Apache License 2.0 - see [LICENSE](https://github.com/kubestellar/klaude/blob/main/LICENSE) for details.
