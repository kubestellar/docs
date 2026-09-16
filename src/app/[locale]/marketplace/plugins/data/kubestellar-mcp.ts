import type { Plugin } from "../types";
import type { Translator } from "./translator";

export function createKubestellarMcpPlugin(t: Translator): Plugin {
  return {
    id: "25",
    name: "kubestellar-mcp",
    slug: "kubestellar-mcp",
    tagline: "AI-powered multi-cluster Kubernetes management for Claude Code",
    description:
      "Integrate Claude Code with your Kubernetes clusters. Use natural language to query pods, diagnose issues, analyze RBAC, and manage multi-cluster environments.",
    longDescription: `KubeStellar MCP brings the power of AI to multi-cluster Kubernetes management. Install as a Claude Code plugin and use natural language to interact with your clusters.

Ask questions like "find pods with issues", "what permissions does the admin service account have?", or "show me warning events in kube-system". KubeStellar MCP understands your intent and executes the right kubectl commands across all your clusters.

Built-in diagnostic tools help you quickly identify CrashLoopBackOff pods, stuck deployments, security misconfigurations, and RBAC issues. Perfect for DevOps teams managing complex multi-cluster environments.

**Installation:**
\`\`\`bash
brew tap kubestellar/tap
brew install kubestellar-ops kubestellar-deploy
\`\`\`

Or install via Claude Code:
\`\`\`
/plugin marketplace add kubestellar/claude-plugins
\`\`\`

Free, open source, and built by the KubeStellar team.`,
    icon: "🤖",
    category: t("categories.cliTools"),
    pricing: {
      type: "free",
    },
    author: "KubeStellar Core Team",
    downloads: 42,
    rating: 4.9,
    version: "0.6.0",
    features: [
      "Natural language Kubernetes queries",
      "Multi-cluster support via kubeconfig",
      "Claude Code MCP plugin integration",
      "RBAC analysis and permission checking",
      "Pod diagnostics (CrashLoopBackOff, OOMKilled, pending)",
      "Deployment issue detection",
      "Security misconfiguration scanning",
      "Namespace-level analysis",
      "Event filtering and monitoring",
      "Kubeconfig health auditing",
    ],
    requirements: [
      "Claude Code CLI",
      "kubectl v1.26+",
      "Kubeconfig with cluster access",
    ],
    compatibility: ["Linux", "macOS", "Windows"],
    screenshots: [],
    documentation: "https://kubestellar.io/docs/kubestellar-mcp/overview/intro",
    github: "https://github.com/kubestellar/kubestellar-mcp",
    tags: ["claude", "ai", "kubectl", "multi-cluster", "diagnostics", "rbac", "free", "mcp"],
  };
}
