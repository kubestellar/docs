import type { Plugin } from "../types";
import type { Translator } from "./translator";

export function createEdgeMonitorProPlugin(t: Translator): Plugin {
  return {
    id: "22",
    name: "Edge Monitor Pro",
    slug: "edge-monitor-pro",
    tagline: "Specialized monitoring for edge computing deployments",
    description:
      "Monitor edge devices and clusters with limited connectivity. Offline-first design, bandwidth-efficient metrics collection, and intelligent data aggregation.",
    longDescription: `Edge Monitor Pro is built from the ground up for the unique challenges of edge computing. Handle intermittent connectivity, bandwidth constraints, and resource-limited devices with ease. Smart data aggregation ensures you get the insights you need without overwhelming your edge infrastructure.

Local data retention keeps critical metrics available even when connectivity is lost. When connection is restored, intelligent sync ensures central visibility without flooding your network. Edge-specific alerts handle scenarios like prolonged disconnection or unusual power consumption.

Purpose-built for IoT, retail, manufacturing, and remote deployments.`,
    icon: "📡",
    category: "Observability",
    pricing: {
      type: "monthly",
      amount: 119,
    },
    author: "EdgeTech Solutions",
    downloads: 6,
    rating: 4.8,
    version: "2.4.0",
    features: [
      "Offline-first architecture",
      "Bandwidth-efficient metrics",
      "Local data retention",
      "Intelligent sync when online",
      "Edge-specific alerts",
      "Device health monitoring",
      "Power consumption tracking",
      "Mobile app for remote access",
    ],
    requirements: [
      "KubeStellar v0.21.0 or higher",
      "Edge clusters with limited resources",
    ],
    compatibility: ["Linux", "ARM"],
    screenshots: [],
    documentation: "https://docs.edgetechsolutions.io",
    website: "https://edgetechsolutions.io",
    tags: ["edge", "monitoring", "iot", "observability", "premium"],
  };
}
