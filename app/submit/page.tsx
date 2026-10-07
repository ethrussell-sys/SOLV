'use client'

import { useRef, useState, ChangeEvent, FormEvent } from 'react'
import { Wordmark } from '@/components/Wordmark'
import { tokens } from '@/lib/tokens'

type Phase = 'form' | 'uploading' | 'saving' | 'error'

const CURRENT_YEAR = new Date().getFullYear()
const DESC_MAX = 200
const RATINGS = ['G', 'PG', 'PG-13', 'R', 'NC-17'] as const
type Rating = typeof RATINGS[number]

const inputStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  borderBottom: `1px solid ${tokens.color.line}`,
  color: tokens.color.ink,
  fontSize: '16px',
  padding: '12px 0',
  width: '100%',
  outline: 'none',
  borderRadius: 0,
  transition: 'border-color 0.15s',
}

const labelStyle: React.CSSProperties = {
  color: tokens.color.muted2,
  fontSize: '11px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  display: 'block',
  marginBottom: '4px',
}

export default function SubmitPage() {
  const [phase, setPhase] = useState<Phase>('form')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [descLen, setDescLen] = useState(0)
  const [fileName, setFileName] = useState('')
  const [rating, setRating] = useState<Rating | ''>('')
  const [licensed, setLicensed] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    const fd = new FormData(e.currentTarget)
    const file = fileRef.current?.files?.[0]

    if (!file) { setError('Please select the film file.'); return }
    if (!rating) { setError('Please select a content rating.'); return }
    if (!licensed) { setError('Please confirm the licensing declaration before submitting.'); return }

    const year = Number(fd.get('year'))
    if (year && (year < 1888 || year > CURRENT_YEAR)) {
      setError(`Year must be between 1888 and ${CURRENT_YEAR}.`)
      return
    }

    try {
      // ── 1. Get presigned S3 upload URL ──────────────────────────────────
      setPhase('uploading')
      setProgress(0)

      const presignRes = await fetch('/api/submit/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || 'video/mp4',
        }),
      })

      if (!presignRes.ok) throw new Error('Could not initialise upload.')
      const { uploadUrl, fileKey } = await presignRes.json()

      // ── 2. Upload directly to S3 with XHR for progress ──────────────────
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4')
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100))
        }
        xhr.onload = () =>
          xhr.status === 200 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`))
        xhr.onerror = () => reject(new Error('Upload failed — check your connection.'))
        xhr.send(file)
      })

      // ── 3. Save metadata + send email ────────────────────────────────────
      setPhase('saving')

      const submitRes = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: fd.get('title'),
          director: fd.get('director'),
          year: year || null,
          description: fd.get('description'),
          trailerUrl: fd.get('trailerUrl'),
          contactEmail: fd.get('contactEmail'),
          rating,
          fileKey,
        }),
      })

      if (!submitRes.ok) {
        const body = await submitRes.json().catch(() => ({}))
        throw new Error(body.error ?? 'Submission failed. Please try again.')
      }

      window.location.replace('/submit/success')
    } catch (err) {
      setPhase('error')
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  // ── Uploading / saving ───────────────────────────────────────────────────
  if (phase === 'uploading' || phase === 'saving') {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 gap-8">
        <p
          className="text-4xl uppercase tracking-tight"
          style={{ fontFamily: tokens.font.display, color: phase === 'saving' ? tokens.color.blue : tokens.color.ink }}
        >
          {phase === 'saving' ? 'Saving…' : 'Uploading…'}
        </p>

        {phase === 'uploading' && (
          <div className="w-full max-w-sm flex flex-col gap-3">
            <div className="w-full h-px bg-neutral-900 relative overflow-hidden rounded-full">
              <div
                className="absolute left-0 top-0 h-full transition-all duration-150"
                style={{ width: `${progress}%`, backgroundColor: tokens.color.blue }}
              />
            </div>
            <span className="text-neutral-600 text-xs text-right tabular-nums">{progress}%</span>
          </div>
        )}
      </main>
    )
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-lg mx-auto px-6 py-16">

        {/* Header */}
        <div className="flex flex-col gap-6 mb-16">
          <Wordmark
            size={12}
            tracking="0.25em"
            color={tokens.color.blue}
            fontFamily={tokens.font.body}
            style={{ fontWeight: 700 }}
          />
          <h1
            className="text-6xl uppercase leading-none tracking-tight"
            style={{ fontFamily: tokens.font.display }}
          >
            Submit your film.
          </h1>
          <p className="text-neutral-500 text-sm leading-relaxed">
            We review every submission personally. If it&apos;s a fit, we&apos;ll be in touch within a few days.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-10">

          {/* Title */}
          <div>
            <label style={labelStyle}>Film title *</label>
            <input name="title" required style={inputStyle} placeholder="—" autoComplete="off" />
          </div>

          {/* Director */}
          <div>
            <label style={labelStyle}>Director</label>
            <input name="director" style={inputStyle} placeholder="—" autoComplete="off" />
          </div>

          {/* Year */}
          <div>
            <label style={labelStyle}>Year</label>
            <input
              name="year"
              type="number"
              min={1888}
              max={CURRENT_YEAR}
              style={inputStyle}
              placeholder={String(CURRENT_YEAR)}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Short description (max {DESC_MAX} characters)</label>
            <textarea
              name="description"
              maxLength={DESC_MAX}
              rows={3}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescLen(e.target.value.length)}
              style={{
                ...inputStyle,
                resize: 'none',
                lineHeight: '1.6',
                borderBottom: `1px solid ${tokens.color.line}`,
              }}
              placeholder="—"
            />
            <div className="text-right" style={{ color: descLen > DESC_MAX - 20 ? tokens.color.blue : tokens.color.muted2, fontSize: '11px', marginTop: '4px' }}>
              {descLen}/{DESC_MAX}
            </div>
          </div>

          {/* Trailer URL */}
          <div>
            <label style={labelStyle}>Trailer URL (YouTube or Vimeo)</label>
            <input
              name="trailerUrl"
              type="url"
              style={inputStyle}
              placeholder="https://youtube.com/watch?v=…"
            />
          </div>

          {/* Contact email */}
          <div>
            <label style={labelStyle}>Contact email *</label>
            <input
              name="contactEmail"
              type="email"
              required
              style={inputStyle}
              placeholder="you@studio.com"
            />
          </div>

          {/* Content rating */}
          <div>
            <label style={labelStyle}>Content rating *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {RATINGS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRating(r)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '6px',
                    border: `1px solid ${rating === r ? tokens.color.blue : tokens.color.line2}`,
                    backgroundColor: rating === r ? tokens.color.blue : 'transparent',
                    color: rating === r ? tokens.color.ink : tokens.color.muted2,
                    fontSize: '13px',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s, background-color 0.15s, color 0.15s',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
            <p style={{ color: tokens.color.muted2, fontSize: '11px', marginTop: '10px', marginBottom: 0, lineHeight: 1.5 }}>
              Self-declared by the filmmaker based on MPA content guidelines.
            </p>
          </div>

          {/* Film file */}
          <div>
            <label style={labelStyle}>Film file * (MP4, MOV, or MKV)</label>
            <input
              ref={fileRef}
              type="file"
              accept="video/mp4,video/quicktime,video/x-matroska,.mp4,.mov,.mkv"
              required
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{
                ...inputStyle,
                textAlign: 'left',
                cursor: 'pointer',
                color: fileName ? tokens.color.ink : tokens.color.muted2,
                paddingLeft: 0,
              }}
            >
              {fileName || 'Choose file…'}
            </button>
          </div>

          {/* Error */}
          {(phase === 'error' || error) && (
            <p style={{ color: '#ef4444', fontSize: '14px', margin: 0 }}>{error}</p>
          )}

          {/* Divider */}
          <div style={{ borderTop: `1px solid ${tokens.color.line}` }} />

          {/* Licensing declaration */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={licensed}
              onChange={(e) => setLicensed(e.target.checked)}
              style={{
                marginTop: '2px',
                width: '16px',
                height: '16px',
                flexShrink: 0,
                accentColor: tokens.color.blue,
                cursor: 'pointer',
              }}
            />
            <span style={{ color: licensed ? tokens.color.muted : tokens.color.muted2, fontSize: '13px', lineHeight: 1.6, transition: 'color 0.15s' }}>
              I confirm the content rating above is accurate and that all music and other third-party content in this film is licensed for commercial digital distribution.
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-4 rounded-2xl text-white font-semibold text-base tracking-wide active:scale-95 transition-transform"
            style={{ backgroundColor: tokens.color.blue }}
          >
            Submit film
          </button>

        </form>
      </div>
    </main>
  )
}
