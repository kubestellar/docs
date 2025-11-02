export function convertHtmlScriptsToJsxComments(input: string): string {
  let s = input;

  const placeholders: string[] = [];
  const put = (block: string) => {
    const key = `__MDX_PLACEHOLDER_${placeholders.length}__`;
    placeholders.push(block);
    return key;
  };

  // Protect code (3+ fences backticks or tildes), <pre>, and inline code
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
  // Also remove encoded-percent variants: {&#37; ... &#37;} / {&#x25; ... &#x25;} / {&percnt; ... &percnt;}
  const percentEntity = '(?:%|&#37;|&#x25;|&percnt;)';
  s = s.replace(new RegExp(`\\{${percentEntity}[\\s\\S]*?${percentEntity}\\}`, 'gi'), "");

  // Strip HTML comments entirely (avoid emitting empty JSX expressions)
  s = s.replace(/<!--[\s\S]*?-->/g, "");

  // Strip script/style tags entirely
  s = s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<script\b[^>]*\/>/gi, "");
  s = s.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");

  // Remove inline handlers and inline style= (React style requires object)
  s = s.replace(/\s+on[a-z]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|\{[^}]*\}|[^\s>]+))?/gi, "");
  s = s.replace(/\sstyle\s*=\s*(?:"[^"]*"|'[^']*')/gi, "");

  // Quote unquoted href/src (JSX requires quotes); drop stray trailing double-quote
  s = s.replace(/\b(href|src)=(?!["'{])([^\s>]+)/gi, (_m, k, v) => {
    v = v.replace(/"$/, '');
    return `${k}="${v}"`;
  });

  // Normalize HTML void elements for JSX/MDX (must be self-closing)
  const VOID = ["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"];
  const voidOpen = new RegExp(`<(${VOID.join("|")})(\\b[^>]*?)>`, "gi");
  const voidClose = new RegExp(`</(?:${VOID.join("|")})\\s*>`, "gi");
  s = s.replace(voidOpen, (_m, tag: string, attrs: string) => `<${tag}${attrs.replace(/\s*\/\s*$/,'')} />`);
  s = s.replace(voidClose, "");
  s = s.replace(/<img\b([^>]*?)>(?!\s*<\/img>)/gi, (_m, attrs) => `<img${attrs.replace(/\s*\/\s*$/, "")} />`);

  // Escape placeholder-like angle tags and pseudo-tags
  // e.g., <branch-name>, <repo_owner>, <var_name\>, and process substitution <(...)
  s = s.replace(/<([A-Za-z][A-ZaZ0-9._-]*[-_][A-Za-z0-9._-]*)\s*\\?>/g, (_m, name) => `&lt;${name}&gt;`)
       .replace(/<\/([A-Za-z][A-ZaZ0-9._-]*[-_][A-Za-z0-9._-]*)\s*\\?>/g, (_m, name) => `&lt;/${name}&gt;`)
       .replace(/<([^>\s]+)\\>/g, (_m, name) => `&lt;${name}&gt;`)
       .replace(/<\/([^>\s]+)\\>/g, (_m, name) => `&lt;/${name}&gt;`)
       .replace(/<\(/g, '&lt;(');

  // JSX attribute normalizations
  s = s.replace(/\bclass=/gi, 'className=');
  s = s.replace(/\bfor=/gi, 'htmlFor=');
  s = s.replace(/\bframeborder\b/gi, 'frameBorder');
  s = s.replace(/\ballowfullscreen\b/gi, 'allowFullScreen');
  s = s.replace(/\btabindex\b/gi, 'tabIndex');
  s = s.replace(/\bcrossorigin\b/gi, 'crossOrigin');
  s = s.replace(/\bsrcset\b/gi, 'srcSet');
  s = s.replace(/\bmaxlength\b/gi, 'maxLength');
  s = s.replace(/\bminlength\b/gi, 'minLength');
  s = s.replace(/\b(allowFullScreen|controls|loop|muted|autoPlay)\b(?:=("[^"]*"|'[^']*'|\{[^}]*\}))?/gi, '$1');

  // Replace <p ...> wrapping block elements with <div ...>
  s = s.replace(
    /<p([^>]*)>([\s\S]*?)(?=<\s*(div|iframe|table|pre|section|article|ul|ol|h[1-6])\b)([\s\S]*?)<\/p>/gi,
    (_m, attrs, before, _tag, inner) => `<div${attrs}>${before}${inner}</div>`
  );

  // Restore protected blocks
  s = s.replace(/__MDX_PLACEHOLDER_(\d+)__/g, (_m, i) => placeholders[Number(i)]);

  return s;
}