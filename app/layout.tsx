import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { Bebas_Neue } from 'next/font/google'
import AddToHomeScreen from '@/components/AddToHomeScreen'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const bebasNeue = Bebas_Neue({
  variable: '--font-bebas',
  subsets: ['latin'],
  weight: '400',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#000000',
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  // Absolute og:image / twitter:image URLs always point at the production
  // domain, whatever host the deployment is served from.
  metadataBase: new URL('https://solvscreen.com'),
  title: 'Sølv',
  description: 'Yours to keep. No expiry. One tap, $1.99.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Sølv',
  },
  openGraph: {
    title: 'Sølv',
    description: 'Own the films that matter. One tap. $1.99. No expiry.',
    siteName: 'Sølv',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sølv',
    description: 'Own the films that matter. One tap. $1.99. No expiry.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${bebasNeue.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        {children}
        <SiteFooter />
        <AddToHomeScreen />
      </body>
    </html>
  )
}
