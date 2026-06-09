---
title: Ecosystem Directory Submissions
description: Draft entries for external directory and awesome-list submissions
---

# Ecosystem Directory Submissions

This document tracks pending submissions to external ecosystem directories and awesome-lists. Each entry includes the draft submission text, the target directory, and the current status.

**Related issue**: [#3792](https://github.com/kubestellar/kubestellar/issues/3792)

---

## Submission Queue

| Directory | Status | PR/Link |
|-----------|--------|---------|
| [awesome-kubernetes](https://github.com/ramitsurana/awesome-kubernetes) | ⏳ Draft ready — needs maintainer approval | [see below](#awesome-kubernetes) |
| [CNCF Landscape](https://landscape.cncf.io) | ⏳ Not submitted | [see below](#cncf-landscape) |
| [awesome-cloud-native](https://github.com/rootsongjc/awesome-cloud-native) | ⏳ Draft ready | [see below](#awesome-cloud-native) |
| [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) | ⏳ Not submitted (kubestellar-mcp) | [see below](#mcp-servers-directory) |

---

## awesome-kubernetes

**Repo**: https://github.com/ramitsurana/awesome-kubernetes  
**Section**: Multi-Cluster Management  
**Status**: Not listed (confirmed June 2026)

### Draft PR entry

Location in `README.md` → section **Multi-Cluster Management**:

```markdown
* [KubeStellar](https://github.com/kubestellar/kubestellar) - Multi-cluster workload orchestration for Kubernetes with policy-based placement, GitOps integration, and an AI-powered observability console.
```

### Submission instructions

1. Fork `ramitsurana/awesome-kubernetes`
2. Add the entry above to the **Multi-Cluster Management** section (alphabetical order — after "Karmada", before "Liqo" if listed)
3. Open a PR titled: `Add KubeStellar to Multi-Cluster Management`
4. Reference the project's CNCF affiliation in the PR body

**Note**: Maintainer approval required before submitting to external repos (per ACMM L6 policy).

---

## CNCF Landscape

**URL**: https://landscape.cncf.io  
**Category**: Orchestration & Management → Scheduling & Orchestration  
**Status**: Verify current listing at https://landscape.cncf.io/?project=kubestellar

### Draft submission

File: `landscape.yml` entry for https://github.com/cncf/landscape

```yaml
- item:
  name: KubeStellar
  homepage_url: 'https://kubestellar.io'
  repo_url: 'https://github.com/kubestellar/kubestellar'
  logo: kubestellar.svg
  description: >-
    Multi-cluster workload orchestration for Kubernetes with policy-based placement,
    GitOps support, and an AI-powered observability console.
  project: sandbox  # update when CNCF Sandbox application (#3809) is approved
  crunchbase: 'https://www.crunchbase.com/organization/ibm'
```

**Logo requirements**: SVG, hosted at `https://kubestellar.io/logo.svg` or submitted to CNCF landscape GitHub.

### Submission process

1. Check current CNCF listing at https://landscape.cncf.io
2. If not listed: open PR at https://github.com/cncf/landscape following their [instructions](https://github.com/cncf/landscape#new-entries)
3. If listed but stale: open update PR with current description and links

---

## awesome-cloud-native

**Repo**: https://github.com/rootsongjc/awesome-cloud-native  
**Section**: Cluster Management  
**Status**: Not verified

### Draft PR entry

```markdown
* [KubeStellar](https://github.com/kubestellar/kubestellar) - Multi-cluster workload orchestration for Kubernetes.
```

---

## MCP Servers Directory

**Repo**: https://github.com/modelcontextprotocol/servers  
**Project**: [kubestellar/kubestellar-mcp](https://github.com/kubestellar/kubestellar-mcp)  
**Status**: Not listed (confirmed June 2026)  
**Related issue**: [#3810](https://github.com/kubestellar/kubestellar/issues/3810)

### Draft README entry

Location in `README.md` → section **🤖 AI & ML** or **☸️ Cloud & Infrastructure**:

```markdown
- **[kubestellar-mcp](https://github.com/kubestellar/kubestellar-mcp)** - AI-powered kubectl plugin for multi-cluster Kubernetes management. Provides natural language multi-cluster operations, GitOps workflow automation, and cluster health diagnostics via MCP.
```

### Alternative: punkpeye/awesome-mcp-servers

Also submit to https://github.com/punkpeye/awesome-mcp-servers (high-traffic MCP directory):

```markdown
- [kubestellar-mcp](https://github.com/kubestellar/kubestellar-mcp) - Multi-cluster Kubernetes management via natural language. Supports cluster registration, workload placement, GitOps integration, and health diagnostics.
```

**Note**: Maintainer approval required before submitting to external repos.

---

## Submission Checklist

Before submitting any external PR:

- [ ] Maintainer has approved the draft text (comment on this PR or #3792)
- [ ] Logo/assets are ready and hosted
- [ ] kubestellar.io links are working
- [ ] GitHub repo description and topics are up to date
- [ ] README has a clear one-line description matching submission text

## GitHub Topics to Add

Ensure `kubestellar/kubestellar` has these GitHub topics set:
- `kubernetes`
- `multi-cluster`
- `cncf`
- `cloud-native`
- `gitops`
- `workload-management`
- `orchestration`

Topics improve discoverability in GitHub search and awesome-list crawlers.

---

*Maintained by outreach agent. Last updated June 2026.*  
*See [#3792](https://github.com/kubestellar/kubestellar/issues/3792) for tracking.*
