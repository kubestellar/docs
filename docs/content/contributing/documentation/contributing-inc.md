# Contributing to KubeStellar Docs

Thank you for your interest in contributing to our documentation repository! We welcome contributions from everyone. Please follow these guidelines to help maintain a high-quality, consistent, and collaborative project.

---

## Prerequisites

Before contributing, ensure you have:

- [Node.js](https://nodejs.org/) (version 18 or higher) installed
- [npm](https://www.npmjs.com/) installed
- A GitHub account
- Basic knowledge of Markdown and Git

---

## How to Contribute

### 1. Fork the Repository

Click the **Fork** button at the top-right corner of this page to create your own copy of the repository.

### 2. Clone Your Fork

Clone the repository to your local machine:

```sh
git clone https://github.com/your-username/docs.git
```

### 3. Install Dependencies

Navigate into the project directory and install dependencies:

```sh
cd docs
npm install
```

### 4. Create a Branch

Create a new branch for your work:

```sh
git checkout -b my-feature-branch
```

### 5. Make Your Changes

Edit or create documentation files as needed.  
Please follow the existing structure, tone, and formatting style.

### 6. Preview / Test Your Changes

Start the development environment to verify rendering:

```sh
npm run dev
```

> **Tip:** During active documentation contributions, regularly run `npm run dev` to preview updates in real time.

### 7. Commit and Push

Commit your changes with a clear and meaningful message:

```sh
git add .
git commit -m "Describe your changes"
git push origin my-feature-branch
```

### 8. Open a Pull Request

Open a Pull Request (PR) from your branch to the main repository.

#### PR Description

- Provide a summary of what you changed (maximum 2 lines).
- Reference related issues, e.g.:
  ```
  Fixes #123
  ```



## Contribution Guidelines

- **Write Clearly:** Use concise language and proper formatting.
- **Stay Consistent:** Maintain the existing structure and style.
- **Respect Internationalization Standards:** Avoid pushing raw UI strings directly; always use i18n references.
- **Be Respectful:** Review our Code of Conduct before contributing.

## Note on E2E Test Context Workaround

The E2E test suite includes a temporary workaround for a known kubeflex context-selection issue.

Under certain conditions, `kflex create` can select an unintended hosting cluster when multiple kubeconfig contexts are present and kubeflex-related context extensions are configured. This can cause E2E tests to fail even when the current context correctly accesses the intended hosting cluster.

To ensure consistent and reliable test execution, the E2E test setup removes kubeflex-specific extensions from the kubeconfig before running tests. This forces `kflex create` to rely solely on the current kubeconfig context during E2E runs.

This workaround is limited to the E2E test infrastructure and does not affect normal user workflows. It is intended to be temporary and will be removed once the underlying context-handling issue is resolved.

### Caution With AI-Generated Code

> AI tools (like GitHub Copilot or ChatGPT) are helpful but **not always context-aware**.  
> **Please DO NOT blindly copy-paste AI-generated code.**

Before committing:

- Double-check if the code aligns with our project's architecture.
- Test thoroughly to ensure it doesn't break existing functionality.
- Refactor and adapt it as per the codebase standards.

---
## CI Workflow Notes

### OSSF Scorecard
The OSSF Scorecard workflow requires permissions to be defined at the job level.
Workflow-level permissions are not supported and may cause CI failures due to
OSSF Scorecard web application requirements.

### Image Scanning
The image scanning workflow supports repositories with multiple Dockerfiles
using a matrix strategy. Dockerfile paths must be correctly configured to
ensure all container images are scanned successfully.

---

## Understanding the Documentation Architecture

For details on the documentation architecture, see the [Docs Structure](docs-structure-inc.md) page.

## Working Effectively on the KubeStellar Docs

For making simple edits, see the [Simple Changes](simple-docs-inc.md) page.

For version management, see the [Version Management](docs-version-inc.md) page.

## Need Help?

If you have questions, open an issue or ask in the community channels:

- **Slack**: [#kubestellar-dev](https://cloud-native.slack.com/archives/C097094RZ3M)
- **GitHub Issues**: [kubestellar/docs](https://github.com/kubestellar/docs/issues)
- **Community Meetings**: Check the [community calendar](https://calendar.google.com/calendar/event?action=TEMPLATE&tmeid=MWM4a2loZDZrOWwzZWQzZ29xanZwa3NuMWdfMjAyMzA1MThUMTQwMDAwWiBiM2Q2NWM5MmJlZDdhOTg4NGVmN2ZlOWUzZjZjOGZlZDE2ZjZmYjJmODExZjU3NTBmNTQ3NTY3YTVkZDU4ZmVkQGc)

### Additional Resources

- **Nextra Documentation**: [https://nextra.site](https://nextra.site)
- **Next.js Documentation**: [https://nextjs.org/docs](https://nextjs.org/docs)
- **MDX Documentation**: [https://mdxjs.com](https://mdxjs.com)
- **Main KubeStellar Repo**: [https://github.com/kubestellar/kubestellar](https://github.com/kubestellar/kubestellar)

_This page is based on [github.com/kubestellar/docs/CONTRIBUTING.md](https://github.com/kubestellar/docs/blob/main/CONTRIBUTING.md). For the most up-to-date version, see that file directly._
