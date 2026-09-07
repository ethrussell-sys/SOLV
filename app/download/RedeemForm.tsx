'use client'

import { useState } from 'react'
import { tokens } from '@/lib/tokens'

type Result = { downloadUrl: string; filmTitle: string; downloadsRemaining: number }

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

const codeInputStyle: React.CSSProperties = {
  ...inputStyle,
  letterSpacing: '0.08em',
  fontFamily: 'monospace',
  textTransform: 'uppercase',
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

export default function RedeemForm() {
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Result | null>(null)

  // "Lost your code?" panel state
  const [showResend, setShowResend] = useState(false)
  const [resendEmail, setResendEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendError, setResendError] = useState('')
  const [resendMessage, setResendMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim() || !email.trim()) return
    setLoading(true)
    setError('')
    setResult(null)

    const res = await fetch('/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, email }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong.')
    } else {
      setResult(data)
    }
  }

  async function handleResend(e: React.FormEvent) {
    e.preventDefault()
    if (!resendEmail.trim()) return
    setResendLoading(true)
    setResendError('')
    setResendMessage('')

    const res = await fetch('/api/resend-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: resendEmail }),
    })

    const data = await res.json()
    setResendLoading(false)

    if (!res.ok) {
      setResendError(data.error ?? 'Something went wrong.')
    } else {
      setResendMessage(data.message)
    }
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (result) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'center' }}>
        <p style={{ color: tokens.color.muted, fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
          {result.filmTitle}
        </p>
        <a
          href={result.downloadUrl}
          style={{
            display: 'block',
            width: '100%',
            padding: '18px',
            borderRadius: '14px',
            backgroundColor: tokens.color.blue,
            color: tokens.color.ink,
            fontSize: '16px',
            fontWeight: 600,
            textDecoration: 'none',
            textAlign: 'center',
            letterSpacing: '0.02em',
            boxSizing: 'border-box',
          }}
        >
          Download now
        </a>
        <p style={mutedStyle}>
          Link expires in 24 hours.{' '}
          {result.downloadsRemaining > 0
            ? `${result.downloadsRemaining} download${result.downloadsRemaining === 1 ? '' : 's'} remaining.`
            : 'This was your last download link.'}
        </p>
        <button
          onClick={() => { setResult(null); setCode(''); setEmail('') }}
          style={{ background: 'none', border: 'none', color: tokens.color.muted2, fontSize: '12px', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}
        >
          Enter another code
        </button>
      </div>
    )
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value); setError('') }}
          placeholder="SOLV-XXXX-XXXX"
          maxLength={14}
          spellCheck={false}
          autoCapitalize="characters"
          autoCorrect="off"
          style={codeInputStyle}
        />
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
          disabled={loading || !code.trim() || !email.trim()}
          style={{
            width: '100%',
            padding: '18px',
            borderRadius: '14px',
            border: `1px solid ${tokens.color.line2}`,
            background: 'transparent',
            color: loading || !code.trim() || !email.trim() ? tokens.color.muted2 : tokens.color.ink,
            fontSize: '15px',
            letterSpacing: '0.06em',
            cursor: loading || !code.trim() || !email.trim() ? 'default' : 'pointer',
            textTransform: 'uppercase',
            transition: 'color 0.2s ease',
          }}
        >
          {loading ? 'Checking…' : 'Get download link'}
        </button>
      </form>

      {/* ── Lost your code? ───────────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${tokens.color.surface2}`, paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <button
          onClick={() => { setShowResend((v) => !v); setResendError(''); setResendMessage('') }}
          style={{ background: 'none', border: 'none', color: tokens.color.muted2, fontSize: '12px', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center' }}
        >
          {showResend ? 'Cancel' : 'Lost your code?'}
        </button>

        {showResend && (
          <form onSubmit={handleResend} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="email"
              value={resendEmail}
              onChange={(e) => { setResendEmail(e.target.value); setResendError(''); setResendMessage('') }}
              placeholder="Email used at purchase"
              autoComplete="email"
              style={inputStyle}
            />

            {resendError && <p style={errorStyle}>{resendError}</p>}
            {resendMessage && (
              <p style={{ color: tokens.color.muted, fontSize: '13px', margin: 0, textAlign: 'center' }}>
                {resendMessage}
              </p>
            )}

            {!resendMessage && (
              <button
                type="submit"
                disabled={resendLoading || !resendEmail.trim()}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '14px',
                  border: `1px solid ${tokens.color.line2}`,
                  background: 'transparent',
                  color: resendLoading || !resendEmail.trim() ? tokens.color.muted2 : tokens.color.ink,
                  fontSize: '14px',
                  letterSpacing: '0.06em',
                  cursor: resendLoading || !resendEmail.trim() ? 'default' : 'pointer',
                  textTransform: 'uppercase',
                  transition: 'color 0.2s ease',
                }}
              >
                {resendLoading ? 'Sending…' : 'Resend code'}
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
