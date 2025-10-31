export function convertHtmlScriptsToJsxComments(input: string): string {
    let s = input;

    const placeholders: string[] = [];
    const put = (block: string) => {
        const key = `__MDX_PLACEHOLDER_${placeholders.length}__`;
        placeholders.push(block);
        return key;
    };

    // Protect code
    s = s.replace(/```[\s\S]*?```/g, m => put(m));
    s = s.replace(/<pre\b[\s\S]*?<\/pre>/gi, m => put(m));
    s = s.replace(/`[^`]*`/g, m => put(m));

    // HTML comments -> JSX comments
    s = s.replace(/<!--([\s\S]*?)-->/g, (_m, body) => `{/*${body}*/}`);

    // Scripts -> JSX comments
    s = s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "{/* [script removed for MDX safety] */}");
    s = s.replace(/<script\b[^>]*\/>/gi, "{/* [script removed for MDX safety] */}");

    // Styles -> JSX comments (raw <style> blocks break MDX)
    s = s.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "{/* [style removed for MDX safety] */}");

    // Remove inline event handlers like onload=, onclick=, etc. (allow spaces, quoted or unquoted)
    s = s.replace(
      /\s+on[a-z]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|\{[^}]*\}|[^\s>]+))?/gi,
      ""
    );

    // Remove inline style="..." (string styles are invalid in JSX)
    s = s.replace(/\s+style\s*=\s*(?:"[^"]*"|'[^']*')/gi, "");

    // Normalize HTML void elements for JSX/MDX (must be self-closing)
    const VOID = [
        "area","base","br","col","embed","hr","img","input",
        "link","meta","param","source","track","wbr"
    ];
    const voidOpen = new RegExp(`<(${VOID.join("|")})(\\b[^>]*?)>`, "gi");
    const voidClose = new RegExp(`</(?:${VOID.join("|")})\\s*>`, "gi");

    // Make opening tags self-closing if not already
    s = s.replace(voidOpen, (_m, tag: string, attrs: string) => {
        const cleaned = attrs.replace(/\s*\/\s*$/,'');
        return `<${tag}${cleaned} />`;
    });
    // Remove any (invalid) closing tags for voids
    s = s.replace(voidClose, "");

    // Extra safeguard for <img ...> (ensure self-closing, avoid double slash)
    s = s.replace(/<img\b([^>]*?)>(?!\s*<\/img>)/gi, (_m, attrs) => {
      const cleaned = attrs.replace(/\s*\/\s*$/, "");
      return `<img${cleaned} />`;
    });

    // Quote some common unquoted attributes used in raw HTML
    s = s.replace(/\balign=([^\s"'>]+)/gi, 'align="$1"');
    s = s.replace(/\bscrolling=([^\s"'>]+)/gi, 'scrolling="$1"');

    // JSX attribute normalizations commonly present in raw HTML blocks
    s = s.replace(/\bclass=/gi, 'className=');
    s = s.replace(/\bfor=/gi, 'htmlFor=');
    s = s.replace(/\bframeborder\b/gi, 'frameBorder');
    s = s.replace(/\ballowfullscreen\b/gi, 'allowFullScreen');
    s = s.replace(/\btabindex\b/gi, 'tabIndex');
    s = s.replace(/\bcrossorigin\b/gi, 'crossOrigin');
    s = s.replace(/\bsrcset\b/gi, 'srcSet');
    s = s.replace(/\bmaxlength\b/gi, 'maxLength');
    s = s.replace(/\bminlength\b/gi, 'minLength');
    // Boolean attrs: keep as presence-only
    s = s.replace(/\b(allowFullScreen|controls|loop|muted|autoPlay)\b(?:=("[^"]*"|'[^']*'|\{[^}]*\}))?/gi, '$1');

    // Replace <p ...> wrappers that contain block elements with <div ...>
    // (block-level inside <p> causes parser mismatches)
    s = s.replace(
      /<p([^>]*)>([\s\S]*?)(?=<\s*(div|iframe|table|pre|section|article|ul|ol|h[1-6])\b)([\s\S]*?)<\/p>/gi,
      (_m, attrs, before, _tag, inner) => `<div${attrs}>${before}${inner}</div>`
    );

    // Restore protected blocks
    s = s.replace(/__MDX_PLACEHOLDER_(\d+)__/g, (_m, i) => placeholders[Number(i)]);

    return s;
}