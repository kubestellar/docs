---
title: Architecture Overview
description: Repository layout and core architecture for kubestellar-mcp
---

# Architecture Overview

`kubestellar-mcp` ships two Go binaries that expose Kubernetes operations as MCP tools over stdio:

- `kubestellar-ops`: diagnostics, RBAC analysis, security checks, and upgrade helpers
- `kubestellar-deploy`: app-centric multi-cluster deployment, GitOps, Helm, kubectl, kustomize, and labeling workflows

Both binaries follow the same high-level pattern:

1. A Cobra root command parses flags.
2. `--mcp-server` switches the process into MCP server mode.
3. The MCP server reads JSON-RPC requests from stdin.
4. A tool handler performs Kubernetes work through `client-go`.
5. The server writes a JSON-RPC response to stdout.

## Repository structure

### `cmd/`

`cmd/` contains the compiled entrypoints.

- `cmd/kubestellar-ops/main.go` starts the diagnostics binary.
- `cmd/kubestellar-deploy/main.go` starts the deployment binary.

The `main` packages stay intentionally thin and delegate almost immediately into `pkg/`.

### `pkg/`

`pkg/` contains the application logic.

#### Shared and diagnostics-oriented packages

- `pkg/cmd/`: Cobra command tree for `kubestellar-ops`
  - `root.go` wires global flags, natural-language query mode, and MCP mode.
  - `clusters/`, `ai/`, and `upgrade/` provide subcommands.
- `pkg/mcp/server/`: the `kubestellar-ops` MCP server
  - `server.go` defines MCP request/response types, the stdio loop, tool schemas, and dispatch.
  - `tools.go`, `diagnostics.go`, `multicluster.go`, and `upgrades.go` implement tool behavior.
- `pkg/cluster/`: kubeconfig-based cluster discovery and health checks.
- `pkg/gitops/`: manifest reading, drift detection, and sync logic reused by MCP handlers.
- `pkg/ai/claude/`: optional natural-language CLI query support for `kubestellar-ops query`.
- `pkg/progress/`: CLI progress helpers.

#### Deployment-oriented packages

- `pkg/deploy/cmd/`: Cobra root command for `kubestellar-deploy`.
- `pkg/deploy/mcp/`: the `kubestellar-deploy` MCP server and its handlers.
  - `server.go` owns the MCP loop, tool catalog, and dispatch.
  - `tools_app.go`, `tools_deploy.go`, `tools_gitops.go`, `tools_helm.go`, `tools_kubectl.go`, `tools_kustomize.go`, and `tools_labels.go` group handlers by domain.
- `pkg/multicluster/`: kubeconfig-backed client management, cluster selection, and parallel execution across clusters.

### `commands/`

`commands/` contains markdown command descriptions used by the Claude Code plugin and marketplace experience. These files explain user-facing workflows such as deploy, delete, app status, and GitOps operations. They are not compiled into the Go binaries, but they should stay aligned with the MCP tools exposed by the servers.
