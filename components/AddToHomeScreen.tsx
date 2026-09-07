'use client'

import { useEffect, useState } from 'react'
import { tokens } from '@/lib/tokens'

type Platform = 'ios' | 'android' | null

export default function AddToHomeScreen() {
  const [platform, setPlatform] = useState<Platform>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return
    // Check both keys so a dismissal from before the rename still sticks.
    if (localStorage.getItem('solv-a2hs-dismissed') || localStorage.getItem('arclo-a2hs-dismissed')) return

    const ua = navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream
    const isAndroidChrome = /Android/.test(ua) && /Chrome/.test(ua)

    if (isIOS) {
      const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua)
      // Deliberate: navigator.userAgent only exists client-side, and this
      // component is server-rendered on first load. Moving this into a
      // lazy useState initializer (the usual fix for this rule) would run
      // during SSR too — either crashing on missing `navigator`, or, if
      // guarded, rendering `false` on the server and the real value on the
      // client's first paint for every iOS Safari visitor, which is a
      // genuine hydration mismatch. The effect-based check here is the
      // hydration-safe pattern: server and first client paint agree
      // (nothing shown), and this only ever adds the banner post-mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (isSafari) { setPlatform('ios'); setVisible(true) }
    } else if (isAndroidChrome) {
      const handler = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e)
        setPlatform('android')
        setVisible(true)
      }
      window.addEventListener('beforeinstallprompt', handler)
      return () => window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  function dismiss() {
    localStorage.setItem('solv-a2hs-dismissed', '1')
    setVisible(false)
  }

  async function installAndroid() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    dismiss()
  }

  if (!visible || !platform) return null

  return (
    <div
      className="fixed bottom-28 left-4 right-4 z-40 rounded-2xl p-4 flex items-start gap-3"
      style={{ backgroundColor: tokens.color.surface2, border: `1px solid ${tokens.color.line}` }}
    >
      <img
        src="/solv-app-icon.png"
        alt="Sølv"
        className="w-10 h-10 rounded-xl flex-shrink-0"
      />

      <div className="flex-1 flex flex-col gap-1.5">
        <span className="text-white text-sm font-semibold">Add Sølv to your home screen</span>
        {platform === 'ios' ? (
          <span className="text-neutral-500 text-xs leading-relaxed">
            Tap{' '}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle' }}>
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
            </svg>
            {' '}then{' '}
            <strong className="text-neutral-300">Add to Home Screen</strong>
          </span>
        ) : (
          <button
            onClick={installAndroid}
            className="text-xs font-semibold self-start px-3 py-1.5 rounded-lg mt-0.5"
            style={{ backgroundColor: tokens.color.blue, color: tokens.color.ink }}
          >
            Add to Home Screen
          </button>
        )}
      </div>

      <button
        onClick={dismiss}
        className="text-neutral-600 hover:text-neutral-400 text-xl leading-none mt-0.5 transition-colors"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}
