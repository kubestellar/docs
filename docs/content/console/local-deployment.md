---
title: "Deploying Local Changes to In-Cluster Console"
linkTitle: "Local Deployment"
weight: 25
description: >
  Guide for building and deploying local code changes to an in-cluster KubeStellar Console instance via Helm.
keywords:
  - kubestellar console local deployment
  - console helm upgrade
  - console docker build
  - console testing in-cluster
  - console development workflow
---

# Deploying Local Changes to In-Cluster Console

> This guide explains how to build local source code changes, push them to a container registry, and deploy them to an in-cluster console instance (e.g., vcluster or remote test cluster) using Helm.

## Overview

Developers frequently need to test local code changes in a real Kubernetes environment. This requires:

1. Building a Docker image from local source
2. Pushing the image to a registry you control
3. Upgrading the existing Helm release to use the new image
4. Preserving existing configuration (OAuth secrets, Kagenti integration, etc.)
5. Waiting for the rollout to complete

This guide provides a generalized, copy-pasteable command that handles all of these steps.

---

## Prerequisites

Before deploying local changes, ensure you have:

### 1. Docker Registry Access

You must have **push access** to a container registry. Common options:

- **Docker Hub**: `docker.io/yourusername`
- **GitHub Container Registry**: `ghcr.io/yourusername`
- **Google Container Registry**: `gcr.io/your-project`
- **AWS ECR**: `aws_account_id.dkr.ecr.region.amazonaws.com`

Log in to your registry:

```bash
# Docker Hub
docker login

# GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Google Container Registry
gcloud auth configure-docker

# AWS ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin aws_account_id.dkr.ecr.us-east-1.amazonaws.com
```

### 2. Kubernetes Cluster Access

Your `kubectl` context must be set to the target cluster:

```bash
# Verify current context
kubectl config current-context

# Switch context if needed
kubectl config use-context your-cluster-context
```

### 3. Existing Helm Release

This guide assumes you have an **existing** console installation deployed via Helm. If not, see the [Installation Guide](./installation.md) first.

Verify the release exists:

```bash
helm list -n kubestellar-console
```

You should see a release named `ks-console` (or similar).

---

## Deployment Command

### Generalized Command

Replace `<YOUR_DOCKER_REGISTRY>` with your container registry (e.g., `docker.io/yourusername`, `ghcr.io/yourusername`):

```bash
TAG="dev-local-$(date +%Y%m%d-%H%M%S)" && \
docker build -t <YOUR_DOCKER_REGISTRY>/kubestellar-console:$TAG . && \
docker push <YOUR_DOCKER_REGISTRY>/kubestellar-console:$TAG && \
helm upgrade --install ks-console ./deploy/helm/kubestellar-console \
  -n kubestellar-console \
  --reuse-values \
  --set github.existingSecret=kc-github \
  --set github.existingSecretKeys.clientId=github-client-id \
  --set github.existingSecretKeys.clientSecret=github-client-secret \
  --set feedbackGithubToken.existingSecret=kc-feedback-token \
  --set feedbackGithubToken.existingSecretKey=feedback-github-token \
  --set image.repository=<YOUR_DOCKER_REGISTRY>/kubestellar-console \
  --set image.tag=$TAG \
  --set extraEnv[0].name=FRONTEND_URL \
  --set extraEnv[0].value=http://localhost:8080 \
  --set extraEnv[1].name=KAGENTI_CONTROLLER_URL \
  --set 'extraEnv[1].value=http://kagenti-backend.kagenti-system.svc:8000' \
  --wait --timeout 300s && \
kubectl -n kubestellar-console rollout status deploy/ks-console-kubestellar-console --timeout=300s
```

### What This Command Does

1. **Generates a timestamped tag** — `dev-local-20260512-143022`
2. **Builds a Docker image** from the current directory (`.`)
3. **Pushes the image** to your registry
4. **Upgrades the Helm release** with the new image tag
5. **Preserves existing values** via `--reuse-values`
6. **Overrides image settings** to use your new image
7. **Sets development environment variables** for local testing
8. **Waits for Helm** to apply the changes (5 minute timeout)
9. **Waits for Kubernetes** to roll out the new pods (5 minute timeout)

---

## Command Breakdown

### Tag Generation

```bash
TAG="dev-local-$(date +%Y%m%d-%H%M%S)"
```

Creates a unique tag like `dev-local-20260512-143022`. This ensures you can track which build is deployed.

### Docker Build

