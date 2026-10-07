'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Wordmark } from '@/components/Wordmark'

// Rendered once from the root layout so every public page shares the same
// top nav: wordmark home on the left, FILMMAKERS on the right. Admin pages
// keep their own chrome.
export function SiteHeader() {
  const pathname = usePathname()
  if (pathname.startsWith('/admin')) return null

  const onSubmit = pathname === '/submit' || pathname.startsWith('/submit/')

  return (
    <header className="site-header">
      <Link href="/" aria-label="Sølv home" className="site-header-home">
        <Wordmark height={28} />
      </Link>
      <Link
        href="/submit"
        className={`site-header-link${onSubmit ? ' is-current' : ''}`}
        aria-current={onSubmit ? 'page' : undefined}
      >
        Filmmakers
      </Link>
    </header>
  )
}
