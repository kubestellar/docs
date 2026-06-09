---
title: "From Evaluator to Contributor"
description: "A guide for teams actively testing KubeStellar who want to move from evaluation to production adoption and contribution"
---

# From Evaluator to Contributor

You forked KubeStellar. You ran the quick-start. Now what?

This guide is for teams in the evaluation phase — running KubeStellar in a lab or PoC environment — who want to understand the path to production adoption and, optionally, open-source contribution.

## Stage 1: Validate Your Use Case (Week 1–2)

Most evaluators share a common need: *"I have workloads that need to run across multiple Kubernetes clusters, and I want a single control plane."*

**Key things to test:**

| Scenario | KubeStellar feature to test |
|----------|----------------------------|
| Deploy to multiple clusters at once | `BindingPolicy` with cluster label selectors |
| Different workloads per cluster tier | `BindingPolicy` with `clusterSelectors` |
| See status from all clusters in one view | `WorkStatus` and `StatusCollector` |
| GitOps integration | KubeStellar + FluxCD or ArgoCD |
| Air-gapped or edge clusters | KubeStellar + OpenZiti transport |

**Quick validation commands:**

```bash
# Register a cluster
kubectl ws use root:hub
kubectl apply -f - <<EOF
apiVersion: control.kubestellar.io/v1alpha1
kind: SyncTarget
metadata:
  name: cluster-a
EOF

# Apply a BindingPolicy
kubectl apply -f examples/binding-policy-all-clusters.yaml
```

## Stage 2: Share Your Results (Week 2–3)

If KubeStellar works for your use case, **tell us**. This helps:

- Justify continued investment in your organization
- Qualify you for [CNCF case studies](https://www.cncf.io/case-studies/)
- Help other teams facing the same problem find the solution

**How to share:**

1. **Open a PR to [ADOPTERS.md](https://github.com/kubestellar/kubestellar/blob/main/ADOPTERS.md)** — one paragraph, zero commitment. See the [self-service guide](https://github.com/kubestellar/kubestellar/issues/3793).
2. **Join #kubestellar on CNCF Slack** — share what you built
3. **Write a blog post** — the KubeStellar maintainers can help publish to kubestellar.io/news

## Stage 3: Contribute Back (Month 2+)

Evaluation teams often discover bugs, missing features, or documentation gaps. These are **valuable contributions** — you don't need to be a Go expert.

### Contribution types by effort level

**Low effort (< 1 hour):**
- Fix a typo or unclear doc sentence
- Open a bug report with reproduction steps
- Add your use case to the [console-marketplace](https://github.com/kubestellar/console-marketplace) as a card template

**Medium effort (1–4 hours):**
- Improve a quick-start doc based on what confused you
- Add an example BindingPolicy for your specific use case
- Write a [discussion post](https://github.com/kubestellar/kubestellar/discussions) about your architecture

**Sustained contribution:**
- Pick up a [help wanted](https://github.com/kubestellar/kubestellar/labels/help%20wanted) issue
- Join the [LFX Mentorship program](https://github.com/kubestellar/kubestellar/issues/3826) (next cycle opens Q3 2026)
- Propose an integration with tools in your stack

### First PR checklist

- [ ] Fork the repo you want to contribute to
- [ ] Create a branch: `git checkout -b fix/describe-what-you-fixed`
- [ ] Make your change
- [ ] Sign your commit: `git commit -s -m "fix: describe the fix"`
- [ ] Open a PR — the maintainers respond within 48 hours (business days)

## Community Resources

| Resource | Link |
|----------|------|
| CNCF Slack #kubestellar | [slack.cncf.io](https://slack.cncf.io) → search `kubestellar` |
| GitHub Discussions | [github.com/kubestellar/kubestellar/discussions](https://github.com/kubestellar/kubestellar/discussions) |
| Community meetings | [kubestellar.io/community](https://kubestellar.io/community) |
| Contributing guide | [CONTRIBUTING.md](https://github.com/kubestellar/kubestellar/blob/main/CONTRIBUTING.md) |
| Help wanted issues | [Issues labeled help-wanted](https://github.com/kubestellar/kubestellar/labels/help%20wanted) |

## FAQ

**Q: Do I need to be a Kubernetes expert to contribute?**  
No. Documentation improvements, test coverage, and example use cases are as valuable as code changes. Some of the most impactful contributions have been from users who hit a rough edge and smoothed it.

**Q: My organization can't publicly disclose KubeStellar adoption yet.**  
That's fine. You can be listed in ADOPTERS.md as `[confidential org] — multi-cluster workload management` or simply [open an issue](https://github.com/kubestellar/kubestellar/issues/new) to let us know you're using it. We track adoption separately from public disclosure.

**Q: We built something on top of KubeStellar. How do we get it featured?**  
Open a PR to [console-marketplace](https://github.com/kubestellar/console-marketplace) or reach out in Slack. We actively highlight ecosystem integrations in release notes and blog posts.

---

*This guide is maintained by the KubeStellar community. To improve it, open a PR.*
