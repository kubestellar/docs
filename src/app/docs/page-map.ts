import { normalizePageMap } from 'nextra/page-map'
import fs from 'fs'
import path from 'path'
import { type ProjectId } from '@/config/versions'

// Local docs path - docs are now in this repository
export const docsContentPath = path.join(process.cwd(), 'docs', 'content')
export const basePath = 'docs'

// Get content path for a project
export function getContentPath(projectId: ProjectId): string {
  switch (projectId) {
    case 'a2a':
      return path.join(process.cwd(), 'docs', 'content', 'a2a')
    case 'kubeflex':
      return path.join(process.cwd(), 'docs', 'content', 'kubeflex')
    case 'multi-plugin':
      return path.join(process.cwd(), 'docs', 'content', 'multi-plugin')
    case 'kubestellar-mcp':
      return path.join(process.cwd(), 'docs', 'content', 'kubestellar-mcp')
    case 'console':
      return path.join(process.cwd(), 'docs', 'content', 'console')
    case 'hive':
      return path.join(process.cwd(), 'docs', 'content', 'hive')
    default:
      return docsContentPath
  }
}

// Get base path for a project
export function getBasePath(projectId: ProjectId): string {
  switch (projectId) {
    case 'a2a':
      return 'docs/a2a'
    case 'kubeflex':
      return 'docs/kubeflex'
    case 'multi-plugin':
      return 'docs/multi-plugin'
    case 'kubestellar-mcp':
      return 'docs/kubestellar-mcp'
    case 'console':
      return 'docs/console'
    case 'hive':
      return 'docs/hive'
    default:
      return 'docs'
  }
}

// Strong types for page-map nodes
type MdxPageNode = { kind: 'MdxPage'; name: string; route: string }
type FolderNode = { kind: 'Folder'; name: string; route: string; children: PageMapNode[]; theme?: { collapsed?: boolean } }
type MetaNode = { kind: 'Meta'; data: Record<string, string> }
type PageMapNode = MdxPageNode | FolderNode | MetaNode

// Helper to prettify names
const pretty = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')

// Recursively get all markdown files from the local docs directory
function getAllDocFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = []

  if (!fs.existsSync(dir)) {
    return files
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    const relativePath = path.relative(baseDir, fullPath)

    if (entry.isDirectory()) {
      // Skip hidden directories and node_modules
      if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
        files.push(...getAllDocFiles(fullPath, baseDir))
      }
    } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mdx'))) {
      // Normalize to forward slashes for cross-platform consistency
      files.push(relativePath.replace(/\\/g, '/'))
    }
  }

  return files
}

// Navigation structure based on mkdocs.yml
type NavItem = { [key: string]: string | NavItem[] | NavItem } | string

// A2A Navigation Structure
const NAV_STRUCTURE_A2A: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Overview',
    items: [
      { 'Introduction': 'intro.md' },
    ]
  },
  {
    title: 'Getting Started',
    items: [
      { 'Quick Start': 'getting-started/quick-start.md' },
      { 'Installation': 'getting-started/installation.md' },
      { 'Guide Overview': 'getting-started/index.md' },
    ]
  },
  {
    title: 'Reference',
    items: [
      { 'CLI Reference': 'cli-reference.md' },
      { 'Troubleshooting': 'troubleshooting.md' },
    ]
  },
  {
    title: 'Contribute to A2A',
    items: [
      { 'Contribute to A2A': 'CONTRIBUTING.md' },
    ]
  }
]

// Multi Plugin Navigation Structure
const NAV_STRUCTURE_MULTI_PLUGIN: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Overview',
    items: [
      { 'Introduction': 'readme.md' },
      { 'Architecture': 'architecture_guide.md' },
    ]
  },
  {
    title: 'Getting Started',
    items: [
      { 'Installation': 'installation_guide.md' },
      { 'Installation (Windows)': 'installation_guide_windows.md' },
      { 'Usage Guide': 'usage_guide.md' },
    ]
  },
  {
    title: 'Reference',
    items: [
      { 'API Reference': 'api_reference.md' },
    ]
  },
  {
    title: 'Development',
    items: [
      { 'Development Guide': 'development_guide.md' },
    ]
  }
]

