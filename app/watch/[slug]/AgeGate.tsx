'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Wordmark } from '@/components/Wordmark'
import { tokens } from '@/lib/tokens'

export default function AgeGate({ slug }: { slug: string }) {
  // Fail-closed: the gate is visible by default, on both the server render
  // and the client's first paint, so there's no flash of ungated content
  // before this effect can check localStorage. It's only ever hidden once
  // we've confirmed (client-only) that this visitor already passed it.
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const key = `age-confirmed-${slug}`
    if (localStorage.getItem(key)) setVisible(false)
  }, [slug])

  function confirm() {
    localStorage.setItem(`age-confirmed-${slug}`, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: tokens.color.bg,
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
    }}>

      {/* Wordmark */}
      <Wordmark
        size={12}
        tracking="0.3em"
        color={tokens.color.muted2}
        fontFamily={tokens.font.body}
        style={{ position: 'absolute', top: '40px' }}
      />

      <div style={{
        width: '100%',
        maxWidth: '360px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '32px',
        textAlign: 'center',
      }}>
        <p style={{
          color: tokens.color.silver,
          fontSize: '15px',
          lineHeight: 1.7,
          margin: 0,
        }}>
          This film is rated R. You must be 18 or older to continue.
        </p>

        <button
          onClick={confirm}
          style={{
            width: '100%',
            padding: '18px',
            borderRadius: '14px',
            border: 'none',
            backgroundColor: tokens.color.blue,
            color: tokens.color.ink,
            fontSize: '16px',
            fontWeight: 600,
            letterSpacing: '0.02em',
            cursor: 'pointer',
          }}
        >
          I am 18 or older
        </button>

        <Link
          href="/"
          style={{
            color: tokens.color.muted2,
            fontSize: '13px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            textDecoration: 'none',
          }}
        >
          Go back
        </Link>
      </div>
    </div>
  )
}
