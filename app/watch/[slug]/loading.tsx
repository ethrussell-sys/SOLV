import { Skeleton } from '@/components/Skeleton'
import { tokens } from '@/lib/tokens'

export default function WatchLoading() {
  return (
    <main
      style={{
        backgroundColor: tokens.color.bg,
        color: tokens.color.ink,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '48px 24px 40px',
          gap: 20,
        }}
      >
        <Skeleton width={240} height={56} radius={tokens.radius.sm} />
        <Skeleton width={160} height={12} radius={tokens.radius.sm} />
        <Skeleton width="100%" height={0} style={{ paddingTop: '56.25%', borderRadius: tokens.radius.lg }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', margin: '32px 0' }}>
          <Skeleton width={260} height={12} />
          <Skeleton width={220} height={12} />
        </div>
        <Skeleton width="100%" height={56} radius={tokens.radius.lg} />
      </div>
    </main>
  )
}
