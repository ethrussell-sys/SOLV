import type { AnchorHTMLAttributes, ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import Link from 'next/link'
import { tokens } from '@/lib/tokens'

type Variant = 'primary' | 'outline' | 'ghost'

type CommonProps = {
  variant?: Variant
  fullWidth?: boolean
  children: ReactNode
  className?: string
  style?: CSSProperties
}

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined }

type ButtonAsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string }

type Props = ButtonAsButton | ButtonAsLink

const base: CSSProperties = {
  fontFamily: tokens.font.body,
  fontSize: 16,
  fontWeight: 600,
  letterSpacing: '0.02em',
  borderRadius: tokens.radius.lg,
  padding: '16px 24px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  transition: 'transform 0.15s ease, opacity 0.15s ease',
  cursor: 'pointer',
  border: 'none',
  textDecoration: 'none',
}

const variants: Record<Variant, CSSProperties> = {
  primary: { backgroundColor: tokens.color.white, color: tokens.color.bg },
  outline: { backgroundColor: tokens.color.bg, color: tokens.color.ink, border: `1.5px solid ${tokens.color.line2}` },
  ghost: { backgroundColor: 'transparent', color: tokens.color.muted, padding: '8px 16px' },
}

export function Button({ variant = 'primary', fullWidth, children, className, style, ...rest }: Props) {
  const combined: CSSProperties = {
    ...base,
    ...variants[variant],
    ...(fullWidth ? { width: '100%' } : {}),
    ...style,
  }

  if ('href' in rest && rest.href) {
    const { href, ...anchorRest } = rest as ButtonAsLink
    return (
      <Link href={href} className={className} style={combined} {...anchorRest}>
        {children}
      </Link>
    )
  }

  const buttonRest = rest as ButtonHTMLAttributes<HTMLButtonElement>
  return (
    <button className={className} style={combined} {...buttonRest}>
      {children}
    </button>
  )
}
