import type { Plugin } from "../types";
import type { Translator } from "./translator";

export function createEdgeGuardianPlugin(t: Translator): Plugin {
  return {
    id: "3",
    name: "Edge Guardian",
    slug: "edge-guardian",
    tagline: "Security and compliance for edge deployments",
    description:
      "Ensure your edge clusters meet security and compliance requirements with automated scanning, policy enforcement, and real-time threat detection.",
    longDescription: `Edge Guardian is your security command center for KubeStellar-managed edge deployments. With the explosion of edge computing, security can't be an afterthought. Edge Guardian provides comprehensive security scanning, policy enforcement, and threat detection specifically designed for distributed edge environments.

Get instant visibility into security postures across all edge locations, automatically enforce compliance policies, and detect anomalies before they become incidents. Built-in integrations with popular SIEM tools ensure your security team has all the information they need.

SOC 2, ISO 27001, and HIPAA compliant out of the box.`,
    icon: "🛡️",
    category: t("categories.security"),
    pricing: {
      type: "monthly",
      amount: 149,
    },
    author: "EdgeSecure Labs",
    downloads: 5,
    rating: 4.7,
    version: "1.8.0",
    features: [
      "Continuous security scanning",
      "Policy-as-code enforcement",
      "Real-time threat detection",
      "Compliance reporting (SOC 2, ISO 27001, HIPAA)",
      "Vulnerability management",
      "Network policy validation",
      "Secret scanning and rotation",
      "Integration with popular SIEM tools",
    ],
    requirements: [
      "KubeStellar v0.21.0 or higher",
      "Kubernetes 1.24+",
      "Valid subscription",
    ],
    compatibility: ["Linux", "macOS"],
    screenshots: [],
    documentation: "https://docs.edgeguardian.io",
    website: "https://edgeguardian.io",
    tags: ["security", "compliance", "edge", "scanning", "premium"],
  };
}
