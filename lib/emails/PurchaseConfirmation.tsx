import * as React from 'react'

type Props = {
  filmTitle: string
  ownerLink: string
  redemptionCode?: string
}

export function PurchaseConfirmationEmail({ filmTitle, ownerLink, redemptionCode }: Props) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>You own {filmTitle}</title>
      </head>
      <body style={body}>
        <table width="100%" cellPadding={0} cellSpacing={0} bgcolor="#000000" style={outer}>
          <tbody>
            <tr>
              <td align="center" style={{ padding: '48px 24px' }}>
                <table width="100%" cellPadding={0} cellSpacing={0} style={card}>
                  <tbody>

                    {/* Wordmark */}
                    <tr>
                      <td style={{ paddingBottom: '48px' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="https://solvscreen.com/solv-wordmark-email.png" width={47} height={24} alt="sølv" style={wordmark} />
                      </td>
                    </tr>

                    {/* Headline */}
                    <tr>
                      <td style={{ paddingBottom: '12px' }}>
                        <h1 style={headline}>You own it.</h1>
                      </td>
                    </tr>

                    {/* Film title */}
                    <tr>
                      <td style={{ paddingBottom: '40px' }}>
                        <p style={filmName}>{filmTitle}</p>
                      </td>
                    </tr>

                    {/* Divider */}
                    <tr>
                      <td style={{ paddingBottom: '40px' }}>
                        <hr style={divider} />
                      </td>
                    </tr>

                    {/* Download instruction */}
                    <tr>
                      <td style={{ paddingBottom: '24px' }}>
                        <p style={instruction}>
                          Your download link (up to 3 downloads).
                        </p>
                      </td>
                    </tr>

                    {/* CTA */}
                    <tr>
                      <td style={{ paddingBottom: '40px' }}>
                        <a href={ownerLink} style={button}>
                          Download {filmTitle}
                        </a>
                      </td>
                    </tr>

                    {/* Divider */}
                    <tr>
                      <td style={{ paddingBottom: '32px' }}>
                        <hr style={divider} />
                      </td>
                    </tr>

                    {/* Redemption code */}
                    {redemptionCode && (
                      <tr>
                        <td style={{ paddingBottom: '16px' }}>
                          <p style={codeLabel}>Your access code</p>
                          <p style={codeBlock}>{redemptionCode}</p>
                        </td>
                      </tr>
                    )}

                    {/* Fine print */}
                    <tr>
                      <td>
                        <p style={finePrint}>
                          Your download link (up to 3 downloads) — bookmark it so you can come back to it.{redemptionCode ? ' You can also use the code above at solvscreen.com/download as a backup.' : ''}
                          <br /><br />
                          Questions? Reply to this email and we&apos;ll sort it out.
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

// ── Styles ────────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: '#000000',
  margin: 0,
  padding: 0,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  WebkitTextSizeAdjust: '100%',
}

const outer: React.CSSProperties = {
  backgroundColor: '#000000',
  width: '100%',
}

const card: React.CSSProperties = {
  maxWidth: '480px',
  width: '100%',
}

const wordmark: React.CSSProperties = {
  display: 'block', border: 0, height: '24px', width: '47px', backgroundColor: '#000000',
  // shown in place of the logo when images are blocked
  color: '#ffffff', fontFamily: "Georgia, 'Times New Roman', serif", fontSize: '20px', lineHeight: '24px',
}

const headline: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '52px',
  fontWeight: 900,
  margin: 0,
  lineHeight: 1,
  letterSpacing: '-1.5px',
}

const filmName: React.CSSProperties = {
  color: '#a3a3a3',
  fontSize: '18px',
  margin: 0,
  lineHeight: 1.5,
}

const divider: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid #1c1c1c',
  margin: 0,
}

const instruction: React.CSSProperties = {
  color: '#525252',
  fontSize: '14px',
  margin: 0,
  lineHeight: 1.6,
}

const button: React.CSSProperties = {
  backgroundColor: '#ffffff',
  color: '#000000',
  fontSize: '16px',
  fontWeight: 600,
  textDecoration: 'none',
  padding: '16px 32px',
  borderRadius: '12px',
  display: 'inline-block',
  letterSpacing: '0.1px',
}

const codeLabel: React.CSSProperties = {
  color: '#525252',
  fontSize: '11px',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  margin: '0 0 10px',
}

const codeBlock: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '20px',
  fontWeight: 700,
  letterSpacing: '0.12em',
  fontFamily: 'monospace',
  backgroundColor: '#0d0d0d',
  border: '1px solid #222',
  borderRadius: '8px',
  padding: '14px 20px',
  margin: 0,
  display: 'inline-block',
}

const finePrint: React.CSSProperties = {
  color: '#404040',
  fontSize: '12px',
  margin: 0,
  lineHeight: 1.7,
}