// KubeFlex Navigation Structure
const NAV_STRUCTURE_KUBEFLEX: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Overview',
    items: [
      { 'Introduction': 'readme.md' },
      { 'Architecture': 'architecture.md' },
      { 'Multi-Tenancy': 'multi-tenancy.md' },
    ]
  },
  {
    title: 'Getting Started',
    items: [
      { 'Quick Start': 'quickstart.md' },
      { 'User Guide': 'users.md' },
    ]
  },
  {
    title: 'Development',
    items: [
      { 'Debugging': 'debugging.md' },
      { 'Code Generation': 'code-generation.md' },
      { 'PostgreSQL Architecture': 'postgresql-architecture-decision.md' },
    ]
  },
  {
    title: 'Community',
    items: [
      { 'Contributors': 'contributors.md' },
    ]
  }
]

// kubestellar-mcp Navigation Structure
const NAV_STRUCTURE_KUBESTELLAR_MCP: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Overview',
    items: [
      { 'Introduction': 'overview/intro.md' },
    ]
  },
  {
    title: 'Setup',
    items: [
      { 'Homebrew Installation': 'setup/homebrew.md' },
    ]
  },
  {
    title: 'Architecture',
    items: [
      { 'Architecture Overview': 'architecture/overview.md' },
      { 'Local Development': 'architecture/local-development.md' },
      { 'Request and Response Lifecycle': 'architecture/request-response-lifecycle.md' },
      { 'Adding a New Tool': 'architecture/adding-a-tool.md' },
      { 'Testing': 'architecture/testing.md' },
    ]
  },
  {
    title: 'Commands',
    items: [
      { 'App Logs': 'commands/app-logs.md' },
      { 'App Status': 'commands/app-status.md' },
      { 'Delete': 'commands/delete.md' },
      { 'Deploy': 'commands/deploy.md' },
      { 'GitOps Drift': 'commands/gitops-drift.md' },
      { 'GitOps Sync': 'commands/gitops-sync.md' },
      { 'Helm Install': 'commands/helm-install.md' },
      { 'Helm Rollback': 'commands/helm-rollback.md' },
      { 'Helm Uninstall': 'commands/helm-uninstall.md' },
      { 'Kustomize': 'commands/kustomize.md' },
      { 'Label': 'commands/label.md' },
    ]
  }
]

// Console Navigation Structure
const NAV_STRUCTURE_CONSOLE: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Overview',
    items: [
      { 'Introduction': 'readme.md' },
      { 'Quick Start': 'quickstart.md' },
      { 'Console Overview': 'console-overview.md' },
      { 'Architecture': 'architecture.md' },
      { 'Architecture Diagram': '_architecture-diagram.md' },
      { 'Installation': 'installation.md' },
      { 'Cluster Registration': 'cluster-registration.md' },
      { 'Demo Mode': 'demo-mode.md' },
      { 'Configuration': 'configuration.md' },
      { 'Updates and Releases': 'console-updates.md' },
    ]
  },
  {
    title: 'Setup',
    items: [
      { 'Local Setup Guide': 'local-setup.md' },
      { 'Local Deployment': 'local-deployment.md' },
      { 'Deploy & Orchestrate': 'deploy.md' },
      { 'vCluster Setup': 'vcluster-setup.md' },
    ]
  },
  {
    title: 'Features',
    items: [
      { 'Console Features': 'console-features.md' },
      { 'Dashboards': 'dashboards.md' },
      { 'Cards': 'all-cards.md' },
      { 'Card Types': 'cards.md' },
      { 'Card Reference': 'console-cards.md' },
      { 'Stats Blocks': 'stats-blocks.md' },
      { 'Alerts': 'alerts.md' },
      { 'Cost Optimization Cards': 'cost-optimization.md' },
      { 'Drasi Reactive Pipeline Dashboard': 'drasi-dashboard.md' },
      { 'KServe Monitoring Card': 'kserve-monitoring.md' },
      { 'Feedback System': 'feedback.md' },
    ]
  },
  {
    title: 'AI Integration',
    items: [
      { 'AI Features': 'ai-features.md' },
      { 'AI Missions Setup': 'ai-missions-setup.md' },
      { 'Kagenti LLM Provider Setup': 'kagenti-llm-provider-setup.md' },
      { 'Local LLM Strategy': 'local-llm-strategy.md' },
      { 'Agentic Quality Controls': 'agentic-quality.md' },
    ]
  },
  {
    title: 'Security',
    items: [
      { 'Authentication & Sessions': 'authentication.md' },
      { 'Security Model': 'security-model.md' },
      { 'Persistence & State Management': 'persistence.md' },
    ]
  },
  {
    title: 'Enterprise',
    items: [
      { 'Enterprise Compliance Portal': 'enterprise-compliance.md' },
      { 'Federation & Multi-Hub': 'federation.md' },
    ]
  },
  {
    title: 'Development',
    items: [
      { 'Development Methodology': 'development.md' },
    ]
  },
  {
    title: 'ACMM',
    items: [
      { 'ACMM Dashboard': 'acmm-dashboard.md' },
    ]
  },
  {
    title: 'Programs',
    items: [
      { 'Marketplace': 'marketplace.md' },
      { 'Knowledge Base': 'knowledge-base.md' },
      { 'Rewards System': 'console-rewards.md' },
    ]
  },
  {
    title: 'Troubleshooting',
    items: [
      { 'Troubleshooting': 'troubleshooting.md' },
      { 'Windows 11 Local Source Build Troubleshooting': 'windows-11-local-source-build-troubleshooting.md' },
    ]
  }
]

