# KubeStellar Documentation

<p align="center">
  <img src="./overrides/images/banner.png" alt="KubeStellar Docs Banner" width="100%"/>
</p>

<!-- <p align="center">
  <img src="./docs/overrides/favicons/android-72x72.png" alt="KubeStellar Logo" width="72"/>
</p> -->

<p align="center">
  <b>Multi-cluster Configuration Management for Edge, Multi-Cloud, and Hybrid Cloud</b><br/>
  Official documentation source for the <a href="https://kubestellar.io">KubeStellar Website</a>
</p>

<p align="center">
  <a href="https://www.firsttimersonly.com/">
    <img src="https://img.shields.io/badge/first--timers--only-friendly-blue.svg?style=flat-square" alt="First Timers Only">
  </a>
  <a href="https://github.com/kubestellar/kubestellar/actions/workflows/broken-links-crawler.yml">
    <img src="https://github.com/kubestellar/kubestellar/actions/workflows/broken-links-crawler.yml/badge.svg" alt="Broken Links Crawler">
  </a>
  <a href="https://www.bestpractices.dev/projects/8266">
    <img src="https://www.bestpractices.dev/projects/8266/badge" alt="OpenSSF Best Practices">
  </a>
  <a href="https://scorecard.dev/viewer/?uri=github.com/kubestellar/kubestellar">
    <img src="https://api.scorecard.dev/projects/github.com/kubestellar/kubestellar/badge" alt="Scorecard">
  </a>
  <a href="https://artifacthub.io/packages/search?repo=kubestellar">
    <img src="https://img.shields.io/endpoint?url=https://artifacthub.io/badge/repository/kubestellar" alt="ArtifactHub">
  </a>
  <a href="https://communityinviter.com/apps/kubernetes/community">
    <img src="https://img.shields.io/badge/KubeStellar-Join%20Slack-blue?logo=slack" alt="Join Slack">
  </a>
</p>

---

## About KubeStellar

**KubeStellar** is a [CNCF Sandbox Project](https://www.cncf.io/sandbox-projects/) that enables seamless deployment and configuration of Kubernetes objects across multiple clusters — whether you're operating in edge, multi-cloud, or hybrid environments.

### Key Capabilities

KubeStellar empowers you to:

- **Define binding policies** between clusters and Kubernetes resources
- **Use familiar single-cluster tooling** for multi-cluster operations
- **Improve compliance, resilience, availability, and developer productivity**

Learn more at the official [KubeStellar Website](https://kubestellar.io).

---

## About This Repository

This repository powers the **KubeStellar Documentation Site**, serving as the canonical source for comprehensive project documentation including:

- User and operator guides
- Architecture overviews and technical references
- Roadmaps and release notes
- Contribution and governance documentation
- Tutorials and practical examples

Our goal is to deliver well-organized, consistent, and comprehensive documentation that helps both newcomers and experienced contributors succeed with KubeStellar.

---

## Quick Links

- 🌐 **Main Site**: [kubestellar.io](https://kubestellar.io)
- 🗺️ **Roadmap**: [docs/content/direct/roadmap.md](docs/content/direct/roadmap.md)
- 🤝 **Contributing**: [CONTRIBUTING.md](https://github.com/kubestellar/kubestellar/blob/main/CONTRIBUTING.md)
- 📜 **Code of Conduct**: [CODE_OF_CONDUCT.md](https://github.com/kubestellar/kubestellar/blob/main/CODE_OF_CONDUCT.md)
- 🚀 **Get Involved**: [kubestellar.io/joinus](http://kubestellar.io/joinus)

---

## Local Development Setup

This documentation site is built with **Next.js**. Follow these steps to run it locally:

### Prerequisites

Ensure you have **Node.js v18+** installed:

```bash
node --version
```

### Installation & Development

1. **Install dependencies:**

   ```bash
   npm install
   # or
   yarn
   ```

2. **Start development server:**

   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000` in your browser. The server supports hot-reload for instant feedback.

3. **Build for production:**

   ```bash
   npm run build
   ```

4. **Preview production build locally:**
   ```bash
   npm start
   ```

---

## Internationalization (i18n) — Important rules

- All user-facing strings must use the i18n system. **Do not commit raw strings**.
- Add keys to the English source and open a translation issue if you add new copy.
- Keep strings short and include context in comments where the meaning is ambiguous.

---

## Contributing

We welcome contributions from everyone! Whether you're fixing a typo, improving documentation, or adding new content, your help makes a meaningful impact.

**Get started:**

1. Review our [Contributing Guidelines](https://github.com/kubestellar/kubestellar/blob/main/CONTRIBUTING.md)
2. Join discussions on Slack or mailing lists
3. Open issues or pull requests for improvements

We especially encourage first-time contributors and provide mentorship for those new to open source.

### Suggested PR checklist
- Run `npm run dev` locally and confirm no build errors
- Add screenshots for UI changes
- Update i18n keys when you change text
- Mention related issues in the PR

---

## Content structure

```
docs/
  content/           # markdown pages, organized by section
  overrides/          # images, favicons, banners, CSS overrides
  public/             # static assets
  i18n/               # translation files and rules
  site.config.js      # site configuration
```

---

## Design & Visuals

- Place images in `docs/overrides/images/`.
- Banner path used in README: `./docs/overrides/images/banner.png`
- Recommended banner size: **1600×420 px** (desktop friendly).
- Use descriptive alt text for accessibility.

---

## Accessibility & Quality

- Use semantic headings and logical structure.
- Mark code fences with language.
- Add alt text for images.
- Run CI checks before requesting a final review.

---

## Project Status & Compliance

<p align="center">
  <a href="https://clomonitor.io/projects/cncf/kubestellar">
    <img src="https://clomonitor.io/api/projects/cncf/kubestellar/report-summary?theme=light" alt="CLOMonitor"/>
  </a>
</p>

<p align="center">
  <a href="https://app.fossa.com/projects/git%2Bgithub.com%2Fkubestellar%2Fkubestellar?ref=badge_large&issueType=license">
    <img src="https://app.fossa.com/api/projects/git%2Bgithub.com%2Fkubestellar%2Fkubestellar.svg?type=large&issueType=license" alt="FOSSA License Scan"/>
  </a>
</p>

---

## Contributors

<p align="center">
  <a href="https://github.com/kubestellar/kubestellar/graphs/contributors">
    <img src="https://contrib.rocks/image?repo=kubestellar/kubestellar" alt="Contributors"/>
  </a>
</p>

---

## CNCF & Licensing

<p align="center">
  <a href="https://landscape.cncf.io">
    <img src="/docs/overrides/images/cncf-color.png" width="300" alt="CNCF Logo"/>
  </a>
</p>

<p align="center">
  We are a proud <a href="https://cncf.io">Cloud Native Computing Foundation</a> Sandbox Project.
</p>

---

**Legal Notice**: Kubernetes® and the Kubernetes logo are registered trademarks of The Linux Foundation®.  
© 2022–2025 The KubeStellar Authors. All rights reserved.  
Licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).