---
title: "App Status"
description: "Show the status of an app across all clusters."
---

> Source: [`kubestellar/kubestellar-mcp/commands/app-status.md`](https://github.com/kubestellar/kubestellar-mcp/blob/main/commands/app-status.md)

# App Status

Show the status of an app across all clusters.

## Usage

Ask about an app's status, and kubestellar-deploy will find where it's running and aggregate the status.

## Examples

- "What's the status of nginx?"
- "Is my api service healthy?"
- "Show me the status of the ml-pipeline app"

## What it shows

- Which clusters the app is running on
- Replica counts and health status per cluster
- Overall health (healthy, degraded, failed)
- Any issues detected

## MCP Tools Used

- `get_app_status` - Get unified status of an app across all clusters
- `get_app_instances` - Find all instances of an app

## Implementation

Use the `get_app_status` tool with the app name. The tool will:
1. Search all clusters for deployments/statefulsets/daemonsets matching the app name
2. Aggregate replica counts and health status
3. Return a unified view of the app's health