// Hive Navigation Structure
const NAV_STRUCTURE_HIVE: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Overview',
    items: [
      { 'Introduction': 'readme.md' },
      { 'Architecture': 'architecture.md' },
    ]
  },
  {
    title: 'Getting Started',
    items: [
      { 'macOS Setup': 'macos.md' },
      { 'Example: Homelab Console (Bluefin)': 'console-starter-install.md' },
      { 'Troubleshooting': 'troubleshooting.md' },
    ]
  },
  {
    title: 'Configuration',
    items: [
      { 'Agent Configuration': 'agent-configuration.md' },
      { 'Governor': 'governor.md' },
      { 'Contributor Relay': 'contributor-relay.md' },
      { 'Variable Substitution': 'variable-substitution.md' },
    ]
  },
  {
    title: 'Security',
    items: [
      { 'Security Model': 'security-model.md' },
    ]
  },
  {
    title: 'Reference',
    items: [
      { 'hivectl CLI': 'hivectl.md' },
      { 'ACMM Policy Matrix': 'acmm-policy-matrix.md' },
      { 'Outreach Anti-Spam': 'outreach-antispam.md' },
    ]
  }
]

// KubeStellar Navigation Structure
const NAV_STRUCTURE_KUBESTELLAR: Array<{ title: string; items: NavItem[] }> = [

  {
    title: 'Overview',
    items: [
      { 'Introduction': 'readme.md' },
      { 'Architecture': 'kubestellar/architecture.md' },
      { 'OCM Status Addon': 'kubestellar/ocm-status-addon-intro.md' },
      { 'Release Notes': 'kubestellar/release-notes.md' },
      { 'Roadmap': 'kubestellar/roadmap.md' }
    ]
  },
  {
    title: 'Getting Started',
    items: [
      { 'Quick Start': 'kubestellar/get-started.md' },
      { 'Console Quick Start': 'console/quickstart.md' },
    ]
  },
  {
    title: 'User Guide',
    items: [
      { 'Guide Overview': 'kubestellar/user-guide-intro.md' },
      { 'Observability': 'kubestellar/observability.md' },
      { 'Getting Started from OCM': 'kubestellar/start-from-ocm.md' },
      {
        'General Setup': [
          { 'Overview': 'kubestellar/setup-overview.md' },
          { 'Setup Limitations': 'kubestellar/setup-limitations.md' },
          { 'Prerequisites': 'kubestellar/pre-reqs.md' },
          {
            'KubeFlex Hosting Cluster': [
              { 'Acquire Cluster for KubeFlex Hosting': 'kubestellar/acquire-hosting-cluster.md' },
              { 'Initialize KubeFlex Hosting Cluster': 'kubestellar/init-hosting-cluster.md' }
            ]
          },
          {
            'Core Spaces': [
              { 'Inventory and Transport Spaces': 'kubestellar/its.md' },
              { 'Workload Description Spaces': 'kubestellar/wds.md' }
            ]
          },
          { 'Core Helm Chart': 'kubestellar/core-chart.md' },
          { 'Argo CD Integration': 'kubestellar/core-chart-argocd.md' },
          {
            'Workload Execution Clusters': [
              { 'About Workload Execution Clusters': 'kubestellar/wec.md' },
              { 'Register a Workload Execution Cluster': 'kubestellar/wec-registration.md' }
            ]
          }
        ]
      },
      {
        'Usage': [
          { 'Usage Limitations': 'kubestellar/usage-limitations.md' },
          {
            'KubeStellar API': [
              { 'Overview': 'kubestellar/control.md' },
              { 'Binding': 'kubestellar/binding.md' },
              { 'Transforming Desired State': 'kubestellar/transforming.md' },
              { 'Combining Reported State': 'kubestellar/combined-status.md' },
              { 'Multi-WEC Aggregated Status': 'kubestellar/multi-wec-aggregated-status.md' }
            ]
          },
          { 'Authorization in WECs': 'kubestellar/authorization.md' },
          { 'Example Scenarios': 'kubestellar/example-scenarios.md' },
          { 'Deploy Helm Charts Through a WDS': 'kubestellar/helm-through-wds.md' },
          {
            'Third-party Integrations': [
              { 'ArgoCD to WDS': 'kubestellar/argo-to-wds1.md' },
              { 'Claude Code': 'kubestellar/claude-code.md' }
            ]
          },
          { 'Troubleshooting': 'kubestellar/troubleshooting.md' },
          {
            'Known Issues': [
              { 'Overview': 'kubestellar/known-issues.md' },
              { 'Hidden State in Kubeconfig': 'kubestellar/knownissue-kflex-extension.md' },
              { 'Kind Needs OS Reconfig': 'kubestellar/knownissue-kind-config.md' },
              { 'Helm Chart Auth Failure': 'kubestellar/knownissue-helm-ghcr.md' },
              { 'Missing CombinedStatus Results': 'kubestellar/knownissue-collector-miss.md' },
              { 'Kind Host Configuration': 'kubestellar/installation-errors.md' },
              { 'Insufficient CPU': 'kubestellar/knownissue-cpu-insufficient-for-its1.md' }
            ]
          }
        ]
      },
      {
        'UI (Deprecated → Console)': [
          { 'Overview': 'ui-docs/ui-overview.md' },
          { 'WECS Remote Monitoring': 'ui-docs/wecs-remote-monitoring.md' },
          { 'ITS cluster management': 'ui-docs/its-cluster-management.md' }
        ]
      },
      { 'Teardown': 'kubestellar/teardown.md' }
    ]
  }
]

