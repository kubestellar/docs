import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { readFileWithinRoot } from '@/lib/safeFsRead'

describe('readFileWithinRoot', () => {
  let root: string

  beforeAll(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'safe-fs-read-'))
    fs.writeFileSync(path.join(root, 'present.md'), '# hello\n')
    fs.mkdirSync(path.join(root, 'nested'))
    fs.writeFileSync(path.join(root, 'nested', 'child.md'), 'nested content\n')
    // sibling directory outside root, used to exercise the escape guard
    fs.writeFileSync(path.join(path.dirname(root), 'outside.md'), 'outside content\n')
  })

  afterAll(() => {
    fs.rmSync(root, { recursive: true, force: true })
    fs.rmSync(path.join(path.dirname(root), 'outside.md'), { force: true })
  })

  it('returns file contents for a path that exists within root', () => {
    expect(readFileWithinRoot(root, 'present.md')).toBe('# hello\n')
  })

  it('returns file contents for a nested path within root', () => {
    expect(readFileWithinRoot(root, 'nested/child.md')).toBe('nested content\n')
  })

  it('rejects a path containing a ".." segment without touching the filesystem', () => {
    expect(readFileWithinRoot(root, '../outside.md')).toBeNull()
    expect(readFileWithinRoot(root, 'nested/../../outside.md')).toBeNull()
  })

  it('rejects a path that resolves outside root even without a literal ".."', () => {
    // A sibling directory that merely shares root's name as a prefix
    // (e.g. root = "/tmp/foo", escape target = "/tmp/foo-evil") must not
    // satisfy the startsWith(root + path.sep) guard.
    const decoyRoot = root + '-evil'
    fs.mkdirSync(decoyRoot)
    fs.writeFileSync(path.join(decoyRoot, 'secret.md'), 'secret\n')
    try {
      const absoluteEscape = path.join(decoyRoot, 'secret.md').slice(root.length)
      expect(readFileWithinRoot(root, absoluteEscape)).toBeNull()
    } finally {
      fs.rmSync(decoyRoot, { recursive: true, force: true })
    }
  })

  it('returns null when the file does not exist under root', () => {
    expect(readFileWithinRoot(root, 'missing.md')).toBeNull()
  })

  it('allows the exact-root path edge case when it points at a readable file', () => {
    // path.join(root, '') === root; the function explicitly allows
    // fullPath === root to proceed past the prefix check instead of
    // rejecting it.
    const fileRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'safe-fs-read-exact-'))
    fs.rmdirSync(fileRoot)
    fs.writeFileSync(fileRoot, 'exact root content\n')
    try {
      expect(readFileWithinRoot(fileRoot, '')).toBe('exact root content\n')
    } finally {
      fs.rmSync(fileRoot, { force: true })
    }
  })
})
