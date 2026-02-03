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

## Security Considerations

1. **GitHub OAuth**: Create a dedicated OAuth app for production
2. **Secrets**: Use Kubernetes secrets, not plain values
3. **Network**: Use TLS termination at ingress/route level
4. **RBAC**: The service account needs read access to target clusters
