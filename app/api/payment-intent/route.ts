import { getStripe } from '@/lib/stripe'
import { serverClient } from '@/lib/supabase'
import { CONSENT_TEXT } from '@/lib/consent'

export async function POST(request: Request) {
  const { filmId, consent, utm_source, utm_medium, utm_campaign, utm_content, utm_term } = await request.json()

  if (!filmId) {
    return Response.json({ error: 'filmId required' }, { status: 400 })
  }

  // Tapping buy is the UK/EU immediate-supply consent (see lib/consent.ts);
  // the client must say so explicitly before any payment starts.
  if (consent !== true) {
    return Response.json({ error: 'consent required' }, { status: 400 })
  }

  const { data: film } = await serverClient()
    .from('films')
    .select('id, title, price')
    .eq('id', filmId)
    .single()

  if (!film) {
    return Response.json({ error: 'Film not found' }, { status: 404 })
  }

  // UTM travels via PaymentIntent metadata (same trust model as filmId
  // below) rather than trusting whatever the client sends back later,
  // since /api/purchase re-reads this intent server-side anyway.
  const intent = await getStripe().paymentIntents.create({
    amount: Math.round(film.price * 100),
    currency: 'usd',
    payment_method_types: ['card'],
    metadata: {
      filmId: film.id,
      consent_immediate_supply: 'true',
      // No consent_at here: this intent is created on page load, ahead of
      // the tap. /api/purchase stamps the time once payment succeeds.
      consent_text: CONSENT_TEXT,
      ...(utm_source && { utm_source }),
      ...(utm_medium && { utm_medium }),
      ...(utm_campaign && { utm_campaign }),
      ...(utm_content && { utm_content }),
      ...(utm_term && { utm_term }),
    },
  })

  return Response.json({
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
  })
}
