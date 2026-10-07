import { serverClient } from '@/lib/supabase'
import SubmissionsTable from './SubmissionsTable'
import { Wordmark } from '@/components/Wordmark'
import { tokens } from '@/lib/tokens'

async function getData() {
  const db = serverClient()

  const [
    { data: submissions },
    { data: purchases },
    { data: waitlist },
    { count: pageViews },
    { count: trailerPlays },
    { count: checkoutStarts },
    { count: completedPurchases },
  ] = await Promise.all([
    db.from('films')
      .select('id, title, director, year, rating, contact_email, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),

    db.from('purchases')
      .select('id, email, created_at, utm_source, utm_medium, utm_campaign, download_count, download_limit, films(title, price)')
      .order('created_at', { ascending: false }),

    db.from('waitlist')
      .select('id, email, country, film_slug, created_at')
      .order('created_at', { ascending: false }),

    db.from('events').select('*', { count: 'exact', head: true }).eq('event_type', 'page_view'),
    db.from('events').select('*', { count: 'exact', head: true }).eq('event_type', 'trailer_play'),
    db.from('events').select('*', { count: 'exact', head: true }).eq('event_type', 'checkout_start'),
    db.from('events').select('*', { count: 'exact', head: true }).eq('event_type', 'purchase_complete'),
  ])

  // ── Funnel + analytics ──────────────────────────────────────────────────
  const [
    { count: funnelPageViews },
    { count: funnelTrailerPlay },
    { count: funnelBuyVisible },
    { count: funnelBuyClick },
    { count: funnelPurchased },
    { count: returnVisits },
    { data: trailerProgressEvents },
    { data: purchaseCompletedEvents },
  ] = await Promise.all([
    db.from('events').select('*', { count: 'exact', head: true }).eq('event_type', 'page_view'),
    db.from('events').select('*', { count: 'exact', head: true }).eq('event_type', 'trailer_play'),
    db.from('events').select('*', { count: 'exact', head: true }).eq('event_type', 'buy_button_visible'),
    db.from('events').select('*', { count: 'exact', head: true }).eq('event_type', 'buy_button_click'),
    db.from('events').select('*', { count: 'exact', head: true }).eq('event_type', 'purchase_completed'),
    db.from('events').select('*', { count: 'exact', head: true }).eq('event_type', 'return_visit'),
    db.from('events').select('metadata').eq('event_type', 'trailer_progress'),
    db.from('events').select('metadata').eq('event_type', 'purchase_completed'),
  ])

  // Trailer dropoff — count distinct sessions at each progress milestone
  const trailerDropoff = [10, 25, 50, 75, 90, 100].map((pct) => ({
    pct,
    count: (trailerProgressEvents ?? []).filter(
      (e) => (e.metadata as Record<string, unknown> | null)?.progress_percent === pct
    ).length,
  }))

  // Average seconds from first visit to purchase
  const secondsList = (purchaseCompletedEvents ?? [])
    .map((e) => (e.metadata as Record<string, unknown> | null)?.seconds_to_purchase)
    .filter((v): v is number => typeof v === 'number')
  const avgSecondsToPurchase =
    secondsList.length > 0
      ? Math.round(secondsList.reduce((a, b) => a + b, 0) / secondsList.length)
      : null

  // Return visitor conversion rate
  const returnVisitCount = returnVisits ?? 0
  const returnConversions = (purchaseCompletedEvents ?? []).filter(
    (e) => ((e.metadata as Record<string, unknown> | null)?.visit_count as number) > 1
  ).length

  // UTM sources by conversion
  type PurchaseRow = { utm_source?: string | null; utm_medium?: string | null; utm_campaign?: string | null }
  const utmStats = (purchases as PurchaseRow[] ?? []).reduce<
    Record<string, { source: string; purchases: number }>
  >((acc, p) => {
    const src = p.utm_source ?? '(direct)'
    if (!acc[src]) acc[src] = { source: src, purchases: 0 }
    acc[src].purchases += 1
    return acc
  }, {})
  const utmRows = Object.values(utmStats).sort((a, b) => b.purchases - a.purchases)

  const totalRevenue = (purchases ?? []).reduce((sum, p) => {
    const film = p.films as { price?: number } | null
    return sum + (film?.price ?? 1.99)
  }, 0)

  const conversionRate =
    pageViews && pageViews > 0
      ? (((completedPurchases ?? 0) / pageViews) * 100).toFixed(2)
      : '0.00'

  return {
    submissions: submissions ?? [],
    purchases: purchases ?? [],
    waitlist: waitlist ?? [],
    totalRevenue,
    stats: {
      pageViews: pageViews ?? 0,
      trailerPlays: trailerPlays ?? 0,
      checkoutStarts: checkoutStarts ?? 0,
      completedPurchases: completedPurchases ?? 0,
      conversionRate,
    },
    funnel: {
      pageViews: funnelPageViews ?? 0,
      trailerPlay: funnelTrailerPlay ?? 0,
      trailer50: trailerDropoff.find((d) => d.pct === 50)?.count ?? 0,
      buyVisible: funnelBuyVisible ?? 0,
      buyClick: funnelBuyClick ?? 0,
      purchased: funnelPurchased ?? 0,
    },
    trailerDropoff,
    avgSecondsToPurchase,
    returnVisitCount,
    returnConversions,
    utmRows,
  }
}

const sectionHead: React.CSSProperties = {
  fontFamily: tokens.font.display,
  fontSize: '28px',
  letterSpacing: '-0.5px',
  textTransform: 'uppercase',
  color: tokens.color.ink,
  margin: 0,
}

const th: React.CSSProperties = {
  color: tokens.color.muted2,
  fontSize: '11px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  textAlign: 'left',
  padding: '0 16px 12px 0',
  whiteSpace: 'nowrap',
}

const td: React.CSSProperties = {
  fontSize: '14px',
  padding: '14px 16px 14px 0',
  borderTop: `1px solid ${tokens.color.surface2}`,
  verticalAlign: 'middle',
  color: tokens.color.muted,
}

const divider: React.CSSProperties = {
  border: 'none',
  borderTop: `1px solid ${tokens.color.line}`,
  margin: '48px 0',
}

function funnelPct(numerator: number, denominator: number): string {
  if (!denominator) return '—'
  return `${((numerator / denominator) * 100).toFixed(1)}%`
}

export default async function AdminPage() {
  const {
    submissions, purchases, waitlist, totalRevenue, stats,
    funnel, trailerDropoff, avgSecondsToPurchase, returnVisitCount, returnConversions, utmRows,
  } = await getData()

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <header style={{ borderBottom: `1px solid ${tokens.color.surface2}`, padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <Wordmark height={24} />
          <span style={{ color: tokens.color.muted2, fontSize: '13px' }}>Admin</span>
        </div>
        <a
          href="/api/admin/logout"
          style={{ color: tokens.color.muted2, fontSize: '13px', textDecoration: 'none' }}
        >
          Logout
        </a>
      </header>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 32px' }}>

        {/* ── Submissions ─────────────────────────────────────────────────── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '24px' }}>
            <h2 style={sectionHead}>Submissions</h2>
            <span style={{ color: tokens.color.muted2, fontSize: '13px' }}>
              {submissions.length} pending
            </span>
          </div>
          <SubmissionsTable films={submissions} />
        </section>

        <hr style={divider} />

        {/* ── Purchases ───────────────────────────────────────────────────── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginBottom: '24px' }}>
            <h2 style={sectionHead}>Purchases</h2>
            <span style={{ color: tokens.color.ink, fontSize: '22px', fontFamily: tokens.font.display, letterSpacing: '0.5px' }}>
              ${totalRevenue.toFixed(2)}
            </span>
          </div>

          {purchases.length === 0 ? (
            <p style={{ color: tokens.color.muted2, fontSize: '14px' }}>No purchases yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={th}>Film</th>
                    <th style={th}>Buyer</th>
                    <th style={th}>Source</th>
                    <th style={th}>Medium</th>
                    <th style={th}>Campaign</th>
                    <th style={{ ...th, textAlign: 'right' }}>Downloads</th>
                    <th style={th}>Date</th>
                    <th style={{ ...th, textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p) => {
                    const film = p.films as { title?: string; price?: number } | null
                    const row = p as typeof p & { utm_source?: string; utm_medium?: string; utm_campaign?: string; download_count?: number; download_limit?: number }
                    const dlCount = row.download_count ?? 0
                    const dlLimit = row.download_limit ?? 1
                    return (
                      <tr key={p.id}>
                        <td style={{ ...td, color: tokens.color.ink }}>{film?.title ?? '—'}</td>
                        <td style={td}>{p.email}</td>
                        <td style={td}>{row.utm_source ?? '—'}</td>
                        <td style={td}>{row.utm_medium ?? '—'}</td>
                        <td style={td}>{row.utm_campaign ?? '—'}</td>
                        <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: dlCount >= dlLimit ? 'rgba(255,80,80,0.7)' : td.color }}>
                          {dlCount} / {dlLimit}
                        </td>
                        <td style={{ ...td, whiteSpace: 'nowrap' }}>
                          {new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{ ...td, textAlign: 'right', color: tokens.color.ink, fontVariantNumeric: 'tabular-nums' }}>
                          ${(film?.price ?? 1.99).toFixed(2)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <hr style={divider} />

        {/* ── Waitlist ────────────────────────────────────────────────────── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '24px' }}>
            <h2 style={sectionHead}>Waitlist</h2>
            <span style={{ color: tokens.color.muted2, fontSize: '13px' }}>{waitlist.length} signups</span>
          </div>

          {waitlist.length === 0 ? (
            <p style={{ color: tokens.color.muted2, fontSize: '14px' }}>No waitlist signups yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={th}>Email</th>
                    <th style={th}>Country</th>
                    <th style={th}>Film</th>
                    <th style={th}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {waitlist.map((w) => (
                    <tr key={w.id}>
                      <td style={{ ...td, color: tokens.color.ink }}>{w.email}</td>
                      <td style={td}>{w.country ?? '—'}</td>
                      <td style={td}>{w.film_slug ?? '—'}</td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>
                        {new Date(w.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <hr style={divider} />

        {/* ── Events ──────────────────────────────────────────────────────── */}
        <section>
          <h2 style={{ ...sectionHead, marginBottom: '24px' }}>Events</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2px', marginBottom: '32px' }}>
            {[
              { label: 'Page views', value: stats.pageViews },
              { label: 'Trailer plays', value: stats.trailerPlays },
              { label: 'Checkout starts', value: stats.checkoutStarts },
              { label: 'Purchases', value: stats.completedPurchases },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{ background: tokens.color.surface, padding: '24px', display: 'flex', flexDirection: 'column', gap: '6px' }}
              >
                <span style={{ color: tokens.color.ink, fontSize: '36px', fontFamily: tokens.font.display, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {value.toLocaleString()}
                </span>
                <span style={{ color: tokens.color.muted2, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span style={{ color: tokens.color.ink, fontSize: '28px', fontFamily: tokens.font.display }}>
              {stats.conversionRate}%
            </span>
            <span style={{ color: tokens.color.muted2, fontSize: '13px' }}>
              page view → purchase conversion
            </span>
          </div>
        </section>

        <hr style={divider} />

        {/* ── Funnel ──────────────────────────────────────────────────────── */}
        <section>
          <h2 style={{ ...sectionHead, marginBottom: '24px' }}>Funnel</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>Step</th>
                  <th style={{ ...th, textAlign: 'right' }}>Count</th>
                  <th style={{ ...th, textAlign: 'right' }}>% of prev</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Page view',          value: funnel.pageViews },
                  { label: 'Trailer play',        value: funnel.trailerPlay },
                  { label: 'Trailer 50% watched', value: funnel.trailer50 },
                  { label: 'Buy button visible',  value: funnel.buyVisible },
                  { label: 'Buy button click',    value: funnel.buyClick },
                  { label: 'Purchase completed',  value: funnel.purchased },
                ].map(({ label, value }, i, arr) => {
                  const prev = i === 0 ? null : arr[i - 1].value
                  return (
                    <tr key={label}>
                      <td style={{ ...td, color: tokens.color.ink }}>{label}</td>
                      <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{value.toLocaleString()}</td>
                      <td style={{ ...td, textAlign: 'right', color: prev === null ? tokens.color.muted2 : value > 0 ? tokens.color.ink : tokens.color.muted2 }}>
                        {prev === null ? '—' : funnelPct(value, prev)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <hr style={divider} />

        {/* ── Trailer dropoff ──────────────────────────────────────────────── */}
        <section>
          <h2 style={{ ...sectionHead, marginBottom: '24px' }}>Trailer Dropoff</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>Progress</th>
                  <th style={{ ...th, textAlign: 'right' }}>Reached</th>
                  <th style={{ ...th, textAlign: 'right' }}>% of plays</th>
                </tr>
              </thead>
              <tbody>
                {trailerDropoff.map(({ pct, count }) => (
                  <tr key={pct}>
                    <td style={{ ...td, color: tokens.color.ink }}>{pct}%</td>
                    <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{count.toLocaleString()}</td>
                    <td style={{ ...td, textAlign: 'right', color: count > 0 ? tokens.color.ink : tokens.color.muted2 }}>
                      {funnelPct(count, funnel.trailerPlay)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <hr style={divider} />

        {/* ── Sources ─────────────────────────────────────────────────────── */}
        <section>
          <h2 style={{ ...sectionHead, marginBottom: '24px' }}>Sources</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2px', marginBottom: '32px' }}>
            <div style={{ background: tokens.color.surface, padding: '24px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ color: tokens.color.ink, fontSize: '36px', fontFamily: tokens.font.display, lineHeight: 1 }}>
                {returnVisitCount.toLocaleString()}
              </span>
              <span style={{ color: tokens.color.muted2, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Return visits
              </span>
            </div>
            <div style={{ background: tokens.color.surface, padding: '24px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ color: tokens.color.ink, fontSize: '36px', fontFamily: tokens.font.display, lineHeight: 1 }}>
                {returnConversions.toLocaleString()}
              </span>
              <span style={{ color: tokens.color.muted2, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Multi-visit conversions
              </span>
            </div>
            <div style={{ background: tokens.color.surface, padding: '24px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ color: tokens.color.ink, fontSize: '36px', fontFamily: tokens.font.display, lineHeight: 1 }}>
                {avgSecondsToPurchase !== null
                  ? avgSecondsToPurchase < 3600
                    ? `${Math.round(avgSecondsToPurchase / 60)}m`
                    : `${(avgSecondsToPurchase / 3600).toFixed(1)}h`
                  : '—'}
              </span>
              <span style={{ color: tokens.color.muted2, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Avg time to purchase
              </span>
            </div>
            <div style={{ background: tokens.color.surface, padding: '24px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ color: tokens.color.ink, fontSize: '36px', fontFamily: tokens.font.display, lineHeight: 1 }}>
                {funnelPct(returnConversions, returnVisitCount)}
              </span>
              <span style={{ color: tokens.color.muted2, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Return visitor conv. rate
              </span>
            </div>
          </div>

          {utmRows.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={th}>UTM Source</th>
                    <th style={{ ...th, textAlign: 'right' }}>Purchases</th>
                    <th style={{ ...th, textAlign: 'right' }}>% of total</th>
                  </tr>
                </thead>
                <tbody>
                  {utmRows.map(({ source, purchases: count }) => (
                    <tr key={source}>
                      <td style={{ ...td, color: tokens.color.ink }}>{source}</td>
                      <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{count}</td>
                      <td style={{ ...td, textAlign: 'right', color: tokens.color.ink }}>
                        {funnelPct(count, purchases.length)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </main>
  )
}
