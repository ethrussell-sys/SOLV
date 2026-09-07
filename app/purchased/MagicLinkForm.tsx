'use client'

import { useState } from 'react'
import { tokens } from '@/lib/tokens'

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: tokens.color.surface,
  border: `1px solid ${tokens.color.line}`,
  borderRadius: '12px',
  color: tokens.color.ink,
  fontSize: '16px',
  padding: '16px 20px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: tokens.font.body,
}

const errorStyle: React.CSSProperties = {
  color: 'rgba(255,80,80,0.8)',
  fontSize: '13px',
  margin: 0,
  textAlign: 'center',
  lineHeight: 1.5,
}

const mutedStyle: React.CSSProperties = {
  color: tokens.color.muted2,
  fontSize: '12px',
  margin: 0,
  textAlign: 'center',
}

export default function MagicLinkForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/magic-link/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error('request failed')
      setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // The API always returns the same message whether or not this email has
  // purchases — this screen can't (and shouldn't) tell the difference.
  if (sent) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'center' }}>
        <p style={{ color: tokens.color.ink, fontSize: '14px', margin: 0, lineHeight: 1.6 }}>
          If that email has purchases, we&apos;ve sent a link to view them.
        </p>
        <p style={mutedStyle}>Check your email — the link is good for 15 minutes.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <input
        type="email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setError('') }}
        placeholder="Email used at purchase"
        autoComplete="email"
        style={inputStyle}
      />

      {error && <p style={errorStyle}>{error}</p>}

      <button
        type="submit"
        disabled={loading || !email.trim()}
        style={{
          width: '100%',
          padding: '18px',
          borderRadius: '14px',
          border: `1px solid ${tokens.color.line2}`,
          background: 'transparent',
          color: loading || !email.trim() ? tokens.color.muted2 : tokens.color.ink,
          fontSize: '15px',
          letterSpacing: '0.06em',
          cursor: loading || !email.trim() ? 'default' : 'pointer',
          textTransform: 'uppercase',
          transition: 'color 0.2s ease',
        }}
      >
        {loading ? 'Sending…' : 'Email me a link'}
      </button>
    </form>
  )
}
