---
title: "Troubleshooting — KubeStellar Console install, port-forward, and agent problems"
linkTitle: "Troubleshooting"
weight: 5
description: >
  Diagnose and fix common KubeStellar Console installation problems — PodSecurity
  restricted rejections, stuck PersistentVolumeClaims, dropped port-forwards,
  deploy.sh timeouts, and "Agent Not Connected" states across hosted demo,
  in-cluster Helm, and local kc-agent modes.
keywords:
  - kubestellar console troubleshooting
  - helm chart pod security
  - kubectl port-forward drops
  - kc-agent not connected
  - persistentvolumeclaim pending kind
---

# Troubleshooting the KubeStellar Console install

This page covers the failure modes users hit most often when installing the
console. Each section gives you the exact symptom, the root cause, and a
reproducible remediation. For the canonical Helm chart reference, see the
[chart README](https://github.com/kubestellar/console/tree/main/deploy/helm/kubestellar-console#troubleshooting)
in the `kubestellar/console` repo.

> If you only need to diagnose a "live" symptom, skip to
> [Pre-port-forward diagnostics](#pre-port-forward-diagnostics) — those are
> the same commands the rest of this page assumes you've already run.

## Pre-port-forward diagnostics

Run these **before** starting `kubectl port-forward`. They are the diagnostic
baseline every other section on this page refers to.

```bash
NS=kubestellar-console

# 1. Is the deployment rolled out?
kubectl -n "$NS" rollout status deploy -l app.kubernetes.io/name=kubestellar-console --timeout=180s

# 2. Are the pods actually Ready?
kubectl -n "$NS" get pods -l app.kubernetes.io/name=kubestellar-console -o wide

# 3. Full pod status (Events at the bottom are usually the smoking gun)
kubectl -n "$NS" describe pod -l app.kubernetes.io/name=kubestellar-console

# 4. Last 200 log lines from every container
kubectl -n "$NS" logs -l app.kubernetes.io/name=kubestellar-console --tail=200 --all-containers

# 5. Service exists and targets the pod
kubectl -n "$NS" get svc
kubectl -n "$NS" get endpoints

# 6. PVC is Bound (if persistence is enabled — it is by default)
kubectl -n "$NS" get pvc
```

The console pod needs to reach `Ready: 1/1` before port-forwarding will work.
The startup probe takes roughly 30 seconds on a cold start.

## `kubectl port-forward` hangs, drops, or is refused

**Symptom:** `kubectl port-forward svc/...` prints `Forwarding from ...` but
connections to `localhost:8080` time out, close immediately, or fail with
`connection refused`.

**Cause — in order of likelihood:**

1. Pod is not yet `Ready`. Port-forward opens against the service but the
   selector matches no ready endpoints. Confirm with
   `kubectl -n kubestellar-console get endpoints` — if the endpoint address
   list is empty, the pod is not ready.
2. You port-forwarded to the wrong port. The service listens on
   **port 8080, not 80**. Use `8080:8080`:
   ```bash
   kubectl -n kubestellar-console port-forward svc/kc-kubestellar-console 8080:8080
   ```
3. The pod was killed and replaced after the port-forward was opened (an
   `OOMKilled`, a node eviction, or a `helm upgrade`). Re-run the command —
   `kubectl port-forward` does not automatically reconnect.
4. A local process is already bound to `:8080`. Check with
   `lsof -nP -iTCP:8080 -sTCP:LISTEN` and either stop it or forward to a
   different local port: `kubectl ... port-forward ... 18080:8080`.

**Remediation:** run the [pre-port-forward diagnostics](#pre-port-forward-diagnostics)
first; if the pod is Ready and endpoints are populated, simply re-run the
port-forward. If you need a long-lived external URL instead, switch to
`ingress.enabled=true` (or `route.enabled=true` on OpenShift) — see
[Installation](installation.md#helm-installation).

## PodSecurity `restricted` rejects the pod

**Symptom:** `helm install` succeeds but the pod never starts. `kubectl
describe` shows one of:

- `container has runAsNonRoot and image has non-numeric user (appuser),
  cannot verify user is non-root`
- `violates PodSecurity "restricted:latest": allowPrivilegeEscalation != false`
- `violates PodSecurity "restricted:latest": seccompProfile (pod or container
  must set seccompProfile.type to "RuntimeDefault" or "Localhost")`

**Cause:** the namespace enforces the `restricted` Pod Security Standard.
The chart ships settings that satisfy the profile out of the box:

| Chart value | Default | Why |
|---|---|---|
| `securityContext.runAsUser` | `1001` | Must be numeric — the Dockerfile's `USER appuser` is opaque to the restricted admission plugin. |
| `securityContext.runAsNonRoot` | `true` | |
| `securityContext.allowPrivilegeEscalation` | `false` | |
| `securityContext.capabilities.drop` | `["ALL"]` | |
| `podSecurityContext.seccompProfile.type` | `RuntimeDefault` | |

If you've overridden `securityContext` or `podSecurityContext` in a values
file and dropped any of these keys, the pod will be rejected. Put them back,
or let the chart defaults win by not overriding those blocks.

See `kubestellar/console` issues
[#6323](https://github.com/kubestellar/console/issues/6323) and
[#6334](https://github.com/kubestellar/console/issues/6334) for the history.

## Pod stuck `Pending` on a PersistentVolumeClaim

**Symptom:** `kubectl get pods` shows `Pending`; `kubectl describe pod` shows
`pod has unbound immediate PersistentVolumeClaims` or
`waiting for a volume to be created, either by external provisioner
"..." or manually`.

**Cause:** The chart sets `persistence.enabled: true` and `backup.enabled:
true` by default. On local clusters (Kind, Minikube, k3d) the default
StorageClass uses `volumeBindingMode: WaitForFirstConsumer`, which means the
PV isn't provisioned until a pod is actually scheduled — but if the cluster
has **no** default StorageClass at all, the PVC stays `Pending` forever.

**Remediation — pick one:**

- **Disable persistence for throwaway local evaluation** (simplest):
  ```bash
  helm upgrade --install kc ./deploy/helm/kubestellar-console \
    -n kubestellar-console \
    --set persistence.enabled=false \
    --set backup.enabled=false
  ```
  You lose session/database state across restarts, which is fine for demos.

- **Install a provisioner on Kind** — Kind ships with `rancher.io/local-path`
  by default; if your cluster was built without it, install
  [local-path-provisioner](https://github.com/rancher/local-path-provisioner)
  and mark it the default StorageClass:
  ```bash
  kubectl patch storageclass local-path \
    -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'
  ```

- **Point the chart at an existing StorageClass:**
  ```bash
  helm upgrade --install kc ./deploy/helm/kubestellar-console \
    -n kubestellar-console \
    --set persistence.storageClass=my-storage-class
  ```

The `WaitForFirstConsumer` delay is **normal** — the PVC will stay unbound
until the pod is scheduled. You only need to act if the PVC is still
unbound *after* the pod has been created.

## `deploy.sh` fails with `context deadline exceeded`

**Symptom:** running the one-liner deploy script —

```bash
curl -sSL https://raw.githubusercontent.com/kubestellar/console/main/deploy.sh | bash
```

— fails with `Error: context deadline exceeded` or `timed out waiting for
the condition` roughly two minutes in.

**Cause:** `deploy.sh` hardcodes `--wait --timeout 120s` on `helm install`.
On Kind, Minikube, and fresh clusters the image pull alone frequently
exceeds two minutes, so the helm call fails before the pod is Ready even
though the install will eventually succeed.

**Remediation:**

1. **Pre-pull the image** before running the script:
   ```bash
   docker pull ghcr.io/kubestellar/console:latest
   kind load docker-image ghcr.io/kubestellar/console:latest --name <your-kind-cluster>
   ```
   Then re-run `deploy.sh`.
2. **Or skip `deploy.sh` entirely** and call Helm directly with a longer
   timeout:
   ```bash
   helm install kc oci://ghcr.io/kubestellar/charts/kubestellar-console \
     -n kubestellar-console --create-namespace \
     --wait --timeout 10m
   ```

See `deploy.sh` vs direct Helm comparison in
[Installation → deploy.sh vs direct Helm](installation.md#deploysh-vs-direct-helm).

## "Agent Not Connected" / cluster actions fail

The console shows an orange **Agent Not Connected** banner, terminal
commands hang, and AI Missions that need `kubectl` fail. The remediation
depends on **which mode** your console is running in.

| Mode | How you installed | Where kc-agent runs | Fix |
|---|---|---|---|
| **Hosted demo** | You're on `https://console.kubestellar.io` | There is no agent — hosted demo is read-only | Nothing to fix; see [Hosted demo limitations](#hosted-demo-limitations) below |
| **Local (from source / curl)** | `start.sh`, `start-dev.sh`, or `startup-oauth.sh` | Same process, port **8585** | Restart the console process; it spawns kc-agent as a child |
| **Helm / in-cluster** | `helm install` | On your **workstation**, not in the cluster | Run `kc-agent` locally (see below) |

### In-cluster (Helm) mode — start kc-agent on your workstation

The Helm chart deploys the console backend inside the cluster but **not**
kc-agent — kc-agent needs direct access to your local kubeconfig and runs
on *your* laptop.

```bash
# Install
brew tap kubestellar/tap
brew install kc-agent

# Run (listens on 127.0.0.1:8585 by default)
kc-agent
```

Then reload the console tab. The "Agent Not Connected" banner should clear
within a few seconds as the browser's WebSocket finds the local agent.

If you are trying to register clusters through kubeconfig, also review
[Cluster Registration](cluster-registration.md) for the expected kubeconfig
shape and multi-context behavior.

Without kc-agent the in-cluster console will fall back to **demo mode** if
it was deployed without GitHub OAuth, or will simply refuse to execute
`kubectl` commands if OAuth is configured.

### Hosted demo limitations

`https://console.kubestellar.io` is a **strict capability boundary**, not a
degraded version of the real product:

- Every cluster you see is a fixture. No real workloads are affected by
  anything you click.
- AI Missions generate plans but cannot apply them.
- You will be **signed out intermittently and intentionally** — the hosted
  demo forces logout to reset state. This is not a bug. Install locally
  (see [Quick Start](quickstart.md)) if you need a persistent session.
- Any "install" / "deploy" / "upgrade" button in the hosted demo is a
  no-op dry run.

If the behavior you want isn't in the hosted demo, you need a local install.

## Forced logout in demo mode

**Symptom:** you're signed in to a local console with `DEMO_MODE=true` (or
to `console.kubestellar.io`) and you get logged out unexpectedly.

**Cause:** this is **intentional**. Demo mode periodically forces a logout
to reset session state so the next user sees a clean demo. It is not a
token expiry bug and not something to report as broken auth.

If you need a persistent session, disable demo mode or configure real
GitHub OAuth — see [Authentication](authentication.md).

## JWT secret surprises

The chart behavior differs depending on how you supplied the JWT secret:

| Scenario | Behavior |
|---|---|
| `jwt.secret` empty and `jwt.existingSecret` empty (**default**) | Chart auto-generates a 64-character random JWT secret on first install and stores it in the release-fullname Secret. Subsequent `helm upgrade` calls reuse the existing value. |
| `jwt.secret` set inline | Chart uses that exact value. Changing it rotates the key and **invalidates all active sessions**. |
| `jwt.existingSecret` set | Chart reads the key from the named Secret (key defaults to `jwt-secret`). The **Secret must exist before `helm install`** or the pod will fail with `CreateContainerConfigError`. |

**If users see `JWT signature verification failed` after an upgrade:**
somebody rotated the key. Have users sign out and back in, and restart the
pods so they pick up the latest Secret:

```bash
kubectl -n kubestellar-console delete pod \
  -l app.kubernetes.io/name=kubestellar-console
```

## `CreateContainerConfigError: secret "..." not found`

**Symptom:** pod is stuck in `CreateContainerConfigError`;
`kubectl describe pod` says `secret "kc-oauth-secret" not found` (or
similar).

**Cause:** you passed `github.existingSecret=<name>` or
`jwt.existingSecret=<name>` to Helm, but that Secret **does not exist in
the release namespace**. Helm does not create it for you — that's the whole
point of the "bring your own secret" mode.

**Remediation:** create the Secret first, then force the pod to restart:

```bash
kubectl -n kubestellar-console create secret generic kc-oauth-secret \
  --from-literal=github-client-id="YOUR_CLIENT_ID" \
  --from-literal=github-client-secret="YOUR_CLIENT_SECRET"

kubectl -n kubestellar-console delete pod \
  -l app.kubernetes.io/name=kubestellar-console
```

The chart's default `existingSecretKeys` are `github-client-id` and
`github-client-secret` — if your Secret uses different keys, set
`github.existingSecretKeys.clientId` and
`github.existingSecretKeys.clientSecret` accordingly.

## Retrying a failed install

If Helm left the release in a broken state (stuck `pending-install`,
`pending-upgrade`, or half-created resources), **do not** re-run the exact
same `helm install` command — you'll get `cannot re-use a name that is
still in use`.

**Clean retry:**

```bash
NS=kubestellar-console
REL=kc

# 1. Uninstall the broken release (safe even if resources are half-created)
helm uninstall "$REL" -n "$NS" || true

# 2. Delete any leftover PVC if you want a truly fresh start
kubectl -n "$NS" delete pvc -l app.kubernetes.io/instance="$REL" --ignore-not-found

# 3. Re-run with a longer timeout so image pull doesn't kill the install
helm install "$REL" oci://ghcr.io/kubestellar/charts/kubestellar-console \
  -n "$NS" --create-namespace \
  --wait --timeout 10m
```

If `helm uninstall` itself hangs, add `--no-hooks` and finish cleaning up
resources manually with `kubectl delete`.

## Related pages

- [Installation](installation.md) — all deployment paths
- [Quick Start](quickstart.md) — 5-minute path
- [Architecture](architecture.md) — how the pieces fit together
- [Authentication](authentication.md) — GitHub OAuth setup
- [Persistence](persistence.md) — PVC and backup behavior
