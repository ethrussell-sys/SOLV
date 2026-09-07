import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { Bebas_Neue } from 'next/font/google'
import AddToHomeScreen from '@/components/AddToHomeScreen'
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
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
  title: 'Sølv',
  description: 'Own it forever. One tap, $1.99.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Sølv',
  },
  openGraph: {
    title: 'Sølv',
    description: 'Own the films that matter. One tap. $1.99. Yours forever.',
    siteName: 'Sølv',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sølv',
    description: 'Own the films that matter. One tap. $1.99. Yours forever.',
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
        {children}
        <AddToHomeScreen />
      </body>
    </html>
  )
}
