import Link from 'next/link'
import { tokens } from '@/lib/tokens'

const link: React.CSSProperties = {
  color: tokens.color.muted2,
  fontSize: '11px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  textDecoration: 'none',
}

// Rendered once from the root layout so every page links to Terms and
// Privacy. Pages with a fixed bottom buy bar mark it with
// data-fixed-buybar; globals.css pads this footer clear of that bar.
export function SiteFooter() {
  return (
    <footer
      className="site-footer"
      style={{
        backgroundColor: tokens.color.bg,
        padding: '24px 24px calc(32px + env(safe-area-inset-bottom))',
        display: 'flex',
        justifyContent: 'center',
        gap: '24px',
      }}
    >
      <Link href="/submit" style={link}>Submit a film</Link>
      <Link href="/terms" style={link}>Terms</Link>
      <Link href="/privacy" style={link}>Privacy</Link>
    </footer>
  )
}
