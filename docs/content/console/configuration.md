---
title: "Configuration"
linkTitle: "Configuration"
weight: 2
description: >
  Configure KubeStellar Console for your environment
---

# Configuration

KubeStellar Console can be configured via environment variables or Helm values.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `DEV_MODE` | Enable dev mode (CORS, hot reload) | `false` |
| `DATABASE_PATH` | SQLite database path | `./data/console.db` |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | (required) |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | (required) |
| `JWT_SECRET` | JWT signing secret | (auto-generated) |
| `FRONTEND_URL` | Frontend URL for redirects | `http://localhost:5174` |
| `CLAUDE_API_KEY` | Claude API key for AI features | (optional) |
| `GITHUB_TOKEN` | GitHub token for nightly E2E status data | (optional) |
| `GOOGLE_DRIVE_API_KEY` | Google Drive API key for benchmark data | (optional) |
| `ENABLED_DASHBOARDS` | Comma-separated list of dashboard routes to show in sidebar | (all dashboards) |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics 4 measurement ID | (optional) |
| `FEEDBACK_GITHUB_TOKEN` | GitHub token for feedback issue creation | (optional) |

## kc-agent Configuration

The local agent (`kc-agent`) runs on your machine and bridges the browser-based console to your kubeconfig. It supports CLI flags and environment variables.

### CLI Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--port` | Port to listen on | `8585` |
| `--kubeconfig` | Path to kubeconfig file | `~/.kube/config` |
| `--allowed-origins` | Comma-separated additional allowed WebSocket origins | (none) |
| `--version` | Print version and exit | |

### Agent Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `KC_ALLOWED_ORIGINS` | Comma-separated list of allowed origins for CORS | localhost only |
| `KC_AGENT_TOKEN` | Optional shared secret for authentication | (none) |

### Default Allowed Origins

The agent allows connections from these origins by default:

- `http://localhost`, `https://localhost`
- `http://127.0.0.1`, `https://127.0.0.1`
- `https://console.kubestellar.io`
- `https://*.ibm.com`

### Adding Custom Origins

Use the `--allowed-origins` CLI flag or `KC_ALLOWED_ORIGINS` environment variable to allow additional origins. Both are additive — they merge on top of the defaults.

```bash
# Via CLI flag
kc-agent --allowed-origins "https://my-console.example.com"

# Via environment variable
KC_ALLOWED_ORIGINS="https://my-console.example.com" kc-agent

# Both together (all origins are merged)
KC_ALLOWED_ORIGINS="https://env-origin.example.com" kc-agent --allowed-origins "https://flag-origin.example.com"
```

Wildcard subdomains are supported (e.g., `https://*.example.com`).

## Helm Values

### Basic Configuration

```yaml
# values.yaml
replicaCount: 1

image:
  repository: ghcr.io/kubestellar/console
  tag: latest

service:
  type: ClusterIP
  port: 8080

# GitHub OAuth
github:
  existingSecret: ksc-secrets
  existingSecretKeys:
    clientId: github-client-id
    clientSecret: github-client-secret
```

### AI Configuration

```yaml
# AI Mode settings
ai:
  defaultMode: "medium"  # low | medium | high
  tokenLimits:
    enabled: true
    monthlyLimit: 100000
    warningThreshold: 80   # Show warning at 80%
    criticalThreshold: 95  # Restrict features at 95%

# Claude API (optional)
claude:
  apiKey: ""
  model: "claude-sonnet-4-20250514"
  existingSecret: ""
```

### Persistence

```yaml
persistence:
  enabled: true
  size: 1Gi
  storageClass: ""
```

### OpenShift Route

```yaml
route:
  enabled: true
  host: ksc.apps.your-cluster.com
  tls:
    termination: edge
    insecureEdgeTerminationPolicy: Redirect
```

### Ingress (non-OpenShift)

```yaml
ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt
  hosts:
    - host: ksc.your-domain.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: ksc-tls
      hosts:
        - ksc.your-domain.com
```

## AI Mode Configuration

### Low Mode
- Minimal token usage (~10%)
- Direct kubectl/API calls for all data
- AI only responds to explicit requests
- Best for cost control

### Medium Mode (Default)
- Balanced token usage (~50%)
- AI analyzes and summarizes data on request
- Natural language card configuration
- Contextual help enabled

### High Mode
- Full AI assistance (~100%)
- Proactive card swap suggestions
- Automatic issue analysis
- Real-time recommendations based on cluster activity

## Dashboard Filtering

Use `ENABLED_DASHBOARDS` to control which dashboards appear in the sidebar for a given deployment. This is useful for per-team or per-environment customization.

```bash
# Show only GPU, AI/ML, and Benchmarks dashboards
ENABLED_DASHBOARDS=gpu-reservations,ai-ml,llm-d-benchmarks

# Show only operations-focused dashboards
ENABLED_DASHBOARDS=clusters,workloads,events,security,alerts
```

When set, only the listed dashboard routes will appear in the sidebar navigation. All other dashboards are hidden but still accessible via direct URL.

## Analytics Configuration

The console includes optional Google Analytics 4 telemetry for product usage insights.

### Enabling Analytics

Set the GA4 measurement ID:

```bash
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### User Opt-Out

Users can opt out of analytics in **Settings > Analytics**. The toggle is off by default on self-hosted installations.

### What Is Collected

- Page views and navigation patterns (prefixed with `ksc_`)
- Card interactions (add, remove, expand, configure)
- No personally identifiable information (PII) is ever collected

## Security Considerations

1. **GitHub OAuth**: Create a dedicated OAuth app for production
2. **Secrets**: Use Kubernetes secrets, not plain values
3. **Network**: Use TLS termination at ingress/route level
4. **RBAC**: The service account needs read access to target clusters
