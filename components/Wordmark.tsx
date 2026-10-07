// The serif "sølv" mark, the only logo. The PNG is white on transparent.
export function Wordmark({
  height = 28,
  className,
  style,
}: {
  height?: number
  className?: string
  style?: React.CSSProperties
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/solv-wordmark_2.png"
      alt="sølv"
      className={className}
      style={{ height, width: 'auto', display: 'block', ...style }}
    />
  )
}
