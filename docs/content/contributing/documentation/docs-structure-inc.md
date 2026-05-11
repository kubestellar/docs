# Understanding the KubeStellar Documentation Architecture

### Overview

This documentation website is a **separate repository** from the main KubeStellar codebase. All the active documentation is now located _in this repository_. 
For safety reasons, copies of the docs source may remain in a to-be-deleted folder in the component repositories during a transition period

```text
┌─────────────────────────────────────────────────────────────┐
│  Main KubeStellar Repository                                │
│  github.com/kubestellar/kubestellar                         │
│  kubestellar/                                               │
│   ├ docs/   <-- NOT THE ACTIVE DOCS                         |
|     ├──README.md                                            |
|     └──content/to-be-deleted                                │
│           ├── readme.md                                     │
│           ├── architecture.md                               │
│           ├── direct/                                       │
│           ├── binding.md                                    │
│           ├── wds.md                                        │
│           └── ... (all previous documentation content)      │
│    └── ...(all the active components of the component repo) |
└─────────────────────────────────────────────────────────────┘
                         
┌────────────────────────────────────────────────────────────────|
│  Docs Website Repository (THIS REPO)                           │
│  github.com/kubestellar/docs                                   |
|                                                                │  
│  docs/ <-- this repository root folder                         │
|   ├ docs/ <-- raw MD content source moved from repos           |
|   |   content/                                                 |
|   |     a2a/                                                   |
|   |     common-subs/                                           |
|   |     Community/                                             |
|   |     console/                                               |
|   |     contribution-guidelines/                               |
|   |     icons/                                                 |
|   |     images/                                                |
|   |     klaude/                                                |
|   |     kubeflex/                                              |
|   |     kubestellar/                                           |
|   |     kubestellar-mcp/                                       |
|   |     multi-plugin/                                          |
|   |     ui-docs/                                               |
|   |   images/ <-- image folder for some of the MD files        |
|   |  overrides/ <-- master mkdocs layouts (legacy ref only)    |
|   ├ messages      <-- alternate language files for pages       | 
|   ├ src/  <-- Source for pages, site nav and layout            |    
|   | ├ app/                                                     |
|   | |  ├ docs/  <-- layouts to apply to component docs pages   |
|   | |  ├── page-map.ts     <-- Defines navigation structure    │
│   | |  ├── layout.tsx      <-- Nextra theme integration        │
|   | |  └── page.mdx      <-- Nextra page master                │
|   | ├ components/                                              │
|   | ├ config/                                                  │
|   | ├ hooks/                                                   │
|   | ├ i18n/ <-- configures language support                    |
|   | ├ lib/                                                     │
|   ├ CONTRIBUTING.md                                            |
|   ├ GOVERNANCE.md                                              |
|   ├ next.config.ts      <-- Nextra configuration               │
|   ├ mdx-components.js   <-- MDX component mappings             |
|   └── ... (various node.js and next.js etc files)              │
└────────────────────────────────────────────────────────────────┘
                          |
                    (Built & Deployed)
                          |
┌─────────────────────────────────────────────────────────────┐
│  Live Documentation Website                                  │
│  https://kubestellar.io                                      │
└─────────────────────────────────────────────────────────────┘
```

**Important Concepts:**

- **Content lives in the docs/content folder of this kubestellar/docs repo** (`docs/content/`)
- **The website structure is defined in the src folder of this repo**
- **This repo also contains the website framework** (Next.js + Nextra)
- **Navigation is defined in `page-map.ts`** (not auto-generated from files)

### How Nextra Integration Works

This documentation site is built using **Nextra**, a powerful Next.js-based documentation framework that provides:

- **Static Site Generation (SSG)** for fast loading
- **MDX Support** for rich, interactive documentation
- **Built-in Search** functionality
- **Theme Customization** with dark/light modes
- **Automatic Navigation** generation

#### Key Files and Their Roles

1. **`next.config.ts`** - Main configuration file that:
   - Imports and configures Nextra with `nextra()` function
   - Enables LaTeX support for mathematical expressions
   - Configures search settings
   - Integrates with `next-intl` for internationalization
   - Sets up redirects for various KubeStellar links

2. **`src/app/docs/layout.tsx`** - Docs layout component that:
   - Imports `Layout` from `nextra-theme-docs`
   - Imports the Nextra theme styles
   - Configures custom navbar, footer, and banner components
   - Sets up the sidebar with page map and repository links
   - Enables dark mode and collapsible sidebar sections

3. **`src/app/docs/page-map.ts`** - Navigation structure builder that:
   - Defines the documentation navigation structure in `NAV_STRUCTURE`
   - Reads documentation files from the local `/docs/content/` directory
   - Constructs hierarchical navigation from the defined structure
   - Generates routes for each documentation page
   - Creates a mapping between file paths and URL routes
   - **Note:** The file tree structure in _/docs/content_ roughly parallels the navigation created in _pagemap.ts_ but is **not** identical. As the new site matures many of the differences will be smoothed out
   - Using the page-map rather than file structure to generate the `NAV_STRUCTURE` simplifies changing menus for different locales (languages)

4. **`src/app/docs/[...slug]/page.tsx`** - Dynamic page renderer that:
   - Reads MDX content from the local `/docs/content/` directory
   - Compiles and evaluates MDX with custom components
   - Processes Jekyll-style includes and template variables
   - Supports Mermaid diagrams and custom components
   - Handles image path resolution and markdown transformations

5. **`mdx-components.js`** - Component mapping file that:
   - Exports MDX components from Nextra theme
   - Allows customization of how markdown elements render
   - Enables adding custom React components to MDX files

 _This page is an excerpt of the [Detailed Contribution Guide](contributing-inc.md). The complete file is viewable there or at [github.com/kubestellar/docs/CONTRIBUTING.md](https://github.com/kubestellar/docs/blob/main/CONTRIBUTING.md). Changes to this page content should be made in CONTRIBUTING.md on GitHub._
