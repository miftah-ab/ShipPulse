import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'ShipPulse — Ship it. Explain it. Keep users in the loop.',
    template: '%s | ShipPulse',
  },
  description:
    'AI-powered product communication platform. Turn GitHub activity into clear release notes, host a public changelog, and keep users in the loop automatically.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://shippulse.vercel.app'),
  keywords: [
    'changelog', 'release notes', 'product updates', 'GitHub integration',
    'AI changelog', 'product communication', 'widget', 'subscriber notifications',
  ],
  authors: [{ name: 'ShipPulse' }],
  creator: 'ShipPulse',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://shippulse.vercel.app',
    siteName: 'ShipPulse',
    title: 'ShipPulse — Ship it. Explain it. Keep users in the loop.',
    description:
      'Turn what you shipped into updates people actually understand. GitHub → AI release notes → public changelog → embeddable widget.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ShipPulse',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShipPulse — Ship it. Explain it. Keep users in the loop.',
    description:
      'Turn what you shipped into updates people actually understand.',
    images: ['/og-image.png'],
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
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
