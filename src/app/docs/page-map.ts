import { convertToPageMap, normalizePageMap } from 'nextra/page-map'

export const user = 'kubestellar'
export const repo = 'kubestellar'
export const docsPath = 'docs/content/'
export const basePath = 'docs'

export function makeGitHubHeaders(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_PAT
  const h: Record<string, string> = {
    'User-Agent': 'kubestellar-docs',
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

type GitTreeItem = { path: string; type: 'blob' | 'tree' }
type GitTreeResp = { tree?: GitTreeItem[] }

export async function buildPageMapForBranch(branch: string) {
  async function fetchDocsTree(): Promise<GitTreeResp> {
    const refUrl = `https://api.github.com/repos/${user}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`
    let sha: string | undefined
    const refRes = await fetch(refUrl, { headers: makeGitHubHeaders(), cache: 'no-store' })
    if (refRes.ok) {
      const ref = await refRes.json()
      sha = ref?.object?.sha
    }
    const treeUrl = sha
      ? `https://api.github.com/repos/${user}/${repo}/git/trees/${sha}?recursive=1`
      : `https://api.github.com/repos/${user}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`
    const treeRes = await fetch(treeUrl, { headers: makeGitHubHeaders(), cache: 'no-store' })
    if (!treeRes.ok) {
      const body = await treeRes.text().catch(() => '')
      throw new Error(`GitHub tree fetch failed: ${treeRes.status} ${treeRes.statusText} ${body}`)
    }
    return treeRes.json()
  }

  const treeData = await fetchDocsTree()
  let allDocFiles =
    treeData.tree?.filter(
      t =>
        t.type === 'blob' &&
        t.path.startsWith(docsPath) &&
        (t.path.endsWith('.md') || t.path.endsWith('.mdx'))
    ).map(t => t.path.slice(docsPath.length)) ?? []

  // Filter out Direct folder completely
  const ROOT_FOLDERS = Array.from(new Set(allDocFiles.map(fp => fp.split('/')[0])))
  const DIRECT_ROOT = ROOT_FOLDERS.find(r => r.toLowerCase() === 'direct')
  const UI_DOCS_ROOT = ROOT_FOLDERS.find(r => r.toLowerCase() === 'ui docs' || r.toLowerCase() === 'ui-docs')

  type PageMapNode = { kind: 'Folder' | 'MdxPage'; name: string; route: string; children?: any[] } | any
  const _pageMap: PageMapNode[] = []
  const aliases: Array<{ alias: string; fp: string }> = []
  const processedFiles = new Set<string>()
  const pretty = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')

  const CATEGORY_MAPPINGS: Record<string, Array<{ root?: string; file: string }>> = {
    'What is Kubestellar?': [
      { file: 'overview.md' },
      { file: 'architecture.md' },
      { file: 'related-projects.md' },
      { file: 'roadmap.md' },
      { file: 'release-notes.md' }
    ],
    'Install & Configure': [
      { file: '.get-started.md' },
      { file: 'start-from-ocm.md' },
      { file: 'setup-limitations.md' },
      { file: 'acquire-hosting-cluster.md' },
      { file: 'init-hosting-cluster.md' },
      { file: 'core-specs/inventory-and-transport.md' },
      { file: 'core-specs/workload-description.md' },
      { file: 'workload-execution-cluster/about.md' },
      { file: 'workload-execution-cluster/register.md' },
      { file: 'core-chart.md' },
      { file: 'teardown.md' }
    ],
    'UI & Tools': [
      // from Direct
      { file: 'ui-intro.md' },
      { file: 'plugins.md' },
      { file: 'galaxy-marketplace.md' },
      { file: 'kubeflex-intro.md' },
      { file: 'galaxy-intro.md' },
      // from UI Docs folder
      { root: UI_DOCS_ROOT, file: 'README.md' },
      { root: UI_DOCS_ROOT, file: 'ui-overview.md' },
    ],
    'Use & Integrate': [
      { file: 'usage-limitations.md' },
      { file: 'binding.md' },
      { file: 'transforming.md' },
      { file: 'combined-status.md' },
      { file: 'example-scenarios.md' },
      { file: 'argo-to-wds1.md' }
    ],
    'User Guide & Support': [
      { file: 'user-guide-intro.md' },
      { file: 'troubleshooting.md' },
      { file: 'known-issues.md' },
      { file: 'knownissue-collector-miss.md' },
      { file: 'knownissue-helm-ghcr.md' },
      { file: 'knownissue-kind-config.md' },
      { file: 'knownissue-cpu-insufficient-for-its1.md' },
      { file: 'knownissue-kflex-extension.md' },
      { file: 'combined-status.md' }
    ]
  }

  for (const [categoryName, fileConfigs] of Object.entries(CATEGORY_MAPPINGS)) {
    const fulls: string[] = []

    for (const config of fileConfigs) {
      const root = config.root || DIRECT_ROOT
      if (!root) continue

      const fullPath = `${root}/${config.file}`
      if (allDocFiles.includes(fullPath)) {
        fulls.push(fullPath)
        processedFiles.add(fullPath)
      }
    }

    if (!fulls.length) continue

    const categorySlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const children = fulls.map(full => {
      const baseName = full
        .replace(/\.(md|mdx)$/i, '')
        .split('/')
        .pop()!
      const route = `/${basePath}/${categorySlug}/${baseName}`
      const alias = `${categorySlug}/${baseName}`
      aliases.push({ alias, fp: full })
      return { kind: 'MdxPage' as const, name: pretty(baseName), route }
    })

    _pageMap.push({ kind: 'Folder', name: categoryName, route: `/${basePath}/${categorySlug}`, children })
  }

  // Filter out files that have been manually categorized or are in special folders
  const remainingFiles = allDocFiles.filter(fp => {
    if (processedFiles.has(fp)) return false
    const lower = fp.toLowerCase()
    if (
      (DIRECT_ROOT && lower.startsWith(`${DIRECT_ROOT.toLowerCase()}/`)) ||
      (UI_DOCS_ROOT && lower.startsWith(`${UI_DOCS_ROOT.toLowerCase()}/`))
    ) {
      return false
    }
    return true
  })

  const { pageMap: baseMap } = convertToPageMap({ filePaths, basePath })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type PageMapNode = { kind: 'Folder' | 'MdxPage'; name: string; route: string; children?: any[] } | any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const _pageMap: PageMapNode[] = baseMap as any

  // Your category mappings...
  const CATEGORY_MAPPINGS: Record<string, string[]> = {
    'What is Kubestellar?': ['overview.md', 'architecture.md', 'related-projects.md', 'roadmap.md', 'release-notes.md'],
    'Install & Configure': [
      '.get-started.md',
      'start-from-ocm.md',
      'setup-limitations.md',
      'acquire-hosting-cluster.md',
      'init-hosting-cluster.md',
      'core-specs/inventory-and-transport.md',
      'core-specs/workload-description.md',
      'workload-execution-cluster/about.md',
      'workload-execution-cluster/register.md',
      'core-chart.md',
      'teardown.md'
    ],
    'UI & Tools': [
      'ui-intro.md',
      'plugins.md',
      'galaxy-marketplace.md',
      'kubeflex-intro.md',
      'galaxy-intro.md'
    ],
    'Use & Integrate': [
      'usage-limitations.md',
      'binding.md',
      'transforming.md',
      'combined-status.md',
      'example-scenarios.md',
      'argo-to-wds1.md'
    ],
    'User Guide & Support': [
      'user-guide-intro.md',
      'troubleshooting.md',
      'known-issues.md',
      'knownissue-collector-miss.md',
      'knownissue-helm-ghcr.md',
      'knownissue-kind-config.md',
      'knownissue-cpu-insufficient-for-its1.md',
      'knownissue-kflex-extension.md',
      'combined-status.md'
    ]
  }

  const pretty = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')
  const aliases: Array<{ alias: string; fp: string }> = []

  for (const [categoryName, relFiles] of Object.entries(CATEGORY_MAPPINGS)) {
    if (!DIRECT_ROOT) continue
    const fulls = relFiles.map(rel => `${DIRECT_ROOT}/${rel}`).filter(full => allDocFiles.includes(full))
    if (!fulls.length) continue

    const categorySlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const children = fulls.map(full => {
      const base = full.replace(/\.(md|mdx)$/i, '').split('/').pop()!
      const route = `/${basePath}/${categorySlug}/${base}`
      const alias = `${categorySlug}/${base}`
      aliases.push({ alias, fp: full })
      return { kind: 'MdxPage' as const, name: pretty(base), route }
    })

    _pageMap.push({ kind: 'Folder', name: categoryName, route: `/${basePath}/${categorySlug}`, children })
  }

  // Build routeMap
  function normalizeRoute(noExtPath: string) {
    return noExtPath.replace(/\/(readme|index)$/i, '').replace(/^(readme|index)$/i, '')
  }

  const routeMap: Record<string, string> = {}
  for (const fp of allDocFiles) {
    const noExt = fp.replace(/\.(md|mdx)$/i, '')
    const norm = normalizeRoute(noExt)
    routeMap[noExt] = fp
    if (!noExt.startsWith('content/')) routeMap[`content/${noExt}`] = fp
    const isIndex = /\/(readme|index)$/i.test(noExt) || /^(readme|index)$/i.test(noExt)
    if (!routeMap[norm] || isIndex) routeMap[norm] = fp
    if (norm !== '' && !norm.startsWith('content/')) {
      const contentNorm = `content/${norm}`
      if (!routeMap[contentNorm] || isIndex) routeMap[contentNorm] = fp
    }
  }
  for (const { alias, fp } of aliases) {
    routeMap[alias] = fp
    if (!alias.startsWith('content/')) routeMap[`content/${alias}`] = fp
  }

  const pageMap = normalizePageMap(_pageMap)

  return { pageMap, routeMap, filePaths: allDocFiles, branch }
}