import Link from 'next/link'
import RedeemForm from './RedeemForm'
import { tokens } from '@/lib/tokens'

export default function DownloadPage() {
  return (
    <main style={{
      backgroundColor: tokens.color.bg,
      color: tokens.color.ink,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '360px',
        display: 'flex',
        flexDirection: 'column',
        gap: '40px',
      }}>

        {/* Heading */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h1 style={{
            fontFamily: tokens.font.display,
            fontSize: 'clamp(2.4rem, 10vw, 3.5rem)',
            lineHeight: 1,
            textTransform: 'uppercase',
            letterSpacing: '-0.5px',
            margin: 0,
          }}>
            Get your film
          </h1>
          <p style={{
            color: tokens.color.muted2,
            fontSize: '14px',
            margin: 0,
            lineHeight: 1.5,
          }}>
            Enter your redemption code to generate a fresh download link.
          </p>
        </div>

        {/* Form */}
        <RedeemForm />

        {/* Footer link */}
        <Link
          href="/"
          style={{
            color: tokens.color.muted2,
            fontSize: '12px',
            letterSpacing: '0.08em',
            textDecoration: 'none',
            textTransform: 'uppercase',
            textAlign: 'center',
          }}
        >
          Explore films
        </Link>

      </div>
    </main>
  )
}
