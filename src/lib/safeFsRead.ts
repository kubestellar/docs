import fs from 'fs'
import path from 'path'

/**
 * Read `filePath` from under `root`, refusing to resolve outside of it.
 *
 * `src/app/docs/[...slug]/page.tsx`'s `readLocalFile` and
 * `src/app/api/search/route.ts`'s `readLocalFile` each independently
 * re-implemented this same "reject a `..` segment, then confirm the
 * joined path still starts with `root`" guard around a
 * `fs.existsSync`/`fs.readFileSync` pair, and had already drifted: the
 * page renderer's copy had the guard, the search route's copy did not.
 * `filePath` at both call sites is always a repo-relative path taken
 * from the internally generated page map (`buildPageMap()` in
 * `src/app/docs/page-map.ts`), never request input, so the missing
 * guard was not a live exploit — but nothing in the function's own
 * signature made that assumption visible, so a future caller passing
 * untrusted input would have had no protection.
 *
 * Returns the file's contents, or null if `filePath` contains `..`, the
 * joined path escapes `root`, or no file exists there. Deliberately
 * mirrors the page renderer's existing "exact `root` match is allowed"
 * edge case (`fullPath !== root` short-circuits the prefix check) rather
 * than `src/app/api/docs-image/[...path]/route.ts`'s stricter guard,
 * which rejects that same case — those two are a real, not accidental,
 * behavioral difference and are not unified here.
 *
 * Propagates (does not catch) any error `fs.existsSync`/`fs.readFileSync`
 * themselves throw (e.g. permission denied, I/O error) — callers decide
 * how to log or handle that distinctly from the expected "absent" case
 * above.
 */
export function readFileWithinRoot(root: string, filePath: string): string | null {
  if (filePath.includes('..')) return null
  const fullPath = path.join(root, filePath)
  if (!fullPath.startsWith(root + path.sep) && fullPath !== root) return null
  if (!fs.existsSync(fullPath)) return null
  return fs.readFileSync(fullPath, 'utf-8')
}
