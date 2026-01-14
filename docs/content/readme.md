

![](../KubeStellar-with-Logo.png)


## Multi-cluster Configuration Management for Edge, Multi-Cloud, and Hybrid Cloud

[![](https://github.com/kubestellar/kubestellar/actions/workflows/docs-gen-and-push.yml/badge.svg?branch={{ config.ks_branch }})](https://github.com/kubestellar/kubestellar/actions/workflows/docs-gen-and-push.yml)&nbsp;&nbsp;&nbsp;
[![](https://img.shields.io/badge/first--timers--only-friendly-blue.svg?style=flat-square)](https://www.firsttimersonly.com/)&nbsp;&nbsp;&nbsp;
[![](https://github.com/kubestellar/kubestellar/actions/workflows/broken-links-crawler.yml/badge.svg)](https://github.com/kubestellar/kubestellar/actions/workflows/broken-links-crawler.yml)
[![Join Slack](https://img.shields.io/badge/KubeStellar-Join%20Slack-blue?logo=slack)](https://kubernetes.slack.com/archives/C058SUSL5AA)

**KubeStellar** is a Cloud Native Computing Foundation (CNCF) Sandbox project that simplifies the deployment and configuration of applications across multiple Kubernetes clusters. It provides a seamless experience akin to using a single cluster, and it integrates with the tools you're already familiar with, eliminating the need to modify existing resources.

KubeStellar is particularly beneficial if you're currently deploying in a single cluster and are looking to expand to multiple clusters, or if you're already using multiple clusters and are seeking a more streamlined developer experience.


![KubeStellar High Level View](./images/kubestellar-high-level.png)


The use of multiple clusters offers several advantages, including:

- Separation of environments (e.g., development, testing, staging)
- Isolation of groups, teams, or departments
- Compliance with enterprise security or data governance requirements
- Enhanced resiliency, including across different clouds
- Improved resource availability
- Access to heterogeneous resources
- Capability to run applications on the edge, including in disconnected environments

In a single-cluster setup, developers typically access the cluster and deploy Kubernetes objects directly. Without KubeStellar, multiple clusters are usually deployed and configured individually, which can be time-consuming and complex.

KubeStellar simplifies this process by allowing developers to define a binding policy between clusters and Kubernetes objects. It then uses your regular single-cluster tooling to deploy and configure each cluster based on these binding policies, making multi-cluster operations as straightforward as managing a single cluster. This approach enhances productivity and efficiency, making KubeStellar a valuable tool in a multi-cluster Kubernetes environment.

## Getting Started

See the [Getting Started setup guide](direct/get-started.md) for getting started with kicking the tires.

## Contributing

We ❤️ our contributors! If you're interested in helping us out, please head over to our [Contributing](Contribution%20guidelines/CONTRIBUTING.md) guide.

## Getting in touch

There are several ways to communicate with us:

Instantly get access to our documents and meeting invites [http://kubestellar.io/joinus](http://kubestellar.io/joinus)

- The [`#kubestellar-dev` channel](https://kubernetes.slack.com/archives/C058SUSL5AA) in the [Kubernetes Slack workspace](https://slack.k8s.io)
- Our mailing lists:
    - [kubestellar-dev](https://groups.google.com/g/kubestellar-dev) for development discussions
    - [kubestellar-users](https://groups.google.com/g/kubestellar-users) for discussions among users and potential users
- Subscribe to the [community calendar](https://calendar.google.com/calendar/event?action=TEMPLATE&tmeid=MWM4a2loZDZrOWwzZWQzZ29xanZwa3NuMWdfMjAyMzA1MThUMTQwMDAwWiBiM2Q2NWM5MmJlZDdhOTg4NGVmN2ZlOWUzZjZjOGZlZDE2ZjZmYjJmODExZjU3NTBmNTQ3NTY3YTVkZDU4ZmVkQGc&tmsrc=b3d65c92bed7a9884ef7fe9e3f6c8fed16f6fb2f811f5750f547567a5dd58fed%40group.calendar.google.com&scp=ALL) for community meetings and events
    - The [kubestellar-dev](https://groups.google.com/g/kubestellar-dev) mailing list is subscribed to this calendar
- See recordings of past KubeStellar community meetings on [YouTube](https://www.youtube.com/@kubestellar)
- See [upcoming](https://github.com/kubestellar/kubestellar/issues?q=is%3Aissue+is%3Aopen+label%3Acommunity-meeting) and [past](https://github.com/kubestellar/kubestellar/issues?q=is%3Aissue+is%3Aclosed+label%3Acommunity-meeting) community meeting agendas and notes
- Browse the [shared Google Drive](https://drive.google.com/drive/folders/1p68MwkX0sYdTvtup0DcnAEsnXElobFLS?usp=sharing) to share design docs, notes, etc.
    - Members of the [kubestellar-dev](https://groups.google.com/g/kubestellar-dev) mailing list can view this drive
- Read our [documentation]({{ config.docs_url }})
- Follow us on:
   - LinkedIn - [#kubestellar](https://www.linkedin.com/feed/hashtag/?keywords=kubestellar)
   - Medium - [kubestellar.medium.com](https://medium.com/@kubestellar/list/predefined:e785a0675051:READING_LIST)
   
   
## ❤️ Contributors

Thanks go to these wonderful people:



  
    [![](https://avatars.githubusercontent.com/u/8633434?v=4)
<sub>Jun Duan</sub>](https://github.com/waltforme)
[👀](https://github.com/kubestellar/kubestellar/issues?q=assignee%3Awaltforme+)
    [![](https://avatars.githubusercontent.com/u/25727844?v=4)
<sub>Braulio Dumba</sub>](https://github.com/dumb0002)
[👀](https://github.com/kubestellar/kubestellar/issues?q=assignee%3Adumb0002+)
    [![](https://avatars.githubusercontent.com/u/14296719?v=4)
<sub>Mike Spreitzer</sub>](https://github.com/MikeSpreitzer)
[👀](https://github.com/kubestellar/kubestellar/pulls?q=is%3Apr+reviewed-by%3AMikeSpreitzer)
    [![](https://avatars.githubusercontent.com/u/6678093?v=4)
<sub>Paolo Dettori</sub>](https://github.com/pdettori)
👀
    [![](https://avatars.githubusercontent.com/u/407614?v=4)
<sub>Andy Anderson</sub>](https://github.com/clubanderson)
[👀](https://github.com/kubestellar/kubestellar/pulls?q=is%3Apr+reviewed-by%3Aclubanderson)
    [![](https://avatars.githubusercontent.com/u/50019234?v=4)
<sub>Franco Stellari</sub>](https://github.com/francostellari)
[👀](https://github.com/kubestellar/kubestellar/issues?q=assignee%3Afrancostellari+)
    [![](https://avatars.githubusercontent.com/u/13567561?v=4)
<sub>Ezra Silvera</sub>](https://github.com/ezrasilvera)
[👀](https://github.com/kubestellar/kubestellar/pulls?q=is%3Apr+reviewed-by%3Aezrasilvera)
  
  
    [![](https://avatars.githubusercontent.com/u/124100147?v=4)
<sub>Bob Filepp</sub>](https://github.com/fileppb)
[👀](https://github.com/kubestellar/kubestellar/issues?q=assignee%3Afileppb+)
    [![](https://avatars.githubusercontent.com/u/18140413?v=4)
<sub>Effi Ofer</sub>](https://github.com/effi-ofer)
[👀](https://github.com/kubestellar/kubestellar/issues?q=assignee%3Aeffi-ofer+)
    [![](https://avatars.githubusercontent.com/u/16118462?v=4)
<sub>Maria Camila Ruiz Cardenas</sub>](https://github.com/mra-ruiz)
[👀](https://github.com/kubestellar/kubestellar/issues?q=assignee%3Amra-ruiz+)
    [![](https://avatars.githubusercontent.com/u/16204273?v=4)
<sub>Andrey Odarenko</sub>](https://github.com/andreyod)
[👀](https://github.com/kubestellar/kubestellar/issues?q=assignee%3Aandreyod+)
    [![](https://avatars.githubusercontent.com/u/26678552?v=4)
<sub>Aashni Manroa</sub>](https://github.com/amanroa)
[👀](https://github.com/kubestellar/kubestellar/issues?q=assignee%3Aamanroa+)
    [![](https://avatars.githubusercontent.com/u/25445603?v=4)
<sub>Kevin Roche</sub>](https://github.com/KPRoche)
[👀](https://github.com/kubestellar/kubestellar/issues?q=assignee%3AKPRoche+)
    [![](https://avatars.githubusercontent.com/u/144150872?v=4)
<sub>Nick Masluk</sub>](https://github.com/namasl)
[👀](https://github.com/kubestellar/kubestellar/issues?q=assignee%3Anamasl+)
  
  
     [![](https://avatars.githubusercontent.com/u/15231306?v=4)
<sub>Francois Abel</sub>](https://github.com/fab7)
[👀](https://github.com/kubestellar/kubestellar/issues?q=assignee%3Afab7+)
    [![](https://avatars.githubusercontent.com/u/19717747?v=4)
<sub>Nir Rozenbaum</sub>](https://github.com/nirrozenbaum)
[👀](https://github.com/kubestellar/kubestellar/issues?q=assignee%3Anirrozenbaum+)
    [![](https://avatars.githubusercontent.com/u/73340153?v=4)
<sub>Maroon Ayoub</sub>](https://github.com/vMaroon)
[👀](https://github.com/kubestellar/kubestellar/issues?q=assignee%3AvMaroon+)
    [![](https://avatars.githubusercontent.com/u/1632332?v=4)
<sub>Graham White</sub>](https://github.com/grahamwhiteuk)
[👀](https://github.com/kubestellar/kubestellar/pulls?q=is%3Apr+author%3A%40me+)
  



