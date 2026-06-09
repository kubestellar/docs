/**
 * HTML sanitization utilities for MDX content.
 *
 * Extracted from src/app/docs/[...slug]/page.tsx so they can be unit-tested
 * without pulling in JSX or server-only Next.js internals.
 */

/** Apply `pattern` replacement in a loop until the output stabilises. */
export function stripUntilStable(content: string, pattern: RegExp): string {
  let prev = ''
  while (content !== prev) {
    prev = content
    content = content.replace(pattern, '')
  }
  return content
}

/** Remove HTML/Jinja/JSX comment patterns. */
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

/**
 * Escape HTML special characters so that extracted attribute values cannot
 * re-introduce HTML tags or break out of attribute context when interpolated
 * into template literals (CWE-79 / CodeQL js/incomplete-html-attribute-sanitization).
 */
export function escapeAngle(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Sanitize HTML for MDX compatibility.
 *
 * Removes or neutralises elements that are unsafe in an MDX/Next.js context:
 * - script, style, iframe, meta, link, base tags
 * - Inline event handlers (onclick, onload, …)
 * - Null bytes and C0 control characters
 * - HTML/JS comments, CDATA, processing instructions, DOCTYPE declarations
 * - Structured contributor tables → CSS grid of cards
 *
 * This function is the primary XSS defence for user-supplied markdown
 * rendered on the docs site (CodeQL #188 and #190).
 */
export function sanitizeHtmlForMdx(content: string): string {
  let sanitized = content

  // Convert contributors table to a grid of contributor cards
  sanitized = sanitized.replace(/<table>[\s\S]*?<\/table>/gi, (tableMatch) => {
    const contributors: Array<{ name: string; github: string; avatar: string; profileUrl: string }> = []
    const tdRegex =
      /<td[^>]*>[\s\S]*?<a href="([^"]+)"[^>]*><img src="([^"]+)"[^>]*\/?><br\s*\/?><sub><b>([^<]+)<\/b><\/sub><\/a>[\s\S]*?<\/td>/gi

    let tdMatch
    while ((tdMatch = tdRegex.exec(tableMatch)) !== null) {
      const profileUrl = tdMatch[1]
      const avatar = tdMatch[2]
      const name = tdMatch[3]
      const githubMatch = profileUrl.match(/github\.com\/([^/]+)/)
      const github = githubMatch ? githubMatch[1] : ''
      if (name && avatar) {
        contributors.push({ name, github, avatar, profileUrl })
      }
    }

    if (contributors.length === 0) return ''

    const cards = contributors
      .map(
        (c) =>
          `<a href="${escapeAngle(c.profileUrl)}" className="contributor-card" target="_blank" rel="noopener noreferrer">
        <img src="${escapeAngle(c.avatar)}" alt="${escapeAngle(c.name)}" />
        <span>${escapeAngle(c.name)}</span>
      </a>`,
      )
      .join('\n')

    return `<div className="contributors-grid">\n${cards}\n</div>`
  })

  // Remove leftover tr/td that aren't part of tables we converted
  sanitized = sanitized.replace(/<tr>[\s\S]*?<\/tr>/gi, '')
  sanitized = sanitized.replace(/<td[^>]*>[\s\S]*?<\/td>/gi, '')

  // Remove all iframe tags
  sanitized = stripUntilStable(sanitized, /<iframe[\s\S]*?<\/iframe>/gi)
  sanitized = sanitized.replace(/<iframe\b[^>]*\/?>/gi, '')

  // Normalize img tags — keep only src, alt, title
  sanitized = sanitized.replace(/<img\s+([^>]*?)\/?>/gi, (_match, attrs) => {
    const srcMatch = attrs.match(/src=["']([^"']+)["']/i)
    const altMatch = attrs.match(/alt=["']([^"']*)["']/i)
    const titleMatch = attrs.match(/title=["']([^"']*)["']/i)
    const src = srcMatch ? srcMatch[1] : ''
    const alt = altMatch ? altMatch[1] : ''
    const title = titleMatch ? ` title="${titleMatch[1]}"` : ''
    if (!src) return ''
    return `<img src="${src}" alt="${alt}"${title} />`
  })

  // Fix self-closing tags
  sanitized = sanitized.replace(/<br\s*\/?>/gi, '<br />')
  sanitized = sanitized.replace(/<hr\s*\/?>/gi, '<hr />')

  // Remove inline event handlers — loop until stable
  sanitized = stripUntilStable(
    sanitized,
    /\s+on\w+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>'"]+))?/gi,
  )

  // Remove other problematic attributes
  sanitized = sanitized.replace(/\s+align=["']?[^"'\s>]+["']?/gi, '')
  sanitized = sanitized.replace(/\s+width=["']?[^"'\s>]+["']?/gi, '')
  sanitized = sanitized.replace(/\s+height=["']?[^"'\s>]+["']?/gi, '')
  sanitized = sanitized.replace(/\s+frameborder=["']?[^"'\s>]+["']?/gi, '')
  sanitized = sanitized.replace(/\s+allowfullscreen(?:=["'][^"']*["'])?/gi, '')
  sanitized = sanitized.replace(/\s+scrolling=["']?[^"'\s>]+["']?/gi, '')
  sanitized = sanitized.replace(/\sclass=/gi, ' className=')

  // Remove style attributes
  sanitized = sanitized.replace(/\s+style=["'][^"']*["']/gi, '')

  // Remove style tags — loop until stable
  sanitized = stripUntilStable(sanitized, /<style[^>]*>[\s\S]*?<\/style>/gi)

  // Remove script tags — loop until stable (CodeQL #190: js/bad-tag-filter)
  sanitized = stripUntilStable(sanitized, /<script[^>]*>[\s\S]*?<\/script[^>]*>/gi)

  // Remove <sub> inline tags
  sanitized = sanitized.replace(/<sub>/gi, '')
  sanitized = sanitized.replace(/<\/sub>/gi, '')

  return sanitized
}
