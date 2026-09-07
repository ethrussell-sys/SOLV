import { getResend } from '@/lib/resend'

// const FROM = 'Sølv <purchases@solvscreen.com>' // restore once solvscreen.com is verified in Resend
const FROM = 'Sølv <onboarding@resend.dev>'

export async function sendPurchaseConfirmation({
  to,
  filmTitle,
  ownerLink,
  redemptionCode,
}: {
  to: string
  filmTitle: string
  ownerLink: string
  redemptionCode?: string
}) {
  console.log('[email] sending purchase confirmation', {
    to,
    filmTitle,
    from: FROM,
    apiKeySet: !!process.env.RESEND_API_KEY,
    apiKeyPrefix: process.env.RESEND_API_KEY?.slice(0, 8),
  })

  const redemptionBlock = redemptionCode ? `
<tr><td style="padding-bottom:16px"><p style="color:#525252;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 10px">Your permanent access code</p><p style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.12em;font-family:monospace;background-color:#0d0d0d;border:1px solid #222;border-radius:8px;padding:14px 20px;margin:0;display:inline-block">${redemptionCode}</p></td></tr>` : ''

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: `You own ${filmTitle} — download it now`,
    html: `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>You own ${filmTitle}</title></head>
<body style="background-color:#000000;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;width:100%"><tbody><tr><td align="center" style="padding:48px 24px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%"><tbody>
<tr><td style="padding-bottom:48px"><span style="color:#0A84FF;font-size:13px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase">S&Oslash;LV</span></td></tr>
<tr><td style="padding-bottom:12px"><h1 style="color:#ffffff;font-size:52px;font-weight:900;margin:0;line-height:1;letter-spacing:-1.5px">You own it.</h1></td></tr>
<tr><td style="padding-bottom:40px"><p style="color:#a3a3a3;font-size:18px;margin:0;line-height:1.5">${filmTitle}</p></td></tr>
<tr><td style="padding-bottom:40px"><hr style="border:none;border-top:1px solid #1c1c1c;margin:0"></td></tr>
<tr><td style="padding-bottom:24px"><p style="color:#525252;font-size:14px;margin:0;line-height:1.6">Your permanent owner link is below. Bookmark it — it never expires.</p></td></tr>
<tr><td style="padding-bottom:40px"><a href="${ownerLink}" style="background-color:#0A84FF;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:16px 32px;border-radius:12px;display:inline-block;letter-spacing:0.1px">Download ${filmTitle}</a></td></tr>
<tr><td style="padding-bottom:32px"><hr style="border:none;border-top:1px solid #1c1c1c;margin:0"></td></tr>${redemptionBlock}
<tr><td><p style="color:#404040;font-size:12px;margin:0;line-height:1.7">Your owner link is permanent — bookmark it and come back any time.${redemptionCode ? ' You can also use the code above at solvscreen.com/download as a backup.' : ''}<br><br>Questions? Reply to this email and we&apos;ll sort it out.</p></td></tr>
</tbody></table>
</td></tr></tbody></table>
</body></html>`,
  })

  if (error) {
    console.error('[email] resend error:', JSON.stringify(error, null, 2))
    throw new Error(`Resend error: ${JSON.stringify(error)}`)
  }

  console.log('[email] sent successfully, id:', data?.id)
}

export async function sendMagicLink({ to, verifyUrl }: { to: string; verifyUrl: string }) {
  console.log('[email] sending magic link', {
    to,
    from: FROM,
    apiKeySet: !!process.env.RESEND_API_KEY,
    apiKeyPrefix: process.env.RESEND_API_KEY?.slice(0, 8),
  })

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: 'Your Sølv download link',
    html: `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Your Sølv download link</title></head>
<body style="background-color:#000000;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;width:100%"><tbody><tr><td align="center" style="padding:48px 24px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%"><tbody>
<tr><td style="padding-bottom:48px"><span style="color:#0A84FF;font-size:13px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase">S&Oslash;LV</span></td></tr>
<tr><td style="padding-bottom:12px"><h1 style="color:#ffffff;font-size:44px;font-weight:900;margin:0;line-height:1;letter-spacing:-1.5px">Your downloads.</h1></td></tr>
<tr><td style="padding-bottom:40px"><p style="color:#a3a3a3;font-size:18px;margin:0;line-height:1.5">Tap below to see everything you've purchased.</p></td></tr>
<tr><td style="padding-bottom:40px"><hr style="border:none;border-top:1px solid #1c1c1c;margin:0"></td></tr>
<tr><td style="padding-bottom:24px"><p style="color:#525252;font-size:14px;margin:0;line-height:1.6">This link is good for 15 minutes and works once. If you didn't request it, ignore this email.</p></td></tr>
<tr><td style="padding-bottom:40px"><a href="${verifyUrl}" style="background-color:#0A84FF;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:16px 32px;border-radius:12px;display:inline-block;letter-spacing:0.1px">View your downloads</a></td></tr>
<tr><td style="padding-bottom:32px"><hr style="border:none;border-top:1px solid #1c1c1c;margin:0"></td></tr>
<tr><td><p style="color:#404040;font-size:12px;margin:0;line-height:1.7">Questions? Reply to this email and we&apos;ll sort it out.</p></td></tr>
</tbody></table>
</td></tr></tbody></table>
</body></html>`,
  })

  if (error) {
    console.error('[email] resend error:', JSON.stringify(error, null, 2))
    throw new Error(`Resend error: ${JSON.stringify(error)}`)
  }

  console.log('[email] sent successfully, id:', data?.id)
}
