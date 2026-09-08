'use client'

import { useRouter } from 'next/navigation'
import { tokens } from '@/lib/tokens'

export default function BackButton() {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Back"
      style={{
        position: 'fixed',
        top: 'calc(16px + env(safe-area-inset-top))',
        left: '16px',
        zIndex: 50,
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
        color: tokens.color.ink,
        cursor: 'pointer',
        padding: 0,
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 6 9 12 15 18" />
      </svg>
    </button>
  )
}
