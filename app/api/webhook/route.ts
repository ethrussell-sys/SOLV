/*
 * Stripe Webhook — /api/webhook
 *
 * SETUP IN STRIPE DASHBOARD:
 *   1. Go to Developers → Webhooks → Add endpoint
 *   2. Endpoint URL: https://yourdomain.com/api/webhook
 *   3. Select event: checkout.session.completed
 *   4. After saving, reveal the Signing secret — that is STRIPE_WEBHOOK_SECRET
 *
 * LOCAL TESTING (Stripe CLI):
 *   stripe listen --forward-to localhost:3000/api/webhook
 *   The CLI prints a whsec_... secret — use that as STRIPE_WEBHOOK_SECRET locally
 *
 * ENV VAR:
 *   STRIPE_WEBHOOK_SECRET=whsec_...
 */

import { getStripe } from '@/lib/stripe'
import { createOrGetPurchase } from '@/lib/purchase'
import type Stripe from 'stripe'

export async function POST(request: Request) {
  // Raw body required for signature verification — do not use request.json()
  const body = await request.text()
  const sig = request.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[webhook] signature verification failed:', msg)
    return new Response(`Webhook error: ${msg}`, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return new Response('OK', { status: 200 })
  }

  const session = event.data.object as Stripe.Checkout.Session

  if (session.payment_status !== 'paid') {
    return new Response('OK', { status: 200 })
  }

  const paymentIntentId = session.payment_intent as string
  const filmId = session.metadata?.filmId
  const email = session.customer_details?.email

  if (!paymentIntentId || !filmId) {
    console.error('[webhook] missing paymentIntentId or filmId', { paymentIntentId, filmId })
    return new Response('OK', { status: 200 })
  }

  const origin = new URL(request.url).origin

  // createOrGetPurchase() is idempotent on stripe_payment_id (upsert), so
  // no separate existence check is needed here — if the /success page's
  // own load already created this purchase, this just returns that row
  // (isNew: false) without sending a duplicate email.
  const result = await createOrGetPurchase({
    filmId,
    email: email ?? '',
    paymentIntentId,
    origin,
    utm: {
      utm_source: session.metadata?.utm_source ?? undefined,
      utm_medium: session.metadata?.utm_medium ?? undefined,
      utm_campaign: session.metadata?.utm_campaign ?? undefined,
      utm_content: session.metadata?.utm_content ?? undefined,
      utm_term: session.metadata?.utm_term ?? undefined,
    },
  })

  if (!result) {
    console.error('[webhook] film not found or purchase creation failed:', filmId)
    return new Response('OK', { status: 200 })
  }

  console.log('[webhook] purchase recorded:', paymentIntentId, 'isNew:', result.isNew)
  return new Response('OK', { status: 200 })
}
