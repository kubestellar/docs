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
      { 'Overview': 'getting-started/index.md' },
      { 'Installation': 'getting-started/installation.md' },
      { 'Quick Start': 'getting-started/quick-start.md' },
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
    title: 'Contributing',
    items: [
      { 'Contributing': 'CONTRIBUTING.md' },
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
  }
]

// Console Navigation Structure
const NAV_STRUCTURE_CONSOLE: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Overview',
    items: [
      { 'Introduction': 'readme.md' },
      { 'Quick Start': 'quickstart.md' },
      { 'Installation': 'installation.md' },
      { 'Architecture': 'architecture.md' },
      { 'Configuration': 'configuration.md' },
    ]
  },
  {
    title: 'Features',
    items: [
      { 'Dashboards': 'dashboards.md' },
      { 'Cards': 'all-cards.md' },
      { 'Stats Blocks': 'stats-blocks.md' },
      { 'AI Features': 'ai-features.md' },
      { 'Alerts': 'alerts.md' },
      { 'Feedback System': 'feedback.md' },
    ]
  }
]

// KubeStellar Navigation Structure
const NAV_STRUCTURE: Array<{ title: string; items: NavItem[] }> = [

  {
    title: 'What is KubeStellar?',
    items: [
      { 'Overview': 'readme.md' },
      { 'Architecture': 'kubestellar/architecture.md' },
      { 'Release Notes': 'kubestellar/release-notes.md' },
      { 'Roadmap': 'kubestellar/roadmap.md' }
    ]
  },
  {
    title: 'User Guide',
    items: [
      { 'Quick Start': 'kubestellar/get-started.md' },
      { 'Guide Overview': 'kubestellar/user-guide-intro.md' },
      { 'Observability': 'kubestellar/observability.md' },
      { 'Getting Started': 'kubestellar/get-started.md' },
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
        'UI': [
          { 'Overview': 'ui-docs/ui-overview.md' },
          { 'ITS cluster management': 'ui-docs/its-cluster-management.md'}
        ]
      },
      { 'Teardown': 'kubestellar/teardown.md' }
    ]
  },
  {
    title: 'Contributing',
    items: [
      { 'Overview': 'kubestellar/contribute.md' },
      { 'Code of Conduct': 'contribution-guidelines/coc-inc.md' },
      { 'Guidelines': 'contribution-guidelines/contributing-inc.md' },
      { 'Contributor Ladder': 'contribution-guidelines/contributor_ladder.md' },
      { 'License': 'contribution-guidelines/license-inc.md' },
      { 'Governance': 'contribution-guidelines/governance-inc.md' },
      { 'Onboarding': 'contribution-guidelines/onboarding-inc.md' },
      {
        'Website': [
          { 'Docs Management': 'contribution-guidelines/operations/document-management.md' },
          { 'Style Guide': 'contribution-guidelines/operations/docs-styleguide.md' },
          { 'Testing PRs': 'contribution-guidelines/operations/testing-doc-prs.md' }
        ]
      },
      {
        'CI/CD': [
          { 'GitHub Actions': 'contribution-guidelines/operations/github-actions.md' }
        ]
      },
      {
        'Security': [
          { 'Policy': 'contribution-guidelines/security/security-inc.md' },
          { 'Contacts': 'contribution-guidelines/security/security_contacts-inc.md' }
        ]
      },
      { 'Testing': 'kubestellar/testing.md' },
      { 'Packaging': 'kubestellar/packaging.md' },
      { 'Release Process': 'kubestellar/release.md' },
      { 'Release Testing': 'kubestellar/release-testing.md' },
      { 'Sign-off': 'kubestellar/pr-signoff.md' }
    ]
  },
  {
    title: 'Community',
    items: [
      { 'Get Involved': 'Community/_index.md' },
      {
        'Partners': [
          { 'ArgoCD': 'Community/partners/argocd.md' },
          { 'Turbonomic': 'Community/partners/turbonomic.md' },
          { 'MVI': 'Community/partners/mvi.md' },
          { 'FluxCD': 'Community/partners/fluxcd.md' },
          { 'OpenZiti': 'Community/partners/openziti.md' },
          { 'Kyverno': 'Community/partners/kyverno.md' }
        ]
      }
    ]
  },
  {
    title: 'News',
    items: [
      { 'Latest News': 'news/index.md' },
      { 'KubeStellar Console Announcement': 'news/kubestellar-console-announcement.md' }
    ]
  }
]

// Get navigation structure for a project
function getNavStructure(projectId: ProjectId): Array<{ title: string; items: NavItem[] }> {
  switch (projectId) {
    case 'a2a':
      return NAV_STRUCTURE_A2A
    case 'kubeflex':
      return NAV_STRUCTURE_KUBEFLEX
    case 'multi-plugin':
      return NAV_STRUCTURE_MULTI_PLUGIN
    case 'kubestellar-mcp':
      return NAV_STRUCTURE_KUBESTELLAR_MCP
    case 'console':
      return NAV_STRUCTURE_CONSOLE
    default:
      return NAV_STRUCTURE
  }
}

export function buildPageMap(projectId: ProjectId = 'kubestellar') {
  const contentPath = getContentPath(projectId)
  const projectBasePath = getBasePath(projectId)
  const navStructure = getNavStructure(projectId)

  const allDocFiles = getAllDocFiles(contentPath)
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
          const route = `/${projectBasePath}/${parentSlug}/${baseName}`
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
            const route = `/${projectBasePath}/${parentSlug ? parentSlug + '/' : ''}${slug}`
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
            nodes.push({
              kind: 'Folder',
              name: title,
              route: `/${projectBasePath}/${newParentSlug}`,
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
      const folderNode: FolderNode = {
        kind: 'Folder',
        name: category.title,
        route: `/${projectBasePath}/${categorySlug}`,
        children
      }

      // Set theme for first category to be expanded
      if (category.title === 'Welcome' || category.title === 'What is KubeStellar?' || category.title === 'Overview') {
        folderNode.theme = { collapsed: false }
      }

      _pageMap.push(folderNode)
    }
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
