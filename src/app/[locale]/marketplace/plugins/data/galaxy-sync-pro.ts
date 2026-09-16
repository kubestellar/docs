import type { Plugin } from "../types";
import type { Translator } from "./translator";

export function createGalaxySyncProPlugin(t: Translator): Plugin {
  return {
    id: "2",
    name: "Galaxy Sync Pro",
    slug: "galaxy-sync-pro",
    tagline: "Advanced synchronization engine for KubeStellar clusters",
    description:
      "Galaxy Sync Pro provides enterprise-grade synchronization capabilities with advanced conflict resolution, real-time monitoring, and automated healing.",
    longDescription: `Galaxy Sync Pro takes KubeStellar's synchronization capabilities to the next level with advanced features designed for enterprise workloads. Get real-time visibility into sync operations, automatic conflict resolution, and intelligent retry mechanisms.

Monitor sync health across your entire cluster fleet with beautiful dashboards, set up custom alerts for sync failures, and leverage machine learning-powered optimization to improve sync performance over time.

Trusted by Fortune 500 companies to keep their distributed applications in perfect harmony.`,
    icon: "🔄",
    category: t("categories.synchronization"),
    pricing: {
      type: "monthly",
      amount: 99,
    },
    author: "StellarSync Inc.",
    downloads: 8,
    rating: 4.9,
    version: "3.5.2",
    features: [
      "Real-time sync monitoring dashboard",
      "Advanced conflict resolution algorithms",
      "Automated healing and retry mechanisms",
      "Custom sync policies and rules",
      "Performance analytics and optimization",
      "Multi-region replication",
      "Compliance and audit logging",
      "24/7 enterprise support",
    ],
    requirements: [
      "KubeStellar v0.20.0 or higher",
      "Minimum 3 managed clusters",
      "Valid license key",
    ],
    compatibility: ["Linux", "macOS"],
    screenshots: [],
    documentation: "https://docs.galaxysync.io",
    website: "https://galaxysync.io",
    tags: ["sync", "enterprise", "monitoring", "automation", "premium"],
  };
}
