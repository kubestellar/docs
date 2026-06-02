---
title: Request and Response Lifecycle
description: How a kubestellar-mcp tool call flows through the MCP server
---

# Request and Response Lifecycle

The two binaries implement the same lifecycle, with slightly different internal helper packages.

## 1. Process startup

- `cmd/kubestellar-ops/main.go` calls `pkg/cmd.Execute()`.
- `cmd/kubestellar-deploy/main.go` calls `pkg/deploy/cmd.Execute()`.
- The root Cobra command checks `--mcp-server`.
- MCP mode creates a server instance (`pkg/mcp/server.NewServer` or `pkg/deploy/mcp.NewServer`).

## 2. MCP handshake

Once started, the server reads JSON-RPC messages from stdin.

- `initialize` returns protocol version, server name and version, and tool capability metadata.
- `tools/list` returns the tool catalog and JSON schema for each tool.
- `initialized` and `notifications/initialized` are accepted as notifications without a response.

In `kubestellar-ops`, the stdio loop lives in `pkg/mcp/server/server.go` and uses `bufio.Reader.ReadBytes('\n')`.
In `kubestellar-deploy`, the loop is in `pkg/deploy/mcp/server.go` and uses a `bufio.Scanner` with a larger buffer for larger payloads.

## 3. Tool dispatch

When Claude Code invokes `tools/call`:

1. The server unmarshals the tool name and arguments.
2. `handleToolsCall` or `handleToolCall` switches on the tool name.
3. The selected handler validates input and performs the operation.

Examples:

- ops handlers commonly call `getClientForCluster()` or `cluster.Discoverer`.
- deploy handlers commonly use `multicluster.ClientManager`, `Executor`, and `Selector`.
- GitOps handlers call into `pkg/gitops`.

## 4. Kubernetes work

Handlers then execute the real operation:

- Read-only diagnostics call Kubernetes list and get APIs.
- Multi-cluster operations fan out across all discovered contexts.
- Deploy workflows aggregate per-cluster results.
- GitOps workflows load manifests, compare desired state, and optionally apply changes.

## 5. Response encoding

Finally the server wraps the result into an MCP `tools/call` response and writes one JSON line to stdout.

There is one important implementation difference:

- `kubestellar-ops` handlers usually return `(string, bool)` where the string is preformatted human-readable output and the boolean marks error state.
- `kubestellar-deploy` handlers usually return structured Go values that `server.go` marshals into formatted JSON text for the MCP response body.
