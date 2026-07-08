/**
 * HTML sanitization utilities for MDX content.
 *
 * This module is the primary XSS defense for user-supplied markdown content
 * rendered on the docs site. It MUST remain free of JSX/React imports so that
 * it can be unit-tested directly with Vitest without needing a JSX transform.
 */

// Apply a regex removal repeatedly until the output is stable.
// Prevents bypass of multi-character patterns via nested/interleaved input
// (e.g. <scr<script>ipt> → after one pass → <script>; loop catches the remainder).
export function stripUntilStable(content: string, pattern: RegExp): string {
  let prev = ''
  while (content !== prev) {
    prev = content
    content = content.replace(pattern, '')
  }
  return content
}

export function removeCommentPatterns(content: string): string {
  let cleaned = content

  // Remove all HTML comments — loop until stable to prevent partial-comment bypass
  let prev = ''
  while (cleaned !== prev) {
    prev = cleaned
    cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '')
  }
  // Remove any residual comment openers that were not closed (loop until stable)
  prev = ''
  while (cleaned !== prev) {
    prev = cleaned
    cleaned = cleaned.replace(/<!--[\s\S]*/g, '')
  }

  // Remove Jinja-style comments
  cleaned = cleaned.replace(/\{#[\s\S]*?#\}/g, '')

  // Remove JSX-style comments that aren't valid
  cleaned = cleaned.replace(/\{\/[^}]*\/\}/g, '')

  return cleaned
}

