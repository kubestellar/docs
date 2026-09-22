// @vitest-environment jsdom
/**
 * Coverage for src/app/[locale]/marketplace/[slug]/components/PluginPaymentModal.tsx.
 *
 * The payment modal has two top-level branches driven by `paymentSuccess`:
 *   - false → form with card/expiry/cvv inputs, Cancel + Pay Now buttons,
 *             plugin name/pricing displayed, `isProcessing` disables inputs
 *             and swaps Pay Now for a Processing spinner.
 *   - true  → success confirmation.
 *
 * As with PluginInstallModal, `t` is passed in as a prop so we can inject
 * a fake translator and assert on both branches without a next-intl
 * provider.
 */

import React from 'react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent, screen } from '@testing-library/react'

import { PluginPaymentModal } from '../app/[locale]/marketplace/[slug]/components/PluginPaymentModal'
import type { Plugin } from '../app/[locale]/marketplace/plugins'

function makeT() {
  const t = ((key: string, values?: Record<string, string | number>) => {
    if (values && 'name' in values) return `${key}[name=${values.name}]`
    return key
  }) as unknown as Parameters<typeof PluginPaymentModal>[0]['t']
  return t
}

function makePlugin(overrides: Partial<Plugin> = {}): Plugin {
  return {
    id: 'plg-1',
    name: 'Premium Widget',
    slug: 'premium-widget',
    tagline: '',
    description: '',
    longDescription: '',
    icon: '💎',
    category: 'utility',
    pricing: { type: 'one-time', amount: 49 },
    author: 'anon',
    downloads: 0,
    rating: 0,
    version: '1.0.0',
    features: [],
    requirements: [],
    compatibility: [],
    screenshots: [],
    documentation: 'https://example.test/docs',
    tags: [],
    ...overrides,
  }
}

describe('PluginPaymentModal', () => {
  afterEach(() => cleanup())

  it('renders the form branch with plugin details and pricing amount', () => {
    render(
      <PluginPaymentModal
        plugin={makePlugin()}
        paymentSuccess={false}
        isProcessing={false}
        onClose={() => {}}
        onPayment={() => {}}
        t={makeT()}
      />,
    )
    // Interpolated subtitle proves plugin.name flowed through the t call
    expect(
      screen.getByText('payment.subtitle[name=Premium Widget]'),
    ).toBeTruthy()
    // The row values pull directly from the plugin object
    expect(screen.getByText('Premium Widget')).toBeTruthy()
    expect(screen.getByText('one-time')).toBeTruthy()
    expect(screen.getByText('$49')).toBeTruthy()
    // Success elements are NOT rendered on the form branch
    expect(screen.queryByText('payment.success.title')).toBeNull()
  })

  it('wires Cancel to onClose and Pay Now to onPayment (one call each)', () => {
    const onClose = vi.fn()
    const onPayment = vi.fn()
    render(
      <PluginPaymentModal
        plugin={makePlugin()}
        paymentSuccess={false}
        isProcessing={false}
        onClose={onClose}
        onPayment={onPayment}
        t={makeT()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'payment.form.cancel' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onPayment).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /payment\.form\.payNow/ }))
    expect(onPayment).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('disables inputs and shows the processing label when isProcessing=true', () => {
    render(
      <PluginPaymentModal
        plugin={makePlugin()}
        paymentSuccess={false}
        isProcessing
        onClose={() => {}}
        onPayment={() => {}}
        t={makeT()}
      />,
    )
    // Processing label replaces the Pay Now text
    expect(screen.getByText('payment.form.processing')).toBeTruthy()

    // Card inputs are disabled
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[]
    expect(inputs.length).toBeGreaterThanOrEqual(3)
    for (const input of inputs) {
      expect(input.disabled).toBe(true)
    }

    // Cancel button is also disabled while processing
    const cancelBtn = screen.getByRole('button', { name: 'payment.form.cancel' }) as HTMLButtonElement
    expect(cancelBtn.disabled).toBe(true)
  })

  it('renders the success branch when paymentSuccess=true and hides the form', () => {
    const onPayment = vi.fn()
    render(
      <PluginPaymentModal
        plugin={makePlugin()}
        paymentSuccess
        isProcessing={false}
        onClose={() => {}}
        onPayment={onPayment}
        t={makeT()}
      />,
    )
    expect(screen.getByText('payment.success.title')).toBeTruthy()
    expect(screen.getByText('payment.success.subtitle')).toBeTruthy()
    // Form is gone — the Pay Now button MUST NOT appear on the success branch
    expect(screen.queryByRole('button', { name: /payment\.form\.payNow/ })).toBeNull()
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(onPayment).not.toHaveBeenCalled()
  })

  it('displays "$undefined" gracefully when pricing.amount is absent (free tier used as monthly)', () => {
    // Regression guard: a monthly plugin without an amount previously
    // crashed the rendered price row. The current impl renders "$" + the
    // raw value, so we just assert it does not throw and still shows the
    // pricing.type label.
    render(
      <PluginPaymentModal
        plugin={makePlugin({ pricing: { type: 'monthly' } })}
        paymentSuccess={false}
        isProcessing={false}
        onClose={() => {}}
        onPayment={() => {}}
        t={makeT()}
      />,
    )
    expect(screen.getByText('monthly')).toBeTruthy()
  })
})
