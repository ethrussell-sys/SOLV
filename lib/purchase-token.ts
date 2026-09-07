import { createHmac, timingSafeEqual } from 'crypto'

// Stateless, short-lived credential minted at purchase-creation time.
// Proves "this browser was just handed this purchase" without a DB
// round trip or server-side revocation — the A2 always-allowed,
// uncounted download depends on it staying self-verifying and cheap.
const PURCHASE_TOKEN_TTL_SECONDS = 60 * 60 * 24 // 24 hours — matches the success page's "good for 24 hours" copy

function secret(): string {
  const s = process.env.DOWNLOAD_TOKEN_SECRET
  if (!s) throw new Error('DOWNLOAD_TOKEN_SECRET is not set')
  return s
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('hex')
}

export function mintPurchaseToken(purchaseId: string): string {
  const expires = Math.floor(Date.now() / 1000) + PURCHASE_TOKEN_TTL_SECONDS
  const payload = `${purchaseId}.${expires}`
  return `${payload}.${sign(payload)}`
}

export function verifyPurchaseToken(token: string): { purchaseId: string } | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null

  const [purchaseId, expiresStr, sig] = parts
  const expires = Number(expiresStr)
  if (!purchaseId || !Number.isFinite(expires)) return null

  const expected = sign(`${purchaseId}.${expiresStr}`)
  const provided = Buffer.from(sig)
  const known = Buffer.from(expected)
  if (provided.length !== known.length || !timingSafeEqual(provided, known)) return null

  if (Math.floor(Date.now() / 1000) > expires) return null

  return { purchaseId }
}
