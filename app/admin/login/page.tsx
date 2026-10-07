import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { isValidToken, ADMIN_COOKIE, LEGACY_ADMIN_COOKIE } from '@/lib/admin-auth'
import { Wordmark } from '@/components/Wordmark'
import { tokens } from '@/lib/tokens'

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string }>
}) {
  // Already logged in — skip to dashboard
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_COOKIE)?.value ?? cookieStore.get(LEGACY_ADMIN_COOKIE)?.value
  if (isValidToken(token)) redirect('/admin')

  const { error } = await props.searchParams

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col gap-10">

        <div className="flex flex-col gap-3">
          <Wordmark height={22} />
          <h1
            className="text-5xl uppercase leading-none tracking-tight"
            style={{ fontFamily: tokens.font.display }}
          >
            Admin
          </h1>
        </div>

        <form action="/api/admin/login" method="POST" className="flex flex-col gap-8">
          <div>
            <label style={{ color: tokens.color.muted2, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              autoFocus
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: `1px solid ${tokens.color.line}`,
                color: tokens.color.ink,
                fontSize: '16px',
                padding: '12px 0',
                width: '100%',
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <p style={{ color: '#ef4444', fontSize: '13px', margin: 0 }}>Incorrect password.</p>
          )}

          <button
            type="submit"
            className="w-full py-4 rounded-2xl text-black font-semibold text-base tracking-wide"
            style={{ backgroundColor: tokens.color.white }}
          >
            Enter
          </button>
        </form>

      </div>
    </main>
  )
}
