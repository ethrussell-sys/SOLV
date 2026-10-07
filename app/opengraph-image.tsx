import { ImageResponse } from 'next/og'
import { join } from 'node:path'
import { readFile } from 'node:fs/promises'
import { tokens } from '@/lib/tokens'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage() {
  const wordmark = await readFile(join(process.cwd(), 'public/solv-wordmark_2.png'), 'base64')

  return new ImageResponse(
    (
      <div
        style={{
          background: tokens.color.bg,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img src={`data:image/png;base64,${wordmark}`} alt="sølv" width={394} height={200} />
        <div
          style={{
            marginTop: 28,
            color: tokens.color.muted,
            fontSize: 28,
            fontFamily: 'sans-serif',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
          }}
        >
          Own the films that matter
        </div>
      </div>
    ),
    { ...size }
  )
}
