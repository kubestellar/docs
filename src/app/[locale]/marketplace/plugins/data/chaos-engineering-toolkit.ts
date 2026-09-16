import type { Plugin } from "../types";
import type { Translator } from "./translator";

export function createChaosEngineeringToolkitPlugin(t: Translator): Plugin {
  return {
    id: "24",
    name: "Chaos Engineering Toolkit",
    slug: "chaos-engineering-toolkit",
    tagline: "Test resilience with controlled chaos experiments",
    description:
      "Free chaos engineering toolkit for KubeStellar. Inject failures, test failover mechanisms, and validate resilience across your distributed infrastructure.",
    longDescription: `Chaos Engineering Toolkit brings the power of chaos engineering to KubeStellar deployments. Test your system's resilience by injecting controlled failures, simulating network issues, and validating failover mechanisms. Learn how your system behaves under stress before real failures occur.

Pre-built experiment templates cover common scenarios like pod failures, network latency, resource exhaustion, and cluster partitions. Safety mechanisms ensure experiments can be aborted and rolled back if needed. Detailed reports show exactly how your system responded.

Free and open source, inspired by Chaos Mesh and powered by the community.`,
    icon: "🌪️",
    category: "Development Tools",
    pricing: {
      type: "free",
    },
    author: "KubeStellar Community",
    downloads: 7,
    rating: 4.6,
    version: "1.6.0",
    features: [
      "Pod failure injection",
      "Network chaos (latency, packet loss)",
      "Resource stress testing",
      "Time chaos experiments",
      "Scheduled experiments",
      "Safety mechanisms and rollback",
      "Experiment templates library",
      "Integration with CI/CD",
    ],
    requirements: ["KubeStellar v0.20.0 or higher", "Kubernetes 1.24+"],
    compatibility: ["Linux", "macOS"],
    screenshots: [],
    documentation: "https://docs.kubestellar.io/plugins/chaos-toolkit",
    github: "https://github.com/kubestellar/chaos-toolkit",
    tags: ["chaos-engineering", "testing", "resilience", "sre", "free"],
  };
}
