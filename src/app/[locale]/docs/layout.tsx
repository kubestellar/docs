import { Layout } from 'nextra-theme-docs'
import 'nextra-theme-docs/style.css'
import { DocsNavbar, DocsFooter, DocsBanner } from '@/components/docs/index'
import { Inter, JetBrains_Mono } from "next/font/google"
import { Suspense } from 'react'
import "../../globals.css"
import { buildPageMapForBranch } from '../../docs/page-map'
import { getDefaultVersion, getBranchForVersion } from '@/config/versions'

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
})

export const metadata = {
  title: 'KubeStellar - Documentación de Orquestación Kubernetes Multi-Cluster',
  description: 'Documentación oficial de KubeStellar - Plataforma de orquestación multi-cluster',
}

const banner = <DocsBanner />
const navbar = (
  <Suspense fallback={<div style={{ height: '4rem' }} />}>
    <DocsNavbar />
  </Suspense>
)
const footer = <DocsFooter />

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleDocsLayout({ children, params }: Props) {
  const { locale } = await params
  
  // Always use default version for initial layout
  const defaultVersion = getDefaultVersion()
  const branch = getBranchForVersion(defaultVersion)
  
  // Build page map for the default version
  const { pageMap } = await buildPageMapForBranch(branch)
  
  return (
    <Layout
      banner={banner}
      navbar={navbar}
      pageMap={pageMap}
      docsRepositoryBase="https://github.com/kubestellar/kubestellar/edit/main/docs/content"
      footer={footer}
      darkMode={true}
      sidebar={{
        defaultMenuCollapseLevel: 1,
        toggleButton: true
      }}
      toc={{
        float: true,
        title: locale === 'es' ? "En Esta Página" : "On This Page"
      }}
    >
      {children}
    </Layout>
  )
}
