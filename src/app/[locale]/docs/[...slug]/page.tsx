// Wrapper for localized docs routes
// Re-uses the existing docs page logic but handles the locale parameter

import DocsPage, { generateStaticParams as baseGenerateStaticParams } from '../../../docs/[...slug]/page'
import { locales } from '@/i18n/settings'

// Static generation config (must be defined, not re-exported)
export const dynamic = 'force-static'
export const revalidate = false

type LocalePageProps = Readonly<{
  params: Promise<{ locale: string; slug?: string[] }>
}>

// Wrapper component that extracts slug and passes to original page
export default async function LocaleDocsPage(props: LocalePageProps) {
  const params = await props.params
  // Pass only the slug to the original page (locale is handled by layout)
  return DocsPage({ params: Promise.resolve({ slug: params.slug }) })
}

// Generate static params for all locales
export async function generateStaticParams() {
  const baseParams = await baseGenerateStaticParams()

  // Generate for each locale
  const allParams: { locale: string; slug: string[] }[] = []
  for (const locale of locales) {
    for (const param of baseParams) {
      allParams.push({ locale, slug: param.slug })
    }
  }

  return allParams
}
