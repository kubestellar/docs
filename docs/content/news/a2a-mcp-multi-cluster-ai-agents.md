# Run AI Agents Anywhere: KubeStellar's A2A + MCP Integration

*June 2026*

As AI agents move from demos to production infrastructure, they face the same scaling challenge every distributed system faces: where do they run, and how do you manage them across clusters?

KubeStellar now has a direct answer: **[kubestellar/a2a](https://github.com/kubestellar/a2a)** — an Agent-to-Agent (A2A) protocol implementation and Model Context Protocol (MCP) server that brings multi-cluster orchestration natively into the AI agent ecosystem.

---

## What Is A2A + MCP?

**A2A (Agent-to-Agent)** is an open protocol for AI agents to discover and communicate with each other across systems. **MCP (Model Context Protocol)**, created by Anthropic, is the emerging standard for connecting AI models to external tools and data sources.

Together, they define how agents find each other, what capabilities they expose, and how they coordinate work — the infrastructure layer that AI agent frameworks like LangChain, CrewAI, AutoGen, and others rely on.

---

## Why Multi-Cluster Matters for AI Agents

Production AI deployments don't run on a single cluster:

- **Data locality**: Training and inference often need to run close to data — different regions, different providers
- **Scale**: AI workloads can spike 10–100× — multi-cluster spreading absorbs demand without over-provisioning
- **Compliance**: Healthcare, financial, and government deployments require workloads in specific jurisdictions
- **Reliability**: Single-cluster deployments are single points of failure for critical agent pipelines

KubeStellar's multi-cluster orchestration — used by organizations like Cornell University for their Software-Defined Farm system — now extends natively to AI agent workloads through the A2A + MCP integration.

---

## What kubestellar/a2a Provides

The [`kubestellar/a2a`](https://github.com/kubestellar/a2a) repo provides:

- **A2A server implementation**: Agents register capabilities and discover each other across KubeStellar-managed clusters
- **MCP server**: Connect any MCP-compatible AI client (Claude, Cursor, Continue, etc.) to your multi-cluster KubeStellar environment — query workload status, manage placements, trigger deployments
- **Cross-cluster agent routing**: Route agent tasks to the right cluster based on policy, availability, or data locality

### Example: Query your clusters from Claude Desktop

With the KubeStellar MCP server configured:

```
"What workloads are deployed to my edge clusters, and are any of them failing?"
```

The MCP server translates that natural language query into KubeStellar API calls, returning structured results that Claude uses to give you a real answer — not a generic template.

---

## Getting Started

**Install the MCP server** and connect it to your KubeStellar instance:

```bash
# Clone the repo
git clone https://github.com/kubestellar/a2a
cd a2a

# Follow setup in README
```

Then add it to your MCP client configuration. Full docs at [kubestellar.io/docs/kubestellar-mcp](https://kubestellar.io/docs/kubestellar-mcp/).

---

## What's Next

- **Expanded A2A agent registry**: Discover and coordinate agents across clusters by capability type
- **Policy-driven agent placement**: KubeStellar's placement engine extended to route agent tasks
- **Integration guides**: LangChain, CrewAI, AutoGen, and Semantic Kernel

If you're building multi-cluster AI infrastructure, we'd love to hear from you. Open a discussion at [github.com/kubestellar/a2a](https://github.com/kubestellar/a2a) or join [#kubestellar-dev](https://kubernetes.slack.com/archives/C058SUSL5AA) on the Kubernetes Slack.

---

## Links

- **A2A + MCP repo:** [github.com/kubestellar/a2a](https://github.com/kubestellar/a2a)
- **MCP server docs:** [kubestellar.io/docs/kubestellar-mcp](https://kubestellar.io/docs/kubestellar-mcp/)
- **KubeStellar main repo:** [github.com/kubestellar/kubestellar](https://github.com/kubestellar/kubestellar)
- **Related issue:** kubestellar/kubestellar#3790
