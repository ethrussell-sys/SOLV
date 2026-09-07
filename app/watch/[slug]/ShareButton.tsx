'use client'

import { useRef, useState, useSyncExternalStore } from 'react'
import { track } from '@/lib/track'
import { tokens } from '@/lib/tokens'

const MAX_NOTE = 120

// navigator.share() availability never changes during a session — no need to subscribe to anything,
// just read it on the client and fall back to the SSR-safe default (false) until hydrated.
function subscribeNoop() { return () => {} }
function getCanNativeShare() { return typeof navigator.share === 'function' }
function getCanNativeShareServer() { return false }

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
  const canNativeShare = useSyncExternalStore(subscribeNoop, getCanNativeShare, getCanNativeShareServer)
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

    // Prefer the native share sheet — much lower friction than copy-then-paste,
    // and this is our primary discovery loop. Clipboard is the fallback for
    // browsers (mostly desktop) that don't support it.
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ url })
        setOpen(false)
        setNote('')
        return
      } catch (err) {
        // User dismissed the share sheet — leave the panel open, don't fall back to copying.
        if (err instanceof DOMException && err.name === 'AbortError') return
      }
    }

    if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(url) } catch {}
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

      {/* Panel — always in DOM for smooth exit animation */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: '240px',
          transformOrigin: 'top right',
          opacity: open ? 1 : 0,
          transform: open ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(-6px)',
          transition: 'opacity 0.18s ease-out, transform 0.18s ease-out',
          pointerEvents: open ? 'auto' : 'none',
          background: tokens.color.surface,
          border: `1px solid ${tokens.color.line}`,
          borderRadius: '14px',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxShadow: '0 12px 28px rgba(0,0,0,0.45)',
          boxSizing: 'border-box',
        }}
      >
        <p style={{
          margin: 0,
          fontSize: '11px',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: tokens.color.muted2,
        }}>
          Share this film
        </p>

        <button
          type="button"
          onMouseDown={() => { suppressBlurRef.current = true }}
          onClick={copyAndClose}
          style={{
            width: '100%',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: tokens.color.ink,
            color: tokens.color.bg,
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 600,
            fontFamily: tokens.font.body,
            cursor: 'pointer',
          }}
        >
          {copied ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12" />
              <path d="M7 8l5-5 5 5" />
              <path d="M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6" />
            </svg>
          )}
          {copied ? 'Copied!' : canNativeShare ? 'Share' : 'Copy link'}
        </button>

        <input
          ref={inputRef}
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, MAX_NOTE))}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder="Add a note (optional)"
          style={{
            width: '100%',
            height: '36px',
            background: tokens.color.bg,
            border: `1px solid ${tokens.color.line}`,
            borderRadius: '10px',
            color: tokens.color.ink,
            fontSize: '13px',
            padding: '0 12px',
            outline: 'none',
            fontFamily: tokens.font.body,
            boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  )
}
