'use client'

import { useEffect, useRef, useState } from 'react'
import { track } from '@/lib/track'
import { tokens } from '@/lib/tokens'

const PROGRESS_MILESTONES = [10, 25, 50, 75, 90, 100]
const FLASH_DURATION_MS = 500

type Props = { src: string; title: string; filmId: string; filmSlug: string }

export default function TeaserPlayer({ src, title, filmId, filmSlug }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [muted, setMuted] = useState(true)
  const [autoplayBlocked, setAutoplayBlocked] = useState(false)
  const [flash, setFlash] = useState<'play' | 'pause' | null>(null)

  const state = useRef({
    plays: 0,
    paused: false,
    pausedAt: 0,
    ended: false,
    progressFired: new Set<number>(),
  })

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const s = state.current

    function onPlay() {
      if (s.plays === 0) {
        s.plays = 1
        track({ event_type: 'trailer_play', film_id: filmId, film_slug: filmSlug })
      } else if (s.paused) {
        track({
          event_type: 'trailer_resume',
          film_id: filmId,
          film_slug: filmSlug,
          metadata: { resumed_at_seconds: Math.round(s.pausedAt) },
        })
        s.paused = false
        s.pausedAt = 0
      } else if (s.ended) {
        s.plays += 1
        s.ended = false
        s.progressFired.clear()
        track({ event_type: 'trailer_replay', film_id: filmId, film_slug: filmSlug })
      }
      setAutoplayBlocked(false)
    }

    function onPause() {
      // Reaching the end fires 'pause' immediately before 'ended' — let onEnded own that case.
      if (video!.ended) return
      s.pausedAt = video!.currentTime
      s.paused = true
      track({
        event_type: 'trailer_pause',
        film_id: filmId,
        film_slug: filmSlug,
        metadata: { paused_at_seconds: Math.round(s.pausedAt) },
      })
    }

    function onEnded() {
      s.ended = true
      s.paused = false
      if (!s.progressFired.has(100)) {
        s.progressFired.add(100)
        track({
          event_type: 'trailer_progress',
          film_id: filmId,
          film_slug: filmSlug,
          metadata: { progress_percent: 100 },
        })
      }
      // Manual loop (not the `loop` attribute) so `ended` actually fires and drives trailer_replay.
      video!.currentTime = 0
      video!.play().catch(() => {})
    }

    function onTimeUpdate() {
      const duration = video!.duration
      if (!duration || Number.isNaN(duration)) return
      const pct = (video!.currentTime / duration) * 100

      if (progressRef.current) {
        progressRef.current.style.width = `${Math.min(100, Math.max(0, pct))}%`
      }

      for (const milestone of PROGRESS_MILESTONES) {
        if (pct >= milestone && !s.progressFired.has(milestone)) {
          s.progressFired.add(milestone)
          track({
            event_type: 'trailer_progress',
            film_id: filmId,
            film_slug: filmSlug,
            metadata: { progress_percent: milestone },
          })
        }
      }
    }

    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('ended', onEnded)
    video.addEventListener('timeupdate', onTimeUpdate)

    video.play().catch(() => setAutoplayBlocked(true))

    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('ended', onEnded)
      video.removeEventListener('timeupdate', onTimeUpdate)
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function triggerFlash(icon: 'play' | 'pause') {
    setFlash(icon)
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current)
    flashTimeoutRef.current = setTimeout(() => setFlash(null), FLASH_DURATION_MS)
  }

  function handleTap() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play().catch(() => setAutoplayBlocked(true))
      triggerFlash('play')
    } else {
      video.pause()
      triggerFlash('pause')
    }
  }

  function toggleMute(e: React.MouseEvent) {
    e.stopPropagation()
    const video = videoRef.current
    if (!video) return
    const next = !video.muted
    video.muted = next
    if (!next) {
      track({ event_type: 'trailer_unmute', film_id: filmId, film_slug: filmSlug })
    }
    setMuted(next)
  }

  return (
    <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
      <div
        onClick={handleTap}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: tokens.color.surface,
          cursor: 'pointer',
        }}
      >
        <video
          ref={videoRef}
          src={src}
          title={title}
          autoPlay
          muted
          playsInline
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />

        {/* Center play/pause flash */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: flash ? 1 : 0,
            transition: 'opacity 200ms ease',
            pointerEvents: 'none',
          }}
        >
          <PlayPauseIcon icon={flash === 'pause' ? 'pause' : 'play'} color={tokens.color.ink} size={26} />
        </div>

        {/* Autoplay-blocked fallback */}
        {autoplayBlocked && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <PlayPauseIcon icon="play" color={tokens.color.ink} size={26} />
          </div>
        )}

        {/* Thin decorative progress line — non-interactive */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '2px',
            background: 'rgba(255,255,255,0.15)',
            pointerEvents: 'none',
          }}
        >
          <div
            ref={progressRef}
            style={{
              height: '100%',
              width: '0%',
              background: tokens.color.ink,
            }}
          />
        </div>
      </div>

      <button
        onClick={toggleMute}
        aria-label={muted ? 'Unmute' : 'Mute'}
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          zIndex: 10,
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: 'none',
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          color: tokens.color.ink,
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          lineHeight: 1,
        }}
      >
        {muted ? '🔇' : '🔊'}
      </button>
    </div>
  )
}

function PlayPauseIcon({ icon, color, size }: { icon: 'play' | 'pause'; color: string; size: number }) {
  if (icon === 'pause') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <rect x="6" y="5" width="4" height="14" rx="1" />
        <rect x="14" y="5" width="4" height="14" rx="1" />
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M8 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 8 5.5Z" />
    </svg>
  )
}
