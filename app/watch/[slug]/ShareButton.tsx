'use client'

import { useRef, useState } from 'react'
import { track } from '@/lib/track'
import { tokens } from '@/lib/tokens'

const MAX_NOTE = 120

export default function ShareButton({
  filmId,
  filmSlug,
  sharePath,
}: {
  filmId?: string
  filmSlug?: string
  sharePath?: string
}) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  // Prevents blur from firing when the user clicks the toggle button itself
  const suppressBlurRef = useRef(false)

  function buildUrl() {
    const base = `${window.location.origin}${sharePath ?? window.location.pathname}`
    return note.trim() ? `${base}?note=${encodeURIComponent(note.trim())}` : base
  }

  async function copyAndClose() {
    if (copied) return
    const url = buildUrl()
    track({ event_type: 'share_button_click', film_id: filmId, film_slug: filmSlug })

    if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(url) } catch {}
    } else if (typeof navigator.share === 'function') {
      try { await navigator.share({ url }) } catch {}
    }

    setCopied(true)
    setTimeout(() => {
      setOpen(false)
      setNote('')
      setCopied(false)
    }, 1400)
  }

  function handleToggle() {
    if (open) {
      setOpen(false)
      setNote('')
    } else {
      setOpen(true)
      setTimeout(() => inputRef.current?.focus(), 20)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      copyAndClose()
    } else if (e.key === 'Escape') {
      setOpen(false)
      setNote('')
    }
  }

  function handleBlur() {
    if (suppressBlurRef.current) {
      suppressBlurRef.current = false
      return
    }
    copyAndClose()
  }

  return (
    <div style={{
      position: 'fixed',
      top: 'calc(16px + env(safe-area-inset-top))',
      right: '16px',
      zIndex: 30,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '8px',
    }}>
      <button
        type="button"
        className="solv-share-icon-btn"
        onMouseDown={() => { suppressBlurRef.current = true }}
        onClick={handleToggle}
        aria-label={copied ? 'Link copied' : 'Share this film'}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '0.5px solid rgba(255,255,255,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: tokens.color.ink,
          padding: 0,
        }}
      >
        {copied ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v12" />
            <path d="M7 8l5-5 5 5" />
            <path d="M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6" />
          </svg>
        )}
      </button>

      {/* Note panel — always in DOM for smooth exit animation */}
      <div
        style={{
          width: '220px',
          overflow: 'hidden',
          height: open ? '40px' : '0',
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(0)' : 'translateY(-4px)',
          transition: 'height 0.22s ease-out, opacity 0.18s ease-out, transform 0.22s ease-out',
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, MAX_NOTE))}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder="Add a note..."
          style={{
            width: '100%',
            height: '40px',
            background: tokens.color.surface,
            border: `1px solid ${tokens.color.line}`,
            borderRadius: '12px',
            color: tokens.color.ink,
            fontSize: '14px',
            padding: '0 14px',
            outline: 'none',
            fontFamily: tokens.font.body,
            boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  )
}
