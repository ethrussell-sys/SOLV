import { serverClient } from '@/lib/supabase'

// The one checkpoint every download path funnels through, regardless of
// which credential proved access. A2 purchase tokens are always allowed
// and never touch the counter; every other credential kind is gated by
// the atomic increment_download_count() (migration 013), whose boolean
// result IS the allow/deny decision — no separate read-then-check.
export type CredentialKind =
  | 'purchase_token'
  | 'download_token'
  | 'redemption_code'
  | 'magic_link_session'

export type DownloadDecision =
  | { allowed: true }
  | { allowed: false; reason: 'not_found' | 'limit_reached' }

export async function assertDownloadAllowed(
  purchaseId: string,
  credentialKind: CredentialKind
): Promise<DownloadDecision> {
  if (credentialKind === 'purchase_token') {
    const { data: purchase } = await serverClient()
      .from('purchases')
      .select('id')
      .eq('id', purchaseId)
      .maybeSingle()

    if (!purchase) return { allowed: false, reason: 'not_found' }
    return { allowed: true }
  }

  // download_token, redemption_code, and magic_link_session all land
  // here: counted, via the same atomic function, no special-casing
  // between them. (Callers using magic_link_session are responsible for
  // verifying the session actually owns this purchaseId before calling —
  // see app/api/download/route.ts's ?purchaseId= branch.)
  const { data: allowed, error } = await serverClient().rpc('increment_download_count', {
    p_purchase_id: purchaseId,
  })

  if (error) {
    console.error('[download-policy] increment_download_count failed:', error)
    return { allowed: false, reason: 'not_found' }
  }

  if (!allowed) return { allowed: false, reason: 'limit_reached' }
  return { allowed: true }
}
