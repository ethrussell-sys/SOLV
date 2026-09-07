import { getStripe } from '@/lib/stripe'
import { createOrGetPurchase } from '@/lib/purchase'

export async function POST(request: Request) {
  const body = await request.json()
  const { paymentIntentId, email } = body

  if (!paymentIntentId) {
    return Response.json({ error: 'paymentIntentId required' }, { status: 400 })
  }

  const intent = await getStripe().paymentIntents.retrieve(paymentIntentId)

  if (intent.status !== 'succeeded') {
    return Response.json({ error: 'Payment not confirmed' }, { status: 400 })
  }

  const filmId = intent.metadata.filmId

  // Metadata set at PaymentIntent-creation time is the authoritative
  // source (same trust model as filmId above); the client-sent body is
  // only a fallback for older PaymentIntents created before UTM was
  // threaded into metadata.
  const utm = {
    utm_source: intent.metadata.utm_source ?? body.utm_source ?? undefined,
    utm_medium: intent.metadata.utm_medium ?? body.utm_medium ?? undefined,
    utm_campaign: intent.metadata.utm_campaign ?? body.utm_campaign ?? undefined,
    utm_content: intent.metadata.utm_content ?? body.utm_content ?? undefined,
    utm_term: intent.metadata.utm_term ?? body.utm_term ?? undefined,
  }

  const origin = new URL(request.url).origin

  const result = await createOrGetPurchase({
    filmId,
    email: email ?? '',
    paymentIntentId,
    origin,
    utm,
  })

  if (!result) {
    return Response.json({ error: 'Film not found' }, { status: 404 })
  }

  return Response.json({
    filmTitle: result.film.title,
    purchaseToken: result.purchaseToken,
  })
}
