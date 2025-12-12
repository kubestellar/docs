import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import * as dotenv from 'dotenv';
dotenv.config();

const config: Config = {
  title: 'KubeStellar A2A',
  tagline: 'Advanced Multi-Cluster Kubernetes Management with AI-Powered Automation',
  favicon: 'img/kubestellar-logo.png',

  url: 'https://kubestellar.github.io',
  baseUrl: '/a2a/',

  organizationName: 'kubestellar',
  projectName: 'a2a',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  customFields: {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/kubestellar/a2a/tree/main/docs-site/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: ['@docusaurus/theme-mermaid'],

  markdown: {
    mermaid: true,
  },

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'KubeStellar A2A',
      logo: {
        alt: 'KubeStellar Logo',
        src: 'img/kubestellar-logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://github.com/kubestellar/a2a',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Introduction',
              to: '/docs/intro',
            },
            {
              label: 'Getting Started',
              to: '/docs/getting-started/',
            },
            {
              label: 'CLI Reference',
              to: '/docs/cli-reference',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/kubestellar/a2a',
            },
            {
              label: 'Issues',
              href: 'https://github.com/kubestellar/a2a/issues',
            },
            {
              label: 'Discussions',
              href: 'https://github.com/kubestellar/a2a/discussions',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'KubeStellar Project',
              href: 'https://kubestellar.io',
            },
            {
              label: 'Contributing',
              href: 'https://github.com/kubestellar/a2a/blob/main/docs-site/docs/CONTRIBUTING.md',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} KubeStellar Project. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;