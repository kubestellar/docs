---
title: Local Development
description: Build and run kubestellar-mcp locally while developing MCP tools
---

# Local Development

## Build the binaries

```bash
go build -o ./bin/kubestellar-ops ./cmd/kubestellar-ops
go build -o ./bin/kubestellar-deploy ./cmd/kubestellar-deploy
```

## Run an MCP server directly

The servers speak newline-delimited JSON-RPC over stdio, so they can be launched directly from a terminal:

```bash
./bin/kubestellar-ops --mcp-server
./bin/kubestellar-deploy --mcp-server
```

They will wait for MCP requests on stdin and write responses to stdout.

## Connect a local build to Claude Code

The README documents the supported plugin workflow. For local development, the easiest path is:

1. Build the binary into `./bin`.
2. Prepend that directory to your `PATH`.
3. Install or update the `kubestellar/claude-plugins` marketplace in Claude Code.
4. Install the `kubestellar-ops` and/or `kubestellar-deploy` plugins.
5. Run `/mcp` in Claude Code and verify the plugin connects.

Example shell setup:

```bash
export PATH="$PWD/bin:$PATH"
```

Because the plugin launches the named binary from `PATH`, putting your local build first lets Claude Code exercise your in-repo changes without publishing a release.

If you want a quick manual smoke test before opening Claude Code, send an initialize request yourself:

```bash
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | ./bin/kubestellar-ops --mcp-server
```
