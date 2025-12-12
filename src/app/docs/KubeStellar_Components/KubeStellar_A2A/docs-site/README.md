<div align="center">
<p align="center">
  <img alt="KubeStellar Logo" width="250px" src="https://avatars.githubusercontent.com/u/134407106?s=200&v=4" />
</p>

  
  # KubeStellar A2A Documentation Website
  
  **A modern documentation site built with Docusaurus**
  
  [![Built with Docusaurus](https://img.shields.io/badge/Built%20with-Docusaurus-2e8555?style=flat-square&logo=docusaurus)](https://docusaurus.io/)
  [![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
  [![GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?style=flat-square&logo=github-actions)](https://github.com/features/actions)
</div>

---

## 📖 About

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

## 🔧 Prerequisites

- **Node.js 20+** (required for Mermaid diagrams)
- npm or yarn

## 📦 Installation

```bash
npm install
# or
yarn
```

## 🚀 Local Development

```bash
npm start
# or
yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## 🏗️ Build

```bash
npm run build
# or
yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## ✨ Features

- **KubeStellar Branding**: Official logo and color scheme
- **Mermaid Diagrams**: Interactive architecture visualizations
- **Dark/Light Mode**: Toggle between themes (defaults to light)
- **Responsive Design**: Works on all devices
- **GitHub Actions**: Automatic deployment on main/dev branches

## 🚢 Deployment

The documentation is automatically deployed via GitHub Actions when changes are pushed to the `main` or `dev` branches.

### Manual Deployment

**Using SSH:**

```bash
USE_SSH=true yarn deploy
```

**Without SSH:**

```bash
GIT_USER=<Your GitHub username> yarn deploy
```

---

<div align="center">
  Made with ❤️ by the KubeStellar Team
</div>
