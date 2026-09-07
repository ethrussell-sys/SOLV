import { cookies } from 'next/headers'
import { serverClient } from '@/lib/supabase'
import { presignedDownloadUrl } from '@/lib/s3'
import { verifyPurchaseToken } from '@/lib/purchase-token'
import { verifyMagicSession, MAGIC_SESSION_COOKIE } from '@/lib/magic-link'
import { assertDownloadAllowed } from '@/lib/download-policy'

// file_key's real extension (.MOV, .mp4, whatever the upload actually was)
// drives the downloaded filename's extension — hardcoding .mp4 would label
// a QuickTime file as if it were one.
function downloadFilename(title: string, fileKey: string): string {
  const ext = fileKey.match(/\.[a-zA-Z0-9]+$/)?.[0].toLowerCase() ?? ''
  return `${title}${ext}`
}

// GET ?token= — the single URL shape every download link (old and new)
// resolves through. A purchase token self-verifies via HMAC and never
// touches the DB for the allow decision; anything that isn't a valid
// purchase token falls back to the legacy download_token lookup, which
// keeps every already-emailed "owner link" working byte-for-byte.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const purchaseIdParam = searchParams.get('purchaseId')

  let filmId: string

  if (token) {
    const purchaseToken = verifyPurchaseToken(token)

    if (purchaseToken) {
      const decision = await assertDownloadAllowed(purchaseToken.purchaseId, 'purchase_token')
      if (!decision.allowed) {
        return new Response('Not found', { status: 404 })
      }

      const { data: purchase } = await serverClient()
        .from('purchases')
        .select('id, film_id')
        .eq('id', purchaseToken.purchaseId)
        .maybeSingle()

      if (!purchase) {
        return new Response('Not found', { status: 404 })
      }

      filmId = purchase.film_id
    } else {
      const { data: purchase } = await serverClient()
        .from('purchases')
        .select('id, film_id')
        .eq('download_token', token)
        .maybeSingle()

      if (!purchase) {
        return new Response('Not found', { status: 404 })
      }

      const decision = await assertDownloadAllowed(purchase.id, 'download_token')
      if (!decision.allowed) {
        return new Response(
          'Download limit reached. Contact support@solvscreen.com for assistance.',
          { status: 403 }
        )
      }

      filmId = purchase.film_id
    }
  } else if (purchaseIdParam) {
    // A3 magic-link session: the cookie proves "this browser controls this
    // email" — it is NOT bound to one purchase the way a token/download_token
    // is by its own value, so purchaseId says which film, and ownership has
    // to be checked explicitly here. A session for email A must never be
    // able to pull a purchaseId belonging to email B.
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(MAGIC_SESSION_COOKIE)?.value
    const session = sessionCookie ? verifyMagicSession(sessionCookie) : null

    if (!session) {
      return new Response('Not found', { status: 404 })
    }

    const { data: purchase } = await serverClient()
      .from('purchases')
      .select('id, film_id, email')
      .eq('id', purchaseIdParam)
      .maybeSingle()

    // The ownership check: the purchase must exist AND its email must
    // match the session's email. Missing purchase and email-mismatch are
    // deliberately indistinguishable (both 404) — same enumeration-safety
    // principle as the POST handler below.
    if (!purchase || purchase.email.toLowerCase() !== session.email.toLowerCase()) {
      return new Response('Not found', { status: 404 })
    }

    const decision = await assertDownloadAllowed(purchase.id, 'magic_link_session')
    if (!decision.allowed) {
      return new Response(
        'Download limit reached. Contact support@solvscreen.com for assistance.',
        { status: 403 }
      )
    }

    filmId = purchase.film_id
  } else {
    return new Response('Missing token or purchaseId', { status: 400 })
  }

  const { data: film } = await serverClient()
    .from('films')
    .select('title, file_key')
    .eq('id', filmId)
    .single()

  if (!film) {
    return new Response('Film not found', { status: 404 })
  }

  const presigned = await presignedDownloadUrl(film.file_key, downloadFilename(film.title, film.file_key))

  return Response.redirect(presigned, 302)
}

// POST {code, email} — legacy redemption-code path, folded into the same
// endpoint. Counted via the same assertDownloadAllowed() checkpoint as
// the GET download_token branch.
export async function POST(request: Request) {
  const { code, email } = await request.json()

  if (!code || typeof code !== 'string') {
    return Response.json({ error: 'Code is required.' }, { status: 400 })
  }
  if (!email || typeof email !== 'string') {
    return Response.json({ error: 'Email address is required.' }, { status: 400 })
  }

  const normalized = code.trim().toUpperCase()
  const normalizedEmail = email.trim().toLowerCase()

  const { data: purchase } = await serverClient()
    .from('purchases')
    .select('id, film_id, email, download_count, download_limit')
    .eq('redemption_code', normalized)
    .maybeSingle()

  // Treat missing code and email mismatch identically to prevent enumeration
  if (!purchase || purchase.email.toLowerCase() !== normalizedEmail) {
    return Response.json(
      { error: "The code and email address don't match. Please check your confirmation email." },
      { status: 404 }
    )
  }

  const decision = await assertDownloadAllowed(purchase.id, 'redemption_code')
  if (!decision.allowed) {
    return Response.json(
      { error: "You've reached the maximum number of downloads for this film. Please contact support@solvscreen.com for assistance." },
      { status: 403 }
    )
  }

  const { data: film } = await serverClient()
    .from('films')
    .select('title, file_key')
    .eq('id', purchase.film_id)
    .single()

  if (!film) {
    return Response.json({ error: 'Film not found.' }, { status: 404 })
  }

  const downloadUrl = await presignedDownloadUrl(film.file_key, downloadFilename(film.title, film.file_key))

  // Display-only figure computed from the pre-increment read above, not
  // from assertDownloadAllowed's result (the atomic function returns only
  // a boolean) — same approach the old /api/redeem used. Under concurrent
  // requests this count can be off by one; it never drives the allow/deny
  // decision, only the "X downloads remaining" copy.
  const limit = purchase.download_limit ?? 1
  const count = purchase.download_count ?? 0

  return Response.json({
    downloadUrl,
    filmTitle: film.title,
    downloadsRemaining: limit - count - 1,
  })
}
