# Deploy Helm Charts Through a WDS

This tutorial shows how to use Helm with KubeStellar when the Workload Execution
Clusters (WECs) are not directly reachable from the machine where you run Helm.

The key idea is to install the chart into a Workload Description Space (WDS), not
into each WEC. Helm renders and creates Kubernetes objects in the WDS. A
`BindingPolicy` then selects those objects and KubeStellar delivers them to the
selected WECs.

## Before You Begin

Complete the setup in [Getting Started](get-started.md) and define the shell
variables from [Example Scenarios](example-scenarios.md#assumptions-and-variables).
This tutorial uses:

- `wds_context`: the kubeconfig context for the WDS.
- `wec1_context` and `wec2_context`: kubeconfig contexts for two WECs.
- `label_query_both`: a label query that selects both WECs from the Inventory
  and Transport Space (ITS).

The WEC contexts are only needed for direct verification in the demo setup. In a
production environment where you do not have direct WEC access, keep the Helm
workflow pointed at the WDS and use your normal KubeStellar or cluster-observability
signals to verify delivery.

You also need the `helm` and `kubectl` commands installed locally.

## Create the BindingPolicy

Create a `BindingPolicy` that selects WECs using `label_query_both` and selects
Helm-created workload objects by the labels Helm adds to chart resources. If you
use a different chart, check its rendered labels and adjust the object selector
to match the resources you want to deliver.

```shell
kubectl --context "$wds_context" apply -f - <<EOF
apiVersion: control.kubestellar.io/v1alpha1
kind: BindingPolicy
metadata:
  name: postgres-bpolicy
spec:
  clusterSelectors:
  - matchLabels: {$(echo "$label_query_both" | tr , $'\n' | while IFS="=" read key val; do echo -n ", \"$key\": \"$val\""; done | tail -c +3)}
  downsync:
  - objectSelectors:
    - matchLabels: {
      "app.kubernetes.io/managed-by": "Helm",
      "app.kubernetes.io/instance": "postgres"}
EOF
```

The `clusterSelectors` field chooses where the workload goes. The
`downsync.objectSelectors` field chooses what objects in the WDS should be sent.

## Install the Chart Into the WDS

Create and label the namespace first. The namespace must be selected by the same
`BindingPolicy` so namespaced chart objects have a destination namespace in each
WEC.

```shell
kubectl --context "$wds_context" apply -f - <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: postgres-system
  labels:
    app.kubernetes.io/managed-by: Helm
    app.kubernetes.io/instance: postgres
EOF
```

Install the chart with Helm, targeting the WDS context:

```shell
helm --kube-context "$wds_context" upgrade --install postgres \
  oci://registry-1.docker.io/bitnamicharts/postgresql \
  --namespace postgres-system
```

Do not point Helm at the WECs for this workflow. The WDS is the desired-state
source, and KubeStellar is responsible for delivery to the WECs.

## Verify Delivery to the WECs

Check that the Helm release exists in the WDS:

```shell
helm --kube-context "$wds_context" list --namespace postgres-system
```

If you have kubeconfig contexts for the WECs, check that KubeStellar delivered
the workload objects:

```shell
kubectl --context "$wec1_context" get statefulsets,services,pods -n postgres-system
kubectl --context "$wec2_context" get statefulsets,services,pods -n postgres-system
```

If the `StatefulSet` exists but the Pod is not ready, inspect the Pod in the WEC
where it is running:

```shell
kubectl --context "$wec1_context" describe pod -n postgres-system -l app.kubernetes.io/instance=postgres
kubectl --context "$wec2_context" describe pod -n postgres-system -l app.kubernetes.io/instance=postgres
```

## About Helm Metadata

Helm stores release metadata in a Secret. The workload can run on the WECs even
when `helm list --kube-context "$wec1_context"` shows no release there, because
Helm did not perform the install against that WEC.

Keep normal Helm lifecycle operations, such as upgrade and uninstall, pointed at
the WDS:

```shell
helm --kube-context "$wds_context" upgrade postgres \
  oci://registry-1.docker.io/bitnamicharts/postgresql \
  --namespace postgres-system
```

If you specifically need `helm list` on a WEC to show the release metadata, label
the Helm metadata Secret in the WDS so it matches the `BindingPolicy`:

```shell
kubectl --context "$wds_context" label secret -n postgres-system \
  "$(kubectl --context "$wds_context" get secrets -n postgres-system -l name=postgres -l owner=helm -o jsonpath='{.items[0].metadata.name}')" \
  app.kubernetes.io/managed-by=Helm \
  app.kubernetes.io/instance=postgres
```

## Clean Up

Uninstall from the WDS and remove the BindingPolicy:

```shell
helm --kube-context "$wds_context" uninstall postgres --namespace postgres-system
kubectl --context "$wds_context" delete namespace postgres-system
kubectl --context "$wds_context" delete bindingpolicy postgres-bpolicy
```

KubeStellar will remove the selected workload objects from the WECs as the WDS
state changes.
