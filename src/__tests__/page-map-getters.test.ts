import { describe, expect, it } from 'vitest'
import path from 'path'
import { getContentPath, getBasePath, docsContentPath, basePath } from '../app/docs/page-map'
import type { ProjectId } from '../config/versions'

/**
 * Coverage for the getContentPath / getBasePath switch tables in
 * src/app/docs/page-map.ts. buildPageMap uses these to resolve the on-disk
 * content directory and the URL base for each documentation project.
 *
 * Existing page-map.test.ts exercises buildPageMap end-to-end for a subset
 * of projects but never asserts the exact return value of these two
 * helpers, which left several project-id branches (notably 'hive') and the
 * default fallthrough uncovered. Regressions here would silently point the
 * page map at the wrong folder, causing 404s across an entire project's
 * docs section.
 */

const cwd = process.cwd()

// One row per ProjectId branch. The 'kubestellar' entry falls through to
// the default arm of both switch statements and returns the shared
// docsContentPath / 'docs' base path.
const projectCases: Array<{ id: ProjectId; content: string; base: string }> = [
  { id: 'a2a',              content: path.join(cwd, 'docs', 'content', 'a2a'),              base: 'docs/a2a' },
  { id: 'kubeflex',         content: path.join(cwd, 'docs', 'content', 'kubeflex'),         base: 'docs/kubeflex' },
  { id: 'multi-plugin',     content: path.join(cwd, 'docs', 'content', 'multi-plugin'),     base: 'docs/multi-plugin' },
  { id: 'kubestellar-mcp',  content: path.join(cwd, 'docs', 'content', 'kubestellar-mcp'),  base: 'docs/kubestellar-mcp' },
  { id: 'console',          content: path.join(cwd, 'docs', 'content', 'console'),          base: 'docs/console' },
  { id: 'hive',             content: path.join(cwd, 'docs', 'content', 'hive'),             base: 'docs/hive' },
  { id: 'kubestellar',      content: docsContentPath,                                       base: basePath }, // default arm
]

describe('getContentPath', () => {
  it.each(projectCases)('resolves the on-disk content path for $id', ({ id, content }) => {
    expect(getContentPath(id)).toBe(content)
  })

  it('returns the shared docsContentPath for the default (kubestellar) arm', () => {
    expect(getContentPath('kubestellar')).toBe(docsContentPath)
    // docsContentPath itself must be rooted at <cwd>/docs/content.
    expect(docsContentPath).toBe(path.join(cwd, 'docs', 'content'))
  })
})

describe('getBasePath', () => {
  it.each(projectCases)('resolves the URL base path for $id', ({ id, base }) => {
    expect(getBasePath(id)).toBe(base)
  })

  it("returns the shared 'docs' base for the default (kubestellar) arm", () => {
    expect(getBasePath('kubestellar')).toBe('docs')
    expect(basePath).toBe('docs')
  })

  it('emits a base path that is a strict prefix of its content directory suffix', () => {
    // Sanity check: every non-default arm's base path must end with the
    // same project-id segment as the content path. This locks the two
    // switch tables against silent drift where a new project id is added
    // to one table but not the other.
    for (const { id, content, base } of projectCases) {
      if (id === 'kubestellar') continue
      expect(base.split('/').pop()).toBe(id)
      expect(content.endsWith(id)).toBe(true)
    }
  })
})
