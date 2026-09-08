import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { serverClient } from '@/lib/supabase'
import BuyButton from './BuyButton'
import BackButton from './BackButton'
import ShareButton from '@/app/watch/[slug]/ShareButton'
import { tokens } from '@/lib/tokens'

export async function generateMetadata(
  props: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await props.params

  const { data: film } = await serverClient()
    .from('films')
    .select('id, title, director, year, description, thumbnail_url, slug')
    .eq('id', id)
    .single()

  if (!film) return {}

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const slug = film.slug as string | null
  const pageUrl = slug ? `${siteUrl}/watch/${slug}` : `${siteUrl}/films/${id}`
  const image = film.thumbnail_url ?? undefined

  const byline = [film.director, film.year].filter(Boolean).join(', ')
  const description = [byline, film.description].filter(Boolean).join(' — ')

  return {
    title: film.title,
    description,
    openGraph: {
      title: film.title,
      description,
      url: pageUrl,
      siteName: 'Sølv',
      type: 'website',
      ...(image && { images: [{ url: image, alt: film.title }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: film.title,
      description,
      ...(image && { images: [image] }),
    },
  }
}

function youtubeEmbedUrl(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  return match ? `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1` : null
}

function isDirectVideoUrl(url: string): boolean {
  return /\.(mp4|mov|webm|ogg)(\?.*)?$/i.test(url)
}

export default async function FilmPage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params

  const { data: film } = await serverClient()
    .from('films')
    .select('*')
    .eq('id', id)
    .single()

  if (!film) notFound()

  const embedUrl = film.trailer_url ? youtubeEmbedUrl(film.trailer_url) : null
  const directVideoUrl = !embedUrl && film.trailer_url && isDirectVideoUrl(film.trailer_url) ? film.trailer_url : null
  const slug = (film.slug as string | null) ?? null

  return (
    <main style={{ minHeight: '100vh', backgroundColor: tokens.color.bg, color: tokens.color.ink, display: 'flex', flexDirection: 'column', paddingBottom: '180px' }}>

      <BackButton />

      {/* ── Hero ── */}
      <div className="film-hero" style={{ position: 'relative', width: '100%', backgroundColor: tokens.color.surface, flexShrink: 0 }}>

        {film.thumbnail_url && (
          <img
            src={film.thumbnail_url}
            alt={film.title}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}

        {/* Gradient: transparent top → rgba(0,0,0,0.85) bottom 40% */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.85) 100%)',
        }} />

        {/* Title + meta */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: 0, paddingBottom: '8px', paddingLeft: '32px', paddingRight: '32px' }}>
          <h1 style={{
            fontFamily: tokens.font.display,
            fontSize: 'clamp(3rem, 8vw, 6rem)',
            lineHeight: 1,
            textTransform: 'uppercase',
            margin: 0,
            letterSpacing: '-0.5px',
            color: tokens.color.ink,
          }}>
            {film.title}
          </h1>
          {(film.director || film.year || film.price) && (
            <p style={{
              color: tokens.color.muted,
              fontSize: '11px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              margin: '8px 0 0',
            }}>
              {[film.director, film.year, film.price != null ? `$${Number(film.price).toFixed(2)}` : null].filter(Boolean).join('   ·   ')}
            </p>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', paddingTop: '32px', paddingLeft: '32px', paddingRight: '32px', paddingBottom: 0 }}>

        {film.description && (
          <p style={{
            color: tokens.color.ink,
            opacity: 0.85,
            fontSize: '17px',
            lineHeight: 1.7,
            maxWidth: '640px',
            margin: 0,
            overflow: 'visible',
            whiteSpace: 'normal',
            wordWrap: 'break-word',
          }}>
            {film.description}
          </p>
        )}

        {embedUrl && (
          <div style={{ marginLeft: '32px', marginRight: '32px' }}>
            <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: '12px', overflow: 'hidden', backgroundColor: tokens.color.surface }}>
              <iframe
                src={embedUrl}
                title={`${film.title} — trailer`}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {directVideoUrl && (
          <div style={{ marginLeft: '32px', marginRight: '32px' }}>
            <div style={{ borderRadius: '12px', overflow: 'hidden', backgroundColor: tokens.color.surface }}>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                src={directVideoUrl}
                controls
                playsInline
                style={{ width: '100%', display: 'block' }}
              />
            </div>
          </div>
        )}

        <div style={{ paddingLeft: '32px', paddingRight: '32px' }}>
          <ShareButton
            filmId={film.id}
            filmSlug={slug ?? undefined}
            sharePath={slug ? `/watch/${slug}` : undefined}
          />
        </div>

      </div>

      {/* ── Buy button fixed to bottom ── */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '24px 24px 32px',
        background: `linear-gradient(to top, ${tokens.color.bg} 60%, transparent)`,
        pointerEvents: 'none',
      }}>
        <div style={{ pointerEvents: 'auto' }}>
          <BuyButton filmId={film.id} price={film.price} title={film.title} />
        </div>
      </div>

    </main>
  )
}
