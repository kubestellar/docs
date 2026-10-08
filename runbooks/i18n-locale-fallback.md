# Runbook: Docs i18n Locale Fallback

## Scope

Applies to the `DocsI18nLocaleFallbackSustained` alert in
`cluster-objects/alerts.yaml`, over the `docs_i18n_locale_fallback_total`
counter (`src/lib/metrics.ts`, incremented from `src/i18n/request.ts`).

This counter records one event every time a requested locale's
`messages/<locale>.json` bundle fails to load and the app falls back to
serving the default locale's messages instead for that request. The
`locale` label is restricted to the fixed 10-value `Locale` union in
`src/i18n/settings.ts` — never request-controlled input — so this alert
cannot be triggered by crafted query/path values, only by an actual
bundle-load failure for one of this app's own supported locales.

- **`DocsI18nLocaleFallbackSustained`** — fires when a given locale has a
  non-zero rate of fallback events, sustained for 15 minutes. Under normal
  operation this rate is 0 for every locale; any sustained non-zero value
  means that locale's message bundle is persistently broken, not a
  one-off blip.

This alert only fires if a Prometheus Operator is already scraping this
namespace via `cluster-objects/servicemonitor.yaml` — it does not assume
any specific monitoring backend is provisioned. See
`cluster-objects/dashboard.json`'s "Locale message-bundle fallbacks by
locale" panel for a visual breakdown by locale.

## Detecting and diagnosing

1. Identify the affected locale(s) from the alert's `{{ $labels.locale }}`
   annotation, or from the dashboard panel above.
2. `src/i18n/request.ts` logs a structured `error` entry via
   `src/lib/logger.ts` on every fallback (added alongside the counter in
   [#7262](https://github.com/kubestellar/docs/issues/7262)) — check
   application logs for that entry to see the underlying import error for
   the affected locale's bundle.
3. Confirm the affected locale's bundle file exists and is valid JSON:
   `messages/<locale>.json` at the repo root. A missing file, an
   accidental delete, or a build artifact that didn't ship that file are
   the most common causes.
4. If the file exists and parses locally but still fails in the running
   deployment, suspect a partial/incomplete deploy (same class of issue
   covered by `runbooks/deploy-rollback.md` for the docs content tree) —
   compare the deployed image/build against the current `main` branch's
   `messages/` directory.
5. This alert firing does not affect the default locale or any other
   locale — only visitors requesting the affected locale(s) see
   default-locale strings. Traffic keeps serving (no 5xx, no outage); this
   is a content-correctness regression, not an availability one.

## Recovery

- If the bundle file is missing or corrupt in the repo, restore/fix it
  and redeploy.
- If the repo's copy is fine but the running deployment lacks it, follow
  `runbooks/deploy-rollback.md` to roll back to (or redeploy) a build that
  includes the correct `messages/` tree.
- The alert clears automatically once the fallback rate for that locale
  returns to 0 for a subsequent 15-minute evaluation window — no manual
  alert-clearing step is required.
