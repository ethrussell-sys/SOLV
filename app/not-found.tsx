import Link from 'next/link'
import { tokens } from '@/lib/tokens'

// Site-wide 404, styled like the homepage hero.
export default function NotFound() {
  return (
    <main style={{
      backgroundColor: tokens.color.bg,
      color: tokens.color.ink,
      minHeight: '100vh',
      padding: '40px 48px 96px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Link href="/" aria-label="Go to homepage" style={{ alignSelf: 'flex-start' }}>
        <img
          src="/solv-wordmark_2.png"
          alt="solv"
          style={{ height: '28px', width: 'auto', display: 'block' }}
        />
      </Link>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: '48px' }}>
        <p style={{
          color: tokens.color.muted2,
          fontSize: '11px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          margin: '0 0 16px',
        }}>
          404
        </p>

        <h1 style={{
          fontFamily: tokens.font.display,
          fontSize: 'clamp(3rem, 11vw, 6.5rem)',
          fontWeight: 400,
          lineHeight: 0.95,
          textTransform: 'uppercase',
          letterSpacing: '-0.5px',
          margin: '0 0 24px',
        }}>
          Nothing<br />here.
        </h1>

        <p style={{
          color: tokens.color.muted2,
          fontSize: '15px',
          lineHeight: 1.6,
          margin: '0 0 32px',
        }}>
          This link may be incorrect, or the film is no longer available.
        </p>

        <Link href="/" className="explore-link">
          Explore films &rarr;
        </Link>
      </div>
    </main>
  )
}
