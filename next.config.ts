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
  
  async redirects() {
    return [
      // Basic redirect
      {
        source: '/tv',
        destination: 'https://www.youtube.com/@kubestellar',
        permanent: true,
      },
    ]
  },
async redirects() {
    return [
      {
        source: '/agenda',
        destination: 'https://docs.google.com/document/d/1XppfxSOD7AOX1lVVVIPWjpFkrxakfBfVzcybRg17-PM/edit?usp=share_link',
        permanent: false,
      },
      {
        source: '/blog',
        destination: 'https://medium.com/@kubestellar/list/predefined:e785a0675051:READING_LIST',
        permanent: false,
      },
      {
        source: '/code',
        destination: 'https://github.com/kubestellar/kubestellar',
        permanent: false,
      },
      {
        source: '/community',
        destination: 'https://docs.kubestellar.io/stable/Community/_index/',
        permanent: false,
      },
      {
        source: '/drive',
        destination: 'https://drive.google.com/drive/u/1/folders/1p68MwkX0sYdTvtup0DcnAEsnXElobFLS',
        permanent: false,
      },
      {
        source: '/infomercial',
        destination: 'https://youtu.be/rCjQAdwvZjk',
        permanent: false,
      },
      {
        source: '/join_us',
        destination: 'https://groups.google.com/g/kubestellar-dev',
        permanent: false,
      },
      {
        source: '/joinus',
        destination: 'https://groups.google.com/g/kubestellar-dev',
        permanent: false,
      },
      {
        source: '/ladder',
        destination: 'https://kubestellar.io/en/ladder',
        permanent: false,
      },
      {
        source: '/ladder_stats',
        destination: 'https://docs.google.com/spreadsheets/d/16CxUk2tNbTB-Si0qRVwIrI_f19t9HwSby9C1djMN7Sc/edit?usp=sharing',
        permanent: false,
      },
      {
        source: '/linkedin',
        destination: 'https://www.linkedin.com/feed/hashtag/?keywords=kubestellar',
        permanent: false,
      },
      {
        source: '/quickstart',
        destination: 'https://kubestellar.io/en/quick-installation',
        permanent: false,
      },
      {
        source: '/slack',
        destination: 'https://cloud-native.slack.com/archives/C097094RZ3M',
        permanent: false,
      },
      {
        source: '/survey',
        destination: 'https://forms.gle/WJ7N6ZVtp44D9NK79',
        permanent: false,
      },
      {
        source: '/tv',
        destination: 'https://youtube.com/@kubestellar',
        permanent: false,
      },
      {
        source: '/youtube',
        destination: 'https://youtube.com/@kubestellar',
        permanent: false,
      },
    ];
  },
};

const configWithNextra = withNextra(nextConfig);

// Note: Route-level exclusion is handled in src/middleware.ts (matcher excludes /docs)
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(configWithNextra);
