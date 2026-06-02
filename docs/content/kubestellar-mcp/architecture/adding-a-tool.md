---
title: Adding a New Tool
description: Contributor workflow for adding a new kubestellar-mcp tool
---

# Adding a New Tool

Start by deciding which MCP server owns the capability:

- Add diagnostics, RBAC, security, and upgrade tools to `pkg/mcp/server/`.
- Add deployment and app-operation tools to `pkg/deploy/mcp/`.

## Step 1: choose the implementation file

Keep handlers grouped by domain.

- Add diagnostics logic to `diagnostics.go` or a new domain-specific file in `pkg/mcp/server/`.
- Add deploy, GitOps, Helm, or kubectl logic to the matching `pkg/deploy/mcp/tools_*.go` file.

## Step 2: add the tool schema to the tool list

Expose the tool to MCP clients by adding it to the tool catalog in the relevant server file:

- `pkg/mcp/server/server.go` → `handleToolsList`
- `pkg/deploy/mcp/server.go` → `handleListTools`

At this stage define:

- The tool name.
- A clear description.
- The JSON input schema.
- Required fields.

## Step 3: wire the dispatcher

Add a new `case` in the tool dispatch switch:

- `pkg/mcp/server/server.go` → `handleToolsCall`
- `pkg/deploy/mcp/server.go` → `handleToolCall`

This is what connects the public MCP tool name to your Go handler.

## Step 4: implement the handler

Implementation conventions differ slightly by binary.

### `kubestellar-ops`

- Implement a method on `*Server`.
- Accept `context.Context` when the tool performs Kubernetes I/O.
- Use `getClientForCluster`, `discoverer`, or shared helpers.
- Return a readable text summary and whether the call should be marked as an error.

### `kubestellar-deploy`

- Implement a method on `*Server`.
- Unmarshal the raw arguments into a typed request struct.
- Use `Executor`, `Selector`, `ClientManager`, and `pkg/gitops` helpers as needed.
- Return a structured response object and an `error`.

## Step 5: add tests

Add focused unit tests beside the implementation.

Examples already in the repo:

- `pkg/mcp/server/tools_test.go`
- `pkg/mcp/server/diagnostics_test.go`
- `pkg/deploy/mcp/tools_app_test.go`
- `pkg/deploy/mcp/tools_gitops_test.go`

Favor the existing testing style:

- Exercise the handler directly.
- Inject fakes or stubs for cluster discovery, kube clients, or manifest readers where supported.
- Assert both success output and error cases.

## Step 6: update user-facing docs when needed

If the tool changes the user experience, update the relevant files:

- `README.md` or `docs/` for developer and operator guidance.
- Matching markdown in `commands/` if the Claude Code command descriptions should surface the new workflow.
