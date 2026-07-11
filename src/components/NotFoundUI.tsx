"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { CSSProperties } from "react";

// This component intentionally uses INLINE STYLES ONLY (no Tailwind classes
// for layout/color) and explicit width/height attributes on the SVG mark.
//
// Why: the 404 page is exactly what users see during deploy propagation
// windows, when the previous deploy's hashed CSS bundle can 404. A 404 page
// styled via external CSS then renders unstyled -- unsized inline SVGs blow
// up to full viewport width (the "giant blue glyph" incident). Inline styles
// and sized SVGs cannot fail to load, so this page always renders correctly.
// Please keep it free of Tailwind classes and external assets.

// KubeStellar brand palette (mirrors src/app/globals.css / tailwind.config.ts)
const SPACE_DARK = "#0a0a0a";
const ACCENT_BLUE = "#3b82f6";
const GRADIENT =
  "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)";
const GRADIENT_FALLBACK = "#764ba2"; // if background-clip: text is unsupported
const TEXT_PRIMARY = "#f3f4f6";
const TEXT_MUTED = "#9ca3af";
const PATH_ACCENT = "#c084fc";
const SUBTLE_BG = "rgba(255, 255, 255, 0.05)";
const SUBTLE_BORDER = "1px solid rgba(255, 255, 255, 0.12)";

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: SPACE_DARK,
    color: TEXT_PRIMARY,
    fontFamily:
      'var(--font-inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif)',
  },
  header: { padding: "1.25rem 1.5rem" },
  brand: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.6rem",
    textDecoration: "none",
    color: TEXT_PRIMARY,
    fontWeight: 600,
    fontSize: "1.05rem",
  },
  main: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "3rem 1.5rem",
    textAlign: "center",
  },
  wrap: { maxWidth: "44rem" },
  code: {
    fontSize: "clamp(4.5rem, 16vw, 8rem)",
    fontWeight: 800,
    lineHeight: 1,
    backgroundImage: GRADIENT,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    color: GRADIENT_FALLBACK,
    marginBottom: "1.25rem",
  },
  description: {
    fontSize: "1.25rem",
    color: TEXT_PRIMARY,
    lineHeight: 1.6,
    marginBottom: "1.5rem",
  },
  pathBox: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 1rem",
    borderRadius: "0.5rem",
    backgroundColor: SUBTLE_BG,
    border: SUBTLE_BORDER,
    marginBottom: "1.5rem",
    maxWidth: "100%",
  },
  pathLabel: { fontSize: "0.875rem", color: TEXT_MUTED },
  pathValue: {
    fontSize: "0.875rem",
    color: PATH_ACCENT,
    fontFamily:
      "var(--font-jetbrains-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
    overflowWrap: "anywhere",
  },
  message: {
    fontSize: "1.05rem",
    color: TEXT_MUTED,
    lineHeight: 1.6,
    marginBottom: "2.5rem",
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem",
    justifyContent: "center",
  },
  buttonPrimary: {
    display: "inline-block",
    padding: "0.75rem 2rem",
    borderRadius: "0.5rem",
    fontSize: "1rem",
    fontWeight: 500,
    textDecoration: "none",
    color: "#ffffff",
    backgroundColor: ACCENT_BLUE,
    border: `1px solid ${ACCENT_BLUE}`,
  },
  buttonSecondary: {
    display: "inline-block",
    padding: "0.75rem 2rem",
    borderRadius: "0.5rem",
    fontSize: "1rem",
    fontWeight: 500,
    textDecoration: "none",
    color: TEXT_PRIMARY,
    backgroundColor: SUBTLE_BG,
    border: SUBTLE_BORDER,
  },
};

const LOGO_SIZE = 28; // px; explicit size so the SVG can never render unsized

function BrandMark() {
  return (
    <svg
      viewBox="0 0 32 32"
      width={LOGO_SIZE}
      height={LOGO_SIZE}
      aria-hidden="true"
      focusable="false"
      style={{ display: "block", width: LOGO_SIZE, height: LOGO_SIZE }}
    >
      <defs>
        <linearGradient id="ks-nf-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#667eea" />
          <stop offset="0.5" stopColor="#764ba2" />
          <stop offset="1" stopColor="#f093fb" />
        </linearGradient>
      </defs>
      <path
        fill="url(#ks-nf-grad)"
        d="M16 1l3.2 9.3a2.5 2.5 0 0 0 1.5 1.5L30 15l-9.3 3.2a2.5 2.5 0 0 0-1.5 1.5L16 29l-3.2-9.3a2.5 2.5 0 0 0-1.5-1.5L2 15l9.3-3.2a2.5 2.5 0 0 0 1.5-1.5L16 1z"
      />
      <circle fill={ACCENT_BLUE} cx="25.5" cy="6.5" r="2.5" />
    </svg>
  );
}

export default function NotFoundUI() {
  const t = useTranslations("notFound");
  const pathname = usePathname();

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <Link href="/" style={styles.brand}>
          <BrandMark />
          <span>KubeStellar</span>
        </Link>
      </header>

      <main style={styles.main}>
        <section style={styles.wrap}>
          <div style={styles.code}>404</div>

          <p style={styles.description}>{t("description")}</p>

          {pathname && (
            <div style={styles.pathBox}>
              <span style={styles.pathLabel}>{t("requestedPath")}</span>
              <code style={styles.pathValue}>{pathname}</code>
            </div>
          )}

          <p style={styles.message}>{t("message")}</p>

          <div style={styles.actions}>
            <Link href="/" style={styles.buttonPrimary}>
              {t("homeButton")}
            </Link>
            <Link href="/docs" style={styles.buttonSecondary}>
              {t("docsButton")}
            </Link>
            <a
              href="https://github.com/kubestellar"
              rel="noopener noreferrer"
              target="_blank"
              style={styles.buttonSecondary}
            >
              GitHub
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
