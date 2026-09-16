import type { Plugin } from "../types";
import type { Translator } from "./translator";

export function createMultiTenancyManagerPlugin(t: Translator): Plugin {
  return {
    id: "23",
    name: "Multi-Tenancy Manager",
    slug: "multi-tenancy-manager",
    tagline: "Enterprise-grade multi-tenancy for KubeStellar",
    description:
      "Implement secure multi-tenancy with isolated namespaces, RBAC templates, resource quotas, and tenant-specific policies across your cluster fleet.",
    longDescription: `Multi-Tenancy Manager transforms your KubeStellar deployment into a secure, multi-tenant platform. Onboard new tenants in seconds with pre-configured isolation, security policies, and resource limits. Each tenant gets their own isolated environment while you maintain centralized control and visibility.

Hierarchical namespace support enables complex organizational structures. Per-tenant billing and showback reports make it easy to track and allocate costs. Advanced RBAC templates ensure security best practices are enforced automatically.

Perfect for SaaS platforms, shared services, and organizations with multiple teams.`,
    icon: "🏢",
    category: "Governance",
    pricing: {
      type: "one-time",
      amount: 599,
    },
    author: "TenantStar Enterprise",
    downloads: 3,
    rating: 4.9,
    version: "3.0.1",
    features: [
      "Automated tenant onboarding",
      "Hierarchical namespaces",
      "RBAC template library",
      "Resource quota management",
      "Network isolation policies",
      "Per-tenant billing reports",
      "Tenant self-service portal",
      "Audit logging per tenant",
    ],
    requirements: ["KubeStellar v0.21.0 or higher", "Kubernetes 1.25+"],
    compatibility: ["Linux", "macOS", "Windows"],
    screenshots: [],
    documentation: "https://docs.tenantstar.io",
    website: "https://tenantstar.io",
    tags: ["multi-tenancy", "governance", "rbac", "enterprise", "premium"],
  };
}
