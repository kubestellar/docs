"use client";

import type { CSSProperties } from "react";

// Root-level error boundary (catches errors thrown by root layouts too).
// Like the 404 pages, this uses inline styles ONLY and English-only strings:
// when this boundary renders, the app (and possibly its CSS bundle and i18n
// message loading) has already failed, so it must not depend on anything
// external. Please keep it free of Tailwind classes and external assets.

// KubeStellar brand palette (mirrors src/app/globals.css / tailwind.config.ts)
const SPACE_DARK = "#0a0a0a";
const ACCENT_BLUE = "#3b82f6";
const GRADIENT =
  "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)";
const GRADIENT_FALLBACK = "#764ba2"; // if background-clip: text is unsupported
const TEXT_PRIMARY = "#f3f4f6";
const TEXT_MUTED = "#9ca3af";
const SUBTLE_BG = "rgba(255, 255, 255, 0.05)";
const SUBTLE_BORDER = "1px solid rgba(255, 255, 255, 0.12)";

const styles: Record<string, CSSProperties> = {
  body: {
    margin: 0,
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SPACE_DARK,
    color: TEXT_PRIMARY,
    textAlign: "center",
    padding: "3rem 1.5rem",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  wrap: { maxWidth: "44rem" },
  code: {
    fontSize: "clamp(3.5rem, 12vw, 6rem)",
    fontWeight: 800,
    lineHeight: 1,
    backgroundImage: GRADIENT,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    color: GRADIENT_FALLBACK,
    marginBottom: "1.25rem",
  },
  heading: {
    fontSize: "1.75rem",
    fontWeight: 600,
    margin: "0 0 0.9rem",
  },
  message: {
    fontSize: "1.05rem",
    color: TEXT_MUTED,
    lineHeight: 1.6,
    margin: "0 0 2.25rem",
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
    cursor: "pointer",
    fontFamily: "inherit",
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

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={styles.body}>
        <main style={styles.wrap}>
          <div style={styles.code}>Oops</div>
          <h1 style={styles.heading}>Something went wrong</h1>
          <p style={styles.message}>
            An unexpected error occurred while loading this page. It may be a
            temporary problem &mdash; trying again usually fixes it.
          </p>
          <div style={styles.actions}>
            <button type="button" onClick={reset} style={styles.buttonPrimary}>
              Try again
            </button>
            {/* Plain <a> is deliberate here: when the global error boundary
                renders, the app (router included) has already crashed, so a
                full-page navigation is the most reliable way out. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" style={styles.buttonSecondary}>
              KubeStellar home
            </a>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/docs" style={styles.buttonSecondary}>
              Browse the docs
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
