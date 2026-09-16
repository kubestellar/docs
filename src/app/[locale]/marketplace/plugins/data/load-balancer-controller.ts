import type { Plugin } from "../types";
import type { Translator } from "./translator";

export function createLoadBalancerControllerPlugin(t: Translator): Plugin {
  return {
    id: "14",
    name: "Load Balancer Controller",
    slug: "load-balancer-controller",
    tagline: "Intelligent load balancing across cluster boundaries",
    description:
      "Free load balancer controller optimized for KubeStellar deployments. Distribute traffic intelligently across clusters based on latency, capacity, and custom rules.",
    longDescription: `Load Balancer Controller extends Kubernetes load balancing capabilities to work seamlessly across KubeStellar-managed clusters. Route traffic based on geographic proximity, cluster capacity, custom weights, or health scores.

Automatic failover ensures high availability, while built-in circuit breakers prevent cascading failures. Compatible with major cloud load balancers and on-premises solutions.

Open source and community-driven, perfect for hybrid and multi-cloud deployments.`,
    icon: "⚖️",
    category: "Networking",
    pricing: {
      type: "free",
    },
    author: "KubeStellar Community",
    downloads: 14,
    rating: 4.6,
    version: "2.2.0",
    features: [
      "Cross-cluster load balancing",
      "Geographic traffic routing",
      "Health-based routing",
      "Automatic failover",
      "Circuit breaker support",
      "Custom routing rules",
      "Integration with cloud LBs",
      "Real-time metrics",
    ],
    requirements: ["KubeStellar v0.20.0 or higher", "Kubernetes 1.24+"],
    compatibility: ["Linux", "macOS"],
    screenshots: [],
    documentation: "https://docs.kubestellar.io/plugins/lb-controller",
    github: "https://github.com/kubestellar/lb-controller",
    tags: ["networking", "load-balancing", "traffic", "free", "open-source"],
  };
}
