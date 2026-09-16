import type { Plugin } from "../types";
import type { Translator } from "./translator";

export function createSecretsManagerPlugin(t: Translator): Plugin {
  return {
    id: "13",
    name: "Secrets Manager",
    slug: "secrets-manager",
    tagline: "Centralized secrets management for distributed clusters",
    description:
      "Securely manage and distribute secrets across all your KubeStellar clusters with automatic rotation, encryption, and audit logging.",
    longDescription: `Secrets Manager provides enterprise-grade secrets management for your KubeStellar infrastructure. Centralize secret storage, automate rotation, and ensure secrets are encrypted at rest and in transit. Built-in integration with HashiCorp Vault, AWS Secrets Manager, and Azure Key Vault.

Automatic secret rotation prevents credential compromise, while detailed audit logs ensure compliance. RBAC controls determine who can access which secrets, and automatic sync ensures secrets are always up-to-date across all clusters.`,
    icon: "🔐",
    category: "Security",
    pricing: {
      type: "monthly",
      amount: 129,
    },
    author: "VaultStar Security",
    downloads: 8,
    rating: 4.9,
    version: "1.6.0",
    features: [
      "Centralized secret storage",
      "Automatic secret rotation",
      "Integration with Vault, AWS, Azure",
      "End-to-end encryption",
      "Detailed audit logging",
      "RBAC and access policies",
      "Cross-cluster secret sync",
      "Emergency secret revocation",
    ],
    requirements: [
      "KubeStellar v0.21.0 or higher",
      "External secrets backend (optional)",
    ],
    compatibility: ["Linux", "macOS"],
    screenshots: [],
    documentation: "https://docs.vaultstar.io",
    website: "https://vaultstar.io",
    tags: ["security", "secrets", "vault", "encryption", "premium"],
  };
}