```bash
docker build -t <YOUR_DOCKER_REGISTRY>/kubestellar-console:$TAG .
```

Builds the console image from the `Dockerfile` in the current directory. The image is tagged with your registry and the generated tag.

### Docker Push

```bash
docker push <YOUR_DOCKER_REGISTRY>/kubestellar-console:$TAG
```

Pushes the newly built image to your container registry so Kubernetes can pull it.

### Helm Upgrade

```bash
helm upgrade --install ks-console ./deploy/helm/kubestellar-console \
  -n kubestellar-console \
  --reuse-values \
  ...
```

| Flag | Purpose |
|------|---------|
| `--install` | Install if the release doesn't exist (idempotent) |
| `-n kubestellar-console` | Deploy to the `kubestellar-console` namespace |
| `--reuse-values` | **Critical** — preserves all existing Helm values from the previous installation |
| `--set image.repository=...` | Overrides the image repository to use your registry |
| `--set image.tag=$TAG` | Overrides the image tag to use your new build |
| `--wait --timeout 300s` | Waits up to 5 minutes for Helm to apply changes |

### GitHub Integration Secrets

```bash
--set github.existingSecret=kc-github \
--set github.existingSecretKeys.clientId=github-client-id \
--set github.existingSecretKeys.clientSecret=github-client-secret \
--set feedbackGithubToken.existingSecret=kc-feedback-token \
--set feedbackGithubToken.existingSecretKey=feedback-github-token \
```

These lines ensure that GitHub OAuth credentials (if deployed separately as Kubernetes secrets) are retained during the upgrade.

**Adjust these values to match your actual secret names** if they differ. If you don't use GitHub OAuth, you can omit these lines.

### Development Environment Variables

```bash
--set extraEnv[0].name=FRONTEND_URL \
--set extraEnv[0].value=http://localhost:8080 \
--set extraEnv[1].name=KAGENTI_CONTROLLER_URL \
--set 'extraEnv[1].value=http://kagenti-backend.kagenti-system.svc:8000' \
```

These inject environment variables into the console deployment:

- **`FRONTEND_URL`** — useful when port-forwarding (`kubectl port-forward`) to access the console locally
- **`KAGENTI_CONTROLLER_URL`** — points to the Kagenti AI backend if deployed in the cluster

**Customize these** based on your environment. If you don't use Kagenti, omit the second variable.

### Rollout Status

```bash
kubectl -n kubestellar-console rollout status deploy/ks-console-kubestellar-console --timeout=300s
```

Waits for the Kubernetes deployment to finish rolling out the new pods. This ensures the command only completes once the new version is fully deployed and ready.

---

## Example Workflows

### Minimal Deployment (No OAuth, No Kagenti)

If you don't have GitHub OAuth or Kagenti, you can simplify the command:

```bash
TAG="dev-local-$(date +%Y%m%d-%H%M%S)" && \
docker build -t docker.io/yourusername/kubestellar-console:$TAG . && \
docker push docker.io/yourusername/kubestellar-console:$TAG && \
helm upgrade --install ks-console ./deploy/helm/kubestellar-console \
  -n kubestellar-console \
  --reuse-values \
  --set image.repository=docker.io/yourusername/kubestellar-console \
  --set image.tag=$TAG \
  --wait --timeout 300s && \
kubectl -n kubestellar-console rollout status deploy/ks-console-kubestellar-console --timeout=300s
```

### With Port-Forwarding

After deploying, if you want to access the console from your local machine:

```bash
kubectl port-forward -n kubestellar-console svc/ks-console-kubestellar-console 8080:80
```

Then open `http://localhost:8080` in your browser.

### Testing Specific Features

If you're testing a specific feature (e.g., AI missions), you might want to tail logs while deploying:

```bash
# In one terminal: deploy the new version
TAG="dev-local-$(date +%Y%m%d-%H%M%S)" && \
docker build -t docker.io/yourusername/kubestellar-console:$TAG . && \
docker push docker.io/yourusername/kubestellar-console:$TAG && \
helm upgrade --install ks-console ./deploy/helm/kubestellar-console \
  -n kubestellar-console \
  --reuse-values \
  --set image.repository=docker.io/yourusername/kubestellar-console \
  --set image.tag=$TAG \
  --wait --timeout 300s

# In another terminal: tail logs
kubectl logs -n kubestellar-console -l app.kubernetes.io/name=kubestellar-console -f
```

---

## Troubleshooting

### Image Pull Errors

**Symptom:** Pods fail with `ImagePullBackOff` or `ErrImagePull`

