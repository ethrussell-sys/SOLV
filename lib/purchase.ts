import { serverClient } from '@/lib/supabase'
import { sendPurchaseConfirmation } from '@/lib/emails/send'
import { generateRedemptionCode } from '@/lib/redemption-code'
import { generateDownloadToken } from '@/lib/download-token'
import { mintPurchaseToken } from '@/lib/purchase-token'
import type { UtmParams } from '@/lib/utm'

type CreatePurchaseParams = {
  filmId: string
  email: string
  paymentIntentId: string
  origin: string
  utm?: UtmParams
  consent?: PurchaseConsent | null
}

// UK/EU immediate-supply consent, ticked at the buy button and carried
// through Stripe metadata (Checkout session or PaymentIntent) so it's
// recorded server-side rather than trusted from a later client request.
export type PurchaseConsent = { immediateSupply: true; at: string }

export function consentFromMetadata(
  metadata: Record<string, string> | null | undefined
): PurchaseConsent | null {
  if (metadata?.consent_immediate_supply !== 'true' || !metadata.consent_at) return null
  return { immediateSupply: true, at: metadata.consent_at }
}

type PurchaseRow = {
  id: string
  film_id: string
  email: string
  stripe_payment_id: string
  redemption_code: string | null
  download_token: string | null
  download_count: number
  download_limit: number
}

type CreatePurchaseResult = {
  purchase: PurchaseRow
  film: { id: string; title: string; file_key: string }
  isNew: boolean
  purchaseToken: string
}

// The single place a `purchases` row gets created, called from all three
// trigger points (Stripe webhook, the /success page's own load, and the
// Apple/Google Pay flow) so every path captures UTM the same way and
// always returns a purchase token — instead of three near-duplicate
// upserts that drifted out of sync with each other.
export async function createOrGetPurchase({
  filmId,
  email,
  paymentIntentId,
  origin,
  utm,
  consent,
}: CreatePurchaseParams): Promise<CreatePurchaseResult | null> {
  const db = serverClient()

  const { data: film } = await db
    .from('films')
    .select('id, title, file_key')
    .eq('id', filmId)
    .single()

  if (!film) return null

  const { data: existing } = await db
    .from('purchases')
    .select('id, redemption_code, download_token')
    .eq('stripe_payment_id', paymentIntentId)
    .maybeSingle()

  const isNew = !existing
  const redemptionCode = existing?.redemption_code ?? generateRedemptionCode()
  const downloadToken = existing?.download_token ?? generateDownloadToken()

  const { data: purchase, error } = await db
    .from('purchases')
    .upsert(
      {
        film_id: film.id,
        email,
        stripe_payment_id: paymentIntentId,
        redemption_code: redemptionCode,
        download_token: downloadToken,
        utm_source: utm?.utm_source ?? null,
        utm_medium: utm?.utm_medium ?? null,
        utm_campaign: utm?.utm_campaign ?? null,
        utm_content: utm?.utm_content ?? null,
        utm_term: utm?.utm_term ?? null,
        // Only written when present, so a caller without consent metadata
        // can never overwrite a consent another path already recorded.
        ...(consent && {
          consent_immediate_supply: consent.immediateSupply,
          consent_at: consent.at,
        }),
      },
      { onConflict: 'stripe_payment_id', ignoreDuplicates: false }
    )
    .select('id, film_id, email, stripe_payment_id, redemption_code, download_token, download_count, download_limit')
    .single()

  if (error || !purchase) {
    console.error('[purchase] upsert failed:', error)
    return null
  }

  const purchaseToken = mintPurchaseToken(purchase.id)

  if (isNew) {
    const ownerLink = `${origin}/api/download?token=${downloadToken}`
    sendPurchaseConfirmation({ to: email, filmTitle: film.title, ownerLink, redemptionCode }).catch(
      (err) => console.error('[purchase] confirmation email failed:', err)
    )
  }

  return { purchase, film, isNew, purchaseToken }
}
