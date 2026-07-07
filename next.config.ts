import type { NextConfig } from "next";
import nextra from "nextra";

import createNextIntlPlugin from "next-intl/plugin";

const withNextra = nextra({
  latex: true,
  search: {
    codeblocks: false,
  },
});

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ["@/components"],
  },
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  async headers() {
    // Content-Security-Policy for the docs site.
    // - default-src 'self': blocks all unlisted resource types by default.
    // - script-src includes 'unsafe-inline' because Next.js/Nextra inject
    //   inline <script> tags for hydration and i18n. A nonce-based CSP is
    //   preferable long-term; 'unsafe-inline' is the pragmatic starting point
    //   that does not break existing functionality. 'unsafe-eval' is excluded
    //   (not needed by any current dependency). 'wasm-unsafe-eval' allows
    //   the Mermaid WASM renderer.
    // - style-src 'unsafe-inline': required by Tailwind CSS and inline styles
    //   injected by framer-motion and Three.js.
    // - img-src includes data: for base64-encoded diagrams and blob: for
    //   canvas snapshots; https: covers external avatars/badges in docs content.
    // - connect-src covers the docs search API, GitHub API (for version data),
    //   and Netlify analytics endpoints.
    // - worker-src blob: is required by the Mermaid diagram renderer.
    // - frame-ancestors 'none' replaces X-Frame-Options: DENY (equivalent
    //   but CSP-native; X-Frame-Options kept for older browser compat).
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.github.com https://www.google-analytics.com",
      "worker-src blob:",
      "frame-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "Content-Security-Policy", value: csp },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        // Serve docs images from docs/content folder
        source: "/docs-images/:path*",
        destination: "/api/docs-image/:path*",
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/agenda",
        destination: "/docs/community/meetings",
        permanent: true,
      },
      {
        source: "/blog",
        destination: "/docs/news/latest-news",
        permanent: false,
      },
      {
        source: "/architecture_guide",
        destination: "/docs/multi-plugin/architecture_guide",
        permanent: true,
      },
      {
        source: "/development_guide",
        destination: "/docs/multi-plugin/development_guide",
        permanent: true,
      },
      {
        source: "/installation_guide",
        destination: "/docs/multi-plugin/installation_guide",
        permanent: true,
      },
      {
        source: "/api_reference",
        destination: "/docs/multi-plugin/api_reference",
        permanent: true,
      },
      {
        source: "/usage_guide",
        destination: "/docs/multi-plugin/usage_guide",
        permanent: true,
      },
      {
        source: "/code",
        destination: "https://github.com/kubestellar/kubestellar",
        permanent: true,
      },
      {
        source: "/community",
        destination: "https://cloud-native.slack.com/archives/C097094RZ3M",
        permanent: true,
      },
      {
        source: "/drive",
        destination:
          "https://drive.google.com/drive/u/1/folders/1p68MwkX0sYdTvtup0DcnAEsnXElobFLS",
        permanent: true,
      },
      {
        source: "/infomercial",
        destination: "https://youtu.be/rCjQAdwvZjk",
        permanent: true,
      },
      {
        source: "/join_us",
        destination: "https://groups.google.com/g/kubestellar-dev",
        permanent: true,
      },
      {
        source: "/joinus",
        destination: "https://groups.google.com/g/kubestellar-dev",
        permanent: true,
      },
      {
        source: "/ladder",
        destination: "https://kubestellar.io/en/ladder",
        permanent: true,
      },
      {
        source: "/ladder_stats",
        destination:
          "https://docs.google.com/spreadsheets/d/16CxUk2tNbTB-Si0qRVwIrI_f19t9HwSby9C1djMN7Sc/edit?usp=sharing",
        permanent: true,
      },
      {
        source: "/linkedin",
        destination:
          "https://www.linkedin.com/feed/hashtag/?keywords=kubestellar",
        permanent: true,
      },
      {
        source: "/quickstart",
        destination: "https://kubestellar.io/en/quick-installation",
        permanent: true,
      },
      {
        source: "/slack",
        destination: "https://cloud-native.slack.com/archives/C097094RZ3M",
        permanent: true,
      },
      {
        source: "/survey",
        destination: "https://forms.gle/Md2381TQ8CcjZv3LA",
        permanent: true,
      },
      {
        source: "/tv",
        destination: "https://youtube.com/@kubestellar",
        permanent: true,
      },
      {
        source: "/youtube",
        destination: "https://youtube.com/@kubestellar",
        permanent: true,
      },
    ];
  },
};

const configWithNextra = withNextra(nextConfig);

// Note: Route-level exclusion is handled in src/middleware.ts (matcher excludes /docs)
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(configWithNextra);
