import type { Plugin } from "../types";
import type { Translator } from "./translator";

export function createComplianceReporterPlugin(t: Translator): Plugin {
  return {
    id: "20",
    name: "Compliance Reporter",
    slug: "compliance-reporter",
    tagline: "Automated compliance reporting and auditing",
    description:
      "Generate compliance reports for SOC 2, ISO 27001, HIPAA, and custom frameworks. Continuous monitoring ensures you stay compliant.",
    longDescription: `Compliance Reporter automates the tedious work of compliance auditing and reporting. Continuous monitoring checks your KubeStellar infrastructure against compliance frameworks, automatically generating reports and alerting you to violations.

Built-in templates for SOC 2, ISO 27001, HIPAA, PCI-DSS, and GDPR. Custom framework support lets you define your own requirements. Evidence collection happens automatically, making audits stress-free.

Essential for regulated industries. One-time purchase, lifetime value.`,
    icon: "📝",
    category: "Governance",
    pricing: {
      type: "one-time",
      amount: 449,
    },
    author: "ComplianceStar",
    downloads: 4,
    rating: 4.9,
    version: "2.0.1",
    features: [
      "Automated compliance monitoring",
      "SOC 2, ISO 27001, HIPAA templates",
      "Custom framework support",
      "Automated evidence collection",
      "Scheduled report generation",
      "Violation alerts",
      "Audit trail management",
      "Export to PDF, CSV, JSON",
    ],
    requirements: ["KubeStellar v0.21.0 or higher", "Audit logging enabled"],
    compatibility: ["Linux", "macOS", "Windows"],
    screenshots: [],
    documentation: "https://docs.compliancestar.io",
    website: "https://compliancestar.io",
    tags: ["compliance", "governance", "auditing", "reporting", "premium"],
  };
}
