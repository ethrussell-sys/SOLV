import { randomUUID, createHmac, timingSafeEqual } from 'crypto'

// The emailed link token: DB-backed and single-use (magic_links.used_at),
// unlike the session token below — a link that's already been clicked has
// to actually be revocable, which a self-verifying token can't do.
export function generateMagicLinkToken(): string {
  return randomUUID().replace(/-/g, '')
}

export const MAGIC_LINK_TTL_SECONDS = 60 * 15 // 15 minutes

// The session cookie minted once the link is verified: stateless HMAC,
// same shape as lib/purchase-token.ts (value.expires.sig), just signing an
// email instead of a purchaseId. Reuses DOWNLOAD_TOKEN_SECRET rather than
// a second secret — the two token kinds can't be usefully cross-played
// (a forged "purchaseId" that's actually an email string just fails to
// match any row; see app/api/download/route.ts's ownership check for the
// session path), so a second env var here buys no real isolation.
export const MAGIC_SESSION_COOKIE = 'solv-magic-session'
export const MAGIC_SESSION_TTL_SECONDS = 60 * 60 * 24 // 24 hours

function secret(): string {
  const s = process.env.DOWNLOAD_TOKEN_SECRET
  if (!s) throw new Error('DOWNLOAD_TOKEN_SECRET is not set')
  return s
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('hex')
}

export function mintMagicSession(email: string): string {
  const expires = Math.floor(Date.now() / 1000) + MAGIC_SESSION_TTL_SECONDS
  const payload = `${email}.${expires}`
  return `${payload}.${sign(payload)}`
}

export function verifyMagicSession(token: string): { email: string } | null {
  // Unlike purchaseId (a UUID, never contains '.'), an email almost always
  // does (the domain's dot, at minimum) — so split from the end: sig and
  // expires are guaranteed dot-free (hex digest, decimal timestamp), and
  // whatever's left, rejoined, is the email.
  const parts = token.split('.')
  if (parts.length < 3) return null

  const sig = parts.pop()!
  const expiresStr = parts.pop()!
  const email = parts.join('.')

  const expires = Number(expiresStr)
  if (!email || !Number.isFinite(expires)) return null

  const expected = sign(`${email}.${expiresStr}`)
  const provided = Buffer.from(sig)
  const known = Buffer.from(expected)
  if (provided.length !== known.length || !timingSafeEqual(provided, known)) return null

  if (Math.floor(Date.now() / 1000) > expires) return null

  return { email }
}
