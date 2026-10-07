import * as React from 'react'

type Props = {
  filmTitle: string
  directorName: string
}

export function FilmSubmissionEmail({ filmTitle, directorName }: Props) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Film received — {filmTitle}</title>
      </head>
      <body style={body}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={outer}>
          <tbody>
            <tr>
              <td align="center" style={{ padding: '48px 24px' }}>
                <table width="100%" cellPadding={0} cellSpacing={0} style={card}>
                  <tbody>

                    <tr>
                      <td style={{ paddingBottom: '48px' }}>
                        <span style={wordmark}>S&Oslash;LV</span>
                      </td>
                    </tr>

                    <tr>
                      <td style={{ paddingBottom: '12px' }}>
                        <h1 style={headline}>We have your film.</h1>
                      </td>
                    </tr>

                    <tr>
                      <td style={{ paddingBottom: '40px' }}>
                        <p style={sub}>
                          {directorName ? `${directorName}, your` : 'Your'} submission of{' '}
                          <em style={{ color: '#ffffff', fontStyle: 'italic' }}>{filmTitle}</em>{' '}
                          has been received.
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td style={{ paddingBottom: '40px' }}>
                        <hr style={divider} />
                      </td>
                    </tr>

                    <tr>
                      <td style={{ paddingBottom: '40px' }}>
                        <p style={body2}>
                          Our team reviews every submission personally. If your film is a fit for Sølv, we&apos;ll be in touch within a few days to discuss next steps.
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td style={{ paddingBottom: '40px' }}>
                        <hr style={divider} />
                      </td>
                    </tr>

                    <tr>
                      <td>
                        <p style={finePrint}>
                          Questions? Reply to this email.
                        </p>
                      </td>
                    </tr>

                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  )
}

const body: React.CSSProperties = {
  backgroundColor: '#000000',
  margin: 0,
  padding: 0,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  WebkitTextSizeAdjust: '100%',
}

const outer: React.CSSProperties = { backgroundColor: '#000000', width: '100%' }
const card: React.CSSProperties = { maxWidth: '480px', width: '100%' }

const wordmark: React.CSSProperties = {
  color: '#0A84FF',
  fontSize: '13px',
  fontWeight: 700,
  letterSpacing: '0.25em',
  textTransform: 'uppercase',
}

const headline: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '48px',
  fontWeight: 900,
  margin: 0,
  lineHeight: 1,
  letterSpacing: '-1.5px',
}

const sub: React.CSSProperties = {
  color: '#a3a3a3',
  fontSize: '18px',
  margin: 0,
  lineHeight: 1.5,
}

const body2: React.CSSProperties = {
  color: '#525252',
  fontSize: '14px',
  margin: 0,
  lineHeight: 1.7,
}

const divider: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid #1c1c1c',
  margin: 0,
}

const finePrint: React.CSSProperties = {
  color: '#404040',
  fontSize: '12px',
  margin: 0,
  lineHeight: 1.7,
}
