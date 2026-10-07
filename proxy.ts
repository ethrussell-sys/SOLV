import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { serverClient } from '@/lib/supabase'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Older share links used /watch/<film id>, but /watch/[slug] only resolves
// slugs. Permanently redirect ID links to the slug URL, keeping any
// ?from= / ?note= / UTM params. This runs here rather than in the page
// because the page streams (loading.tsx), and a redirect from a streamed
// page is a client-side meta refresh, not a 308.
export async function proxy(request: NextRequest) {
  const id = request.nextUrl.pathname.split('/')[2] ?? ''
  if (!UUID.test(id)) return NextResponse.next()

  // A failed lookup must never take the request down: fall through to
  // the page, which shows the 404.
  let slug: string | null = null
  try {
    const { data: film } = await serverClient()
      .from('films')
      .select('slug')
      .eq('id', id)
      .maybeSingle()
    slug = film?.slug ?? null
  } catch (err) {
    console.error('[proxy] film lookup failed:', err)
  }

  if (!slug) return NextResponse.next()

  const url = request.nextUrl.clone()
  url.pathname = `/watch/${slug}`
  return NextResponse.redirect(url, 308)
}

export const config = {
  matcher: '/watch/:id',
}
