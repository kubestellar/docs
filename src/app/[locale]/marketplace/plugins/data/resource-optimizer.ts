import type { Plugin } from "../types";
import type { Translator } from "./translator";

export function createResourceOptimizerPlugin(t: Translator): Plugin {
  return {
    id: "19",
    name: "Resource Optimizer",
    slug: "resource-optimizer",
    tagline: "AI-powered resource recommendations",
    description:
      "Free tool that analyzes workload patterns and provides AI-powered recommendations for right-sizing resources across your clusters.",
    longDescription: `Resource Optimizer uses machine learning to analyze your workload behavior and recommend optimal resource allocations. Stop wasting money on over-provisioned pods and prevent performance issues from under-provisioning.

Historical analysis identifies trends, while predictive modeling forecasts future needs. One-click apply makes optimization effortless. Typical users save 30-40% on infrastructure costs.

Completely free and open source.`,
    icon: "🎛️",
    category: "Resource Management",
    pricing: {
      type: "free",
    },
    author: "KubeStellar Community",
    downloads: 11,
    rating: 4.6,
    version: "1.3.2",
    features: [
      "AI-powered recommendations",
      "Historical usage analysis",
      "Predictive resource modeling",
      "One-click optimization",
      "Cost savings estimates",
      "Cluster-wide analysis",
      "Custom recommendation policies",
      "Integration with VPA",
    ],
    requirements: ["KubeStellar v0.20.0 or higher", "Metrics server"],
    compatibility: ["Linux", "macOS", "Windows"],
    screenshots: [],
    documentation: "https://docs.kubestellar.io/plugins/resource-optimizer",
    github: "https://github.com/kubestellar/resource-optimizer",
    tags: ["optimization", "resources", "ai", "cost-savings", "free"],
  };
}
