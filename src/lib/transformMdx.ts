export function convertHtmlScriptsToJsxComments(input: string): string {
  let s = input;

  const placeholders: string[] = [];
  const put = (block: string) => {
    const key = `__MDX_PLACEHOLDER_${placeholders.length}__`;
    placeholders.push(block);
    return key;
  };

  s = s.replace(/`{3,}[\s\S]*?`{3,}/g, m => put(m));
  s = s.replace(/~{3,}[\s\S]*?~{3,}/g, m => put(m));
  s = s.replace(/<pre\b[\s\S]*?<\/pre>/gi, m => put(m));
  s = s.replace(/`[^`]*`/g, m => put(m));

  s = s
    .replace(/\\\{\{/g, "&#123;&#123;")
    .replace(/\\\}\}/g, "&#125;&#125;")
    .replace(/\\\{\#/g, "&#123;#")
    .replace(/\\\#\}/g, "#&#125;")
    .replace(/\\\{\%/g, "&#123;%")
    .replace(/\\\%\}/g, "%&#125;");

  s = s.replace(/{%[\s\S]*?%}/g, "");
  s = s.replace(/\{\{[\s\S]*?\}\}/g, "");
  s = s.replace(/\{#[\s\S]*?#\}/g, "");
  const percentEntity = "(?:%|&#37;|&#x25;|&percnt;)";
  s = s.replace(
    new RegExp(`\\{${percentEntity}[\\s\\S]*?${percentEntity}\\}`, "gi"),
    ""
  );

  s = s.replace(
    /<!--([\s\S]*?)-->/g,
    (_m, comment) => `{/*${comment.trim()}*/}`
  );

  // Loop until stable to prevent nested-tag bypass (CWE-116 / CodeQL #106-#108).
  // A single-pass replace on a multi-character pattern can be bypassed by crafting
  // input so that one removal reconstitutes the dangerous pattern, e.g.:
  //   <scr<script>ipt>...</scr</script>ipt>
  // Repeating until the string no longer changes closes this gap.
  // Use [^>]* on closing tags to match any closing-tag variant (</script >,
  // </script\t\n bar>, etc.) that \s*> would not handle (CodeQL alert).
  const stripLoop = (str: string, re: RegExp): string => {
    let prev: string;
    do {
      prev = str;
      str = str.replace(re, "");
    } while (str !== prev);
    return str;
  };

  s = stripLoop(s, /<script\b[^>]*>[\s\S]*?<\/script[^>]*>/gi);
  s = stripLoop(s, /<script\b[^>]*\/>/gi);
  s = stripLoop(s, /<style\b[^>]*>[\s\S]*?<\/style[^>]*>/gi);

  // Strip HTML event-handler attributes (onclick, onload, etc.).
  // Require `=` after the attribute name so normal prose words like
  // "onto", "once", "one", "only" are NOT removed.
  s = stripLoop(
    s,
    /\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|\{[^}]*\}|[^\s>]+)/gi
  );
  s = s.replace(/\sstyle\s*=\s*(?:"[\s\S]*?"|'[\s\S]*?')/gi, "");
  s = s.replace(/\sstyle\s*=\s*\{\{[\s\S]*?\}\}/gi, "");
  s = s.replace(/\sstyle\s*=\s*\{[\s\S]*?\}/gi, "");

  s = s.replace(
    /\b(href|src)=(?!["'{])([^\s>]+)/gi,
    (_m, k, v) => `${k}="${v.replace(/"$/, "")}"`
  );

  const VOID = [
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
  ];
  const voidOpen = new RegExp(`<(${VOID.join("|")})(\\b[^>]*?)>`, "gi");
  const voidClose = new RegExp(`</(?:${VOID.join("|")})\\s*>`, "gi");
  s = s.replace(
    voidOpen,
    (_m, tag: string, attrs: string) =>
      `<${tag}${attrs.replace(/\s*\/\s*$/, "")} />`
  );
  s = s.replace(voidClose, "");
  s = s.replace(
    /<img\b([^>]*?)>(?!\s*<\/img>)/gi,
    (_m, attrs) => `<img${attrs.replace(/\s*\/\s*$/, "")} />`
  );

  s = s
    .replace(
      /<([A-Za-z][A-Za-z0-9._-]*[-_][A-Za-z0-9._-]*)\s*\\?>/g,
      (_m, name) => `&lt;${name}&gt;`
    )
    .replace(
      /<\/([A-Za-z][A-ZaZ0-9._-]*[-_][A-Za-z0-9._-]*)\s*\\?>/g,
      (_m, name) => `&lt;/${name}&gt;`
    )
    .replace(/<([^>\s]+)\\>/g, (_m, name) => `&lt;${name}&gt;`)
    .replace(/<\/([^>\s]+)\\>/g, (_m, name) => `&lt;/${name}&gt;`)
    .replace(/<\(/g, "&lt;(");

  s = s.replace(/<(?![A-Za-z/!])/g, "&lt;");
  s = s.replace(/<([A-Za-z0-9._-]+:[^>]+)>/g, "&lt;$1&gt;");
  s = s.replace(/<([A-Z0-9_-]+)>/g, "&lt;$1&gt;");

  s = s
    .replace(/\bclass=/gi, "className=")
    .replace(/\bfor=/gi, "htmlFor=")
    .replace(/\bframeborder\b/gi, "frameBorder")
    .replace(/\ballowfullscreen\b/gi, "allowFullScreen")
    .replace(/\btabindex\b/gi, "tabIndex")
    .replace(/\bcrossorigin\b/gi, "crossOrigin")
    .replace(/\bsrcset\b/gi, "srcSet")
    .replace(/\bmaxlength\b/gi, "maxLength")
    .replace(/\bminlength\b/gi, "minLength")
    .replace(
      /\b(allowFullScreen|controls|loop|muted|autoPlay)\b(?:=("[^"]*"|'[^']*'|\{[^}]*\}))?/gi,
      "$1"
    );

  s = s.replace(
    /<p([^>]*)>([\s\S]*?)(?=<\s*(div|iframe|table|pre|section|article|ul|ol|h[1-6])\b)([\s\S]*?)<\/p>/gi,
    (_m, attrs, before, _tag, inner) => `<div${attrs}>${before}${inner}</div>`
  );

  s = s.replace(/\{/g, "&#123;").replace(/\}/g, "&#125;");

  s = s.replace(
    /__MDX_PLACEHOLDER_(\d+)__/g,
    (_m, i) => placeholders[Number(i)]
  );

  return s;
}
