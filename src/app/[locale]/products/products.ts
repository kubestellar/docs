export interface Product {
  id: string;
  name: string;
  fullName: string;
  description: string;
  logo: string;
  website: string;
  repository: string;
  theme: {
    gradient: string;
    primaryColor: string;
    secondaryColor: string;
    floatingShapes: string[];
  };
}

export const products: Product[] = [
  {
    id: "kubestellar-ui",
    name: "KubeStellar UI",
    fullName: "KubeStellar UI", 
    description: "A powerful web-based interface for managing multi-cluster Kubernetes orchestration with intuitive dashboards, real-time monitoring, and comprehensive controls for cluster management.",
    logo: "/products/ui.png",
    website: "https://ui.kubestellar.io",
    repository: "https://github.com/kubestellar/ui",
    theme: {
      gradient: "linear-gradient(135deg, #3B82F6, #1D4ED8, #1E40AF, #1E3A8A)",
      primaryColor: "#3B82F6",
      secondaryColor: "#1E3A8A",
      floatingShapes: ["bg-blue-500", "bg-blue-400", "bg-blue-600"],
    },
  },
  {
    id: "kubeflex",
    name: "KubeFlex",
    fullName: "KubeFlex",
    description: "A flexible Kubernetes management platform providing comprehensive tools and resources for multi-cluster orchestration and workload distribution.",
    logo: "/products/kubeflex.png",
    website: "https://kflex.kubestellar.io",
    repository: "https://github.com/kubestellar/kubeflex",
    theme: {
      gradient: "linear-gradient(135deg, #10B981, #059669, #047857, #065F46)",
      primaryColor: "#10B981",
      secondaryColor: "#065F46",
      floatingShapes: ["bg-emerald-500", "bg-green-500", "bg-emerald-600"],
    },
  },
  {
    id: "a2a",
    name: "A2A",
    fullName: "A2A",
    description: "Application-to-Application communication platform enabling seamless connectivity within the KubeStellar ecosystem.",
    logo: "/products/a2a.png",
    website: "https://a2a.kubestellar.io",
    repository: "https://github.com/kubestellar/a2a",
    theme: {
      gradient: "linear-gradient(135deg, #8B5CF6, #7C3AED, #6D28D9, #5B21B6)",
      primaryColor: "#8B5CF6",
      secondaryColor: "#5B21B6",
      floatingShapes: ["bg-purple-500", "bg-violet-500", "bg-purple-600"],
    },
  },
  {
    id: "galaxy-marketplace",
    name: "Galaxy Marketplace",
    fullName: "KS Galaxy Marketplace",
    description: "A centralized marketplace for KubeStellar extensions, plugins, and community-contributed tools and integrations.",
    logo: "/products/galaxy.png",
    website: "https://galaxy.kubestellar.io",
    repository: "https://github.com/kubestellar/ui-plugins",
    theme: {
      gradient: "linear-gradient(135deg, #F59E0B, #D97706, #B45309, #92400E)",
      primaryColor: "#F59E0B",
      secondaryColor: "#92400E",
      floatingShapes: ["bg-amber-500", "bg-yellow-500", "bg-orange-500"],
    },
  },
];

export function getProductById(id: string): Product | undefined {
  return products.find(product => product.id === id);
}

export function getAllProducts(): Product[] {
  return products;
}