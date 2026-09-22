// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup, screen } from '@testing-library/react'
import React from 'react'

/**
 * Coverage for
 * src/app/[locale]/marketplace/[slug]/components/PluginPaymentModal.tsx
 * (baseline 0%).
 *
 * Exercises:
 *   - the payment form renders plugin name, license type and total amount
 *   - the "Pay" and "Cancel" buttons are disabled while isProcessing=true
 *   - clicking "Pay" fires onPayment exactly once per click
 *   - clicking "Cancel" fires onClose exactly once per click
 *   - the paymentSuccess=true branch renders the success copy instead of the form
 */

import { PluginPaymentModal } from '@/app/[locale]/marketplace/[slug]/components/PluginPaymentModal'
import type { Plugin } from '@/app/[locale]/marketplace/plugins'

const t = ((key: string, values?: Record<string, unknown>) => {
  if (values) return `${key}:${JSON.stringify(values)}`
  return key
}) as unknown as ReturnType<typeof import('next-intl').useTranslations>

const plugin: Plugin = {
  id: 'cost-analyzer-premium',
  name: 'Cost Analyzer Premium',
  slug: 'cost-analyzer-premium',
  tagline: 'Track spend',
  description: 'desc',
  longDescription: 'long desc',
  icon: '💰',
  category: 'finops',
  pricing: { type: 'monthly', amount: 19 },
  author: 'KubeStellar',
  downloads: 50,
  rating: 4.5,
  version: '2.1.0',
  features: [],
  requirements: [],
  compatibility: [],
  screenshots: [],
  documentation: 'https://example.com/docs',
  tags: ['finops'],
}

afterEach(() => cleanup())

describe('PluginPaymentModal', () => {
  it('renders plugin name, license type and total amount in the payment form', () => {
    render(
      <PluginPaymentModal
        plugin={plugin}
        paymentSuccess={false}
        isProcessing={false}
        onClose={() => {}}
        onPayment={() => {}}
        t={t}
      />,
    )

    expect(screen.getByText('Cost Analyzer Premium')).toBeTruthy()
    expect(screen.getByText('monthly')).toBeTruthy()
    expect(screen.getByText('$19')).toBeTruthy()
  })

  it('calls onPayment exactly once per click on "payment.form.payNow"', () => {
    const onPayment = vi.fn()
    render(
      <PluginPaymentModal
        plugin={plugin}
        paymentSuccess={false}
        isProcessing={false}
        onClose={() => {}}
        onPayment={onPayment}
        t={t}
      />,
    )

    const payButton = screen.getByRole('button', { name: /payment\.form\.payNow/ })
    fireEvent.click(payButton)
    fireEvent.click(payButton)

    expect(onPayment).toHaveBeenCalledTimes(2)
  })

  it('calls onClose exactly once per click on "payment.form.cancel"', () => {
    const onClose = vi.fn()
    render(
      <PluginPaymentModal
        plugin={plugin}
        paymentSuccess={false}
        isProcessing={false}
        onClose={onClose}
        onPayment={() => {}}
        t={t}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'payment.form.cancel' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('disables the pay and cancel buttons while isProcessing is true', () => {
    render(
      <PluginPaymentModal
        plugin={plugin}
        paymentSuccess={false}
        isProcessing={true}
        onClose={() => {}}
        onPayment={() => {}}
        t={t}
      />,
    )

    const cancelButton = screen.getByRole('button', { name: 'payment.form.cancel' })
    const payButton = screen.getByRole('button', { name: /payment\.form\.processing/ })

    expect(cancelButton.hasAttribute('disabled')).toBe(true)
    expect(payButton.hasAttribute('disabled')).toBe(true)
  })

  it('renders the success copy instead of the form when paymentSuccess is true', () => {
    render(
      <PluginPaymentModal
        plugin={plugin}
        paymentSuccess={true}
        isProcessing={false}
        onClose={() => {}}
        onPayment={() => {}}
        t={t}
      />,
    )

    expect(screen.getByText('payment.success.title')).toBeTruthy()
    expect(screen.getByText('payment.success.subtitle')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'payment.form.cancel' })).toBeNull()
  })
})
