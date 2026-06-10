# KubeStellar + OpenZiti

[OpenZiti](https://openziti.io/) is an open source zero-trust overlay networking platform that enables secure, software-defined connectivity between services — regardless of network topology, firewalls, or NAT. KubeStellar and OpenZiti address complementary problems: KubeStellar orchestrates *what runs where* across clusters; OpenZiti secures *how those clusters communicate*.

## How They Work Together

In edge and multi-cloud deployments, target clusters often lack direct network connectivity: they sit behind corporate firewalls, in air-gapped environments, or on untrusted networks. OpenZiti solves the connectivity problem using its zero-trust overlay, while KubeStellar handles workload placement and policy distribution across those clusters.

Key integration points:

- **Cluster-to-cluster communication**: OpenZiti tunnels secure connections between the KubeStellar control plane and edge clusters without requiring public IPs or open firewall ports
- **Workload service mesh**: Services deployed by KubeStellar across clusters can communicate over OpenZiti's overlay, eliminating the need for VPNs or IP routing across sites
- **Zero-trust posture**: Every connection is authenticated and encrypted by identity, not network location — essential for edge deployments in untrusted environments

## Architecture

```text
┌─────────────────────────────────────────────────────┐
│  KubeStellar Control Plane                           │
│  ┌─────────────────────────────────────────────────┐│
│  │  WDS + ITS + KubeFlex                           ││
│  └─────────────────────────────────────────────────┘│
│                     │ OpenZiti Tunnel                │
└─────────────────────┼───────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
   │ Edge    │   │ Edge    │   │ Edge    │
   │Cluster 1│   │Cluster 2│   │Cluster 3│
   │(factory)│   │(retail) │   │(branch) │
   └─────────┘   └─────────┘   └─────────┘
   OpenZiti      OpenZiti       OpenZiti
   Tunneler      Tunneler       Tunneler
```

Each edge cluster runs an OpenZiti tunneler. The KubeStellar control plane connects to edge clusters through the OpenZiti overlay, not direct network access.

## Prerequisites

- A running KubeStellar control plane
- OpenZiti Controller deployed (cloud-hosted via [CloudZiti](https://cloudziti.io/) or self-hosted)
- OpenZiti CLI (`ziti`) installed: see [OpenZiti downloads](https://github.com/openziti/ziti/releases)
- Kubernetes access to each cluster you want to connect

## Install the OpenZiti Tunneler on Edge Clusters

Deploy the OpenZiti `ziti-host` tunneler as a DaemonSet or Deployment on each edge cluster. This makes the cluster's services reachable via the OpenZiti overlay.

```shell
# Add the OpenZiti Helm chart repository
helm repo add openziti https://docs.openziti.io/helm-charts
helm repo update

# Install the tunneler on an edge cluster
helm install ziti-host openziti/ziti-host \
  --namespace ziti \
  --create-namespace \
  --set zitiIdentity="<base64-encoded-identity-json>" \
  --kube-context <edge-cluster-context>
```

Generate an identity for each cluster from your OpenZiti Controller:

```shell
ziti edge create identity device <cluster-name> \
  --role-attributes edge-clusters \
  -o /tmp/<cluster-name>.json

# Base64-encode for the Helm value
cat /tmp/<cluster-name>.json | base64
```

## Configure KubeStellar to Use the OpenZiti Network

If your KubeStellar control plane needs to reach edge clusters through the OpenZiti overlay, run the `ziti-edge-tunnel` on the machine hosting the control plane:

```shell
# Linux — install and run the tunneler with your controller identity
sudo ziti-edge-tunnel run \
  --identity-dir /etc/ziti/identities \
  &
```

This makes the edge cluster API servers reachable at their OpenZiti service addresses, even if they have no public endpoint.

## Distribute OpenZiti Configuration via KubeStellar

You can use KubeStellar to distribute OpenZiti identity Secrets to edge clusters at scale. Define the Secret in the WDS and create a `BindingPolicy`:

```yaml
# Secret containing OpenZiti identity (one per cluster, or a shared service identity)
apiVersion: v1
kind: Secret
metadata:
  name: openziti-identity
  namespace: ziti
type: Opaque
data:
  identity.json: <base64-encoded-identity>
```

```yaml
apiVersion: control.kubestellar.io/v1alpha1
kind: BindingPolicy
metadata:
  name: openziti-identity-policy
  namespace: ziti
spec:
  clusterSelectors:
  - matchLabels:
      network: openziti
  downsync:
  - objectSelectors:
    - matchLabels: {}
    apiGroups: [""]
    resources: ["secrets"]
    namespaces: ["ziti"]
```

This pushes the OpenZiti identity secret to all clusters labeled `network: openziti`, enabling the tunneler to start automatically after cluster onboarding.

## Verifying Connectivity

After deploying the tunneler and configuring identities:

```shell
# List services visible through the OpenZiti overlay
ziti edge list services

# Verify the edge cluster API is reachable through the tunnel
kubectl get nodes --context <edge-cluster-context>
```

## Use Cases

- **Air-gapped edge clusters**: Factory floors, retail locations, and remote sites with no inbound connectivity
- **Zero-trust multi-cloud**: Connect clusters across AWS, Azure, GCP, and on-prem without VPNs or peering
- **Secure IoT/edge workloads**: Distribute workloads to IoT gateways and edge devices with mutual TLS enforcement
- **Regulated industries**: Healthcare and financial deployments requiring end-to-end encryption with identity-based access control

## How to Get This Working with Your KubeStellar Instance

[Join the conversation on Slack](https://cloud-native.slack.com/archives/C097094RZ3M) in `#kubestellar-dev`. We're actively developing the KubeStellar + OpenZiti integration guide and welcome contributors with edge networking experience.

## Resources

- [OpenZiti documentation](https://openziti.io/docs/)
- [OpenZiti Helm charts](https://docs.openziti.io/helm-charts/)
- [OpenZiti GitHub](https://github.com/openziti/ziti)
- [KubeStellar quickstart](../../kubestellar/get-started.md)
- [KubeStellar BindingPolicy reference](../../kubestellar/binding.md)

<style type="text/css">
.centerImage
{
 display: block;
 margin: auto;
}
</style>
