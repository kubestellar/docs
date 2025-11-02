export function convertHtmlScriptsToJsxComments(input: string): string {
  let s = input;

  const placeholders: string[] = [];
  const put = (block: string) => {
    const key = `__MDX_PLACEHOLDER_${placeholders.length}__`;
    placeholders.push(block);
    return key;
  };

  // Protect code (3+ backticks or tildes), <pre>, and inline code
  s = s.replace(/`{3,}[\s\S]*?`{3,}/g, m => put(m));
  s = s.replace(/~{3,}[\s\S]*?~{3,}/g, m => put(m));
  s = s.replace(/<pre\b[\s\S]*?<\/pre>/gi, m => put(m));
  s = s.replace(/`[^`]*`/g, m => put(m));

  // Show escaped Jinja examples literally (avoid MDX parsing on '{')
  s = s.replace(/\\\{\{/g, '&#123;&#123;')
    .replace(/\\\}\}/g, '&#125;&#125;')
    .replace(/\\\{\#/g, '&#123;#')
    .replace(/\\\#\}/g, '#&#125;')
    .replace(/\\\{\%/g, '&#123;%')
    .replace(/\\\%\}/g, '%&#125;');

  // Remove templating (Liquid/Jinja/Jekyll)
  s = s.replace(/{%[\s\S]*?%}/g, "");
  s = s.replace(/\{\{[\s\S]*?\}\}/g, "");
  s = s.replace(/\{#[\s\S]*?#\}/g, "");
  const percentEntity = '(?:%|&#37;|&#x25;|&percnt;)';
  s = s.replace(new RegExp(`\\{${percentEntity}[\\s\\S]*?${percentEntity}\\}`, 'gi'), "");

  // Strip HTML comments and script/style tags
  s = s.replace(/<!--([\s\S]*?)-->/g, (_m, comment) => `{/*${comment.trim()}*/}`);
  s = s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<script\b[^>]*\/>/gi, "");
  s = s.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");

  // Remove inline handlers and ANY inline style=
  s = s.replace(/\s+on[a-z]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|\{[^}]*\}|[^\s>]+))?/gi, "");
  s = s.replace(/\sstyle\s*=\s*(?:"[\s\S]*?"|'[\s\S]*?')/gi, "");
  s = s.replace(/\sstyle\s*=\s*\{\{[\s\S]*?\}\}/gi, "");
  s = s.replace(/\sstyle\s*=\s*\{[\s\S]*?\}/gi, "");

  // Quote unquoted href/src (JSX requires quotes)
  s = s.replace(/\b(href|src)=(?!["'{])([^\s>]+)/gi, (_m, k, v) => `${k}="${v.replace(/"$/, '')}"`);

  // Normalize void elements for JSX
  const VOID = ["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"];
  const voidOpen = new RegExp(`<(${VOID.join("|")})(\\b[^>]*?)>`, "gi");
  const voidClose = new RegExp(`</(?:${VOID.join("|")})\\s*>`, "gi");
  s = s.replace(voidOpen, (_m, tag: string, attrs: string) => `<${tag}${attrs.replace(/\s*\/\s*$/, '')} />`);
  s = s.replace(voidClose, "");
  s = s.replace(/<img\b([^>]*?)>(?!\s*<\/img>)/gi, (_m, attrs) => `<img${attrs.replace(/\s*\/\s*$/, "")} />`);

  // Escape pseudo-tags and process substitution
  s = s.replace(/<([A-Za-z][A-Za-z0-9._-]*[-_][A-Za-z0-9._-]*)\s*\\?>/g, (_m, name) => `&lt;${name}&gt;`)
    .replace(/<\/([A-Za-z][A-ZaZ0-9._-]*[-_][A-Za-z0-9._-]*)\s*\\?>/g, (_m, name) => `&lt;/${name}&gt;`)
    .replace(/<([^>\s]+)\\>/g, (_m, name) => `&lt;${name}&gt;`)
    .replace(/<\/([^>\s]+)\\>/g, (_m, name) => `&lt;/${name}&gt;`)
    .replace(/<\(/g, '&lt;(');

  // If '<' is followed by an invalid tag-start (e.g., '=', '(', digits), escape it.
  // Keeps real tags like <img>, </div>, <!--...> (comments already removed) intact.
  s = s.replace(/<(?![A-Za-z/!])/g, '&lt;');
  // Escape MDX-invalid pseudo-tags like <VM_IP> or <https://...>
  s = s.replace(/<([A-Za-z0-9._-]+:[^>]+)>/g, '&lt;$1&gt;'); // e.g., <https://foo>
  s = s.replace(/<([A-Z0-9_-]+)>/g, '&lt;$1&gt;'); // e.g., <VM_IP>

  // JSX attribute normalizations
  s = s.replace(/\bclass=/gi, 'className=')
    .replace(/\bfor=/gi, 'htmlFor=')
    .replace(/\bframeborder\b/gi, 'frameBorder')
    .replace(/\ballowfullscreen\b/gi, 'allowFullScreen')
    .replace(/\btabindex\b/gi, 'tabIndex')
    .replace(/\bcrossorigin\b/gi, 'crossOrigin')
    .replace(/\bsrcset\b/gi, 'srcSet')
    .replace(/\bmaxlength\b/gi, 'maxLength')
    .replace(/\bminlength\b/gi, 'minLength')
    .replace(/\b(allowFullScreen|controls|loop|muted|autoPlay)\b(?:=("[^"]*"|'[^']*'|\{[^}]*\}))?/gi, '$1');

  // Replace <p ...> wrapping block elements with <div ...>
  s = s.replace(
    /<p([^>]*)>([\s\S]*?)(?=<\s*(div|iframe|table|pre|section|article|ul|ol|h[1-6])\b)([\s\S]*?)<\/p>/gi,
    (_m, attrs, before, _tag, inner) => `<div${attrs}>${before}${inner}</div>`
  );

  // Escape any remaining curly braces outside code to avoid MDX expression parsing
  // Handles patterns like "{\u007B ... }}" in prose.
  s = s.replace(/\{/g, '&#123;').replace(/\}/g, '&#125;');

  // Restore protected blocks
  s = s.replace(/__MDX_PLACEHOLDER_(\d+)__/g, (_m, i) => placeholders[Number(i)]);

  return s;
}