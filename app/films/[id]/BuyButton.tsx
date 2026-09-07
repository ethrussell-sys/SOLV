'use client'

import { useEffect, useRef, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import type { Stripe, PaymentRequest } from '@stripe/stripe-js'
import { readUtm } from '@/lib/utm'
import { track } from '@/lib/track'
import { getVisitRecord } from '@/lib/session'
import { tokens } from '@/lib/tokens'

type Props = { filmId: string; price: number; title: string; filmSlug?: string }

type Phase =
  | 'checking'
  | 'apple-pay'
  | 'card'
  | 'processing'
  | 'success'
  | 'error'

function triggerDownload(url: string) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  if (isIOS) {
    // iOS Safari: open in new tab — user can save to Files via share sheet
    window.open(url, '_blank')
  } else {
    // Empty download="" forces download behavior without hardcoding a
    // filename — /api/download's Content-Disposition header supplies the
    // real, correctly-extensioned name.
    const a = document.createElement('a')
    a.href = url
    a.download = ''
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
}

function downloadUrlFor(purchaseToken: string): string {
  return `/api/download?token=${purchaseToken}`
}

export default function BuyButton({ filmId, price, title, filmSlug }: Props) {
  const [phase, setPhase] = useState<Phase>('checking')
  const [purchaseToken, setPurchaseToken] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const stripeRef = useRef<Stripe | null>(null)
  const prRef = useRef<PaymentRequest | null>(null)
  const piIdRef = useRef<string | null>(null)
  const clientSecretRef = useRef<string | null>(null)

  useEffect(() => {
    async function init() {
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
      if (!stripe) { setPhase('card'); return }
      stripeRef.current = stripe

      const pr = stripe.paymentRequest({
        country: 'US',
        currency: 'usd',
        total: { label: title, amount: Math.round(price * 100) },
        requestPayerEmail: true,
        requestPayerName: false,
      })

      const canPay = await pr.canMakePayment()
      if (!canPay) { setPhase('card'); return }

      // Apple Pay or Google Pay is available — pre-create the PaymentIntent
      const res = await fetch('/api/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filmId, ...readUtm() }),
      })
      if (!res.ok) { setPhase('card'); return }

      const { clientSecret, paymentIntentId } = await res.json()
      clientSecretRef.current = clientSecret
      piIdRef.current = paymentIntentId

      pr.on('paymentmethod', async (ev) => {
        setPhase('processing')

        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          { payment_method: ev.paymentMethod.id },
          { handleActions: false }
        )

        if (confirmError) {
          ev.complete('fail')
          setPhase('error')
          setErrorMsg(confirmError.message ?? 'Payment failed. Please try again.')
          return
        }

        // Handle 3DS if required (rare for wallet payments)
        if (paymentIntent?.status === 'requires_action') {
          const { error } = await stripe.confirmCardPayment(clientSecret)
          if (error) {
            ev.complete('fail')
            setPhase('error')
            setErrorMsg(error.message ?? 'Authentication failed.')
            return
          }
        }

        ev.complete('success')

        const purchaseRes = await fetch('/api/purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId,
            email: ev.payerEmail ?? '',
            ...readUtm(),
          }),
        })

        if (!purchaseRes.ok) {
          setPhase('error')
          setErrorMsg('Payment succeeded but download failed. Email support@solvscreen.com.')
          return
        }

        const { purchaseToken: token } = await purchaseRes.json()
        setPurchaseToken(token)
        setPhase('success')
        triggerDownload(downloadUrlFor(token))

        if (filmSlug) {
          sessionStorage.setItem(`solv_purchased_${filmSlug}`, '1')
          const visit = getVisitRecord(filmSlug)
          track({
            event_type: 'purchase_completed',
            film_id: filmId,
            film_slug: filmSlug,
            metadata: {
              visit_count: visit.count,
              first_visit_at: visit.firstAt,
              seconds_to_purchase: Math.round((Date.now() - new Date(visit.firstAt).getTime()) / 1000),
            },
          })
          if (visit.count > 1) {
            track({
              event_type: 'multi_visit_conversion',
              film_id: filmId,
              film_slug: filmSlug,
              metadata: {
                visit_count: visit.count,
                days_to_convert: Math.floor((Date.now() - new Date(visit.firstAt).getTime()) / 86_400_000),
              },
            })
          }
        }
      })

      prRef.current = pr
      setPhase('apple-pay')
    }

    init().catch(() => setPhase('card'))
  }, [filmId, price, title])

  async function handleRegularCheckout() {
    track({ event_type: 'buy_button_click', film_id: filmId, film_slug: filmSlug })
    setPhase('processing')
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filmId, ...readUtm() }),
    })
    if (!res.ok) { setPhase('error'); setErrorMsg('Checkout failed. Please try again.'); return }
    const { url } = await res.json()
    if (url) {
      if (filmSlug) sessionStorage.setItem('solv_checkout_slug', filmSlug)
      track({ event_type: 'purchase_initiated', film_id: filmId, film_slug: filmSlug })
      window.location.href = url
    }
  }

  // ── Confirmation overlay ──────────────────────────────────────────────────
  if (phase === 'success') {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center px-6 text-center">
        <div className="flex flex-col items-center gap-8">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center animate-pop-in"
            style={{ backgroundColor: tokens.color.blue }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <div className="flex flex-col gap-2">
            <h2
              className="text-6xl uppercase tracking-tight"
              style={{ fontFamily: tokens.font.display }}
            >
              You own it.
            </h2>
            <p className="text-neutral-400 text-base">{title}</p>
          </div>

          {purchaseToken && (
            <>
              <button
                onClick={() => triggerDownload(downloadUrlFor(purchaseToken))}
                className="w-full max-w-xs py-4 rounded-2xl text-white font-semibold text-base tracking-wide active:scale-95 transition-transform"
                style={{ backgroundColor: tokens.color.blue }}
              >
                Download to device
              </button>

              <p className="text-neutral-500 text-xs text-center max-w-xs">
                Download didn&apos;t start?{' '}
                <a
                  href={downloadUrlFor(purchaseToken)}
                  style={{ color: tokens.color.blue }}
                  className="underline"
                >
                  Tap to retry
                </a>
                {' '}— or find it anytime in your confirmation email.
              </p>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-red-400 text-sm text-center">{errorMsg}</p>
        <button
          onClick={() => setPhase('card')}
          className="w-full py-4 rounded-2xl text-white text-lg font-semibold"
          style={{ backgroundColor: tokens.color.blue }}
        >
          Try again
        </button>
      </div>
    )
  }

  const isProcessing = phase === 'processing'

  // ── Apple Pay / Google Pay button ─────────────────────────────────────────
  if (phase === 'apple-pay' || phase === 'checking') {
    return (
      <button
        onClick={() => {
          track({ event_type: 'buy_button_click', film_id: filmId, film_slug: filmSlug })
          prRef.current?.show()
        }}
        onMouseEnter={() => track({ event_type: 'buy_button_hover', film_id: filmId, film_slug: filmSlug })}
        disabled={isProcessing || phase === 'checking'}
        className="w-full py-[18px] rounded-2xl font-semibold tracking-wide active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-40"
        style={{ backgroundColor: tokens.color.bg, border: `1.5px solid ${tokens.color.line2}` }}
        aria-label={`Buy ${title} with Apple Pay`}
      >
        {isProcessing ? (
          <span className="text-neutral-400 text-sm">Processing…</span>
        ) : (
          <>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.37 2.83zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            <span className="text-white text-lg">Pay</span>
          </>
        )}
      </button>
    )
  }

  // ── Regular checkout fallback ─────────────────────────────────────────────
  return (
    <button
      onClick={handleRegularCheckout}
      onMouseEnter={() => track({ event_type: 'buy_button_hover', film_id: filmId, film_slug: filmSlug })}
      disabled={isProcessing}
      className="solv-buy-btn w-full disabled:opacity-60"
      style={{
        height: '48px',
        borderRadius: '13px',
        border: 'none',
        backgroundColor: '#0071E3',
        boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
        color: '#fff',
        fontWeight: 600,
        fontSize: '16px',
        letterSpacing: '-0.01em',
        cursor: isProcessing ? 'default' : 'pointer',
      }}
      aria-label={`Buy ${title} for $${price.toFixed(2)}`}
    >
      {isProcessing ? 'Processing…' : `Own it — $${price.toFixed(2)}`}
    </button>
  )
}
