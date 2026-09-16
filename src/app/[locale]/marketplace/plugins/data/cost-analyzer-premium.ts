import type { Plugin } from "../types";
import type { Translator } from "./translator";

export function createCostAnalyzerPremiumPlugin(t: Translator): Plugin {
  return {
    id: "12",
    name: "Cost Analyzer Premium",
    slug: "cost-analyzer-premium",
    tagline:
      "Advanced cost tracking and optimization for multi-cluster environments",
    description:
      "Track, analyze, and optimize costs across your entire KubeStellar infrastructure with granular insights and AI-powered recommendations.",
    longDescription: `Cost Analyzer Premium gives you complete visibility into your multi-cluster spending. Track costs by cluster, namespace, team, or any custom label. Understand exactly where your cloud budget is going and get AI-powered recommendations to reduce waste.

Set budgets, get alerts before you overspend, and forecast future costs with machine learning models. Generate beautiful reports for stakeholders and integrate with your existing FinOps tools.

Pay once, use forever. Includes all future updates and features.`,
    icon: "💰",
    category: "Cost Management",
    pricing: {
      type: "one-time",
      amount: 399,
    },
    author: "FinOps Labs",
    downloads: 7,
    rating: 4.7,
    version: "3.2.1",
    features: [
      "Granular cost tracking and attribution",
      "AI-powered optimization recommendations",
      "Budget management and alerts",
      "Cost forecasting and trending",
      "Chargeback and showback reports",
      "Multi-cloud cost aggregation",
      "Custom dashboards and reports",
      "Integration with cloud billing APIs",
    ],
    requirements: [
      "KubeStellar v0.20.0 or higher",
      "Access to cloud provider billing APIs",
    ],
    compatibility: ["Linux", "macOS", "Windows"],
    screenshots: [],
    documentation: "https://docs.finopslabs.io",
    website: "https://finopslabs.io",
    tags: [
      "cost-management",
      "finops",
      "analytics",
      "optimization",
      "premium",
    ],
  };
}
