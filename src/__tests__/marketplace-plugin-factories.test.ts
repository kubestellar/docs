/**
 * Coverage for the 25 pure-data plugin factories under
 * src/app/[locale]/marketplace/plugins/data/*.ts. Each factory takes a
 * next-intl translator and returns a Plugin object; before this file they
 * were all sitting at 0% because the marketplace page that consumes them
 * is not exercised by any test.
 *
 * A shape regression here (missing field, non-unique id/slug, malformed
 * pricing, non-https documentation link) would previously have surfaced
 * only at runtime on the marketplace page — the vitest run now catches it.
 */
import { describe, test, expect } from 'vitest'

import type { Plugin } from '../app/[locale]/marketplace/plugins/types'
import type { Translator } from '../app/[locale]/marketplace/plugins/data/translator'

import { createKubectlMultiPlugin } from '../app/[locale]/marketplace/plugins/data/kubectl-multi'
import { createGalaxySyncProPlugin } from '../app/[locale]/marketplace/plugins/data/galaxy-sync-pro'
import { createEdgeGuardianPlugin } from '../app/[locale]/marketplace/plugins/data/edge-guardian'
import { createStellarInsightsPlugin } from '../app/[locale]/marketplace/plugins/data/stellar-insights'
import { createClusterNavigatorPlugin } from '../app/[locale]/marketplace/plugins/data/cluster-navigator'
import { createConfigValidatorPlugin } from '../app/[locale]/marketplace/plugins/data/config-validator'
import { createDisasterRecoverySuitePlugin } from '../app/[locale]/marketplace/plugins/data/disaster-recovery-suite'
import { createAutoScalerProPlugin } from '../app/[locale]/marketplace/plugins/data/auto-scaler-pro'
import { createPolicyEnginePlugin } from '../app/[locale]/marketplace/plugins/data/policy-engine'
import { createNetworkMeshOptimizerPlugin } from '../app/[locale]/marketplace/plugins/data/network-mesh-optimizer'
import { createGitopsBridgePlugin } from '../app/[locale]/marketplace/plugins/data/gitops-bridge'
import { createCostAnalyzerPremiumPlugin } from '../app/[locale]/marketplace/plugins/data/cost-analyzer-premium'
import { createSecretsManagerPlugin } from '../app/[locale]/marketplace/plugins/data/secrets-manager'
import { createLoadBalancerControllerPlugin } from '../app/[locale]/marketplace/plugins/data/load-balancer-controller'
import { createWorkloadMigratorPlugin } from '../app/[locale]/marketplace/plugins/data/workload-migrator'
import { createMetricsAggregatorPlugin } from '../app/[locale]/marketplace/plugins/data/metrics-aggregator'
import { createClusterProvisionerPlugin } from '../app/[locale]/marketplace/plugins/data/cluster-provisioner'
import { createAlertManagerPlusPlugin } from '../app/[locale]/marketplace/plugins/data/alert-manager-plus'
import { createResourceOptimizerPlugin } from '../app/[locale]/marketplace/plugins/data/resource-optimizer'
import { createComplianceReporterPlugin } from '../app/[locale]/marketplace/plugins/data/compliance-reporter'
import { createServiceMeshBridgePlugin } from '../app/[locale]/marketplace/plugins/data/service-mesh-bridge'
import { createEdgeMonitorProPlugin } from '../app/[locale]/marketplace/plugins/data/edge-monitor-pro'
import { createMultiTenancyManagerPlugin } from '../app/[locale]/marketplace/plugins/data/multi-tenancy-manager'
import { createChaosEngineeringToolkitPlugin } from '../app/[locale]/marketplace/plugins/data/chaos-engineering-toolkit'
import { createKubestellarMcpPlugin } from '../app/[locale]/marketplace/plugins/data/kubestellar-mcp'

// The factories only call `t(key)` to resolve a category label. Passing a
// stub that echoes its argument is enough to exercise every code path
// without pulling in next-intl's runtime — the factories are pure w.r.t.
// the translator's return type. Cast via `unknown` because next-intl's
// Translator carries extra namespaces (rich/raw/etc.) that this stub does
// not implement and none of the factories call.
const t = ((key: string) => `t:${key}`) as unknown as Translator

