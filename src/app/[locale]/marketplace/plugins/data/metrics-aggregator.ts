import type { Plugin } from "../types";
import type { Translator } from "./translator";

export function createMetricsAggregatorPlugin(t: Translator): Plugin {
  return {
    id: "16",
    name: "Metrics Aggregator",
    slug: "metrics-aggregator",
    tagline: "Unified metrics collection from all clusters",
    description:
      "Free tool to aggregate metrics from all your KubeStellar clusters into a single Prometheus instance. Simplify monitoring and alerting.",
    longDescription: `Metrics Aggregator solves the challenge of monitoring distributed clusters by aggregating metrics into a centralized location. Compatible with Prometheus, it provides a unified view of your entire infrastructure without the complexity of federated setups.

Automatic cluster discovery, intelligent metric filtering, and built-in dashboards get you up and running in minutes. Reduce monitoring overhead and costs while maintaining complete visibility.

Free forever, built by the community for the community.`,
    icon: "📉",
    category: "Observability",
    pricing: {
      type: "free",
    },
    author: "KubeStellar Community",
    downloads: 12,
    rating: 4.5,
    version: "1.7.1",
    features: [
      "Multi-cluster metrics aggregation",
      "Prometheus compatibility",
      "Automatic cluster discovery",
      "Metric filtering and sampling",
      "Built-in Grafana dashboards",
      "Low resource overhead",
      "High availability support",
      "Custom metric pipelines",
    ],
    requirements: ["KubeStellar v0.19.0 or higher", "Prometheus operator"],
    compatibility: ["Linux", "macOS"],
    screenshots: [],
    documentation: "https://docs.kubestellar.io/plugins/metrics-aggregator",
    github: "https://github.com/kubestellar/metrics-aggregator",
    tags: ["observability", "metrics", "prometheus", "monitoring", "free"],
  };
}
