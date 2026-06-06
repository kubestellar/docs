function stripUnsafeAttributesFromTagOnce(tag: string): string {
  let i = 1;
  while (i < tag.length && !/[\s/>]/.test(tag[i])) {
    i++;
  }

  let sanitized = tag.slice(0, i);

  while (i < tag.length) {
    const segmentStart = i;

    while (i < tag.length && /\s/.test(tag[i])) {
      i++;
    }

    if (i >= tag.length || tag[i] === ">" || (tag[i] === "/" && tag[i + 1] === ">")) {
      sanitized += tag.slice(segmentStart);
      break;
    }

    const nameStart = i;
    while (i < tag.length && !/[\s=/>]/.test(tag[i])) {
      i++;
    }
    const nameEnd = i;
    const name = tag.slice(nameStart, nameEnd);
    let attributeEnd = nameEnd;
    let scan = nameEnd;

    while (scan < tag.length && /\s/.test(tag[scan])) {
      scan++;
    }

    if (tag[scan] === "=") {
      scan++;
      while (scan < tag.length && /\s/.test(tag[scan])) {
        scan++;
      }

      const delimiter = tag[scan];
      if (delimiter === '"' || delimiter === "'") {
        scan++;
        while (scan < tag.length) {
          if (tag[scan] === delimiter) {
            scan++;
            break;
          }
          scan++;
        }
      } else if (delimiter === "{") {
        let depth = 0;
        while (scan < tag.length) {
          if (tag[scan] === "{") {
            depth++;
          } else if (tag[scan] === "}") {
            depth--;
            if (depth === 0) {
              scan++;
              break;
            }
          }
          scan++;
        }
      } else {
        while (scan < tag.length && !/[\s>]/.test(tag[scan])) {
          scan++;
        }
      }
      attributeEnd = scan;
    }

    const attribute = tag.slice(segmentStart, attributeEnd);
    const lowerName = name.toLowerCase();
    if (!lowerName.startsWith("on") && lowerName !== "style") {
      sanitized += attribute;
    }

    i = attributeEnd;
  }

  return sanitized;
}

function stripUnsafeAttributesFromTag(tag: string): string {
  let sanitized = tag;
  let previous: string;

  do {
    previous = sanitized;
    sanitized = stripUnsafeAttributesFromTagOnce(sanitized);
  } while (sanitized !== previous);

  return sanitized;
}

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
  s = s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<script\b[^>]*\/>/gi, "");
  s = s.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");

  // Strip HTML event-handler attributes (onclick, onload, etc.) and
  // inline style attributes. Re-run on each tag until stable so
  // malformed/stacked attributes cannot re-form `on*=` after one removal.
  s = s.replace(/<[A-Za-z][^>]*>/g, tag => stripUnsafeAttributesFromTag(tag));

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
