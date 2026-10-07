import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { tokens } from '@/lib/tokens'

// Minimal markdown → React renderer for long-form legal copy (Terms,
// Privacy). Supports what those documents use: #–#### headings,
// paragraphs, -/*/1. lists (one level of nesting by indentation), **bold**,
// *italic*, [links](href), bare emails, and --- rules. Deliberately tiny
// instead of a dependency — these pages are static and server-rendered.

export const mdStyles = {
  h1: {
    fontFamily: tokens.font.display,
    fontSize: 'clamp(2.8rem, 8vw, 4rem)',
    textTransform: 'uppercase',
    lineHeight: 1,
    letterSpacing: '-0.5px',
    margin: 0,
  },
  h2: {
    color: tokens.color.ink,
    fontSize: '18px',
    fontWeight: 700,
    letterSpacing: '-0.2px',
    margin: '28px 0 0',
    lineHeight: 1.3,
  },
  h3: {
    color: tokens.color.ink,
    fontSize: '15px',
    fontWeight: 600,
    margin: '12px 0 0',
    lineHeight: 1.4,
  },
  body: {
    color: tokens.color.muted2,
    fontSize: '14px',
    lineHeight: 1.8,
    margin: 0,
  },
  strong: { color: tokens.color.muted, fontWeight: 500 },
  link: { color: tokens.color.ink, textDecoration: 'underline' },
  list: { paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' },
  divider: { border: 'none', borderTop: `1px solid ${tokens.color.line}`, margin: '16px 0' },
} satisfies Record<string, CSSProperties>

type Block =
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'para'; text: string }
  | { kind: 'hr' }
  | { kind: 'list'; ordered: boolean; items: { text: string; children: string[]; childOrdered: boolean }[] }

const LIST_RE = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/

function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, '\n').split('\n')
  const blocks: Block[] = []
  let para: string[] = []

  const flushPara = () => {
    if (para.length) blocks.push({ kind: 'para', text: para.join(' ') })
    para = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) { flushPara(); continue }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) { flushPara(); blocks.push({ kind: 'hr' }); continue }

    const heading = /^(#{1,6})\s+(.*?)\s*#*$/.exec(trimmed)
    if (heading) {
      flushPara()
      blocks.push({ kind: 'heading', level: heading[1].length, text: heading[2] })
      continue
    }

    const item = LIST_RE.exec(line)
    if (item && item[1].length < 2) {
      flushPara()
      const ordered = /\d/.test(item[2])
      const list: Extract<Block, { kind: 'list' }> = { kind: 'list', ordered, items: [] }
      let current = { text: item[3], children: [] as string[], childOrdered: false }
      list.items.push(current)

      while (i + 1 < lines.length) {
        const next = lines[i + 1]
        if (!next.trim()) {
          // A blank line only continues the list if another item of the
          // same list follows (a nested item, or a top-level one of the
          // same bullet/number type).
          const after = lines[i + 2] === undefined ? null : LIST_RE.exec(lines[i + 2])
          if (after && (after[1].length >= 2 || /\d/.test(after[2]) === ordered)) { i++; continue }
          break
        }
        const m = LIST_RE.exec(next)
        if (m && m[1].length >= 2) {
          current.childOrdered = /\d/.test(m[2])
          current.children.push(m[3])
        } else if (m) {
          if (/\d/.test(m[2]) !== ordered) break
          current = { text: m[3], children: [], childOrdered: false }
          list.items.push(current)
        } else if (/^\s+/.test(next) || !/^(#|-{3,})/.test(next.trim())) {
          // Lazy continuation of the previous item's text.
          if (current.children.length) current.children[current.children.length - 1] += ' ' + next.trim()
          else current.text += ' ' + next.trim()
        } else {
          break
        }
        i++
      }
      blocks.push(list)
      continue
    }

    para.push(trimmed)
  }
  flushPara()
  return blocks
}

const INLINE_RE =
  /(\*\*|__)(.+?)\1|\[([^\]]+)\]\(([^)\s]+)\)|(\*|_)([^*_]+?)\5|([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g

function renderInline(text: string, keyPrefix = ''): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let n = 0
  for (const m of text.matchAll(INLINE_RE)) {
    const idx = m.index ?? 0
    if (idx > last) out.push(text.slice(last, idx))
    const key = `${keyPrefix}${n++}`
    if (m[2] !== undefined) {
      out.push(<strong key={key} style={mdStyles.strong}>{renderInline(m[2], key + '-')}</strong>)
    } else if (m[3] !== undefined) {
      const href = m[4]
      const label = renderInline(m[3], key + '-')
      out.push(
        href.startsWith('/')
          ? <Link key={key} href={href} style={mdStyles.link}>{label}</Link>
          : <a key={key} href={href} style={mdStyles.link}>{label}</a>
      )
    } else if (m[6] !== undefined) {
      out.push(<em key={key}>{renderInline(m[6], key + '-')}</em>)
    } else if (m[7] !== undefined) {
      out.push(<a key={key} href={`mailto:${m[7]}`} style={mdStyles.link}>{m[7]}</a>)
    }
    last = idx + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

export function Markdown({ source, skipFirstH1 = false }: { source: string; skipFirstH1?: boolean }) {
  let blocks = parseBlocks(source)
  if (skipFirstH1) {
    const i = blocks.findIndex((b) => b.kind === 'heading' && b.level === 1)
    if (i !== -1) blocks = blocks.filter((_, j) => j !== i)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {blocks.map((b, i) => {
        switch (b.kind) {
          case 'heading':
            if (b.level === 1) return <h1 key={i} style={mdStyles.h1}>{renderInline(b.text)}</h1>
            if (b.level === 2) return <h2 key={i} style={mdStyles.h2}>{renderInline(b.text)}</h2>
            return <h3 key={i} style={mdStyles.h3}>{renderInline(b.text)}</h3>
          case 'hr':
            return <hr key={i} style={mdStyles.divider} />
          case 'para':
            return <p key={i} style={mdStyles.body}>{renderInline(b.text)}</p>
          case 'list': {
            const Tag = b.ordered ? 'ol' : 'ul'
            return (
              <Tag key={i} style={{ ...mdStyles.body, ...mdStyles.list, listStyleType: b.ordered ? 'decimal' : 'disc' }}>
                {b.items.map((item, j) => {
                  const Child = item.childOrdered ? 'ol' : 'ul'
                  return (
                    <li key={j}>
                      {renderInline(item.text)}
                      {item.children.length > 0 && (
                        <Child style={{ ...mdStyles.list, marginTop: '8px', listStyleType: item.childOrdered ? 'lower-alpha' : 'circle' }}>
                          {item.children.map((c, k) => <li key={k}>{renderInline(c)}</li>)}
                        </Child>
                      )}
                    </li>
                  )
                })}
              </Tag>
            )
          }
        }
      })}
    </div>
  )
}
