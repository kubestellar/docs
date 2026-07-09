> ⚠️ **Important notice**
>
> Release **v0.9.2** of Kubeflex is **broken** due to a known image tag mismatch issue.
> Please **do not use this version**.

# User's Guide

## Breaking changes

### v0.9.0

Kubeflex configuration is stored within Kubeconfig file. Prior this version, `kflex` put its configuration under

```yaml
preferences:
  extensions:
  - extension:
      data:
        kflex-initial-ctx-name: kind-kubeflex  # indicates to kflex the hosting cluster context
      metadata:
        name: kubeflex-config
```

Kubeflex configuration is now stored as part of the kubeconfig extension data, hence the value of `kflex-initial-ctx-name` key is now stored in the KUBECONFIG environment variable.

## Installation

Installation instructions are [here](quick-start.md).

## Usage

### Create a control plane

To create a control plane use the command:

```shell
kflex create <control-plane-name>
```

This command creates a control plane with the name `<control-plane-name>`. The control plane hosts a series of Kubernetes objects that will be used by the KubeStellar system. These include hosting the WEC (Workload Execution Cluster) related APIs and the WDS (Workload Distribution System) API.

If there are multiple hosting clusters available, you may want to use a different hosting cluster for the new control plane.

```shell
kflex create <control-plane-name> --hosting-cluster <hosting-cluster-context-name>
```

To delete a control plane, use:

```shell
kflex delete <control-plane-name>
```

To view the available hosting clusters, use:

```shell
kflex get hosting-clusters
```

To view the available control planes:

```shell
kflex get control-planes
```

To initialize your kubeconfig with a control plane context use:

```shell
kflex init <control-plane-name>
```

This adds a context to your kubeconfig file for the control plane. The context will have the name `<control-plane-name>`.

### Using the control plane

After initializing with a control plane you can access the control plane with your preferred tool. For example:

```shell
kubectl --context=<control-plane-name> api-resources
```

or

```shell
kubectl --context <control-plane-name> apply -f -
```

