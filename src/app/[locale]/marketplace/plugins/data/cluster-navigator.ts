import type { Plugin } from "../types";
import type { Translator } from "./translator";

export function createClusterNavigatorPlugin(t: Translator): Plugin {
  return {
    id: "5",
    name: "Cluster Navigator",
    slug: "cluster-navigator",
    tagline: "Visual cluster topology and resource mapping",
    description:
      "Navigate your multi-cluster topology with an interactive visual interface. Understand relationships, dependencies, and resource distribution at a glance.",
    longDescription: `Cluster Navigator brings your KubeStellar infrastructure to life with stunning visual representations. See your entire cluster topology, understand service dependencies, track resource distribution, and identify bottlenecks with an intuitive, interactive interface.

Built for both developers and operators, Cluster Navigator makes complex multi-cluster architectures easy to understand. Zoom in on specific namespaces, filter by labels, and trace request paths across clusters with just a few clicks.

Free and open source, trusted by over 15,000 KubeStellar users worldwide.`,
    icon: "🗺️",
    category: t("categories.visualization"),
    pricing: {
      type: "free",
    },
    author: "KubeStellar Core Team",
    downloads: 18,
    rating: 4.6,
    version: "1.5.3",
    features: [
      "Interactive cluster topology visualization",
      "Service dependency mapping",
      "Resource distribution heatmaps",
      "Real-time status indicators",
      "Search and filter capabilities",
      "Export to PNG, SVG, or PDF",
      "Dark and light themes",
      "Responsive web interface",
    ],
    requirements: [
      "KubeStellar v0.20.0 or higher",
      "Modern web browser",
      "Network access to clusters",
    ],
    compatibility: ["Web-based"],
    screenshots: [],
    documentation: "https://docs.kubestellar.io/plugins/cluster-navigator",
    github: "https://github.com/kubestellar/cluster-navigator",
    tags: ["visualization", "topology", "ui", "free", "open-source"],
  };
}
