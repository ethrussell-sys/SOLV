import { serverClient } from '@/lib/supabase'
import { getResend } from '@/lib/resend'

function toSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function uniqueSlug(base: string): Promise<string> {
  const db = serverClient()
  let candidate = base
  let suffix = 2
  while (true) {
    const { data } = await db.from('films').select('id').eq('slug', candidate).maybeSingle()
    if (!data) return candidate
    candidate = `${base}-${suffix++}`
  }
}

export async function POST(request: Request) {
  const body = await request.json()
  console.log('[submit] received body:', JSON.stringify({ ...body, fileKey: body.fileKey?.slice(0, 40) }))

  const { title, director, year, description, trailerUrl, contactEmail, rating, fileKey } = body

  const VALID_RATINGS = ['G', 'PG', 'PG-13', 'R', 'NC-17']

  if (!title || !fileKey || !contactEmail) {
    console.log('[submit] validation failed — missing fields:', { title: !!title, fileKey: !!fileKey, contactEmail: !!contactEmail })
    return Response.json({ error: 'title, fileKey, and contactEmail are required' }, { status: 400 })
  }
  if (!rating || !VALID_RATINGS.includes(rating)) {
    console.log('[submit] validation failed — bad rating:', rating)
    return Response.json({ error: 'A valid content rating is required' }, { status: 400 })
  }

  console.log('[submit] generating slug for:', title)
  const slug = await uniqueSlug(toSlug(title))
  console.log('[submit] slug:', slug)

  const { error: dbError } = await serverClient()
    .from('films')
    .insert({
      title,
      slug,
      director: director || null,
      year: year || null,
      description: description || null,
      trailer_url: trailerUrl || null,
      contact_email: contactEmail,
      rating,
      file_key: fileKey,
      status: 'pending',
      price: 1.99,
    })

  if (dbError) {
    console.error('[submit] supabase insert error:', JSON.stringify(dbError))
    return Response.json({ error: `Failed to save submission: ${dbError.message}` }, { status: 500 })
  }

  console.log('[submit] DB insert succeeded, sending email to:', contactEmail)

  const byline = director ? `${director}, your` : 'Your'
  const { error: emailError } = await getResend().emails.send({
    from: 'Sølv <onboarding@resend.dev>',
    to: contactEmail,
    subject: `We have your film — ${title}`,
    html: `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Film received</title></head>
<body style="background:#000;margin:0;padding:48px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tbody><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px">
<tbody>
<tr><td style="padding-bottom:48px"><span style="color:#0A84FF;font-size:13px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase">S&Oslash;LV</span></td></tr>
<tr><td style="padding-bottom:12px"><h1 style="color:#fff;font-size:48px;font-weight:900;margin:0;line-height:1;letter-spacing:-1.5px">We have your film.</h1></td></tr>
<tr><td style="padding-bottom:40px"><p style="color:#a3a3a3;font-size:18px;margin:0;line-height:1.5">${byline} submission of <em style="color:#fff">${title}</em> has been received.</p></td></tr>
<tr><td style="padding-bottom:40px"><hr style="border:none;border-top:1px solid #1c1c1c;margin:0"></td></tr>
<tr><td style="padding-bottom:40px"><p style="color:#525252;font-size:14px;margin:0;line-height:1.7">Our team reviews every submission personally. If your film is a fit for Sølv, we'll be in touch within a few days to discuss next steps.</p></td></tr>
<tr><td style="padding-bottom:40px"><hr style="border:none;border-top:1px solid #1c1c1c;margin:0"></td></tr>
<tr><td><p style="color:#404040;font-size:12px;margin:0;line-height:1.7">Questions? Reply to this email.</p></td></tr>
</tbody></table>
</td></tr></tbody></table>
</body></html>`,
  })

  if (emailError) {
    console.error('[submit] confirmation email failed:', JSON.stringify(emailError))
  }

  console.log('[submit] done — returning ok')
  return Response.json({ ok: true })
}
