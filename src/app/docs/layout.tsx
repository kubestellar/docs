import type { Metadata } from 'next'
import { DocsNavbar, DocsFooter, DocsBanner } from '@/components/docs/index'
import { DocsProvider } from '@/components/docs/DocsProvider'
import { MobileOverlay } from '@/components/docs/MobileOverlay'
import { Inter, JetBrains_Mono } from "next/font/google"
import { Suspense } from 'react'
import { ThemeProvider } from "next-themes"
import "../globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
})

const SITE_URL = 'https://kubestellar.io'
const SITE_TITLE = 'KubeStellar Docs - Multi-Cluster Kubernetes Orchestration'
const SITE_DESCRIPTION =
  'Official documentation for KubeStellar. Learn how to orchestrate workloads across multiple Kubernetes clusters with intelligent distribution, unified management, and seamless multi-cluster operations.'

export const metadata: Metadata = {
  title: {
    default: SITE_TITLE,
    template: '%s | KubeStellar Docs',
  },
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/docs',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: `${SITE_URL}/docs`,
    siteName: 'KubeStellar',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/KubeStellar-with-Logo.png',
        width: 1200,
        height: 630,
        alt: 'KubeStellar - Multi-Cluster Kubernetes Orchestration',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/KubeStellar-with-Logo.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

type Props = {
  children: React.ReactNode
}

export default async function DocsLayout({ children }: Props) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <DocsProvider>
            <div className="flex flex-col min-h-screen">
              <DocsBanner />
              <Suspense fallback={<div className="h-16" />}>
                <DocsNavbar />
              </Suspense>
              <div className="flex flex-1 relative">
                <MobileOverlay />
                {children}
              </div>
              <DocsFooter />
            </div>
          </DocsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