const NAV_STRUCTURE_CONTRIBUTING: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Contributing',
    items: [
      { 'Overview': 'contributing/contribute.md' },
      { 'Code of Conduct': 'contributing/coc-inc.md' },
      { 'Contributing to Code': 'contributing/CONTRIBUTINGKS.md' },
      { 'Contributing to Docs/Website': [
          {'Docs Structure': 'contributing/documentation/docs-structure-inc.md'} ,
          {'Simple Changes' : 'contributing/documentation/simple-docs-inc.md'},
          {'Version Management' : 'contributing/documentation/docs-version-inc.md'},
          {'Detailed Contribution Guide': 'contributing/documentation/contributing-inc.md' },
          {'Style Guide': 'contributing/documentation/docs-styleguide.md' }
          ]},
      { 'Contributor Ladder': 'contributing/contributor_ladder.md' },
      { 'License': 'contributing/license-inc.md' },
      { 'Governance': 'contributing/governance-inc.md' },
      { 'Onboarding': 'contributing/onboarding-inc.md' },
      {
        'CI/CD': [
          { 'GitHub Actions': 'contributing/operations/github-actions.md' },
          { 'Demoting Component Repo Docs': 'contributing/operations/demote-component-docs.md' }
        ]
      },
      {
        'Security': [
          { 'Policy': 'contributing/security/security-inc.md' },
          { 'Contacts': 'contributing/security/security_contacts-inc.md' }
        ]
      },
      { 'Testing': 'kubestellar/testing.md' },
      { 'Packaging': 'kubestellar/packaging.md' },
      { 'Release Process': 'kubestellar/release.md' },
      { 'Release Testing': 'kubestellar/release-testing.md' },
      { 'Sign-off': 'kubestellar/pr-signoff.md' }
    ]
  }
]

