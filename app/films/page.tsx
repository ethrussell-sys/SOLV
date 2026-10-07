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
  if (error) console.error('[films] failed to load live films:', error)
  return data ?? []
}

export default async function FilmsPage() {
  const films = await getLiveFilms()

  return (
    <main style={{ minHeight: '100vh', backgroundColor: tokens.color.bg, color: tokens.color.ink, paddingLeft: '48px', paddingRight: '48px' }}>
      <div className="page-top-space" />

      <h1
        style={{
          fontFamily: tokens.font.display,
          fontSize: 'clamp(2.5rem, 8vw, 4rem)',
          lineHeight: 0.95,
          textTransform: 'uppercase',
          letterSpacing: '-0.5px',
          margin: '0 0 32px',
        }}
      >
        Films
      </h1>

      {films.length === 0 ? (
        <p style={{ color: tokens.color.muted2, fontSize: '15px', paddingBottom: '80px' }}>
          No films are live yet. Check back soon.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
            paddingBottom: '80px',
          }}
        >
          {films.map((film) => (
            <FilmCard
              key={film.id}
              href={`/films/${film.id}`}
              title={film.title}
              director={film.director}
              thumbnailUrl={film.thumbnail_url}
              width="100%"
            />
          ))}
        </div>
      )}
    </main>
  )
}
