'use client'

import { useState } from 'react'
import { tokens } from '@/lib/tokens'

type Phase = 'idle' | 'loading' | 'success' | 'error'

export default function WaitlistPanel({ slug, country }: { slug: string; country: string }) {
  const [email, setEmail] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setPhase('loading')

    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, country, filmSlug: slug }),
    })

    setPhase(res.ok ? 'success' : 'error')
  }

  if (phase === 'success') {
    return (
      <p style={{
        color: tokens.color.muted,
        fontSize: '14px',
        textAlign: 'center',
        margin: 0,
        lineHeight: 1.6,
      }}>
        You&apos;re on the list.
      </p>
    )
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <p style={{
        color: tokens.color.muted2,
        fontSize: '13px',
        textAlign: 'center',
        margin: 0,
        lineHeight: 1.6,
      }}>
        Sølv is currently available in the US. Enter your email to be notified when we launch in your region.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          style={{
            width: '100%',
            background: tokens.color.surface,
            border: `1px solid ${tokens.color.line}`,
            borderRadius: '12px',
            color: tokens.color.ink,
            fontSize: '15px',
            padding: '14px 16px',
            outline: 'none',
            fontFamily: tokens.font.body,
            boxSizing: 'border-box',
          }}
        />

        {phase === 'error' && (
          <p style={{ color: 'rgba(255,80,80,0.8)', fontSize: '13px', margin: 0, textAlign: 'center' }}>
            Something went wrong. Try again.
          </p>
        )}

        <button
          type="submit"
          disabled={phase === 'loading' || !email.trim()}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '14px',
            border: 'none',
            backgroundColor: tokens.color.white,
            color: tokens.color.bg,
            fontSize: '15px',
            fontWeight: 600,
            letterSpacing: '0.02em',
            cursor: phase === 'loading' || !email.trim() ? 'default' : 'pointer',
            opacity: phase === 'loading' || !email.trim() ? 0.6 : 1,
            transition: 'opacity 0.2s ease',
          }}
        >
          {phase === 'loading' ? 'Saving…' : 'Notify me'}
        </button>
      </form>
    </div>
  )
}
