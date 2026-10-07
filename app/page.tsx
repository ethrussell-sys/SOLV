import Link from 'next/link'
import { serverClient } from '@/lib/supabase'
import { FilmCard } from '@/components/FilmCard'
import { tokens } from '@/lib/tokens'

export const dynamic = 'force-dynamic'

async function getLiveFilms() {
  const { data, error } = await serverClient()
    .from('films')
    .select('id, thumbnail_url, title, director')
    .eq('status', 'live')
    .order('created_at', { ascending: false })
    .limit(12)
  if (error) console.error('[home] failed to load live films:', error)
  return data ?? []
}

export default async function HomePage() {
  const films = await getLiveFilms()

  return (
    <main style={{ backgroundColor: tokens.color.bg, color: tokens.color.ink, paddingLeft: '48px', paddingRight: '48px' }}>

      {/* Hero */}
      <section className="hero-section" style={{
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* Headline + subtext + CTA */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1
            style={{
              fontFamily: tokens.font.display,
              fontSize: 'clamp(3.5rem, 14vw, 8rem)',
              lineHeight: 0.95,
              textTransform: 'uppercase',
              letterSpacing: '-0.5px',
              margin: '0 0 24px',
              animation: 'fade-up 0.8s ease-out both',
            }}
          >
            Own the films<br />that matter.
          </h1>

          <p style={{
            color: tokens.color.muted2,
            fontSize: '15px',
            lineHeight: 1.6,
            margin: '0 0 32px',
            animation: 'fade-up 0.8s ease-out 0.15s both',
          }}>
            One tap.&nbsp;&nbsp;$1.99.&nbsp;&nbsp;No expiry.
          </p>

          <Link
            href={films.length > 0 ? '#films' : '/films'}
            className="explore-link"
            style={{ animation: 'fade-up 0.8s ease-out 0.3s both' }}
          >
            Explore films &rarr;
          </Link>
        </div>

        {/* Film strip */}
        {films.length > 0 && (
          <>
            <div className="hero-divider" style={{ borderTop: `1px solid ${tokens.color.line}` }} />
            <div
              id="films"
              className="film-strip hero-strip"
              style={{
                display: 'flex',
                gap: '10px',
                overflowX: 'auto',
                padding: '48px 0 48px',
                animation: 'fade-up 0.8s ease-out 0.45s both',
              }}
            >
              {films.map((film) => (
                <FilmCard
                  key={film.id}
                  href={`/films/${film.id}`}
                  title={film.title}
                  director={film.director}
                  thumbnailUrl={film.thumbnail_url}
                />
              ))}
            </div>
          </>
        )}

      </section>


    </main>
  )
}