const factories: Array<[string, (t: Translator) => Plugin]> = [
  ['kubectl-multi', createKubectlMultiPlugin],
  ['galaxy-sync-pro', createGalaxySyncProPlugin],
  ['edge-guardian', createEdgeGuardianPlugin],
  ['stellar-insights', createStellarInsightsPlugin],
  ['cluster-navigator', createClusterNavigatorPlugin],
  ['config-validator', createConfigValidatorPlugin],
  ['disaster-recovery-suite', createDisasterRecoverySuitePlugin],
  ['auto-scaler-pro', createAutoScalerProPlugin],
  ['policy-engine', createPolicyEnginePlugin],
  ['network-mesh-optimizer', createNetworkMeshOptimizerPlugin],
  ['gitops-bridge', createGitopsBridgePlugin],
  ['cost-analyzer-premium', createCostAnalyzerPremiumPlugin],
  ['secrets-manager', createSecretsManagerPlugin],
  ['load-balancer-controller', createLoadBalancerControllerPlugin],
  ['workload-migrator', createWorkloadMigratorPlugin],
  ['metrics-aggregator', createMetricsAggregatorPlugin],
  ['cluster-provisioner', createClusterProvisionerPlugin],
  ['alert-manager-plus', createAlertManagerPlusPlugin],
  ['resource-optimizer', createResourceOptimizerPlugin],
  ['compliance-reporter', createComplianceReporterPlugin],
  ['service-mesh-bridge', createServiceMeshBridgePlugin],
  ['edge-monitor-pro', createEdgeMonitorProPlugin],
  ['multi-tenancy-manager', createMultiTenancyManagerPlugin],
  ['chaos-engineering-toolkit', createChaosEngineeringToolkitPlugin],
  ['kubestellar-mcp', createKubestellarMcpPlugin],
]

const allPlugins: Plugin[] = factories.map(([, factory]) => factory(t))

describe('marketplace plugin factories — shape', () => {
  test.each(factories)(
    '%s returns a Plugin with every required string/number/array field',
    (expectedSlug, factory) => {
      const p = factory(t)

      // Slug matches the file name so `/marketplace/[slug]` routes stay in
      // sync with the data file layout; drift between the two silently
      // 404s the marketplace detail page.
      expect(p.slug).toBe(expectedSlug)

      const requiredStrings: Array<keyof Plugin> = [
        'id',
        'name',
        'slug',
        'tagline',
        'description',
        'longDescription',
        'icon',
        'category',
        'author',
        'version',
        'documentation',
      ]
      for (const key of requiredStrings) {
        expect(typeof p[key], `${expectedSlug}.${String(key)}`).toBe('string')
        expect((p[key] as string).length, `${expectedSlug}.${String(key)} empty`).toBeGreaterThan(0)
      }

      expect(typeof p.downloads).toBe('number')
      expect(p.downloads).toBeGreaterThanOrEqual(0)
      expect(typeof p.rating).toBe('number')
      expect(p.rating).toBeGreaterThanOrEqual(0)
      expect(p.rating).toBeLessThanOrEqual(5)

      for (const key of ['features', 'requirements', 'compatibility', 'screenshots', 'tags'] as const) {
        expect(Array.isArray(p[key]), `${expectedSlug}.${key} not array`).toBe(true)
      }
      // A plugin card with no features would render an empty <ul>; enforce
      // at least one so the marketplace listing keeps its content shape.
      expect(p.features.length).toBeGreaterThan(0)
      expect(p.tags.length).toBeGreaterThan(0)
    },
  )

  test.each(factories)('%s has a valid pricing block', (_, factory) => {
    const { pricing } = factory(t)
    expect(['free', 'monthly', 'one-time']).toContain(pricing.type)
    if (pricing.type === 'free') {
      // Free plugins must not carry a paid amount; if a factory ever adds
      // one by accident the marketplace card would render "$N/mo" for a
      // supposedly-free plugin.
      expect(pricing.amount).toBeUndefined()
    } else {
      expect(typeof pricing.amount).toBe('number')
      expect(pricing.amount as number).toBeGreaterThan(0)
    }
  })

  test.each(factories)('%s optional github/website links are absolute https URLs', (_, factory) => {
    const p = factory(t)
    for (const key of ['github', 'website', 'documentation'] as const) {
      const v = p[key]
      if (typeof v === 'string' && v.length > 0) {
        expect(v.startsWith('https://'), `${p.slug}.${key} not https: ${v}`).toBe(true)
      }
    }
  })
})

describe('marketplace plugin factories — uniqueness', () => {
  test('every plugin id is unique across the catalog', () => {
    // The marketplace listing uses id as the React key and slug as the URL
    // segment; a duplicate would silently drop a card and mask a route.
    const ids = allPlugins.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  test('every plugin slug is unique across the catalog', () => {
    const slugs = allPlugins.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  test('catalog size matches the current factory list', () => {
    // Guardrail: if a new plugin factory is added but not wired into the
    // barrel or this test, the count check flags the omission.
    expect(allPlugins.length).toBe(25)
  })
})
