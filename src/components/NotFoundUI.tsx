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
const SUBTLE_BORDER = "1px solid rgba(59, 130, 246, 0.35)"; // accent-tinted, not a stark white edge

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

const LOGO_SIZE = 28; // px; explicit size so the logo <img> can never render unsized

// Real KubeStellar logo mark, embedded as a data URI (no external request) so
// this page renders correctly even when hashed asset bundles are unavailable.
// Cropped from the canonical brand asset public/KubeStellar-with-Logo-transparent.png.
const LOGO_DATA_URI =
  "data:image/png;base64,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";

function BrandMark() {
  return (
    <img
      src={LOGO_DATA_URI}
      width={LOGO_SIZE}
      height={LOGO_SIZE}
      alt="KubeStellar"
      style={{
        display: "block",
        width: LOGO_SIZE,
        height: LOGO_SIZE,
        borderRadius: "50%",
      }}
    />
  );
}

export default function NotFoundUI() {
  const t = useTranslations("notFound");
  const pathname = usePathname();

  return (
    <div style={styles.page}>
      {/* Inline styles can't reach <html>/<body>. When the hashed CSS bundle
          is unavailable (the exact scenario this page is built for), there is
          no Tailwind preflight, so the UA default body margin (8px) shows as
          a white border around the dark page. This inline <style> ships with
          the markup and cannot fail to load. */}
      <style>{`html,body{margin:0;padding:0;background:${SPACE_DARK}}`}</style>
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
