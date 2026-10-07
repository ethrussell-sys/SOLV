import Link from 'next/link'
import { Wordmark } from '@/components/Wordmark'

// Rendered once from the root layout so every page shares the same footer:
// wordmark and tagline, then Submit a film / Terms / Privacy, all on the
// site's 48px gutter. Pages with a fixed bottom buy bar mark it with
// data-fixed-buybar; globals.css pads this footer clear of that bar.
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <Wordmark height={20} />
        <p className="site-footer-tagline">The films that matter.</p>
        <nav className="site-footer-links">
          <Link href="/submit">Submit a film</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </nav>
      </div>
    </footer>
  )
}
