import type { Plugin } from "../types";
import type { Translator } from "./translator";

export function createClusterProvisionerPlugin(t: Translator): Plugin {
  return {
    id: "17",
    name: "Cluster Provisioner",
    slug: "cluster-provisioner",
    tagline: "Automate cluster creation and onboarding",
    description:
      "Streamline cluster provisioning with automated creation, configuration, and onboarding to KubeStellar. Support for major cloud providers and on-prem.",
    longDescription: `Cluster Provisioner eliminates the manual work of creating and onboarding new clusters. Define your cluster specifications in code, and let Cluster Provisioner handle creation across AWS, Azure, GCP, or on-premises infrastructure.

Automatic KubeStellar onboarding ensures new clusters are ready to use immediately. Built-in compliance templates ensure clusters meet your security and governance requirements from day one.

One-time purchase includes lifetime updates.`,
    icon: "🏗️",
    category: "CLI Tools",
    pricing: {
      type: "one-time",
      amount: 349,
    },
    author: "ProvisionStar",
    downloads: 6,
    rating: 4.7,
    version: "2.1.3",
    features: [
      "Multi-cloud cluster creation",
      "Infrastructure-as-code support",
      "Automatic KubeStellar onboarding",
      "Compliance template library",
      "Cluster templating",
      "Batch provisioning",
      "Cost estimation",
      "Terraform and Pulumi integration",
    ],
    requirements: [
      "KubeStellar v0.20.0 or higher",
      "Cloud provider credentials",
    ],
    compatibility: ["Linux", "macOS", "Windows"],
    screenshots: [],
    documentation: "https://docs.provisionstar.io",
    website: "https://provisionstar.io",
    tags: ["provisioning", "automation", "infrastructure", "cli", "premium"],
  };
}