See [below](#accessing-the-control-plane-without-the-kubeflex-cli-context-name) for an alternative way to access the control plane.

### Using kubectl instead of kflex for a ControlPlane CR

Instead of using the KubeFlex CLI, you can create a ControlPlane CR in the hosting cluster and KubeFlex will manage the control plane for you. You can also view the ControlPlane CR in the hosting cluster to understand the structure and create similar CRs.

To create a ControlPlane CR, first see what a default ControlPlane CR looks like:

```shell
kflex get hosting-clusters
```

You can use this command to get the hosting cluster name. Then use the name of the hosting cluster to get the information of a ControlPlane CR that is already present:

```shell
kubectl --context <hosting-cluster-context-name> get controlplanes -A
```

If there is not currently a kubeconfig context named for that control plane then that command requires your kubeconfig file to hold an extension that `kflex init` created to hold the name of the hosting cluster context. See [below](#hosting-context) for more information.


The same result can be accomplished with kubectl by using the `ControlPlane` CR, for example:


```shell
kubectl apply -f - <<EOF
apiVersion: tenancy.kflex.kubestellar.org/v1alpha1
kind: ControlPlane
metadata:
  name: my-cp
spec:
  hosting_cluster_context: kind-kubeflex
EOF
```

You can verify the ControlPlane was created successfully by using:

```shell
kubectl get cp --context kind-kubeflex
```

Or you can access the `kflex` CLI's shorthand:

```shell
kflex get control-planes
```

### Accessing the ControlPlane without the KubeFlex CLI

#### With a context name

You can access the ControlPlane with a context name in the kubeconfig:

```shell
kubectl --context=<control-plane-name>
```

#### Without a context name

If there is not currently a kubeconfig context named for that control plane then that command requires your kubeconfig file to hold an extension that `kflex init` created to hold the name of the hosting cluster context. See [below](#hosting-context) for more information.

#### Using kubectl to delete a control plane

You can also delete the ControlPlane object directly. To delete it from the hosting cluster:

```shell
kubectl --context <hosting-cluster-context-name> delete controlplane <control-plane-name>
```

### Using the kubeflex CLI to delete a ControlPlane

To delete a control plane with the kubeflex CLI use the command:

```shell
kflex delete <control-plane-name>
```

If you are not using the kflex CLI to create the control plane and require access to the control plane,
you may retrieve the secret containing the control plane Kubeconfig, which is hosted in the control
plane hosting namespace (by convention `\<control-plane-name\>-system`) and is named `admin-kubeconfig`.

### Adopting External Clusters

This section provides a guide for adopting an external KubeStellar cluster for management by KubeFlex.

#### Prerequisites

Before proceeding, ensure that:

1. You have KubeFlex installed and running on your hosting cluster.
2. An external Kubernetes cluster (`ext1`) exists and is accessible from your KubeFlex hosting cluster.
3. A valid kubeconfig file exists for the external cluster.
4. The external cluster's kubeconfig is available on your local machine (typically at `~/.kube/config` or another location).

#### Adoption Process

To adopt an external cluster, use the following command:

```shell
kflex adopt <external-cluster-kubeconfig-path> --adopted-context kind-ext1 --url-override https://ext1-control-plane:6443 ext1
```

#### Explanation of command parameters:

- `--adopted-context kind-ext1`:
    This specifies the context name, kind-ext1, for the ext1 cluster. Ensure that this context is correctly set in your current kubeconfig file.

- `--url-override https://ext1-control-plane:6443`:
    This parameter sets the endpoint URL for the external control plane. It's crucial to use this option when the server URL in the existing kubeconfig uses a local loopback address, which is common for kind or k3d servers running on your local machine. Here, replace https://ext1-control-plane:6443 with the actual endpoint you have determined for your external control plane in the previous step.

- `ext1`:
   This is the name of the new control plane.

#### Verification

You can verify the adoption by running:

```shell
kflex get control-planes
```

This should now list the newly adopted control plane.

#### Accessing the adopted control plane

Once adopted, you can interact with the adopted control plane just like any other KubeFlex-managed control plane:

```shell
kflex init ext1
```

This initializes a kubeconfig context for the adopted control plane.

```shell
kubectl --context=ext1 get nodes
```

### Adopting OCM Agent

This section provides a guide for adopting an external cluster for management by KubeStellar using OCM agents.

#### Prerequisites

Before proceeding, ensure the following:

1. You have KubeFlex installed and running on your hosting cluster.
2. An external Kubernetes cluster exists.
3. A valid kubeconfig file exists for the external cluster.
4. OCM is installed on the external cluster.

#### Adoption Process

First, you need to retrieve the hosting cluster context. Use this command:

```shell
kflex get hosting-clusters
```

You can use this command to get the hosting cluster name. Then use the name of the hosting cluster to find out a running hub instance by:

```shell
kubectl --context <hosting-cluster-context-name> get managedclusters -A
```

Then, run the following command to adopt an external cluster using OCM agents:

```shell
kflex adopt ocm <hosted-cluster-name>
```

Where `<hosted-cluster-name>` is the name of the external cluster.

#### Verification

You can verify the adoption by running:

```shell
kflex get control-planes
```

This should now list the newly adopted control plane.

You can view the adoption status for managed clusters:

```shell
kubectl --context <hosting-cluster-context-name> get managedclusters -A
```

### Re-initializing hosting clusters

You can reinitialize a hosting cluster by using the kflex CLI:

```shell
kflex init-hosting-cluster <hosting-cluster-context-name>
```

After this command, you can use the hosting cluster as a KubeFlex hosting cluster.

### Accessing the control plane without the KubeFlex CLI context name

If there is not currently a kubeconfig context named for that control plane, you may retrieve the secret containing the control plane Kubeconfig, which is hosted in the control plane hosting namespace (by convention `\<control-plane-name\>-system`) and is named `admin-kubeconfig`.

#### The kubectl way

You can retrieve this with kubectl:

```shell
kubectl get secret admin-kubeconfig --context=<hosting-cluster-context> -n <control-plane-name>-system -o jsonpath='{.data.kubeconfig}' | base64 --decode
```

Or you can get the secret and save it to a file:

```shell
kubectl --context=<hosting-cluster-context> get secret admin-kubeconfig -n <control-plane-name>-system -o yaml | grep "kubeconfig:" | awk '{print $2}' | base64 --decode > kubeflex-kubeconfig.yaml
```

#### The kflex CLI way

You can retrieve this with the kflex CLI using:

```shell
kflex exec <control-plane-name> -- cat /etc/kubernetes/admin.conf
```

Once you have retrieved the kubeconfig, you can add it to your kubeconfig file and reference it with `kubectl` by specifying the `--kubeconfig` flag:

```shell
kubectl --kubeconfig=kubeflex-kubeconfig.yaml <command>
```

### Using External Docker Network

If you're not utilizing the default `kind` network, you'll need to make sure that the external cluster `ext1`
and the KubeFlex hosting cluster are on the same docker network.

```shell
docker inspect ext1-control-plane | jq '.[].NetworkSettings.Networks | keys[]'
docker inspect kubeflex-control-plane | jq '.[].NetworkSettings.Networks | keys[]'
```

To set the docker network, use:

```shell
docker network create kflex-network
docker network connect kflex-network ext1-control-plane
docker network connect kflex-network kubeflex-control-plane
```

## Adopting the external cluster


Explanation of command parameters:

- `--adopted-context kind-ext1`:
    This specifies the context name, kind-ext1, for the ext1 cluster. Ensure that this context is correctly set in your current kubeconfig file.

- `--url-override https://ext1-control-plane:6443`:
    This parameter sets the endpoint URL for the external control plane. It's crucial to use this option when the server URL in the existing kubeconfig uses a local loopback address, which is common for kind or k3d servers running on your local machine. Here, replace https://ext1-control-plane:6443 with the actual endpoint you have determined for your external control plane in the previous step.

- `ext1`:
   This is the name of the new control plane.

## Adopting OCM Agent

This section provides a guide for adopting an external cluster for management by KubeStellar using OCM agents.

### Prerequisites

Before proceeding, ensure the following:

1. You have KubeFlex installed and running on your hosting cluster.
2. An external Kubernetes cluster exists.
3. A valid kubeconfig file exists for the external cluster.
4. OCM is installed on the external cluster.

### Adoption Process

First, you need to retrieve the hosting cluster context. Use this command:

```shell
kflex get hosting-clusters
```

You can use this command to get the hosting cluster name. Then use the name of the hosting cluster to find out a running hub instance by:

```shell
kubectl --context <hosting-cluster-context-name> get managedclusters -A
```

Then, run the following command to adopt an external cluster using OCM agents:

```shell
kflex adopt ocm <hosted-cluster-name>
```

Where `<hosted-cluster-name>` is the name of the external cluster.

### Verification

You can verify the adoption by running:

```shell
kflex get control-planes
```

This should now list the newly adopted control plane.

You can view the adoption status for managed clusters:

```shell
kubectl --context <hosting-cluster-context-name> get managedclusters -A
```

## KubeFlex CLI reference

### Initialization and Setup

```bash
kflex init [KUBECONTEXT]
  Initialize a control plane and add it to your kubeconfig.
  If KUBECONTEXT is not specified, it defaults to the hosting cluster context.
```

### Hosting Cluster Management

The following commands work with hosting clusters.

```bash
kflex init-hosting-cluster <hosting-cluster>
  Initialize a hosting cluster.
```

### Control Plane Management

The following commands work with control planes.

```bash
kflex create <control-plane>
  Create a control plane with the default name.

kflex delete <control-plane>
  Delete a control plane by name.

kflex get control-planes
  List the available control planes.
```

## Adoption Commands

```bash
kflex adopt [KUBECONFIG] --adopted-context <context> --url-override <url> <control-plane>
  Adopt an external cluster as a control plane.

kflex adopt ocm <hosted-cluster>
  Adopt an external cluster using OCM agents.
```

## Hosting Context

The hosting context is the kubeconfig context of the hosting cluster where the control planes will be hosted. Initially, `kflex init` stores this context name in the kubeconfig extension data under the key `kflex-initial-ctx-name`.

If there is not currently a kubeconfig context named for that control plane then that command requires your kubeconfig file to hold an extension that `kflex init` created to hold the name of the hosting cluster context. When you use the `kflex init` command, it stores the hosting cluster context name in the kubeconfig extension data.

You can retrieve the hosting cluster context by using:

```shell
kubectl config get-context
```
