'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { tokens } from '@/lib/tokens'

// Homepage entry point for filmmakers, styled to mirror the hero. Fades and
// rises in once when it scrolls into view; globals.css skips the motion for
// reduced-motion users.
export function FilmmakerCta() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.25 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="filmmaker-cta">
      <div ref={ref} className={`filmmaker-cta-inner${visible ? ' is-visible' : ''}`}>
        <p style={{
          color: tokens.color.muted2,
          fontSize: '11px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          margin: '0 0 16px',
        }}>
          For filmmakers
        </p>

        <h2 style={{
          fontFamily: tokens.font.display,
          fontSize: 'clamp(3rem, 11vw, 6.5rem)',
          fontWeight: 400,
          lineHeight: 0.95,
          textTransform: 'uppercase',
          letterSpacing: '-0.5px',
          margin: '0 0 24px',
        }}>
          Your film.<br />Your audience.
        </h2>

        <p style={{
          color: tokens.color.muted2,
          fontSize: '15px',
          lineHeight: 1.6,
          margin: '0 0 32px',
        }}>
          Straight to the people who want it.
        </p>

        <Link href="/submit" className="explore-link">
          Submit your film &rarr;
        </Link>
      </div>
    </section>
  )
}
