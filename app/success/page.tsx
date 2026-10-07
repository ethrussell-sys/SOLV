import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getStripe } from '@/lib/stripe'
import { createOrGetPurchase, consentFromMetadata } from '@/lib/purchase'
import DownloadButton from './DownloadButton'
import ShareSection from './ShareSection'
import PurchaseTracker from './PurchaseTracker'
import { tokens } from '@/lib/tokens'

async function getOrCreatePurchase(sessionId: string, origin: string) {
  const session = await getStripe().checkout.sessions.retrieve(sessionId)

  if (session.payment_status !== 'paid') return null

  const filmId = session.metadata?.filmId
  const email = session.customer_details?.email
  const paymentIntentId = session.payment_intent as string

  if (!filmId || !email) return null

  // Previously this function ran its own separate upsert with no UTM
  // fields at all — if it landed before the webhook, that purchase
  // permanently lost attribution, since the webhook's own idempotency
  // check would then skip it. Now both paths call the same function
  // with the same session.metadata source, so whichever lands first
  // captures UTM correctly.
  const result = await createOrGetPurchase({
    filmId,
    email,
    paymentIntentId,
    origin,
    utm: {
      utm_source: session.metadata?.utm_source ?? undefined,
      utm_medium: session.metadata?.utm_medium ?? undefined,
      utm_campaign: session.metadata?.utm_campaign ?? undefined,
      utm_content: session.metadata?.utm_content ?? undefined,
      utm_term: session.metadata?.utm_term ?? undefined,
    },
    consent: consentFromMetadata(session.metadata),
  })

  if (!result) return null

  return { film: result.film, email, purchaseToken: result.purchaseToken }
}

export default async function SuccessPage(props: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id } = await props.searchParams

  if (!session_id) redirect('/')

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? ''
  const result = await getOrCreatePurchase(session_id, origin)

  if (!result) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-3 px-5 text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-neutral-400 text-sm">
          We couldn&apos;t verify your payment. If you were charged, email us and we&apos;ll sort it out.
        </p>
      </main>
    )
  }

  const { film, email, purchaseToken } = result
  // /watch only resolves slugs; a film without one falls back to its film page
  const sharePath = film.slug ? `/watch/${film.slug}` : `/films/${film.id}`

  return (
    <>
    <PurchaseTracker filmId={film.id} filmSlug={film.slug ?? film.id} />
    <main style={{ backgroundColor: tokens.color.bg, color: tokens.color.ink, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '64px', paddingBottom: '80px' }}>

      <div style={{ width: '100%', maxWidth: '384px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', textAlign: 'center', paddingLeft: '20px', paddingRight: '20px' }}>

        <div style={{ width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.color.white }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h1 style={{
            fontFamily: tokens.font.display,
            fontSize: 'clamp(2.8rem, 12vw, 4rem)',
            lineHeight: 1,
            textTransform: 'uppercase',
            letterSpacing: '-0.5px',
            margin: 0,
          }}>
            Your download.
            <br />
            Ready now.
          </h1>
          <p style={{ color: tokens.color.muted2, fontSize: '14px', lineHeight: 1.6, margin: '8px 0 0' }}>
            <span style={{ color: tokens.color.ink, fontWeight: 500 }}>{film.title}</span> is yours to keep — no account, no subscription, no catch.
            <br />
            Download link sent to {email}.
          </p>
        </div>

        <DownloadButton title={film.title} filmId={film.id} purchaseToken={purchaseToken} />

        <p style={{ color: tokens.color.muted2, fontSize: '12px', margin: 0 }}>
          Download didn&apos;t start?{' '}
          <a href={`/api/download?token=${purchaseToken}`} style={{ color: tokens.color.ink, textDecoration: 'underline' }}>
            Tap to retry
          </a>
          {' '}— or find it anytime in your confirmation email.
        </p>

        <ShareSection watchUrl={`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}${sharePath}`} />

        <Link
          href="/"
          style={{
            color: tokens.color.muted2,
            fontSize: '12px',
            letterSpacing: '0.08em',
            textDecoration: 'none',
            textTransform: 'uppercase',
            display: 'block',
            textAlign: 'center',
            marginTop: '60px',
          }}
        >
          Explore more films
        </Link>
      </div>

    </main>
    </>
  )
}
