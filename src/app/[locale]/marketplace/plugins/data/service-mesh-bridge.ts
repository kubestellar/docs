import type { Plugin } from "../types";
import type { Translator } from "./translator";

export function createServiceMeshBridgePlugin(t: Translator): Plugin {
  return {
    id: "21",
    name: "Service Mesh Bridge",
    slug: "service-mesh-bridge",
    tagline: "Connect and manage multiple service meshes",
    description:
      "Unified management for Istio, Linkerd, and Consul service meshes across your KubeStellar clusters. Centralized observability and control.",
    longDescription: `Service Mesh Bridge provides a unified control plane for managing multiple service mesh implementations across your distributed clusters. Whether you're running Istio, Linkerd, Consul, or a mix of different meshes, Service Mesh Bridge gives you a single pane of glass for configuration, monitoring, and troubleshooting.

Cross-mesh service discovery enables services in different meshes to communicate seamlessly. Advanced traffic management features allow you to implement sophisticated routing, load balancing, and failover strategies across mesh boundaries.

Free forever, built by mesh enthusiasts for mesh enthusiasts.`,
    icon: "🕸️",
    category: "Networking",
    pricing: {
      type: "free",
    },
    author: "KubeStellar Community",
    downloads: 9,
    rating: 4.7,
    version: "1.2.4",
    features: [
      "Multi-mesh management",
      "Cross-mesh service discovery",
      "Unified observability dashboard",
      "Traffic mirroring and shadowing",
      "Centralized policy management",
      "Mesh migration tools",
      "Performance metrics aggregation",
      "Integration with popular meshes",
    ],
    requirements: [
      "KubeStellar v0.20.0 or higher",
      "Service mesh installed (Istio/Linkerd/Consul)",
    ],
    compatibility: ["Linux", "macOS"],
    screenshots: [],
    documentation: "https://docs.kubestellar.io/plugins/service-mesh-bridge",
    github: "https://github.com/kubestellar/service-mesh-bridge",
    tags: ["service-mesh", "networking", "istio", "linkerd", "free"],
  };
}
