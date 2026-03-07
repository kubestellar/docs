# Community-Contributed Monitoring Cards Are Here

*March 2026*

KubeStellar Console now has a **marketplace** — an open repository of community-contributed monitoring cards, dashboard presets, and themes that anyone can install with one click.

---

## What's in the Marketplace?

The [console-marketplace](https://github.com/kubestellar/console-marketplace) repo is where the community shares monitoring cards for tools and platforms that matter to them. Recent additions include:

- **wasmCloud** — monitor your WebAssembly workloads
- **Metal3** — bare-metal provisioning status and inventory
- **Buildpacks** — build status monitoring
- **Flatcar Container Linux** — node OS monitoring
- **CoreDNS** — DNS query rates, cache hits, and error tracking
- **Lima** — lightweight VM monitoring for macOS development

Each card comes with demo data so you can preview it before connecting to a real cluster.

---

## How to Contribute a Card

The marketplace is designed for contributions. If you use a CNCF project or Kubernetes tool that doesn't have a monitoring card yet, you can create one:

1. Fork [console-marketplace](https://github.com/kubestellar/console-marketplace)
2. Add a card preset JSON file with your card's configuration
3. Include demo data so others can preview it
4. Open a PR — automated quality checks validate your submission

No Go or React code required. Card presets are declarative JSON that define what data to fetch and how to display it.

---

## Quality Gates

Every marketplace submission goes through automated checks:

- **Schema validation** — ensures your card preset is well-formed
- **Registry integrity** — verifies IDs and naming conventions
- **Nightly auto-QA** — scans for regressions across all cards

This keeps the marketplace reliable as it grows.

---

## Installing Cards

From the console:

1. Open the card catalog (click **+** on any dashboard)
2. Browse the **Marketplace** tab
3. Click **Install** on any card
4. It appears on your dashboard immediately

---

## Links

- **Marketplace repo:** [github.com/kubestellar/console-marketplace](https://github.com/kubestellar/console-marketplace)
- **Console:** [console.kubestellar.io](https://console.kubestellar.io)
- **Contributing guide:** [github.com/kubestellar/console/blob/main/CONTRIBUTING.md](https://github.com/kubestellar/console/blob/main/CONTRIBUTING.md)
