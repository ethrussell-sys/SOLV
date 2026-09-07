import { serverClient } from '@/lib/supabase'
import { sendMagicLink } from '@/lib/emails/send'
import { generateMagicLinkToken, MAGIC_LINK_TTL_SECONDS } from '@/lib/magic-link'

// Always the same response, whether or not this email has ever purchased
// anything, and whether or not a link actually got sent (rate-limited or
// not) — the only way to learn "do I have purchases" is to actually click
// a link, which requires inbox access. No enumeration signal here.
const GENERIC_MESSAGE = "If that email has purchases, we've sent a link to view them."

export async function POST(request: Request) {
  const { email } = await request.json()

  if (!email || typeof email !== 'string') {
    return Response.json({ error: 'Email address is required.' }, { status: 400 })
  }

  const normalizedEmail = email.trim().toLowerCase()
  const db = serverClient()

  // Rate-limit guard: skip issuing a new link if an unexpired, unused one
  // already exists for this email. Since the token's own TTL is 15
  // minutes, "unexpired and unused" already bounds this to a short
  // window — protects Resend sender reputation and stops someone from
  // email-bombing an arbitrary address via repeated requests.
  const { data: existing } = await db
    .from('magic_links')
    .select('id')
    .eq('email', normalizedEmail)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .limit(1)
    .maybeSingle()

  if (!existing) {
    const token = generateMagicLinkToken()
    const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_SECONDS * 1000).toISOString()

    const { error: insertError } = await db
      .from('magic_links')
      .insert({ email: normalizedEmail, token, expires_at: expiresAt })

    if (insertError) {
      console.error('[magic-link] insert failed:', insertError)
    } else {
      const origin = new URL(request.url).origin
      const verifyUrl = `${origin}/api/magic-link/verify?token=${token}`

      sendMagicLink({ to: normalizedEmail, verifyUrl }).catch((err) =>
        console.error('[magic-link] send failed:', err)
      )
    }
  }

  return Response.json({ message: GENERIC_MESSAGE })
}
