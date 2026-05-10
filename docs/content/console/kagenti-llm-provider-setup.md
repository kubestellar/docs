---
title: "Configure Kagenti LLM Providers and API Keys"
linkTitle: "Kagenti LLM Providers"
weight: 11
description: >
  Configure Kagenti with Gemini, Anthropic, or OpenAI by creating the required Kubernetes Secret, setting LLM_PROVIDER, rotating keys safely, and troubleshooting common configuration errors.
---

# Configure Kagenti LLM Providers and API Keys

Use this guide when you deploy `kagenti-backend` for the KubeStellar Console AI Agents dashboard. It covers the supported hosted providers, how to create the `kagenti-llm-secrets` Secret, how to set `LLM_PROVIDER`, and what to check when the backend fails to start.

## Supported providers

| Provider | `LLM_PROVIDER` value | Secret key |
|----------|----------------------|------------|
| Google Gemini | `gemini` | `GEMINI_API_KEY` |
| Anthropic Claude | `anthropic` | `ANTHROPIC_API_KEY` |
| OpenAI | `openai` | `OPENAI_API_KEY` |

Use exactly one `LLM_PROVIDER` value in the Deployment. The selected provider must have its matching API key present in the `kagenti-llm-secrets` Secret.

## Create the Kubernetes Secret

Create the Secret in the same namespace as `kagenti-backend`.

### Gemini

```bash
kubectl create secret generic kagenti-llm-secrets \
  -n kagenti-system \
  --from-literal=GEMINI_API_KEY=your-gemini-api-key
```

### Anthropic

```bash
kubectl create secret generic kagenti-llm-secrets \
  -n kagenti-system \
  --from-literal=ANTHROPIC_API_KEY=your-anthropic-api-key
```

### OpenAI

```bash
kubectl create secret generic kagenti-llm-secrets \
  -n kagenti-system \
  --from-literal=OPENAI_API_KEY=your-openai-api-key
```

If you want to keep more than one provider key available, recreate the Secret with multiple `--from-literal` flags.

## Set `LLM_PROVIDER` in `kagenti-backend`

Update the `env:` block for the `kagenti-backend` container in your `kagenti-backend-deploy.yaml` manifest, then re-apply it.

### Gemini example

```yaml
env:
  - name: KAGENTI_AUTH_ENABLED
    value: "false"
  - name: LLM_PROVIDER
    value: gemini
  - name: GEMINI_API_KEY
    valueFrom:
      secretKeyRef:
        name: kagenti-llm-secrets
        key: GEMINI_API_KEY
```

### Anthropic example

```yaml
env:
  - name: KAGENTI_AUTH_ENABLED
    value: "false"
  - name: LLM_PROVIDER
    value: anthropic
  - name: ANTHROPIC_API_KEY
    valueFrom:
      secretKeyRef:
        name: kagenti-llm-secrets
        key: ANTHROPIC_API_KEY
```

### OpenAI example

```yaml
env:
  - name: KAGENTI_AUTH_ENABLED
    value: "false"
  - name: LLM_PROVIDER
    value: openai
  - name: OPENAI_API_KEY
    valueFrom:
      secretKeyRef:
        name: kagenti-llm-secrets
        key: OPENAI_API_KEY
```

Apply the updated Deployment:

```bash
kubectl apply -f kagenti-backend-deploy.yaml
kubectl rollout status deployment/kagenti-backend -n kagenti-system
```

## Rotate API keys

When you rotate a key, recreate the Secret and restart the backend so the Pod reads the new value.

```bash
kubectl delete secret kagenti-llm-secrets -n kagenti-system
kubectl create secret generic kagenti-llm-secrets \
  -n kagenti-system \
  --from-literal=GEMINI_API_KEY=your-new-gemini-api-key
kubectl rollout restart deployment/kagenti-backend -n kagenti-system
kubectl rollout status deployment/kagenti-backend -n kagenti-system
```

If you use Anthropic or OpenAI instead, replace the literal key name with `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`. If your Secret stores multiple providers, recreate all required entries before restarting the Deployment.

## Troubleshooting

### Pod shows `CreateContainerConfigError`

If the Secret is missing, Kubernetes cannot build the container environment and the Pod stays in `CreateContainerConfigError`.

Check the Pod events:

```bash
kubectl describe pod -n kagenti-system <kagenti-backend-pod-name>
```

Typical symptom:

```text
Error: secret "kagenti-llm-secrets" not found
```

Fix:

1. Create `kagenti-llm-secrets` in `kagenti-system`.
2. Confirm the Secret contains the expected key for your provider.
3. Restart the Deployment:

```bash
kubectl rollout restart deployment/kagenti-backend -n kagenti-system
```

### Wrong `LLM_PROVIDER` value or mismatched key

If `LLM_PROVIDER` is not one of `gemini`, `anthropic`, or `openai`, or if it points to a provider whose key is missing, the backend will not be able to talk to the selected LLM provider.

Check the Deployment configuration and logs:

```bash
kubectl get deployment kagenti-backend -n kagenti-system -o yaml | grep -A6 "LLM_PROVIDER"
kubectl logs deployment/kagenti-backend -n kagenti-system --tail=50
```

Verify that:

- `LLM_PROVIDER` exactly matches one of the supported values.
- The matching Secret key exists in `kagenti-llm-secrets`.
- The Secret and Deployment are in the same namespace.

## Managing keys from the console UI

Today, KubeStellar Console can discover and connect to Kagenti, but it does not manage Kagenti provider secrets for you. Continue to manage `kagenti-llm-secrets` and `LLM_PROVIDER` with `kubectl`, Helm values, or your GitOps workflow. When console-based secret management is available, this guide will be updated.
