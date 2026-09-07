import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { serverClient } from '@/lib/supabase'
import { mintMagicSession, MAGIC_SESSION_COOKIE, MAGIC_SESSION_TTL_SECONDS } from '@/lib/magic-link'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) redirect('/purchased?error=invalid')

  const db = serverClient()
  const nowIso = new Date().toISOString()

  // Atomic consume: only a row that's currently unused AND unexpired gets
  // its used_at set, in one conditional UPDATE — same pattern as
  // increment_download_count's WHERE clause. If this token was already
  // clicked (or two requests race on the same link), at most one succeeds;
  // everyone else falls through to the generic invalid-link redirect.
  const { data: rows, error } = await db
    .from('magic_links')
    .update({ used_at: nowIso })
    .eq('token', token)
    .is('used_at', null)
    .gt('expires_at', nowIso)
    .select('email')

  const consumed = rows?.[0]

  if (error || !consumed) redirect('/purchased?error=invalid')

  const cookieStore = await cookies()
  cookieStore.set(MAGIC_SESSION_COOKIE, mintMagicSession(consumed.email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAGIC_SESSION_TTL_SECONDS,
  })

  redirect('/purchased')
}
