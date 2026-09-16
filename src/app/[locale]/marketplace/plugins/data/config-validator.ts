import type { Plugin } from "../types";
import type { Translator } from "./translator";

export function createConfigValidatorPlugin(t: Translator): Plugin {
  return {
    id: "6",
    name: "Config Validator",
    slug: "config-validator",
    tagline: "Validate KubeStellar configurations before deployment",
    description:
      "Catch configuration errors before they cause problems. Validate your BindingPolicies, Workspaces, and custom resources with comprehensive rule sets.",
    longDescription: `Config Validator is your safety net for KubeStellar configurations. Before deploying changes to your production clusters, validate them against comprehensive rule sets, best practices, and your own custom policies.

Catch typos, misconfigurations, security issues, and compliance violations in seconds. Integrates seamlessly into your CI/CD pipelines and provides clear, actionable error messages that help you fix issues fast.

Prevent 99% of configuration-related incidents with Config Validator.`,
    icon: "✅",
    category: "Development Tools",
    pricing: {
      type: "free",
    },
    author: "KubeStellar Core Team",
    downloads: 11,
    rating: 4.7,
    version: "1.2.0",
    features: [
      "Comprehensive validation rules",
      "Custom policy support",
      "CI/CD pipeline integration",
      "Detailed error reporting",
      "Best practice recommendations",
      "Schema validation",
      "Dry-run simulation",
      "VS Code extension available",
    ],
    requirements: ["KubeStellar v0.18.0 or higher", "kubectl v1.25+"],
    compatibility: ["Linux", "macOS", "Windows"],
    screenshots: [],
    documentation: "https://docs.kubestellar.io/plugins/config-validator",
    github: "https://github.com/kubestellar/config-validator",
    tags: ["validation", "ci-cd", "configuration", "development", "free"],
  };
}
