import type { Plugin } from "../types";
import type { Translator } from "./translator";

export function createGitopsBridgePlugin(t: Translator): Plugin {
  return {
    id: "11",
    name: "GitOps Bridge",
    slug: "gitops-bridge",
    tagline: "Seamless GitOps integration for KubeStellar",
    description:
      "Bridge KubeStellar with your GitOps workflow. Manage cluster configurations through Git with full support for ArgoCD and Flux.",
    longDescription: `GitOps Bridge makes it effortless to manage your KubeStellar infrastructure using GitOps principles. Declare your desired cluster state in Git, and let GitOps Bridge handle the synchronization across your entire cluster fleet.

Full support for ArgoCD, Flux CD, and other popular GitOps tools. Automatic drift detection, reconciliation, and rollback capabilities ensure your infrastructure always matches your Git repository.

Free forever, because GitOps should be accessible to everyone.`,
    icon: "🔀",
    category: "GitOps",
    pricing: {
      type: "free",
    },
    author: "KubeStellar Core Team",
    downloads: 16,
    rating: 4.8,
    version: "2.0.0",
    features: [
      "ArgoCD and Flux CD integration",
      "Automated drift detection",
      "Multi-cluster GitOps workflows",
      "Progressive delivery support",
      "Rollback capabilities",
      "Git-based RBAC",
      "Webhook support for CI/CD",
      "Detailed sync status reporting",
    ],
    requirements: [
      "KubeStellar v0.20.0 or higher",
      "Git repository",
      "ArgoCD or Flux CD (optional)",
    ],
    compatibility: ["Linux", "macOS", "Windows"],
    screenshots: [],
    documentation: "https://docs.kubestellar.io/plugins/gitops-bridge",
    github: "https://github.com/kubestellar/gitops-bridge",
    tags: ["gitops", "argocd", "flux", "automation", "free"],
  };
}
