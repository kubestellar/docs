import type { Plugin } from "../types";
import type { Translator } from "./translator";

export function createKubectlMultiPlugin(t: Translator): Plugin {
  return {
    id: "1",
    name: "KubeCtl Multi",
    slug: "kubectl-multi",
    tagline:
      "Execute kubectl commands across multiple clusters simultaneously",
    description:
      "Streamline your multi-cluster operations with KubeCtl Multi. Execute commands across all your KubeStellar-managed clusters with a single command.",
    longDescription: `KubeCtl Multi is the ultimate productivity tool for managing multiple Kubernetes clusters through KubeStellar. Built specifically for the KubeStellar ecosystem, it allows you to execute kubectl commands across all your managed clusters simultaneously, saving hours of manual work.

With intelligent context switching and parallel execution, KubeCtl Multi ensures your operations are fast, reliable, and consistent across your entire infrastructure. Whether you're deploying applications, updating configurations, or troubleshooting issues, KubeCtl Multi makes it seamless.

Perfect for DevOps teams managing edge deployments, hybrid clouds, or geographically distributed clusters.`,
    icon: "🎯",
    category: t("categories.cliTools"),
    pricing: {
      type: "free",
    },
    author: "KubeStellar Core Team",
    downloads: 15,
    rating: 4.8,
    version: "2.1.0",
    features: [
      "Execute commands across all clusters simultaneously",
      "Intelligent context switching and management",
      "Parallel execution with customizable concurrency",
      "Built-in safety checks and rollback mechanisms",
      "Interactive mode for cluster selection",
      "Export results to JSON, YAML, or CSV formats",
      "Integration with KubeStellar's cluster inventory",
      "Real-time progress tracking and logging",
    ],
    requirements: [
      "KubeStellar v0.21.0 or higher",
      "kubectl v1.26+",
      "Go 1.20+ (for building from source)",
    ],
    compatibility: ["Linux", "macOS", "Windows"],
    screenshots: [],
    documentation: "https://docs.kubestellar.io/plugins/kubectl-multi",
    github: "https://github.com/kubestellar/kubectl-multi-plugin",
    tags: ["kubectl", "multi-cluster", "cli", "automation", "productivity"],
  };
}
