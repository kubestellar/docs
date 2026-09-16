import type { Plugin } from "../types";
import type { Translator } from "./translator";

export function createNetworkMeshOptimizerPlugin(t: Translator): Plugin {
  return {
    id: "10",
    name: "Network Mesh Optimizer",
    slug: "network-mesh-optimizer",
    tagline: "Optimize network performance across distributed clusters",
    description:
      "Free tool to analyze and optimize network mesh configurations for better performance, lower latency, and reduced costs in your KubeStellar deployments.",
    longDescription: `Network Mesh Optimizer helps you get the most out of your service mesh in a KubeStellar environment. Analyze traffic patterns, identify inefficiencies, and get actionable recommendations to improve performance and reduce costs.

Visualize cross-cluster traffic flows, detect misconfigurations, and optimize routing policies. Compatible with Istio, Linkerd, and other popular service meshes.

Completely free and open source, developed by the KubeStellar community.`,
    icon: "🌐",
    category: "Networking",
    pricing: {
      type: "free",
    },
    author: "KubeStellar Community",
    downloads: 13,
    rating: 4.5,
    version: "1.3.0",
    features: [
      "Network traffic analysis",
      "Service mesh health checks",
      "Performance optimization recommendations",
      "Traffic visualization",
      "Latency analysis",
      "Cost optimization suggestions",
      "Multi-mesh support",
      "CLI and web interface",
    ],
    requirements: [
      "KubeStellar v0.19.0 or higher",
      "Service mesh (Istio, Linkerd, etc.)",
    ],
    compatibility: ["Linux", "macOS", "Windows"],
    screenshots: [],
    documentation:
      "https://docs.kubestellar.io/plugins/network-mesh-optimizer",
    github: "https://github.com/kubestellar/network-mesh-optimizer",
    tags: [
      "networking",
      "service-mesh",
      "optimization",
      "performance",
      "free",
    ],
  };
}