const NAV_STRUCTURE_COMMUNITY: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Community',
    items: [
      { 'Get Involved': 'community/index.md' },
      { 'Videos and Demos': 'community/videos.md' },
      { 'Community Meetings': 'community/meetings.md' },
    ]
  }
]

const NAV_STRUCTURE_NEWS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'News',
    items: [
      { 'Latest News': 'news/index.md' },
      { 'Marketplace & KB Launch': 'news/marketplace-and-kb-launch.md' },
      { 'KubeStellar Console Announcement': 'news/kubestellar-console-announcement.md' },
      { 'Reviews and Testimonials': 'news/reviews.md'}
    ]
  }
]

// Get navigation structure for a project
function getNavStructure(projectId: ProjectId): Array<{ title: string; items: NavItem[] }> {
  let baseStructure: Array<{ title: string; items: NavItem[] }>;

  switch (projectId) {
    case 'a2a':
      baseStructure = NAV_STRUCTURE_A2A
      break
    case 'kubeflex':
      baseStructure = NAV_STRUCTURE_KUBEFLEX
      break
    case 'multi-plugin':
      baseStructure = NAV_STRUCTURE_MULTI_PLUGIN
      break
    case 'kubestellar-mcp':
      baseStructure = NAV_STRUCTURE_KUBESTELLAR_MCP
      break
    case 'console':
      baseStructure = NAV_STRUCTURE_CONSOLE
      break
    case 'hive':
      baseStructure = NAV_STRUCTURE_HIVE
      break
    default:
      baseStructure = NAV_STRUCTURE_KUBESTELLAR
  }

  // Add general sections to all projects
  return [...baseStructure, ...NAV_STRUCTURE_CONTRIBUTING, ...NAV_STRUCTURE_COMMUNITY, ...NAV_STRUCTURE_NEWS]
}

