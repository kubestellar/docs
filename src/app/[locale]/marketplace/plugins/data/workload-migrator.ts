import type { Plugin } from "../types";
import type { Translator } from "./translator";

export function createWorkloadMigratorPlugin(t: Translator): Plugin {
  return {
    id: "15",
    name: "Workload Migrator",
    slug: "workload-migrator",
    tagline: "Seamlessly migrate workloads between clusters",
    description:
      "Migrate applications and data between KubeStellar clusters with zero downtime. Perfect for cluster upgrades, disaster recovery, and rebalancing.",
    longDescription: `Workload Migrator makes cluster migrations painless. Whether you're upgrading clusters, rebalancing workloads, or responding to disasters, Workload Migrator ensures smooth transitions with zero downtime.

Intelligent pre-flight checks catch potential issues, automated data migration handles persistent volumes, and gradual traffic shifting ensures reliability. Rollback capabilities provide a safety net if anything goes wrong.

Essential tool for production KubeStellar deployments.`,
    icon: "🚚",
    category: "CLI Tools",
    pricing: {
      type: "one-time",
      amount: 199,
    },
    author: "MigrateStar",
    downloads: 5,
    rating: 4.8,
    version: "1.4.2",
    features: [
      "Zero-downtime migrations",
      "Pre-flight validation checks",
      "Persistent volume migration",
      "Gradual traffic shifting",
      "Automated rollback",
      "Migration scheduling",
      "Progress tracking",
      "Dry-run mode",
    ],
    requirements: ["KubeStellar v0.21.0 or higher", "kubectl v1.26+"],
    compatibility: ["Linux", "macOS", "Windows"],
    screenshots: [],
    documentation: "https://docs.migratestar.io",
    website: "https://migratestar.io",
    tags: ["migration", "workload", "cli", "disaster-recovery", "premium"],
  };
}
