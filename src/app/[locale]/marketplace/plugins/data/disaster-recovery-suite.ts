import type { Plugin } from "../types";
import type { Translator } from "./translator";

export function createDisasterRecoverySuitePlugin(t: Translator): Plugin {
  return {
    id: "7",
    name: "Disaster Recovery Suite",
    slug: "disaster-recovery-suite",
    tagline: "Complete backup and disaster recovery solution",
    description:
      "Protect your KubeStellar deployments with automated backups, point-in-time recovery, and multi-region disaster recovery capabilities.",
    longDescription: `When disaster strikes, Disaster Recovery Suite ensures your KubeStellar infrastructure can be restored quickly and completely. Automated backups of your cluster state, configurations, and data happen continuously in the background.

Restore to any point in time, replicate backups across regions for true disaster recovery, and test your recovery procedures without impacting production. Meet your RTO and RPO requirements with confidence.

Enterprise-grade disaster recovery that just works.`,
    icon: "💾",
    category: "Backup & Recovery",
    pricing: {
      type: "monthly",
      amount: 199,
    },
    author: "ResilienStar Inc.",
    downloads: 6,
    rating: 4.8,
    version: "2.0.5",
    features: [
      "Automated continuous backups",
      "Point-in-time recovery",
      "Multi-region replication",
      "Backup encryption at rest and in transit",
      "Recovery testing environment",
      "RPO under 5 minutes",
      "RTO under 30 minutes",
      "Compliance reporting",
    ],
    requirements: [
      "KubeStellar v0.20.0 or higher",
      "S3-compatible storage",
      "Valid license",
    ],
    compatibility: ["Linux", "macOS"],
    screenshots: [],
    documentation: "https://docs.resilienstar.io",
    website: "https://resilienstar.io",
    tags: [
      "backup",
      "disaster-recovery",
      "business-continuity",
      "enterprise",
      "premium",
    ],
  };
}
