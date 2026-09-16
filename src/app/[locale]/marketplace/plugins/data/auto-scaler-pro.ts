import type { Plugin } from "../types";
import type { Translator } from "./translator";

export function createAutoScalerProPlugin(t: Translator): Plugin {
  return {
    id: "8",
    name: "Auto Scaler Pro",
    slug: "auto-scaler-pro",
    tagline: "Intelligent autoscaling for distributed workloads",
    description:
      "Optimize resource utilization across your cluster fleet with AI-powered autoscaling that understands your workload patterns and business requirements.",
    longDescription: `Auto Scaler Pro uses machine learning to understand your workload patterns and automatically scale resources across your KubeStellar-managed clusters. Unlike traditional autoscalers, it considers cross-cluster dependencies, geographic distribution, and your specific business requirements.

Save up to 60% on infrastructure costs while maintaining performance and reliability. Predictive scaling ensures resources are ready before demand spikes, and intelligent placement ensures workloads run in the most cost-effective locations.

Smart scaling for the distributed cloud era.`,
    icon: "📈",
    category: "Resource Management",
    pricing: {
      type: "monthly",
      amount: 79,
    },
    author: "ScaleStar Technologies",
    downloads: 9,
    rating: 4.6,
    version: "1.9.2",
    features: [
      "AI-powered predictive scaling",
      "Cross-cluster resource optimization",
      "Cost-aware workload placement",
      "Custom scaling policies",
      "Integration with cluster autoscalers",
      "Real-time cost analytics",
      "Schedule-based scaling",
      "Multi-metric decision making",
    ],
    requirements: [
      "KubeStellar v0.21.0 or higher",
      "Metrics server on all clusters",
      "Valid subscription",
    ],
    compatibility: ["Linux", "macOS"],
    screenshots: [],
    documentation: "https://docs.scalestar.io",
    website: "https://scalestar.io",
    tags: ["autoscaling", "optimization", "cost-management", "ai", "premium"],
  };
}
