---
title: Testing
description: Recommended tests and local checks for kubestellar-mcp contributors
---

# Testing

The repository is mostly covered by Go unit tests colocated with the implementation.

## What is tested

- Cobra command behavior in `pkg/cmd/...` and `pkg/deploy/cmd/...`
- kubeconfig and cluster discovery logic in `pkg/cluster/` and `pkg/multicluster/`
- MCP request handling and tool execution in `pkg/mcp/server/` and `pkg/deploy/mcp/`
- GitOps helpers in `pkg/gitops/`
- Claude prompt and client helpers in `pkg/ai/claude/`

## Recommended local checks

Run these before sending changes for review:

```bash
go test ./...
go vet ./...
```

The GitHub Actions workflow in `.github/workflows/build-test.yml` also runs:

- `go build -v ./...`
- `go test -v -race -coverprofile=coverage.out ./...`
- `golangci-lint`

That combination keeps command wiring, MCP protocol handling, and Kubernetes helper logic from drifting out of sync.
