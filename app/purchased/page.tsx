import { cookies } from 'next/headers'
import Link from 'next/link'
import { serverClient } from '@/lib/supabase'
import { verifyMagicSession, MAGIC_SESSION_COOKIE } from '@/lib/magic-link'
import { Wordmark } from '@/components/Wordmark'
import { tokens } from '@/lib/tokens'
import MagicLinkForm from './MagicLinkForm'

const headingStyle: React.CSSProperties = {
  fontFamily: tokens.font.display,
  fontSize: 'clamp(2.4rem, 10vw, 3.5rem)',
  lineHeight: 1,
  textTransform: 'uppercase',
  letterSpacing: '-0.5px',
  margin: 0,
}

type OwnedPurchase = {
  id: string
  downloadCount: number
  downloadLimit: number
  filmTitle: string
}

async function getOwnedPurchases(email: string): Promise<OwnedPurchase[]> {
  const { data } = await serverClient()
    .from('purchases')
    .select('id, download_count, download_limit, created_at, films(title)')
    .ilike('email', email)
    .order('created_at', { ascending: false })

  if (!data) return []

  return data.map((row) => {
    const film = Array.isArray(row.films) ? row.films[0] : row.films
    return {
      id: row.id,
      downloadCount: row.download_count,
      downloadLimit: row.download_limit,
      filmTitle: (film as { title: string } | null)?.title ?? 'Untitled',
    }
  })
}

export default async function PurchasedPage(props: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await props.searchParams

  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(MAGIC_SESSION_COOKIE)?.value
  const session = sessionCookie ? verifyMagicSession(sessionCookie) : null

  const purchases = session ? await getOwnedPurchases(session.email) : []

  return (
    <main style={{
      backgroundColor: tokens.color.bg,
      color: tokens.color.ink,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '48px 24px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '40px' }}>

        <div style={{ textAlign: 'center' }}>
          <Wordmark size={12} tracking="0.3em" color={tokens.color.muted2} fontFamily={tokens.font.body} />
        </div>

        {!session ? (
          <>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h1 style={headingStyle}>Your purchases</h1>
              <p style={{ color: tokens.color.muted2, fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
                {error === 'invalid'
                  ? 'That link has expired or already been used. Enter your email for a new one.'
                  : "Enter your email and we'll send you a link to everything you've bought."}
              </p>
            </div>
            <MagicLinkForm />
          </>
        ) : purchases.length === 0 ? (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h1 style={headingStyle}>Nothing here yet</h1>
            <p style={{ color: tokens.color.muted2, fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
              No purchases found for {session.email}.
            </p>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h1 style={headingStyle}>Your films</h1>
              <p style={{ color: tokens.color.muted2, fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
                {session.email}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {purchases.map((p) => {
                const remaining = p.downloadLimit - p.downloadCount
                return (
                  <div key={p.id} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    padding: '20px',
                    borderRadius: '14px',
                    border: `1px solid ${tokens.color.line}`,
                    backgroundColor: tokens.color.surface,
                  }}>
                    <span style={{ fontSize: '15px', fontWeight: 500 }}>{p.filmTitle}</span>

                    {remaining > 0 ? (
                      <>
                        <a
                          href={`/api/download?purchaseId=${p.id}`}
                          style={{
                            display: 'block',
                            textAlign: 'center',
                            padding: '14px',
                            borderRadius: '12px',
                            backgroundColor: tokens.color.blue,
                            color: tokens.color.ink,
                            fontSize: '14px',
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          Download
                        </a>
                        <p style={{ color: tokens.color.muted2, fontSize: '11px', margin: 0, textAlign: 'center' }}>
                          {remaining} download{remaining === 1 ? '' : 's'} remaining
                        </p>
                      </>
                    ) : (
                      <p style={{ color: tokens.color.muted2, fontSize: '12px', margin: 0 }}>
                        Download limit reached. Contact support@solvscreen.com for assistance.
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        <Link
          href="/"
          style={{
            color: tokens.color.muted2,
            fontSize: '12px',
            letterSpacing: '0.08em',
            textDecoration: 'none',
            textTransform: 'uppercase',
            textAlign: 'center',
          }}
        >
          Explore films
        </Link>
      </div>
    </main>
  )
}
