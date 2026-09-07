import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { serverClient } from '@/lib/supabase'
import BuyButton from '@/app/films/[id]/BuyButton'
import WaitlistPanel from './WaitlistPanel'
import AgeGate from './AgeGate'
import ShareButton from './ShareButton'
import TrailerPlayer from './TrailerPlayer'
import TeaserPlayer from './TeaserPlayer'
import PageTracker from './PageTracker'
import { Wordmark } from '@/components/Wordmark'
import { tokens } from '@/lib/tokens'

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await props.params

  const { data: film } = await serverClient()
    .from('films')
    .select('title, director, year, description, thumbnail_url')
    .eq('slug', slug)
    .single()

  if (!film) return {}

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const pageUrl = `${siteUrl}/watch/${slug}`
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
  if (!match) return null
  const id = match[1]
  return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1&loop=1&playlist=${id}`
}

export default async function WatchPage(props: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    note?: string
    from?: string
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
    utm_content?: string
    utm_term?: string
  }>
}) {
  const { slug } = await props.params
  const { note, from, utm_source, utm_medium, utm_campaign, utm_content, utm_term } = await props.searchParams
  const utm = { utm_source, utm_medium, utm_campaign, utm_content, utm_term }
  const country = (await headers()).get('x-vercel-ip-country')
  // const isUS = !country || country === 'US' // re-enable before launch
  const isUS = true

  const { data: film } = await serverClient()
    .from('films')
    .select('id, title, director, year, price, trailer_url, description, rating')
    .eq('slug', slug)
    .single()

  if (!film) notFound()

  const embedUrl = film.trailer_url ? youtubeEmbedUrl(film.trailer_url) : null
  const directVideoUrl = !embedUrl && film.trailer_url ? film.trailer_url : null

  const meta = [
    film.director,
    film.year,
    film.price != null ? `$${Number(film.price).toFixed(2)}` : null,
  ].filter(Boolean).join('   ·   ')

  return (
    <>
    <PageTracker utm={utm} filmId={film.id} filmSlug={slug} />
    {film.rating === 'R' && <AgeGate slug={slug} />}
    <main style={{
      backgroundColor: tokens.color.bg,
      color: tokens.color.ink,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>

      <Link
        href="/films"
        aria-label="Browse all films"
        style={{
          position: 'fixed',
          top: 'calc(16px + env(safe-area-inset-top))',
          left: '16px',
          zIndex: 30,
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
          textDecoration: 'none',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 6 9 12 15 18" />
        </svg>
      </Link>

      <ShareButton filmId={film.id} filmSlug={slug} />

      <div style={{
        width: '100%',
        maxWidth: '480px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        // Bottom padding matches the pinned buy bar's height so content never hides behind it
        padding: isUS ? '48px 24px calc(100px + env(safe-area-inset-bottom))' : '48px 24px 40px',
        gap: '20px',
      }}>

        <Wordmark />

        {/* Title */}
        <h1 style={{
          fontFamily: tokens.font.display,
          fontSize: 'clamp(2.8rem, 12vw, 4.5rem)',
          lineHeight: 1,
          textTransform: 'uppercase',
          letterSpacing: '-0.5px',
          textAlign: 'center',
          margin: 0,
        }}>
          {film.title}
        </h1>

        {/* Metadata */}
        {meta && (
          <p style={{
            color: tokens.color.muted2,
            fontSize: '11px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            margin: 0,
            textAlign: 'center',
          }}>
            {meta}
          </p>
        )}

        {/* Trailer */}
        {embedUrl && (
          <TrailerPlayer
            embedUrl={embedUrl}
            title={`${film.title} — trailer`}
            filmId={film.id}
            filmSlug={slug}
          />
        )}
        {directVideoUrl && (
          <TeaserPlayer
            src={directVideoUrl}
            title={`${film.title} — trailer`}
            filmId={film.id}
            filmSlug={slug}
          />
        )}

        {/* Synopsis */}
        {film.description && (
          <p
            data-track="synopsis"
            style={{
              color: tokens.color.muted,
              fontSize: '15px',
              textAlign: 'center',
              lineHeight: 1.6,
              maxWidth: '300px',
              margin: '32px auto',
            }}
          >
            {film.description}
          </p>
        )}

        {/* Buy button (US, pinned to a frosted bottom bar) or waitlist (non-US) → incoming note */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {isUS ? (
            <div
              data-track="buy-section"
              style={{
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 40,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                padding: '12px 24px calc(12px + env(safe-area-inset-bottom))',
              }}
            >
              {/* Fades scrolling content into the bar instead of a hard hairline */}
              <div style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: '-24px',
                height: '24px',
                background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.6))',
                pointerEvents: 'none',
              }} />
              <div style={{ width: '100%', maxWidth: '480px', margin: '0 auto' }}>
                <BuyButton filmId={film.id} price={film.price} title={film.title} filmSlug={slug} />
              </div>
            </div>
          ) : (
            <div data-track="buy-section" style={{ width: '100%' }}>
              <WaitlistPanel slug={slug} country={country!} />
            </div>
          )}

          {note && (
            <div style={{
              color: tokens.color.muted2,
              fontSize: '14px',
              fontStyle: 'italic',
              textAlign: 'center',
              margin: '48px 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}>
              <span>{note}</span>
              {from && <span>{from}</span>}
            </div>
          )}
        </div>

      </div>

      <p style={{
        color: tokens.color.muted2,
        fontSize: '11px',
        letterSpacing: '0.05em',
        textAlign: 'center',
        padding: '0 24px 32px',
        margin: 0,
      }}>
        © 2026 SØLV
      </p>

    </main>
    </>
  )
}