// Escape HTML special characters so that extracted attribute values cannot
// re-introduce HTML tags or break out of attribute context.
function escapeAngle(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Strip all security-critical patterns in a single pass, looping until the
 * output is stable.
 *
 * Running this as a unified loop — rather than as independent sequential
 * stripUntilStable() calls — prevents "spacer" exploits where one removal
 * operation reconstructs a dangerous pattern that an earlier operation already
 * finished processing.  For example:
 *
 *   <sty<script>…</script>le> → (remove <script>…</script>) → <style>
 *   <scri<iframe …>pt>…</script> → (remove <iframe>) → <script>…</script>
 *   o<script>…</script>nclick="x" → (remove <script>) → onclick="x"
 *
 * A single-loop approach guarantees that newly-created dangerous fragments are
 * always caught in subsequent iterations (Fixes: kubestellar/docs#6233).
 */
/**
 * Remove one category of dangerous tag (identified by `tagName`) until stable.
 *
 * Strategy — two sub-passes per outer iteration, each looped to stability:
 *  1. Remove complete open+close pairs (e.g. <script>…</script>).
 *  2. Remove any remaining lone openers (e.g. <script> with no </script>).
 *
 * Running the pair pass first ensures that intact pairs are fully eliminated
 * before the opener pass executes, preventing the opener pass from stripping
 * only the opening tag and leaving an orphaned </script> in the output.
 */
function stripTagUntilClean(content: string, tagName: string): string {
  const pairRe = new RegExp(`<${tagName}[^>]*>[\\s\\S]*?<\\/${tagName}[^>]*>`, 'gi')
  const openerRe = new RegExp(`<${tagName}\\b[^>]*>`, 'gi')
  const partialRe = new RegExp(`<${tagName}\\b[^>]*`, 'gi')

  let prev = ''
  while (content !== prev) {
    prev = content
    // Pass 1: remove complete pairs until no more pairs exist
    content = stripUntilStable(content, pairRe)
    // Pass 2: remove lone openers (those with no matching close tag remaining)
    content = stripUntilStable(content, openerRe)
    // Pass 3: remove partial openers that never have a closing > at all
    // (e.g. <script type="tex — truncated at end of string)
    content = stripUntilStable(content, partialRe)
  }
  return content
}

/**
 * Strip all security-critical patterns in a unified stability loop.
 *
 * Running all removals in a single outer loop — rather than as independent
 * sequential calls — prevents "spacer" exploits where one removal operation
 * reconstructs a dangerous pattern that an earlier operation already finished
 * processing.  For example:
 *
 *   <sty<script>…</script>le> → (remove <script>…</script>) → <style>
 *   <scri<iframe …>pt>…</script> → (remove <iframe>) → <script>…</script>
 *   o<script>…</script>nclick="x" → (remove <script>) → onclick="x"
 *
 * The outer loop guarantees newly-created dangerous fragments are always
 * caught in subsequent iterations (Fixes: kubestellar/docs#6233).
 */
function stripDangerousPatterns(content: string): string {
  let prev = ''
  while (content !== prev) {
    prev = content

    // Remove <script> tags (complete pairs, then lone openers, then partials).
    content = stripTagUntilClean(content, 'script')

    // Remove <style> tags (complete pairs, then lone openers).
    content = stripTagUntilClean(content, 'style')

    // Remove <iframe> tags — included here so that iframe-spacer patterns like
    // <scri<iframe …>pt>…</script> are also caught in the same stability loop.
    content = stripUntilStable(content, /<iframe[\s\S]*?<\/iframe>/gi)
    content = stripUntilStable(content, /<iframe\b[^>]*\/?>/gi)

    // Remove inline event handlers.
    content = stripUntilStable(
      content,
      /\s+on\w+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>'"]+))?/gi,
    )
  }
  return content
}

// Sanitize HTML for MDX compatibility
export function sanitizeHtmlForMdx(content: string): string {
  let sanitized = content

  // Strip null bytes and control characters (except \t, \n, \r)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  // Convert contributors table to a grid of contributor cards
  sanitized = sanitized.replace(/<table>[\s\S]*?<\/table>/gi, (tableMatch) => {
    const contributors: Array<{ name: string; github: string; avatar: string; profileUrl: string }> = []
    const tdRegex = /<td[^>]*>[\s\S]*?<a href="([^"]+)"[^>]*><img src="([^"]+)"[^>]*\/?><br\s*\/?><sub><b>([^<]+)<\/b><\/sub><\/a>[\s\S]*?<\/td>/gi

    let tdMatch
    while ((tdMatch = tdRegex.exec(tableMatch)) !== null) {
      const profileUrl = tdMatch[1]
      const avatar = tdMatch[2]
      const name = tdMatch[3]
      const githubMatch = profileUrl.match(/github\.com\/([^\/]+)/)
      const github = githubMatch ? githubMatch[1] : ''

      if (name && avatar) {
        contributors.push({ name, github, avatar, profileUrl })
      }
    }

    if (contributors.length === 0) return ''

    const cards = contributors.map(c =>
      `<a href="${escapeAngle(c.profileUrl)}" className="contributor-card" target="_blank" rel="noopener noreferrer">
        <img src="${escapeAngle(c.avatar)}" alt="${escapeAngle(c.name)}" />
        <span>${escapeAngle(c.name)}</span>
      </a>`
    ).join('\n')

    return `<div className="contributors-grid">\n${cards}\n</div>`
  })

  // Remove leftover tr/td that aren't part of tables we converted
  sanitized = sanitized.replace(/<tr>[\s\S]*?<\/tr>/gi, '')
  sanitized = sanitized.replace(/<td[^>]*>[\s\S]*?<\/td>/gi, '')

  // Remove all iframe tags — handles closed, self-closing, and unclosed <iframe> forms.
  // Use stripUntilStable for both patterns to prevent multi-character bypass via
  // nested/interleaved input (e.g. <i<iframe>frame ...) — CWE-116.
  // Iframe removal is included in the stripDangerousPatterns loop below so that
  // iframe-spacer patterns like <scri<iframe …>pt>…</script> are also caught.
  sanitized = stripUntilStable(sanitized, /<iframe[\s\S]*?<\/iframe>/gi)
  sanitized = stripUntilStable(sanitized, /<iframe\b[^>]*\/?>/gi)

  // Normalize all img tags - handle both <img ...> and <img ... />
  sanitized = sanitized.replace(/<img\s+([^>]*?)\/?>/gi, (match, attrs) => {
    const srcMatch = attrs.match(/src=["']([^"']+)["']/i)
    const altMatch = attrs.match(/alt=["']([^"']*)["']/i)
    const titleMatch = attrs.match(/title=["']([^"']*)["']/i)

    const src = srcMatch ? srcMatch[1] : ''
    if (!src) return ''
    const alt = altMatch ? altMatch[1] : ''

    return `<img src="${escapeAngle(src)}" alt="${escapeAngle(alt)}"${titleMatch ? ` title="${escapeAngle(titleMatch[1])}"` : ''} />`
  })

  // Fix self-closing tags
  sanitized = sanitized.replace(/<br\s*\/?>/gi, '<br />')
  sanitized = sanitized.replace(/<hr\s*\/?>/gi, '<hr />')

  // Remove other problematic attributes from remaining tags
  sanitized = sanitized.replace(/\s+align=["']?[^"'\s>]+["']?/gi, '')
  sanitized = sanitized.replace(/\s+width=["']?[^"'\s>]+["']?/gi, '')
  sanitized = sanitized.replace(/\s+height=["']?[^"'\s>]+["']?/gi, '')
  sanitized = sanitized.replace(/\s+frameborder=["']?[^"'\s>]+["']?/gi, '')
  sanitized = sanitized.replace(/\s+allowfullscreen(?:=["'][^"']*["'])?/gi, '')
  sanitized = sanitized.replace(/\s+scrolling=["']?[^"'\s>]+["']?/gi, '')
  sanitized = sanitized.replace(/\sclass=/gi, ' className=')

  // Remove style attributes that might cause issues
  sanitized = sanitized.replace(/\s+style=["'][^"']*["']/gi, '')

  // Strip all security-critical patterns (script, style tags, event handlers)
  // in a unified stability loop.  This prevents "spacer" exploits where one
  // removal reconstructs a pattern that an earlier removal already finished
  // processing (e.g. iframe or script fragments reassembling dangerous tags).
  sanitized = stripDangerousPatterns(sanitized)

  // Remove <meta>, <link>, <base> tags
  sanitized = sanitized.replace(/<meta\b[^>]*\/?>/gi, '')
  sanitized = sanitized.replace(/<link\b[^>]*\/?>/gi, '')
  sanitized = sanitized.replace(/<base\b[^>]*\/?>/gi, '')

  // Remove CDATA sections
  sanitized = sanitized.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '')

  // Remove processing instructions
  sanitized = sanitized.replace(/<\?[\s\S]*?\?>/g, '')

  // Remove DOCTYPE declarations
  sanitized = sanitized.replace(/<!DOCTYPE[^>]*>/gi, '')

  // Remove <sub> and other problematic inline tags that may have issues
  sanitized = sanitized.replace(/<sub>/gi, '')
  sanitized = sanitized.replace(/<\/sub>/gi, '')

  return sanitized
}
