---
title: "App Logs"
description: "Get aggregated logs from an app across all clusters."
---

> Source: [`kubestellar/kubestellar-mcp/commands/app-logs.md`](https://github.com/kubestellar/kubestellar-mcp/blob/main/commands/app-logs.md)

# App Logs

Get aggregated logs from an app across all clusters.

## Usage

Request logs from an app by name, and kubestellar-deploy will aggregate logs from all clusters where it runs.

## Examples

- "Get logs from nginx"
- "Show me the last 50 lines of logs from the api service"
- "Get logs from ml-worker since 1 hour ago"

## What it shows

- Logs from all pods matching the app across all clusters
- Each log line is prefixed with cluster and pod name
- Can filter by time range and line count

## MCP Tools Used

- `get_app_logs` - Get aggregated logs from an app across all clusters

## Implementation

Use the `get_app_logs` tool with:
- `app`: App name to search for
- `tail`: Number of lines (default 100)
- `since`: Time duration (e.g., "1h", "30m")
- `namespace`: Optional namespace filter
