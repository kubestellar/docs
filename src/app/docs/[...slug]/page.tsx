import { notFound } from 'next/navigation'
import { compileMdx } from 'nextra/compile'
import { Callout, Tabs } from 'nextra/components'
import { evaluate } from 'nextra/evaluate'
import {
  convertToPageMap,
  normalizePageMap
} from 'nextra/page-map'
import { useMDXComponents as getMDXComponents } from '../../../../mdx-components'
import { convertHtmlScriptsToJsxComments } from '@/lib/transformMdx'
import { MermaidComponent } from '@/lib/Mermaid'

export const dynamic = 'force-dynamic'

const user = 'kubestellar'
const repo = 'kubestellar'
const branch = 'main'
const docsPath = 'docs/content/'
const INCLUDE_PREFIXES: string[] = []
const basePath = 'docs'


function makeGitHubHeaders(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_PAT
  const h: Record<string, string> = {
    'User-Agent': 'kubestellar-docs-dev',
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

type GitTreeItem = { path: string; type: 'blob' | 'tree' }
type GitTreeResp = { tree?: GitTreeItem[] }

const treeUrl = `https://api.github.com/repos/${user}/${repo}/git/trees/${encodeURIComponent(
  branch
)}?recursive=1`

const treeResp = await fetch(treeUrl, { headers: makeGitHubHeaders(), cache: 'no-store' })
if (!treeResp.ok) {
  const body = await treeResp.text().catch(() => '')
  throw new Error(`GitHub tree fetch failed: ${treeResp.status} ${treeResp.statusText} ${body}`)
}
const treeData: GitTreeResp = await treeResp.json()

const allDocFiles = treeData.tree?.filter(t => t.type === 'blob' && t.path.startsWith(docsPath) && (t.path.endsWith('.md') || t.path.endsWith('.mdx'))).map(t => t.path.slice(docsPath.length)) ?? []

// Keep the original remote list; do not rewrite paths
const filePaths = INCLUDE_PREFIXES.length
  ? allDocFiles.filter(fp =>
      INCLUDE_PREFIXES.some(prefix => fp === prefix || fp.startsWith(prefix + '/'))
    )
  : allDocFiles

// Detect actual "Direct" folder name (case-insensitive)
const ROOT_FOLDERS = Array.from(new Set(filePaths.map(fp => fp.split('/')[0])))
const DIRECT_ROOT = ROOT_FOLDERS.find(r => r.toLowerCase() === 'direct')

// Helper: pretty title from leaf
const pretty = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')

// Your desired groupings (relative to Direct)
const CATEGORY_MAPPINGS: Record<string, string[]> = {
  "What is Kubestellar?": [
    "overview.md",
    "architecture.md",
    "related-projects.md",
    "roadmap.md",
    "release-notes.md"
  ],
  "Install & Configure": [
    ".get-started.md",
    "start-from-ocm.md",
    "setup-limitations.md",
    "acquire-hosting-cluster.md",
    "init-hosting-cluster.md",
    "core-specs/inventory-and-transport.md",
    "core-specs/workload-description.md",
    "workload-execution-cluster/about.md",
    "workload-execution-cluster/register.md",
    "core-chart.md",
    "teardown.md"
  ],
  "UI & Tools": [
    "ui-intro.md",
    "plugins.md",
    "galaxy-marketplace.md",
    "kubeflex-intro.md",
    "galaxy-intro.md"
  ],
  "Use & Integrate": [
    "usage-limitations.md",
    "binding.md",
    "transforming.md",
    "combined-status.md",
    "example-scenarios.md",
    "argo-to-wds1.md",
  ],
  "User Guide & Support": [
    "user-guide-intro.md",
    "troubleshooting.md",
    "known-issues.md",
    "knownissue-collector-miss.md",
    "knownissue-helm-ghcr.md",
    "knownissue-kind-config.md",
    "knownissue-cpu-insufficient-for-its1.md",
    "knownissue-kflex-extension.md",
    "combined-status.md",
    ]
}

// Build pageMap; hide the Direct folder if present
const { pageMap: _pageMap } = convertToPageMap({
  filePaths,
  basePath,
  meta: DIRECT_ROOT ? { [DIRECT_ROOT]: false } : {}
})

// We also need alias routes so the new sidebar links open the real files
const aliases: Array<{ alias: string; fp: string }> = []

for (const [categoryName, relFiles] of Object.entries(CATEGORY_MAPPINGS)) {
  if (!DIRECT_ROOT) continue

  // Keep only files that actually exist in the remote tree
  const fulls = relFiles
    .map(rel => `${DIRECT_ROOT}/${rel}`)
    .filter(full => filePaths.includes(full))

  if (!fulls.length) continue

  const categorySlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const children = fulls.map(full => {
    const base = full.replace(/\.(md|mdx)$/i, '').split('/').pop()!
    // Sidebar routes must start with "/docs/..."
    const route = `/${basePath}/${categorySlug}/${base}`
    // Alias key used by our routeMap (no leading "/docs")
    const alias = `${categorySlug}/${base}`
    aliases.push({ alias, fp: full })
    return {
      kind: 'MdxPage' as const,
      name: pretty(base),
      route
    }
  })

  _pageMap.push({
    kind: 'Folder',
    name: categoryName,
    route: `/${basePath}/${categorySlug}`,
    children
  })
}

function normalizeRoute(noExtPath: string) {
  let r = noExtPath
  r = r.replace(/\/(readme|index)$/i, '')
  r = r.replace(/^(readme|index)$/i, '')
  return r
}

const routeMap: Record<string, string> = {}
for (const fp of filePaths) {
  const noExt = fp.replace(/\.(md|mdx)$/i, '')
  const norm = normalizeRoute(noExt)

  routeMap[noExt] = fp
  if (!noExt.startsWith('content/')) {
    routeMap[`content/${noExt}`] = fp
  }

  const isIndex = /\/(readme|index)$/i.test(noExt) || /^(readme|index)$/i.test(noExt)
  if (!routeMap[norm] || isIndex) routeMap[norm] = fp

  if (norm !== '' && !norm.startsWith('content/')) {
    const contentNorm = `content/${norm}`
    if (!routeMap[contentNorm] || isIndex) routeMap[contentNorm] = fp
  }
}

// Add aliases for our custom sidebar routes (no leading /docs here)
for (const { alias, fp } of aliases) {
  routeMap[alias] = fp
  if (!alias.startsWith('content/')) routeMap[`content/${alias}`] = fp
}

// @ts-expect-error - nextra types mismatch
export const pageMap = normalizePageMap(_pageMap)

const { wrapper: Wrapper, ...components } = getMDXComponents({
  $Tabs: Tabs,
  Callout
})

const component = {
  ...components,
  Mermaid: MermaidComponent
}

type PageProps = Readonly<{
  params: Promise<{
    slug?: string[]
  }>
}>

export default async function Page(props: PageProps) {
  const params = await props.params
  const route = params.slug ? params.slug.join('/') : ''


  console.log(route);

  const filePath =
    routeMap[route] ??
    [`${route}.mdx`, `${route}.md`, `${route}/README.md`, `${route}/readme.md`, `${route}/index.mdx`, `${route}/index.md`]
      .find(p => filePaths.includes(p))

  if (!filePath) {
    notFound()
  }

  const response = await fetch(
    `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${docsPath}${filePath}`,
    { headers: makeGitHubHeaders(), cache: 'no-store' }
  )
  if (!response.ok) notFound()

  const data = await response.text()
  const processedData = convertHtmlScriptsToJsxComments(data)
    .replace(/<br\s*\/?>/gi, '<br />')
    .replace(/align=center/g, 'align="center"')
    .replace(/frameborder="0"/g, 'frameBorder="0"')
    .replace(/allowfullscreen/g, 'allowFullScreen')
    .replace(/scrolling=no/g, 'scrolling="no"')
    .replace(/onload="[^"]*"/g, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<\/?ol>/g, '')
    .replace(/<\/?li>/g, '')
  const rawJs = await compileMdx(processedData, { filePath })
  const { default: MDXContent, toc, metadata } = evaluate(rawJs, component)

  return (
    <Wrapper toc={toc} metadata={metadata} sourceCode={rawJs}>
      <MDXContent />
    </Wrapper>
  )
}

export function generateStaticParams() {
  return Object.keys(routeMap)
    .filter(k => k !== '')
    .map(route => ({ slug: route.split('/') }))
}