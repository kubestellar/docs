# Contributing to the KubeStellar Docs Repository

Thanks for wanting to contribute! This guide shows how to make a useful, reviewable contribution to the docs repository. Follow these steps so maintainers can review and merge faster.

---

## Table of contents

- [Before you start](#before-you-start)  
- [How to contribute](#how-to-contribute)  
- [Branching and commit rules](#branching-and-commit-rules)  
- [Pull request process](#pull-request-process)  
- [Internationalization (i18n) rules — important](#internationalization-i18n-rules---important)  
- [Style and formatting](#style-and-formatting)  
- [Testing and previewing locally](#testing-and-previewing-locally)  
- [Labels and issue workflow](#labels-and-issue-workflow)  
- [Security issues](#security-issues)  
- [Code of conduct](#code-of-conduct)  
- [Contact & help](#contact--help)

---

## Before you start

1. Read `README.md` and `CODE_OF_CONDUCT.md`.
2. Search open issues to avoid duplicate work.
3. If your change is large, open an issue first to discuss scope and design.

---

## How to contribute

1. **Fork** the repo and clone your fork:
   ```bash
   git clone https://github.com/your-username/docs.git
   cd docs
   ```

2. **Create a branch**:
   ```bash
   git checkout -b docs/<short-description>-<your-gh>
   ```
   Example: `docs/fix-install-typo-amanc77`

3. Make small, focused changes. Limit each PR to a single goal.

4. Preview your changes locally.

5. Commit, push, and open a PR to `main`.

---

## Branching and commit rules

- Branch pattern: `docs/<short-description>-<your-username>`
- Commit message format:
  ```
  <type>: Short description

  Optional longer description.
  ```
  `<type>`: `major:`, `minor:`, `patch:`.

Example:
```
patch: Fix typo in installation guide
```

---

## Pull request process

1. Push your branch and open a PR against `kubestellar/docs:main`.
2. Use a concise PR title and a one-line description (the repo uses short PR summaries).
3. In the PR body, include:
   - Why the change matters
   - How to test locally
   - Any i18n impacts
   - Screenshots for UI changes
4. Use the PR checklist:
   - [ ] Local build passes
   - [ ] i18n keys added or issue opened
   - [ ] Screenshots added for UI changes
   - [ ] PR allows edits by maintainers (recommended)

5. Mention related issues using `Fixes #<issue>` to auto-close them on merge.

---

## Internationalization (i18n) rules — important

- **Do not commit raw strings** in templates or components.
- Add new English keys in `i18n/` or `locales/`, following naming patterns.
- If you change copy, update the English key and open a translation issue for other locales or add minimal translations when possible.
- Add context comments for translators when needed.

If unsure, ask on Slack (`#kubestellar-dev`) or open an issue.

---

## Style and formatting

- Use plain, clear English.
- Short paragraphs.
- Use fenced code blocks with language markers.
- Use internal links to other docs.
- Provide descriptive `alt` text for images.

---

## Testing and previewing locally

**Prereqs:** Node.js v18+, npm or yarn.

```bash
npm install
npm run dev
# open http://localhost:3000
```

If layout or CSS changes, rebuild:
```bash
npm run build
npm start
```

If something breaks, remove `.next` and retry `npm run dev`. Check terminal for errors.

---

## Labels and issue workflow

Use labels to categorize issues and PRs. Common labels:
- `good first issue`
- `help wanted`
- `docs`
- `bug`
- `enhancement`

---

## Security issues

Do not open public issues for security problems. Follow `SECURITY.md` and contact maintainers via the private channel listed there.

---

## Code of conduct

Follow our [Code of Conduct](docs/contribution-guidelines/coc-inc.md). Be respectful and constructive.

---

## Contact & help

Need help?
- Open an issue with `help wanted`.
- Ask in Slack: `#kubestellar-dev`
- Mention maintainers on GitHub if urgent.

---

## Final notes

- Small, focused PRs merge faster.
- Add screenshots for UI changes.
- Follow the i18n rule — it's a common blocker.

Thanks — your contributions improve the docs for everyone!