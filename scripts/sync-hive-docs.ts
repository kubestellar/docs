import fs from 'fs'
import path from 'path'

const owner = 'kubestellar'
const repo = 'hive'
const branch = process.env.HIVE_DOCS_REF || 'v4'
const docsRoot = path.join(process.cwd(), 'docs', 'content', 'hive')
const rawBase = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/v2/docs`
const canonicalBase = `https://github.com/${owner}/${repo}/blob/${branch}/v2/docs`

const files: Array<{ source: string; target?: string }> = [
  { source: 'README.md', target: 'readme.md' },
  { source: 'architecture.md' },
  { source: 'security-threat-model.md' },
  { source: 'roadmap.md' },
  { source: 'landscape.md' },
  { source: 'adr/README.md', target: 'adr/readme.md' },
  { source: 'adr/0001-record-architecture-decisions.md' },
  { source: 'adr/0002-mitm-proxy-network-enforcement.md' },
  { source: 'adr/0003-acmm-autonomy-levels.md' },
  { source: 'adr/0004-beads-work-ledger.md' },
  { source: 'adr/0005-forge-abstraction.md' },
  { source: 'adr/0006-planning-intelligence.md' },
  { source: 'adr/0007-token-mint.md' },
  { source: 'adr/0008-ioscan-untrusted-input.md' },
  { source: 'adr/0009-trajectory-review.md' },
  { source: 'adr/0010-escalation-circuit-breaker.md' },
  { source: 'adr/0011-knowledge-graph.md' },
  { source: 'adr/0012-skill-registry.md' },
  { source: 'adr/0013-cel-triggers.md' },
  { source: 'adr/0014-hub-spoke.md' },
]

function canonicalHeader(source: string): string {
  const canonical = `${canonicalBase}/${source}`
  return `> **Synced from Hive.** This page is pulled from [kubestellar/hive@${branch}](${canonical}) during the docs build. Edit the canonical source in the Hive repository.\n\n`
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }
  return response.text()
}

async function main() {
  for (const file of files) {
    const target = file.target || file.source
    const sourceURL = `${rawBase}/${file.source}`
    const targetPath = path.join(docsRoot, target)
    if (!targetPath.startsWith(docsRoot + path.sep)) {
      throw new Error(`refusing to write outside Hive docs root: ${target}`)
    }
    const content = await fetchText(sourceURL)
    fs.mkdirSync(path.dirname(targetPath), { recursive: true })
    fs.writeFileSync(targetPath, canonicalHeader(file.source) + content)
    console.log(`synced ${file.source} -> docs/content/hive/${target}`)
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