**Cause:** Kubernetes cannot pull the image from your registry

**Solutions:**
1. Ensure you pushed the image: `docker images | grep kubestellar-console`
2. Verify registry credentials: `kubectl get secret -n kubestellar-console`
3. Check image name matches exactly (including registry and tag)
4. If using a private registry, create an image pull secret:

   ```bash
   kubectl create secret docker-registry regcred \
     -n kubestellar-console \
     --docker-server=<YOUR_REGISTRY> \
     --docker-username=<USERNAME> \
     --docker-password=<PASSWORD>
   
   # Then add to Helm upgrade:
   --set imagePullSecrets[0].name=regcred
   ```

### Rollout Timeout

**Symptom:** Command hangs at `Waiting for deployment rollout to finish...`

**Cause:** Pods are failing to start

**Solutions:**
1. Check pod status: `kubectl get pods -n kubestellar-console`
2. View pod logs: `kubectl logs -n kubestellar-console <pod-name>`
3. Describe the pod: `kubectl describe pod -n kubestellar-console <pod-name>`
4. Check resource limits: ensure the cluster has enough CPU/memory
5. Verify configuration: `kubectl get deploy -n kubestellar-console ks-console-kubestellar-console -o yaml`

### Build Failures

**Symptom:** `docker build` fails

**Cause:** Missing dependencies or incorrect Dockerfile

**Solutions:**
1. Ensure you're in the repository root (where `Dockerfile` is)
2. Clean Docker build cache: `docker builder prune`
3. Check Docker daemon is running: `docker ps`
4. Review build logs for missing files or dependencies

### Helm Upgrade Fails

**Symptom:** Helm returns an error about missing values or invalid chart

**Cause:** Incorrect Helm chart path or incompatible values

**Solutions:**
1. Verify chart path: `ls -la ./deploy/helm/kubestellar-console`
2. Check current values: `helm get values ks-console -n kubestellar-console`
3. Validate the chart: `helm lint ./deploy/helm/kubestellar-console`
4. Remove `--reuse-values` temporarily to start fresh (may lose configuration)

---

## Best Practices

### 1. Use Version Tags

Always use timestamped tags (as shown) rather than `latest`. This ensures:
- You can track which build is deployed
- Kubernetes actually pulls the new image (it caches `latest`)
- You can roll back to a known-good version if needed

### 2. Keep a Deployment Log

Create a simple log file to track deployments:

```bash
echo "$(date): Deployed $TAG to $(kubectl config current-context)" >> deployment-log.txt
```

### 3. Test Locally First

Before deploying to a shared cluster, test your changes locally:

```bash
./startup-oauth.sh  # or ./start-dev.sh
```

Only deploy to the cluster once you've verified the changes work in local mode.

### 4. Clean Up Old Images

Your registry can fill up with dev images over time. Periodically remove old tags:

```bash
# List images
docker images | grep kubestellar-console

# Remove specific tags
docker rmi <YOUR_REGISTRY>/kubestellar-console:dev-local-20260510-120000
```

### 5. Document Environment Variables

If you're using custom `extraEnv` settings, document them in a `deploy-env.yaml` file:

```yaml
# deploy-env.yaml
extraEnv:
  - name: FRONTEND_URL
    value: http://localhost:8080
  - name: KAGENTI_CONTROLLER_URL
    value: http://kagenti-backend.kagenti-system.svc:8000
  - name: MY_CUSTOM_VAR
    value: some-value
```

Then use it with Helm:

```bash
helm upgrade --install ks-console ./deploy/helm/kubestellar-console \
  -n kubestellar-console \
  --reuse-values \
  --set image.repository=<YOUR_REGISTRY>/kubestellar-console \
  --set image.tag=$TAG \
  -f deploy-env.yaml \
  --wait --timeout 300s
```

---

## Related Documentation

- [Installation Guide](./installation.md) — initial console installation
- [Development Methodology](./development.md) — contribution workflow
- [Local Setup](./local-setup.md) — running the console locally
- [Configuration](./configuration.md) — Helm chart configuration options
- [Troubleshooting](./troubleshooting.md) — common issues and solutions

---

## Next Steps

Once your local changes are deployed and tested:

1. **Validate the changes** — test all affected functionality
2. **Check logs** — ensure no errors or warnings
3. **Open a PR** — if the changes are ready for production
4. **Document the change** — update relevant documentation

For contribution guidelines, see the [Development Methodology](./development.md) page.
