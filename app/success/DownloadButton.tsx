'use client'

import { useEffect } from 'react'
import { tokens } from '@/lib/tokens'

type Props = { title: string; filmId: string; purchaseToken: string }

export default function DownloadButton({ title, filmId, purchaseToken }: Props) {
  // Stash the purchase token too, in case a future in-page re-download
  // affordance wants it without a fresh server round trip — the download
  // link below doesn't need this, since it carries the token itself.
  useEffect(() => {
    try {
      sessionStorage.setItem(`solv_purchase_token_${filmId}`, purchaseToken)
    } catch {
      // sessionStorage unavailable (private mode, etc.) — non-critical
    }
  }, [filmId, purchaseToken])

  return (
    <a
      href={`/api/download?token=${purchaseToken}`}
      download
      className="w-full py-4 rounded-2xl text-white text-lg font-semibold tracking-wide text-center active:scale-95 transition-transform block"
      style={{ backgroundColor: tokens.color.blue }}
    >
      Download {title}
    </a>
  )
}
