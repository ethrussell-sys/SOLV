import Link from 'next/link'
import { tokens } from '@/lib/tokens'

export default function SubmitSuccessPage() {
  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: tokens.color.bg,
      color: tokens.color.ink,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', maxWidth: '400px' }}>

        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: tokens.color.white,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 style={{
          fontFamily: tokens.font.display,
          fontSize: 'clamp(2.8rem, 10vw, 4rem)',
          lineHeight: 1,
          textTransform: 'uppercase',
          letterSpacing: '-0.5px',
          margin: 0,
        }}>
          Your film has been submitted.
        </h1>

        <p style={{
          color: tokens.color.muted2,
          fontSize: '15px',
          lineHeight: 1.6,
          margin: 0,
        }}>
          We&apos;ll be in touch within a few days.<br />Check your email for a confirmation.
        </p>

        <Link href="/" style={{
          color: tokens.color.muted2,
          fontSize: '11px',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          textDecoration: 'none',
          marginTop: '16px',
        }}>
          Back to films
        </Link>

      </div>
    </main>
  )
}
