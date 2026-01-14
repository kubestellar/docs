# Check out KubeStellar working with Turbonomic:
Medium - [Make Multi-Cluster Scheduling a No-Brainer](https://medium.com/@waltforme/make-multi-cluster-scheduling-a-no-brainer-e1979ba5b9b2)


### Turbonomic and KubeStellar Demo Day


  ![image](../../../images/spinner.gif)

[![Video](https://img.youtube.com/vi/B3jZTnu1LDo/0.jpg)](https://www.youtube.com/watch?v=B3jZTnu1LDo)


### How do I get this working with my KubeStellar instance?
As we can see from the blog and the demo, Turbonomic talks to KubeStellar via GitOps. The scheduling decisions are passed from Turbonomic to KubeStellar in two steps:
1. Turbo -> GitHub repository.
2. GitHub repository -> KubeStellar.

For the first step (Turbonomic -> GitHub repository), a controller named "[change reconciler](https://github.com/irfanurrehman/change-reconciler)" creates PRs against the GitHub repository, where the PRs contains changes to scheduling decisions.

There's also [a piece of code](https://github.com/edge-experiments/turbonomic-integrations) which intercepts Turbonomic actions and creates CRs for the above change reconciler.

For the second step (GitHub repository-> KubeStellar), we can use Argo CD. The detailed procedure to integrate Argo CD with KubeStellar is documented [here](./argocd.md).

As we can see from the blog and the demo, Turbonomic collects data from edge clusters. This is made possible by installing [kubeturbo](https://github.com/turbonomic/kubeturbo) into each of the edge clusters.


### Turbonomic and KubeStellar in the news


    ![image](../../../images/spinner.gif)

[View on LinkedIn](https://www.linkedin.com/embed/feed/update/urn:li:share:7066466334334668800)


