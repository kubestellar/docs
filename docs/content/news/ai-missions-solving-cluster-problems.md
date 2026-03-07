# Solving Complex Cluster Issues with AI Missions

*March 2026*

Managing multiple Kubernetes clusters means dealing with problems that span environments — a misconfigured RBAC policy in staging, a resource quota silently blocking deployments in production, a drift between what's in Git and what's actually running. These are the kinds of issues that eat hours of your day.

KubeStellar Console's **AI Missions** feature changes how you approach these problems.

---

## What Are AI Missions?

AI Missions are guided workflows that observe patterns across all your connected clusters and proactively surface issues. Instead of writing kubectl commands across 10 clusters, you describe what you want to investigate and the AI does the legwork.

Think of it as having a senior SRE that never sleeps, watching all your clusters simultaneously.

---

## Real Examples

### Diagnosing Cross-Cluster RBAC Drift

You notice that a service account works in your dev cluster but fails in staging. Instead of manually comparing RoleBindings across clusters, open the AI Mission Explorer and describe the problem. The mission will:

1. Scan RBAC configurations across all connected clusters
2. Highlight differences in roles, bindings, and service account permissions
3. Suggest the specific fix with a diff you can apply

### Finding Resource Quota Bottlenecks

Deployments are pending but you're not sure why. An AI Mission can scan all namespaces across clusters, identify where resource quotas are near their limits, and rank them by severity — all in one view instead of running `kubectl describe quota` in every namespace on every cluster.

### Detecting GitOps Drift

Your Helm release says it's synced, but something doesn't look right. AI Missions can compare the live state of resources against what your Git repository says should be deployed, flagging any drift with exact field-level differences.

---

## How to Use It

1. Open the console at [console.kubestellar.io](https://console.kubestellar.io) or your local instance
2. Click the **AI Missions** button in the sidebar (or press `Ctrl+K` and search for "missions")
3. Browse pre-built missions or describe your own problem
4. Watch as the mission executes across your clusters and presents findings

---

## 250+ Guided Install Missions

Beyond troubleshooting, the [console-kb](https://github.com/kubestellar/console-kb) knowledge base now includes **250+ guided install missions** for CNCF projects and Kubernetes platforms. Each mission includes:

- Step-by-step installation commands
- Verification checks
- Upgrade procedures
- Troubleshooting guides
- Uninstall instructions

Whether you need to set up Istio, deploy Prometheus, or configure Gatekeeper policies, there's a mission for it.

---

## Links

- **Try it:** [console.kubestellar.io](https://console.kubestellar.io)
- **Knowledge base:** [github.com/kubestellar/console-kb](https://github.com/kubestellar/console-kb)
- **Documentation:** [kubestellar.io/docs/console/readme](https://kubestellar.io/docs/console/readme)
