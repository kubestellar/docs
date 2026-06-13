---
title: Contributor Communication Guide
description: How to engage with contributors — response templates for maintainers
---

# Contributor Communication Guide

This guide helps maintainers respond promptly and consistently to contributor PRs, especially those that have been waiting a long time for review. Contributor retention is a direct function of response speed and quality.

> **Why this matters**: KubeStellar has 288 forks and 683 stars but only 1 documented adopter. Many forks represent active contributors or evaluators. A poor first-contribution experience costs real community members permanently.

---

## Response SLAs

| PR age | Target action |
|--------|---------------|
| 0–7 days | First review comment or acknowledgment |
| 7–30 days | Full review or clear status update |
| 30+ days | Explicit status: blocked / in-progress / needs-rebase / accepted |
| 90+ days | Escalation to maintainer meeting agenda |

---

## Response Templates

### New PR — Acknowledgment (within 48h)

```text
Thanks for this contribution! We appreciate you taking the time to work on this.

I've added it to our review queue. You should hear back with a full review within the week. In the meantime, please make sure:
- [ ] CI checks pass
- [ ] DCO sign-off is present (`git commit -s`)
- [ ] There are no merge conflicts with `main`

We'll ping you here as soon as we have feedback.
```

### PR Waiting on Author (needs-rebase / failing CI)

```text
Thanks for your patience while we've been heads-down on other priorities!

Before we can move forward, this PR needs a few updates:

- [ ] Rebase on latest `main` to resolve merge conflicts
- [ ] [specific CI failure] — see the failing check above

Once those are addressed, we'll prioritize the review. Let us know if you have any questions or need help getting unblocked.
```

### Long-Stale PR — Status Check (30+ days)

```text
Thanks for your patience — this PR has been in our queue for a while and we want to make sure it doesn't fall through the cracks.

Quick status check:
- Are you still interested in landing this change?
- Is there anything blocking you that we can help with?
- Do you need a review pair or any architectural guidance?

If we don't hear back in 2 weeks, we'll assume life got busy and close this PR — but you're always welcome to reopen or create a new PR from this work. Your contribution is valued and this code is saved in your fork.
```

### PR Declined — With Explanation

```text
Thank you for this contribution — we've reviewed it carefully.

After discussion, we've decided not to merge this PR because:
[specific reason — architecture mismatch / out of scope / alternative approach preferred]

This doesn't reflect on the quality of your work. We'd love to have you contribute in a direction that fits our current roadmap:
- [link to good first issues]
- [link to help wanted issues]

Feel free to ask in CNCF Slack #kubestellar if you'd like guidance on where to start next.
```

### PR Merged — Celebration

```text
🎉 Merged! Thank you for this contribution — it's now part of KubeStellar.

Here's how to stay involved:
- **Star** the repo if you haven't already ⭐
- **Join CNCF Slack** [#kubestellar](https://cloud-native.slack.com/archives/C058SUSL5AA) for community discussions
- **Check [good first issues](https://github.com/kubestellar/kubestellar/labels/good%20first%20issue)** for your next contribution
- **Add your org to [ADOPTERS.md](https://github.com/kubestellar/kubestellar/blob/main/ADOPTERS.md)** if you're using KubeStellar

Your commit will appear in the next release. We'll mention your contribution in the release notes. Welcome to the KubeStellar contributor community!
```

---

## Stale PR Triage Process

For any PR older than 30 days without recent activity:

1. **Check if it still applies** — has the underlying issue been fixed another way?
2. **Check CI status** — if CI is red, that's usually the blocker
3. **Comment** using the "Long-Stale PR — Status Check" template above
4. **Label it** with `needs-rebase` or `waiting-for-author` as appropriate
5. **Assign it** to a maintainer who will own the review
6. **Set a 2-week deadline** in the comment

### Priority triage list (as of June 2026)

The following PRs are oldest and should be triaged first:

| PR | Author | Age | Topic |
|----|--------|-----|-------|
| #2682 | clubanderson | 541d | Lima demo environment support |
| #3119 | PranjaliBhardwaj | 319d | Duplicate object identifier detection |
| #3167 | krrish-sehgal | 310d | Additional metrics from generic sources |
| #3170 | AritraDey-Dev | 310d | Wait for cleanup in demo env |
| #3171 | krrish-sehgal | 309d | Status updates fix |
| #3287 | antedotee | 280d | Remove arbitrary sleep, add state validation |
| #3297 | rishi-jat | 275d | Singleton status report |
| #3324 | greninja517 | 263d | ArgoCD and kubectl research |
| #3326 | antedotee | 263d | Automation to unassign stale issues |
| #3379 | antedotee | 244d | OSPS-QA security check content |

> See [#3814](https://github.com/kubestellar/kubestellar/issues/3814) for the full retention risk analysis.

---

## GitHub Discussions for Community Engagement

GitHub Discussions is enabled on kubestellar/kubestellar but has been dormant since 2023. Reactivating it with intentional posts creates a community hub that converts GitHub visitors into engaged members.

### Recommended starter threads

1. **Welcome thread**: "Welcome to KubeStellar — who are you and what are you building?"
2. **Adopters thread**: "Using KubeStellar in production or evaluation? Tell us about it"
3. **CFP thread**: "KubeCon NA 2026 CFP is open — looking for co-presenters and lightning talk volunteers"
4. **Ideas thread**: "What features would make KubeStellar better for your use case?"

### How to post

Any GitHub user with repo access can post a Discussion. Go to
https://github.com/kubestellar/kubestellar/discussions/new and select the appropriate category.

---

## Related Issues

- [#3814](https://github.com/kubestellar/kubestellar/issues/3814) — contributor retention P0
- [#3823](https://github.com/kubestellar/kubestellar/issues/3823) — GitHub Discussions reactivation
- [#3799](https://github.com/kubestellar/kubestellar/issues/3799) — AI-contribution onboarding gap
- [#3793](https://github.com/kubestellar/kubestellar/pull/3793) — ADOPTERS.md self-service PR

---

*Maintained by the KubeStellar outreach team. Last updated June 2026.*
