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

export const metadata = {
  title: 'KubeStellar - Multi-Cluster Kubernetes Orchestration',
  description: 'Official documentation for KubeStellar - Multi-cluster orchestration platform',
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
