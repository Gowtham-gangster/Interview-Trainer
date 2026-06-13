import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { Providers } from '@/components/providers/providers'
import { PwaBootstrapScript } from '@/components/pwa/pwa-bootstrap-script'
import { ThemedToaster } from '@/components/theme/themed-toaster'
import { ThemeScript } from '@/components/theme/theme-script'
import { cn } from '@/lib/utils'
import './globals.css'

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover' as const,
}

export const metadata: Metadata = {
  title: {
    default: 'AI Interview Trainer',
    template: '%s | AI Interview Trainer',
  },
  description: 'Master your interview skills with AI-powered practice sessions',
  keywords: ['interview', 'AI', 'practice', 'training', 'job', 'career'],
  authors: [{ name: 'AI Interview Trainer Team' }],
  creator: 'AI Interview Trainer',
  metadataBase: new URL(appUrl),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: appUrl,
    title: 'AI Interview Trainer',
    description: 'Master your interview skills with AI-powered practice sessions',
    siteName: 'AI Interview Trainer',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AI Interview Trainer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Interview Trainer',
    description: 'Master your interview skills with AI-powered practice sessions',
    images: ['/og-image.png'],
    creator: '@aiinterviewtrainer',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
  appleWebApp: {
    capable: true,
    title: 'Interview Trainer',
    statusBarStyle: 'default',
  },
  applicationName: 'AI Interview Trainer',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
  formatDetection: {
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <PwaBootstrapScript />
        <ThemeScript />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          inter.className,
        )}
      >
        <Providers>
          <div className="relative flex min-h-screen flex-col">{children}</div>
          <ThemedToaster />
        </Providers>
      </body>
    </html>
  )
}