export function buildPageMap(projectId: ProjectId = 'kubestellar') {
  const contentPath = getContentPath(projectId)
  const projectBasePath = getBasePath(projectId)
  const navStructure = getNavStructure(projectId)

  // For all projects, include files from both project-specific and main KubeStellar directories
  let allDocFiles = getAllDocFiles(contentPath)
  if (projectId !== 'kubestellar') {
    // Add general sections files and root-level pages from main KubeStellar directory
    const generalFiles = getAllDocFiles(docsContentPath).filter(f =>
      f.startsWith('contributing/') || f.startsWith('community/') || f.startsWith('news/') ||
      f === 'intro.md' || f === 'legacy-components.md' || f === 'what-is-console.md'
    )
    allDocFiles = [...allDocFiles, ...generalFiles]
  }
  const processedFiles = new Set<string>()
  const routeMap: Record<string, string> = {}
  const _pageMap: PageMapNode[] = []

  function buildNavNodes(items: NavItem[], parentSlug: string): PageMapNode[] {
    const nodes: PageMapNode[] = []
    const meta: Record<string, string> = {}

    for (const item of items) {
      if (typeof item === 'string') {
        // Simple file reference
        if (allDocFiles.includes(item)) {
          processedFiles.add(item)
          const baseName = item.replace(/\.(md|mdx)$/i, '').split('/').pop()!
          // Use /docs path for general sections, project path for everything else
          const isGeneralSection = item.startsWith('contributing/') || item.startsWith('community/') || item.startsWith('news/')
          const basePathForRoute = isGeneralSection ? 'docs' : projectBasePath
          const route = `/${basePathForRoute}/${parentSlug}/${baseName}`
          routeMap[`${parentSlug}/${baseName}`] = item
          nodes.push({ kind: 'MdxPage', name: pretty(baseName), route })
          meta[pretty(baseName)] = pretty(baseName)
        }
      } else {
        // Object with title: path or title: children
        const title = Object.keys(item)[0]
        const value = (item as Record<string, string | NavItem[]>)[title]

        if (typeof value === 'string') {
          // It's a file path or link
          if (value.startsWith('http') || value.startsWith('/')) {
            // External link or absolute internal link
            nodes.push({ kind: 'MdxPage', name: title, route: value })
            meta[title] = title
          } else if (allDocFiles.includes(value)) {
            processedFiles.add(value)
            // const baseName = value.replace(/\.(md|mdx)$/i, '').split('/').pop()!
            const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
            // Use /docs path for general sections, project path for everything else
            const isGeneralSection = value.startsWith('contributing/') || value.startsWith('community/') || value.startsWith('news/')
            const basePathForRoute = isGeneralSection ? 'docs' : projectBasePath
            const route = `/${basePathForRoute}/${parentSlug ? parentSlug + '/' : ''}${slug}`
            routeMap[`${parentSlug ? parentSlug + '/' : ''}${slug}`] = value
            nodes.push({ kind: 'MdxPage', name: title, route })
            meta[title] = title
          }
        } else if (Array.isArray(value)) {
          // It's a folder with children
          const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
          const newParentSlug = parentSlug ? `${parentSlug}/${slug}` : slug
          const children = buildNavNodes(value, newParentSlug)
          if (children.length > 0) {
            // Use /docs path for general sections, project path for everything else
            // Check both direct string entries and nested values in objects
            const isGeneralSection = Array.isArray(value) &&
              value.some(v => {
                if (typeof v === 'string') {
                  return v.startsWith('contributing/') || v.startsWith('community/') || v.startsWith('news/')
                }
                // For object entries, check if any value starts with general section path
                if (typeof v === 'object' && v !== null) {
                  const objValues = Object.values(v);
                  return objValues.some(val =>
                    typeof val === 'string' &&
                    (val.startsWith('contributing/') || val.startsWith('community/') || val.startsWith('news/'))
                  );
                }
                return false;
              })
            const basePathForRoute = isGeneralSection ? 'docs' : projectBasePath
            nodes.push({
              kind: 'Folder',
              name: title,
              route: `/${basePathForRoute}/${newParentSlug}`,
              children
            })
            meta[title] = title
          }
        }
      }
    }

    if (Object.keys(meta).length > 0) {
      nodes.unshift({ kind: 'Meta', data: meta })
    }

    return nodes
  }

  // Build navigation from navStructure (project-specific)
  for (const category of navStructure) {
    const categorySlug = category.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const children = buildNavNodes(category.items, categorySlug)

    if (children.length > 0) {
      // Use /docs path for general sections, project path for project-specific sections
      const isGeneralSection = ['Contributing', 'Community', 'News'].includes(category.title)
      const basePath = isGeneralSection ? 'docs' : projectBasePath

      const folderNode: FolderNode = {
        kind: 'Folder',
        name: category.title,
        route: `/${basePath}/${categorySlug}`,
        children
      }

      // Set theme for first category to be expanded
      if (category.title === 'Welcome' || category.title === 'Overview') {
        folderNode.theme = { collapsed: false }
      }

      _pageMap.push(folderNode)
    }
  }

  // Add top-level introduction page (accessible at /docs/introduction)
  // Route map entry only - sidebar renders this separately above projects
  if (projectId === 'kubestellar' && allDocFiles.includes('intro.md')) {
    routeMap['introduction'] = 'intro.md'
  }

  // Add legacy components overview page (accessible at /docs/legacy-components)
  if (allDocFiles.includes('legacy-components.md')) {
    routeMap['legacy-components'] = 'legacy-components.md'
  }

  // Add "What is Console" disambiguation page (accessible at /docs/what-is-console)
  // This is a standalone page that clarifies KubeStellar Console is a separate
  // project from the original kubestellar/kubestellar repository. See issue #1472.
  if (allDocFiles.includes('what-is-console.md')) {
    routeMap['what-is-console'] = 'what-is-console.md'
  }

  // Add top-level meta - only include our defined navigation structure
  const meta: Record<string, string> = {}
  for (const category of navStructure) {
    meta[category.title] = category.title
  }
  _pageMap.unshift({ kind: 'Meta', data: meta })

  // Populate routeMap with all files for fallback resolution (needed for link rewriting)
  for (const fp of allDocFiles) {
    const noExt = fp.replace(/\.(md|mdx)$/i, '')
    if (!routeMap[noExt]) {
      routeMap[noExt] = fp
    }
  }

  const pageMap = normalizePageMap(_pageMap)

  return { pageMap, routeMap, filePaths: allDocFiles, contentPath }
}

// For backwards compatibility, export a function that doesn't need branch parameter
export async function buildPageMapForBranch() {
  return buildPageMap()
}
