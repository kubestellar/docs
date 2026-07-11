<!--onboarding-start-->
# KubeStellar GitHub Organization
## Onboarding and Offboarding Policy

Effective date: June 1, 2023  
Last reviewed: May 30, 2025

KubeStellar welcomes contributors across documentation, core platform code, the Console, MCP tools, and related community projects. This policy explains how to get oriented, how to request organization access when needed, and how to hand work off cleanly when leaving.

## 1. Purpose and scope

This policy applies to people joining or leaving the KubeStellar GitHub organization, including maintainers, recurring contributors, and collaborators who need organization-level access.

The KubeStellar project now spans multiple repositories and contribution areas. Start with the unified documentation site at [kubestellar.io](https://kubestellar.io/) (also available at [docs.kubestellar.io](https://docs.kubestellar.io/)) for current product, community, and contributor documentation.

## 2. Onboarding process

### 2.1 Start with the current project resources

Before requesting organization access, review the current project resources:

- [KubeStellar documentation site](https://kubestellar.io/)
- [Contributing guide](https://github.com/kubestellar/docs/blob/main/CONTRIBUTING.md)
- [Code of conduct](https://github.com/kubestellar/docs/blob/main/CODE_OF_CONDUCT.md)
- [KubeStellar community pages](https://kubestellar.io/community)

### 2.2 Choose your contribution area

Use the repository that matches the area where you plan to contribute:

| Area | Repository | Starting point |
| --- | --- | --- |
| Core KubeStellar platform | [kubestellar/kubestellar](https://github.com/kubestellar/kubestellar) | Project docs and contribution guides for the core platform |
| Documentation website | [kubestellar/docs](https://github.com/kubestellar/docs) | `README.md` and `CONTRIBUTING.md` in this repository |
| KubeStellar Console | [kubestellar/console](https://github.com/kubestellar/console) | [Console docs](https://kubestellar.io/console/console-overview/) and the repository README |
| Console knowledge base | [kubestellar/console-kb](https://github.com/kubestellar/console-kb) | Repository README and contribution guidance |
| Console marketplace | [kubestellar/console-marketplace](https://github.com/kubestellar/console-marketplace) | Repository README and contribution guidance |
| MCP tools | [kubestellar/kubestellar-mcp](https://github.com/kubestellar/kubestellar-mcp) | [KubeStellar MCP docs](https://kubestellar.io/kubestellar-mcp/) and the repository README |

### 2.3 Access request

If you need to join the GitHub organization or need elevated permissions, open an issue in the [kubestellar/docs](https://github.com/kubestellar/docs/issues) repository and mention the approvers listed in the [OWNERS](https://github.com/kubestellar/docs/blob/main/OWNERS) file.

Include the following in the request:

- GitHub username
- Area of contribution (for example: docs, console, marketplace, MCP, or core platform)
- Why organization access is needed
- Relevant prior contributions, issues, or pull requests
- Whether you need general membership or access to a specific repository/team

### 2.4 Review and approval

Organization maintainers or delegated approvers review access requests based on the contributor's role, demonstrated need, prior involvement, and adherence to project policies.

If approved, the contributor will receive a GitHub organization invitation. Contributors should ensure their GitHub account meets current GitHub security requirements, including any organization-enforced account protections.

### 2.5 Getting help and staying oriented

The maintainers want contributors to be effective and confident. If you need help:

- Join the [#kubestellar-dev Slack channel](https://cloud-native.slack.com/archives/C097094RZ3M)
- Join the [kubestellar-dev Google Group](https://groups.google.com/g/kubestellar-dev)
- Review project and product docs on [kubestellar.io](https://kubestellar.io/)
- Attend community meetings listed on the docs site

### 2.6 Getting started by contribution area

There is no single "getting started" workflow for every repository. After you choose an area, follow the setup and contribution instructions in that repository.

A typical flow is:

1. Find or open an issue in the relevant repository.
2. Fork or clone that repository.
3. Create a feature branch.
4. Follow the repository-specific setup instructions.
5. Make your change, open a pull request, and link the issue.

Examples:

- **Docs website work**: use [kubestellar/docs](https://github.com/kubestellar/docs) and follow its `README.md` and `CONTRIBUTING.md`.
- **Console work**: use [kubestellar/console](https://github.com/kubestellar/console) and the Console section of the docs site for architecture, deployment, and development guidance.
- **MCP work**: use [kubestellar/kubestellar-mcp](https://github.com/kubestellar/kubestellar-mcp) and the MCP docs for installation and usage.
- **Marketplace or KB work**: use the relevant repository and its own README for contribution expectations and local setup.

## 3. Offboarding process

### 3.1 Departure notification

Members leaving the organization should notify the maintainers or the relevant team lead as early as practical and share any important timing or transition details.

### 3.2 Access termination

After departure is confirmed, maintainers or delegated personnel will remove organization access that is no longer needed.

### 3.3 Knowledge transfer

Departing members should hand off open work, document important context, and update any relevant issues, pull requests, or docs so the remaining team can continue smoothly.

## 4. Code of conduct

All members of the KubeStellar GitHub organization are expected to follow the [Code of Conduct](https://github.com/kubestellar/docs/blob/main/CODE_OF_CONDUCT.md) and help maintain a respectful and inclusive community.

## 5. Policy compliance and review

All members are responsible for following this policy. Maintainers are responsible for keeping it current and reviewing it periodically as the project evolves.

Maintained by the KubeStellar maintainers.  
Last reviewed: May 30, 2025
<!--onboarding-end-->