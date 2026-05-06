---
title: "Cluster Registration — Connect Clusters to KubeStellar Console with kubeconfig"
linkTitle: "Cluster Registration"
weight: 4
description: >
  Register clusters in KubeStellar Console by making them available through your kubeconfig. Learn the required kubeconfig structure, how single-context and multi-context configs behave, and what authentication methods work.
---

# Cluster Registration

In KubeStellar Console, **cluster registration is kubeconfig-driven**. There is no separate upload wizard or custom registration API you must call first. If the console process (or `kc-agent`) can read a working kubeconfig context, that cluster becomes available to the console.

This page covers:

- the required kubeconfig shape
- what happens with one context vs. many contexts
- authentication expectations
- how to verify that registration worked
- discovering clusters through the UI or API
- removing stale clusters

## What "registration" means in Console

The console discovers clusters from your kubeconfig.

- **One working context** → the console has one cluster target to query
- **Multiple working contexts** → the console can fan out across multiple cluster targets
- **No working contexts** → no clusters appear, or some cluster-backed features fail

> **Important:** the hosted demo at [console.kubestellar.io](https://console.kubestellar.io) cannot read your local kubeconfig, so you cannot register real clusters there. Use a local or self-hosted install instead.

## Required kubeconfig format

Your kubeconfig must contain the standard Kubernetes sections:

- `clusters`
- `users`
- `contexts`
- `current-context`

A minimal example looks like this:

```yaml
apiVersion: v1
kind: Config
clusters:
  - name: dev-cluster
    cluster:
      server: https://api.dev.example.com:6443
      certificate-authority-data: <base64-ca-data>
users:
  - name: dev-user
    user:
      token: <bearer-token>
contexts:
  - name: dev-cluster
    context:
      cluster: dev-cluster
      user: dev-user
current-context: dev-cluster
```

The console does **not** require a KubeStellar-specific kubeconfig extension. It expects the same file format that `kubectl` and `client-go` use.

## Registration flow

### 1. Make sure the kubeconfig already works with kubectl

Before opening the console, confirm the contexts you want to use are valid:

```bash
kubectl config get-contexts
kubectl --context=dev-cluster get namespaces
```

If `kubectl` cannot reach the cluster, the console will not be able to use that context either.

### 2. Put every target cluster in the kubeconfig the console will read

For local installs, this is usually `~/.kube/config`.

If your clusters are split across multiple files, merge them first:

```bash
KUBECONFIG=~/.kube/config:~/.kube/cluster2.yaml:~/.kube/cluster3.yaml \
  kubectl config view --flatten > ~/.kube/merged-config
mv ~/.kube/merged-config ~/.kube/config
```

### 3. Start the console in the mode you are using

- **Local / source / curl install**: start the console normally; it reads your kubeconfig automatically
- **Helm / in-cluster install**: run `kc-agent` on your workstation so browser-driven cluster actions can use your local kubeconfig

See [Installation](installation.md), [Local Setup](local-setup.md), and [Troubleshooting](troubleshooting.md#agent-not-connected--cluster-actions-fail) for the deployment-specific details.

### 4. Verify the clusters appear

After startup:

1. Open the console
2. Go to cluster-aware dashboards such as **Clusters**
3. Confirm the clusters from your kubeconfig are visible and returning data

If a context is present in kubeconfig but unreachable, you may see partial data or connection errors instead of a clean registration.

## Single-context vs. multi-context behavior

### Single-context kubeconfig

If your kubeconfig contains one usable context, the console behaves like a single-cluster install. This is the simplest way to validate that registration is working.

### Multi-context kubeconfig

If your kubeconfig contains multiple usable contexts, the console treats them as multiple cluster targets and queries them in parallel. This is the normal setup for multi-cluster fleet views.

Practical guidance:

- Use clear, stable context names so operators can tell clusters apart
- Regularly review and remove stale contexts (see [Removing stale clusters](#removing-stale-clusters))
- Test each context individually with `kubectl --context=...`

## Authentication expectations

The console uses the **same authentication material your kubeconfig already uses**. It does not mint new Kubernetes credentials and it does not send your kubeconfig to GitHub.

Common authentication patterns that work are the same ones that work with `kubectl`, including:

- bearer tokens
- client certificates
- exec-based auth plugins
- cloud-provider generated kubeconfigs

The important requirement is that authentication must work **non-interactively** on the machine running the console components that read kubeconfig.

That means:

- if an exec plugin is required, its binary must already be installed
- if a token is expired, renew it before opening the console
- if access depends on VPN or network reachability, that path must already be up
- if a context prompts for interactive login every time, fix that first in your normal `kubectl` workflow

## Discovering clusters

### Via the UI

The console provides a dedicated **Clusters** dashboard that displays all discovered clusters with live health information:

1. Open the console
2. Navigate to **Clusters** in the main menu
3. View all clusters from your kubeconfig with:
   - Health status (healthy, unhealthy, or initializing)
   - Node count
   - Pod count
   - Connection status

### Via the API

The console exposes cluster discovery through REST APIs:

**GET `/api/mcp/clusters`**

Returns all discovered clusters with cached health information:

```json
{
  "clusters": [
    {
      "name": "dev-cluster",
      "healthy": true,
      "nodeCount": 3,
      "podCount": 42,
      "neverConnected": false
    },
    {
      "name": "prod-cluster",
      "healthy": true,
      "nodeCount": 10,
      "podCount": 200
    }
  ],
  "source": "k8s"
}
```

**GET `/api/mcp/clusters/:cluster/health`**

Returns detailed health data for a specific cluster:

```json
{
  "cluster": "dev-cluster",
  "healthy": true,
  "nodeCount": 3,
  "podCount": 42,
  "reachable": true,
  "lastSeen": "2025-05-06T10:30:00Z"
}
```

**GET `/api/mcp/clusters/health`**

Returns health information for all clusters at once.

These APIs are available through the standard REST interface and require authentication (if enabled).

## Removing stale clusters

### When to remove a cluster

Over time, you may need to clean up stale cluster contexts from your kubeconfig:

- Clusters that are no longer in use
- Temporary dev/test clusters that have been decommissioned
- Duplicate contexts pointing to the same physical cluster
- Expired credentials that can no longer be renewed

### How to remove a cluster

#### Via the UI

The console supports cluster removal through the Clusters page:

1. Navigate to **Clusters**
2. Identify the cluster you want to remove
3. Click the remove or delete option (if available in your UI)
4. Confirm the removal

#### Via the API (kc-agent required)

Use the kubeconfig removal API to programmatically deregister clusters:

**POST `/kubeconfig/remove`**

Request body:

```json
{
  "context": "cluster-name"
}
```

Example response on success:

```json
{
  "ok": true,
  "removed": "cluster-name"
}
```

Constraints:

- The context must exist in your kubeconfig
- You cannot remove the currently active context (set via `current-context`)
- If the cluster or user credentials are not referenced by any other context, they are also removed from the kubeconfig
- This operation modifies your local kubeconfig file

### Via kubectl

You can also remove contexts directly using kubectl:

```bash
# Remove a specific context
kubectl config delete-context <context-name>

# View the updated list
kubectl config get-contexts

# Optionally reset current-context if it was the one you deleted
kubectl config use-context <new-current-context>
```

After removal, the context will no longer appear in the console's cluster list on the next refresh.

## Troubleshooting cluster registration

### No clusters appear

Check these first:

```bash
kubectl config get-contexts
kubectl config current-context
kubectl --context=<context-name> get namespaces
```

If those commands fail, fix the kubeconfig before troubleshooting the console.

### Some clusters appear, but not all

Usually one or more contexts are stale, expired, or depend on auth plugins that are not available on the current machine.

### Helm install shows "Agent Not Connected"

For Helm deployments, `kc-agent` runs on **your workstation**, not inside the cluster. Without it, browser-driven cluster actions cannot use your local kubeconfig. See [Troubleshooting](troubleshooting.md#agent-not-connected--cluster-actions-fail).

### Hosted demo cannot see my clusters

That is expected. The hosted demo is intentionally read-only and does not connect to your local kubeconfig.

## Related docs

- [Quick Start](quickstart.md)
- [Installation](installation.md)
- [Local Setup](local-setup.md)
- [Architecture](architecture.md)
- [Security Model](security-model.md)
- [Troubleshooting](troubleshooting.md)
