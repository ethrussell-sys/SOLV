import type { Metadata } from 'next'
import Link from 'next/link'
import { Wordmark } from '@/components/Wordmark'
import { tokens } from '@/lib/tokens'

export const metadata: Metadata = {
  title: 'Privacy Policy — Sølv',
}

const CONTACT_EMAIL = 'legal@solvscreen.com'

// Placeholder until a full privacy policy is drafted.
export default function PrivacyPage() {
  return (
    <main style={{ backgroundColor: tokens.color.bg, color: tokens.color.ink, minHeight: '100vh' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '64px 24px 96px' }}>

        <div style={{ marginBottom: '56px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Wordmark size={12} tracking="0.25em" color={tokens.color.muted2} fontFamily={tokens.font.body} />
          </Link>
        </div>

        <h1
          style={{
            fontFamily: tokens.font.display,
            fontSize: 'clamp(2.8rem, 8vw, 4rem)',
            textTransform: 'uppercase',
            lineHeight: 1,
            letterSpacing: '-0.5px',
            margin: '0 0 24px',
          }}
        >
          Privacy Policy
        </h1>
        <p style={{ color: tokens.color.muted2, fontSize: '14px', lineHeight: 1.8, margin: 0 }}>
          Coming soon. Questions:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: tokens.color.blue, textDecoration: 'none' }}>
            {CONTACT_EMAIL}
          </a>
        </p>

      </div>
    </main>
  )
}
