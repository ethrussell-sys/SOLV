import { getStripe } from '@/lib/stripe'
import { serverClient } from '@/lib/supabase'

export async function POST(request: Request) {
  const { filmId, utm_source, utm_medium, utm_campaign, utm_content, utm_term } = await request.json()

  if (!filmId) {
    return Response.json({ error: 'filmId required' }, { status: 400 })
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
