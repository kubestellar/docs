# Status-AddOn

Agent and Controller built with the Open Cluster Management 
[Add-On Framework](https://open-cluster-management.io/concepts/addon/)
to provide deep status for selected resources.

# TL;DR

The OCM status addon consists of a controller and an agent. The controller 
is responsible for installing the agent addon on all clusters. The agent is responsible
for monitoring the objects delivered by the OCM work agent, and report their statuses 
back to the OCM Hub using WorkStatus objects. The addon uses the OCM Add-on Framework 
and RBAC permissions to enable this functionality.

## Prereqs

- go version 1.23 and up
- make
- kubectl
- docker (or compatible docker engine that works with kind)
- kind
- helm

## Setup

1. Clone this repo.

2. Setup KubeStellar as described in [setup](https://docs.kubestellar.io/release-0.29.0/direct/get-started/), then install
   status add-on with helm:
    ```shell
    helm --kube-context imbs1 upgrade --install ocm-status-addon -n open-cluster-management oci://ghcr.io/kubestellar/ocm-status-addon-chart --version <latest version>
    ```
3. Check status of agent deployments
    ```shell
    kubectl --context imbs1 -n cluster1 get managedclusteraddons addon-status
    kubectl --context imbs1 -n cluster2 get managedclusteraddons addon-status
    ```
    After agents start and are running, `AVAILABLE` should be `True` on both namespaces

## Using the Add-On

1. Deploy a workload with KubeStellar, for example following [Scenario 4](https://docs.kubestellar.io/release-0.29.0/direct/example-scenarios/#scenario-4-singleton-status)

2. Verify that `WorkStatus` objects are created in `imbs1` managed clusters namespaces 
    ```shell
    kubectl --context imbs1 get workstatuses -n cluster1 
    kubectl --context imbs1 get workstatuses -n cluster2
    ```

3. Inspect one of the statuses (change `WS_NAME` based on your scenario). You should be able to see a full status.
    ```shell
    WS_NAME=appsv1-deployment-nginx-nginx-deployment
    kubectl --context imbs1 get workstatuses -n cluster1 ${WS_NAME} -o yaml
    ```

## Uninstalling the add-on

To uninstall the status add-on, use the following helm command:

```shell
helm --kube-context imbs1 -n open-cluster-management delete ocm-status-addon
```