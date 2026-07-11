# Example Deployment: A Homelab Console (Bluefin Server)

This page walks through a real deployment: shipping the KubeStellar Console as
the out-of-the-box management UI for a home-infrastructure distribution. The
worked example is **[Bluefin Server](https://projectbluefin.io/server/)** —
image-based, auto-updating homelab nodes where "step 1" is *go to this IP,
and it's KubeStellar*. The same recipe applies to any product or lab that
wants a curated console on a blank Kubernetes cluster.

The goals, in the words of the request:

- **Minimal, core set** — a CS101 student's first cluster, not sixty dashboards
- **Zero Helm** — plain `kubectl`, no values files, no chart debugging
- **Auto-updating** — image-based, matching the Bluefin ethos
- Room to grow — users add dashboards and cards over time

---

## Install (three commands)

On any blank Kubernetes cluster (kind, k3s, Talos, OpenShift, cloud):

```bash
# 1. Namespace
kubectl create namespace kubestellar-console

# 2. JWT signing secret (generated locally — the console refuses to start without one)
kubectl -n kubestellar-console create secret generic kubestellar-console-jwt \
  --from-literal=jwt-secret="$(openssl rand -base64 48)"

# 3. The starter experience
kubectl apply -k 'https://github.com/kubestellar/console/tree/main/deploy/kustomize/overlays/starter'
```

Then open it:

```bash
kubectl -n kubestellar-console port-forward svc/kubestellar-console 8080:8080
# → http://localhost:8080
```

That's the whole install. No Helm repo, no chart values, no OAuth prerequisite.

## What the user lands on

The `starter` overlay sets `ENABLED_DASHBOARDS=dashboard,workloads,nodes`, so
the sidebar shows exactly three dashboards — mapping one-to-one onto the
"every node, every service, every container" promise:

| Dashboard | Default cards | Homelab meaning |
|-----------|---------------|-----------------|
| **Dashboard** | cluster health, hardware health, resource usage, pod issues, live event stream, deployment status, events timeline | "Is my lab OK?" — the single pane |
| **Workloads** | deployments, deployment issues, statefulsets, daemonsets, jobs, cronjobs | Every service and container you run |
| **Nodes** | node status (full-width), resource usage, capacity, top pods, upgrade status | Every machine in the rack/closet |

The onboarding questionnaire is skipped (`SKIP_ONBOARDING=true`) — first
visit lands directly on the dashboard. Everything else in the console stays
one click away: users add dashboards through the sidebar customizer and cards
through the Marketplace, so the surface grows with the user.

## Staying current

The kustomize base tracks the **`latest`** release channel on
`ghcr.io/kubestellar/console`. Every nightly and weekly console release pushes
the moving tags `latest` / `nightly` / `weekly` plus an immutable version tag,
and `:latest` implies `imagePullPolicy: Always` — so every fresh install and
pod restart runs the newest console with zero manifest changes. The in-app
self-upgrade can also roll the deployment forward from the UI.

Distributions that want reproducible builds pin an immutable tag in their own
overlay instead:

```yaml
# kustomization.yaml — a downstream distro overlay
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - https://github.com/kubestellar/console/deploy/kustomize/overlays/starter?ref=main
images:
  - name: ghcr.io/kubestellar/console
    newTag: v0.3.34-nightly.20260709   # or: weekly
```

## Customizing the starter set

The dashboard list is one env var. A distro overlay can rebrand and re-curate
without forking anything:

```yaml
patches:
  - patch: |-
      apiVersion: apps/v1
      kind: Deployment
      metadata:
        name: kubestellar-console
      spec:
        template:
          spec:
            containers:
              - name: kubestellar-console
                env:
                  - name: ENABLED_DASHBOARDS
                    value: dashboard,workloads,nodes,storage,gpu
                  - name: APP_NAME
                    value: Bluefin Server
                  - name: THEME_COLOR
                    value: "#1e66f5"
```

Dashboard IDs live in `web/src/hooks/useSidebarConfig.ts` in the console repo
(`DEFAULT_PRIMARY_NAV` + `DISCOVERABLE_DASHBOARDS`) — `storage`, `network`,
`events`, `gpu`, `helm`, `security`, and friends are all available.

## OpenShift

`overlays/openshift` layers an edge-terminated Route and the SCC patches
(restricted-v2 rejects the chart-default fixed UID) on top of the starter:

```bash
kubectl apply -k 'https://github.com/kubestellar/console/tree/main/deploy/kustomize/overlays/openshift'
```

When exposing on a real hostname (Route or Ingress), set `FRONTEND_URL` so
auth redirects return to the right place:

```bash
kubectl -n kubestellar-console set env deployment/kubestellar-console \
  FRONTEND_URL=https://console.lab.example.com
```

## Live data vs. demo data

The console starts with sample data (marked with a yellow **Demo** badge) and
switches to live cluster data once you sign in. Without GitHub OAuth
configured, the login page offers a one-click **Set up GitHub Sign-In** wizard
that creates the OAuth app for you. The in-cluster ServiceAccount already has
read access to nodes, workloads, and events, so live data flows immediately
after sign-in — no agent required.
(A fix is in flight to skip the sign-in step entirely on in-cluster installs
without OAuth — see
[kubestellar/console#20823](https://github.com/kubestellar/console/issues/20823).)

## How this was verified

Both variants were tested end-to-end from the public GitHub URLs before this
page was written:

- **Vanilla Kubernetes** (fresh kind cluster): three commands → pod Ready,
  PVCs bound, `/health` returning the three starter dashboards, auth redirect
  landing on the documented `localhost:8080` port-forward.
- **OpenShift 4.18**: `overlays/openshift` → Route serving the UI, sidebar
  showing exactly Dashboard / Workloads / Nodes, no onboarding wizard.

## Connecting to a hive

A homelab console is a natural hive member: the same nodes that run your
services can host supervised agents, and the console gives the humans in the
loop a single pane for both. Connect the cluster to your hive hub and the
Dashboard's event stream and workload cards cover the agent workloads too —
see the [hive introduction](readme.md) and [architecture](architecture.md).
