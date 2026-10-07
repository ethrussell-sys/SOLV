import type { Metadata } from 'next'
import Link from 'next/link'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { Markdown } from '@/lib/markdown'
import { tokens } from '@/lib/tokens'

export const metadata: Metadata = {
  title: 'Privacy Policy — Sølv',
}

// Same setup as /terms: the policy lives as markdown so an updated
// document drops in as-is. Read at build time; this page is static.
const PRIVACY = readFileSync(path.join(process.cwd(), 'content', 'privacy-policy.md'), 'utf8')

export default function PrivacyPage() {
  return (
    <main style={{ backgroundColor: tokens.color.bg, color: tokens.color.ink, minHeight: '100vh' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '64px 24px 96px' }}>

        <Markdown source={PRIVACY} />

        {/* Footer nav */}
        <div style={{ marginTop: '80px', paddingTop: '32px', borderTop: `1px solid ${tokens.color.surface2}`, display: 'flex', gap: '24px' }}>
          <Link
            href="/"
            style={{ color: tokens.color.muted2, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none' }}
          >
            ← Back to films
          </Link>
        </div>

      </div>
    </main>
  )
}
