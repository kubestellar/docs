import type { Plugin } from "../types";
import type { Translator } from "./translator";

export function createAlertManagerPlusPlugin(t: Translator): Plugin {
  return {
    id: "18",
    name: "Alert Manager Plus",
    slug: "alert-manager-plus",
    tagline: "Advanced alerting and incident management",
    description:
      "Sophisticated alerting system for KubeStellar with smart routing, deduplication, and integration with popular incident management platforms.",
    longDescription: `Alert Manager Plus transforms Kubernetes alerts into actionable insights. Smart alert routing ensures the right people get notified, while intelligent deduplication reduces noise. Integration with PagerDuty, OpsGenie, and Slack ensures alerts reach your team wherever they are.

Alert correlation detects patterns and prevents alert storms. Runbook automation can auto-remediate common issues, reducing manual intervention and MTTR.

Affordable monthly pricing with enterprise support.`,
    icon: "🚨",
    category: "Observability",
    pricing: {
      type: "monthly",
      amount: 89,
    },
    author: "AlertStar Inc.",
    downloads: 9,
    rating: 4.8,
    version: "1.5.0",
    features: [
      "Smart alert routing",
      "Intelligent deduplication",
      "PagerDuty/OpsGenie integration",
      "Alert correlation",
      "Runbook automation",
      "Escalation policies",
      "Custom alert templates",
      "Detailed analytics",
    ],
    requirements: [
      "KubeStellar v0.20.0 or higher",
      "Prometheus or compatible metrics source",
    ],
    compatibility: ["Linux", "macOS"],
    screenshots: [],
    documentation: "https://docs.alertstar.io",
    website: "https://alertstar.io",
    tags: [
      "alerting",
      "observability",
      "incident-management",
      "automation",
      "premium",
    ],
  };
}
