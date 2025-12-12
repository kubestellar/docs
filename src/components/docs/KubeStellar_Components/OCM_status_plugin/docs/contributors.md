# Developing Status-AddOn

To work on the status-addon code, you will need an OCM hub and at least one
managed cluster. The commands used here assume that you have followed 
[these steps](https://github.com/kubestellar/kubestellar/blob/main/docs/content/v0.20/examples.md#common-setup)
to install OCM and two managed clusters.

## Run add-on agent in dev mode

```shell
make run-agent
```

## Making local build

```shell
make ko-local-build
```

## Install chart from local repo using local build

```shell
make install-local-chart
```

## Restart add-on manager on hub

```shell
kubectl --context imbs1 -n open-cluster-management scale deployment addon-status-controller --replicas 0
kubectl --context imbs1 -n open-cluster-management scale deployment addon-status-controller --replicas 1
```

## Check status of agent deployments

```shell
kubectl --context imbs1 -n cluster1 get managedclusteraddons addon-status
kubectl --context imbs1 -n cluster2 get managedclusteraddons addon-status
```

## Check workstatuses on hub

```shell
kubectl --context imbs1 get workstatuses -n cluster1 
kubectl --context imbs1 get workstatuses -n cluster2
```

## Delete workstatuses from hub (for debugging agent)

```shell
kubectl --context imbs1 delete workstatuses -n cluster1 --all
kubectl --context imbs1 delete workstatuses -n cluster2 --all
```

## Restart agents

```shell
kubectl --context cluster1 -n open-cluster-management-agent-addon scale deployment status-agent --replicas 0
kubectl --context cluster1 -n open-cluster-management-agent-addon scale deployment status-agent --replicas 1
kubectl --context cluster2 -n open-cluster-management-agent-addon scale deployment status-agent --replicas 0
kubectl --context cluster2 -n open-cluster-management-agent-addon scale deployment status-agent --replicas 1
```

## Uninstall addon

If installed with helm

```shell
helm --kube-context imbs1 -n open-cluster-management delete status-addon
```

If installed with `make deploy`

```shell
make undeploy
```

## Stop deployed agent on cluster1 (for local testing)

```shell
kubectl --context imbs1 -n open-cluster-management scale deployment addon-status-controller --replicas 0
```

Then change the number of replicas to 0 in the manifestwork for the addon by opening an editor.

```shell
kubectl --context imbs1 -n cluster1 edit manifestwork addon-addon-status-deploy-0 
```
and set spec.workload.manifests[0].spec.replicas = 0

Verify that the status agent was stopped:

```shell
kubectl --context cluster1 -n open-cluster-management-agent-addon get deployments.apps status-agent 
```
now you can start for local testing with `make run-agent`







