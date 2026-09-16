import type { Plugin } from "../types";
import type { Translator } from "./translator";

export function createStellarInsightsPlugin(t: Translator): Plugin {
  return {
    id: "4",
    name: "Stellar Insights",
    slug: "stellar-insights",
    tagline:
      "Advanced analytics and observability for multi-cluster deployments",
    description:
      "Gain deep insights into your KubeStellar deployments with advanced metrics, tracing, and AI-powered anomaly detection.",
    longDescription: `Stellar Insights transforms your KubeStellar deployment into a fully observable system. Get deep visibility into every aspect of your multi-cluster infrastructure with advanced metrics collection, distributed tracing, and AI-powered analytics.

Our machine learning algorithms detect anomalies before they impact your applications, predict resource needs, and suggest optimizations. Beautiful, customizable dashboards give your team the insights they need at a glance.

Reduce MTTR by 70% and proactively prevent 90% of incidents with Stellar Insights.`,
    icon: "📊",
    category: t("categories.observability"),
    pricing: {
      type: "one-time",
      amount: 299,
    },
    author: "ObservaStar Technologies",
    downloads: 12,
    rating: 4.9,
    version: "2.3.1",
    features: [
      "Real-time metrics and dashboards",
      "Distributed tracing across clusters",
      "AI-powered anomaly detection",
      "Predictive analytics and forecasting",
      "Custom alert rules and notifications",
      "Log aggregation and analysis",
      "Cost optimization recommendations",
      "API for custom integrations",
    ],
    requirements: [
      "KubeStellar v0.19.0 or higher",
      "Prometheus operator",
      "Grafana (optional)",
    ],
    compatibility: ["Linux", "macOS", "Windows"],
    screenshots: [],
    documentation: "https://docs.stellarinsights.io",
    website: "https://stellarinsights.io",
    tags: ["observability", "metrics", "analytics", "monitoring", "ai"],
  };
}
