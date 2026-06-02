import { describe, expect, it } from 'vitest'
import { buildPageMap } from '../app/docs/page-map'
import type { ProjectId } from '../config/versions'

type PageNode = {
  kind: 'Folder' | 'MdxPage' | 'Meta'
  name?: string
  route?: string
  children?: PageNode[]
}

type ExpectedNavEntry = {
  title: string
  route: string
  filePath: string
}

type ExpectedSection = {
  title: string
  route: string
}

const EXPECTED_SECTIONS: Partial<Record<ProjectId, ExpectedSection[]>> = {
  'kubestellar-mcp': [
    { title: 'Commands', route: '/docs/kubestellar-mcp/commands' },
  ],
  console: [
    { title: 'Setup', route: '/docs/console/setup' },
    { title: 'AI Integration', route: '/docs/console/ai-integration' },
    { title: 'Security', route: '/docs/console/security' },
    { title: 'Enterprise', route: '/docs/console/enterprise' },
    { title: 'Development', route: '/docs/console/development' },
    { title: 'Troubleshooting', route: '/docs/console/troubleshooting' },
  ],
}

const EXPECTED_ENTRIES: Partial<Record<ProjectId, ExpectedNavEntry[]>> = {
  'kubestellar-mcp': [
    { title: 'App Logs', route: '/docs/kubestellar-mcp/commands/app-logs', filePath: 'commands/app-logs.md' },
    { title: 'App Status', route: '/docs/kubestellar-mcp/commands/app-status', filePath: 'commands/app-status.md' },
    { title: 'Delete', route: '/docs/kubestellar-mcp/commands/delete', filePath: 'commands/delete.md' },
    { title: 'Deploy', route: '/docs/kubestellar-mcp/commands/deploy', filePath: 'commands/deploy.md' },
    { title: 'GitOps Drift', route: '/docs/kubestellar-mcp/commands/gitops-drift', filePath: 'commands/gitops-drift.md' },
    { title: 'GitOps Sync', route: '/docs/kubestellar-mcp/commands/gitops-sync', filePath: 'commands/gitops-sync.md' },
    { title: 'Helm Install', route: '/docs/kubestellar-mcp/commands/helm-install', filePath: 'commands/helm-install.md' },
    { title: 'Helm Rollback', route: '/docs/kubestellar-mcp/commands/helm-rollback', filePath: 'commands/helm-rollback.md' },
    { title: 'Helm Uninstall', route: '/docs/kubestellar-mcp/commands/helm-uninstall', filePath: 'commands/helm-uninstall.md' },
    { title: 'Kustomize', route: '/docs/kubestellar-mcp/commands/kustomize', filePath: 'commands/kustomize.md' },
    { title: 'Label', route: '/docs/kubestellar-mcp/commands/label', filePath: 'commands/label.md' },
  ],
  console: [
    { title: 'Console Overview', route: '/docs/console/overview/console-overview', filePath: 'console-overview.md' },
    { title: 'Architecture Diagram', route: '/docs/console/overview/architecture-diagram', filePath: '_architecture-diagram.md' },
    { title: 'Updates and Releases', route: '/docs/console/overview/updates-and-releases', filePath: 'console-updates.md' },
    { title: 'Local Setup Guide', route: '/docs/console/setup/local-setup-guide', filePath: 'local-setup.md' },
    { title: 'Local Deployment', route: '/docs/console/setup/local-deployment', filePath: 'local-deployment.md' },
    { title: 'Deploy & Orchestrate', route: '/docs/console/setup/deploy-orchestrate', filePath: 'deploy.md' },
    { title: 'vCluster Setup', route: '/docs/console/setup/vcluster-setup', filePath: 'vcluster-setup.md' },
    { title: 'Console Features', route: '/docs/console/features/console-features', filePath: 'console-features.md' },
    { title: 'Card Types', route: '/docs/console/features/card-types', filePath: 'cards.md' },
    { title: 'Card Reference', route: '/docs/console/features/card-reference', filePath: 'console-cards.md' },
    { title: 'Cost Optimization Cards', route: '/docs/console/features/cost-optimization-cards', filePath: 'cost-optimization.md' },
    { title: 'Drasi Reactive Pipeline Dashboard', route: '/docs/console/features/drasi-reactive-pipeline-dashboard', filePath: 'drasi-dashboard.md' },
    { title: 'KServe Monitoring Card', route: '/docs/console/features/kserve-monitoring-card', filePath: 'kserve-monitoring.md' },
    { title: 'Kagenti LLM Provider Setup', route: '/docs/console/ai-integration/kagenti-llm-provider-setup', filePath: 'kagenti-llm-provider-setup.md' },
    { title: 'Local LLM Strategy', route: '/docs/console/ai-integration/local-llm-strategy', filePath: 'local-llm-strategy.md' },
    { title: 'Authentication & Sessions', route: '/docs/console/security/authentication-sessions', filePath: 'authentication.md' },
    { title: 'Security Model', route: '/docs/console/security/security-model', filePath: 'security-model.md' },
    { title: 'Persistence & State Management', route: '/docs/console/security/persistence-state-management', filePath: 'persistence.md' },
    { title: 'Enterprise Compliance Portal', route: '/docs/console/enterprise/enterprise-compliance-portal', filePath: 'enterprise-compliance.md' },
    { title: 'Federation & Multi-Hub', route: '/docs/console/enterprise/federation-multi-hub', filePath: 'federation.md' },
    { title: 'Development Methodology', route: '/docs/console/development/development-methodology', filePath: 'development.md' },
    { title: 'Rewards System', route: '/docs/console/programs/rewards-system', filePath: 'console-rewards.md' },
    { title: 'Troubleshooting', route: '/docs/console/troubleshooting/troubleshooting', filePath: 'troubleshooting.md' },
    { title: 'Windows 11 Local Source Build Troubleshooting', route: '/docs/console/troubleshooting/windows-11-local-source-build-troubleshooting', filePath: 'windows-11-local-source-build-troubleshooting.md' },
  ],
}

function flattenNodes(nodes: PageNode[]): PageNode[] {
  return nodes.flatMap((node) => [node, ...flattenNodes(node.children || [])])
}

describe('page map navigation structure', () => {
  it.each(Object.entries(EXPECTED_SECTIONS))(
    'builds expected section folders for %s',
    (projectId, expectedSections) => {
      const { pageMap } = buildPageMap(projectId as ProjectId)
      const nodes = flattenNodes(pageMap as PageNode[])

      for (const expectedSection of expectedSections || []) {
        const matches = nodes.filter(
          (node) =>
            node.kind === 'Folder' &&
            node.name === expectedSection.title &&
            node.route === expectedSection.route
        )

        expect(matches).toHaveLength(1)
      }
    }
  )

  it.each(Object.entries(EXPECTED_ENTRIES))(
    'includes the new markdown-backed nav entries for %s',
    (projectId, expectedEntries) => {
      const { pageMap, filePaths } = buildPageMap(projectId as ProjectId)
      const nodes = flattenNodes(pageMap as PageNode[])

      for (const expectedEntry of expectedEntries || []) {
        const matches = nodes.filter(
          (node) =>
            node.kind === 'MdxPage' &&
            node.name === expectedEntry.title &&
            node.route === expectedEntry.route
        )

        expect(filePaths).toContain(expectedEntry.filePath)
        expect(matches).toHaveLength(1)
      }
    }
  )
})
