import { DocsNavbar, DocsFooter, DocsBanner } from '@/components/docs/index'
import { DocsProvider } from '@/components/docs/DocsProvider'
import { SidebarContainer } from '@/components/docs/SidebarContainer'
import { MobileOverlay } from '@/components/docs/MobileOverlay'
import { Inter, JetBrains_Mono } from "next/font/google"
import { Suspense } from 'react'
import { ThemeProvider } from "next-themes"
import "../globals.css"
import { buildPageMap } from './page-map'
import type { ProjectId } from '@/config/versions'

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
  title: 'KubeStellar - Multi-Cluster Kubernetes Orchestration',
  description: 'Official documentation for KubeStellar - Multi-cluster orchestration platform',
}

type Props = {
  children: React.ReactNode
}

const ALL_PROJECT_IDS: ProjectId[] = ['kubestellar', 'a2a', 'kubeflex', 'multi-plugin', 'kubestellar-mcp', 'console']

export default async function DocsLayout({ children }: Props) {
  // Build page maps for all projects so the sidebar can switch without remounting
  const allPageMaps = Object.fromEntries(
    ALL_PROJECT_IDS.map(id => [id, buildPageMap(id).pageMap])
  ) as Record<ProjectId, ReturnType<typeof buildPageMap>['pageMap']>

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
                <SidebarContainer allPageMaps={allPageMaps} />
                <MobileOverlay />
                <div className="flex-1 min-w-0">
                  {children}
                </div>
              </div>
              <DocsFooter />
            </div>
          </DocsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
