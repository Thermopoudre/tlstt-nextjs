import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import nodemailer from 'nodemailer'
import { getSmtpConfig } from '@/lib/email'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tlstt-nextjs.vercel.app'

export async function POST(request: NextRequest) {
  try {
    const smtpConfig = await getSmtpConfig()
    if (!smtpConfig.configured) {
      return NextResponse.json({ skipped: true, reason: 'SMTP non configure' })
    }

    const supabase = await createClient()
    const body = await request.json()
    const { type, title, url, excerpt } = body

    if (!type || !title || !url) {
      return NextResponse.json({ error: 'type, title et url requis' }, { status: 400 })
    }

    // Get subscribers
    const { data: subscribers } = await supabase
      .from('newsletter_subscribers')
      .select('email, first_name')
      .eq('is_subscribed', true)

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ sent: 0, reason: 'Aucun abonne' })
    }

    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: { user: smtpConfig.user, pass: smtpConfig.pass },
    })
    const typeLabel = type === 'article' ? 'Nouvel article' : type === 'newsletter' ? 'Nouvelle newsletter' : 'Nouvelle publication'
    const fullUrl = url.startsWith('http') ? url : `${SITE_URL}${url}`
    let sent = 0

    const html = `
<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:system-ui,sans-serif;">
<div style="max-width:500px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
  <div style="background:#0a0a0a;padding:20px;text-align:center;">
    <h2 style="color:#3b9fd8;margin:0;font-size:20px;">TLSTT</h2>
  </div>
  <div style="padding:25px;">
    <p style="color:#666;font-size:14px;margin:0 0 8px;">${typeLabel}</p>
    <h1 style="color:#1a1a2e;font-size:20px;margin:0 0 15px;">${title}</h1>
    ${excerpt ? `<p style="color:#666;font-size:14px;line-height:1.5;">${excerpt.substring(0, 200)}${excerpt.length > 200 ? '...' : ''}</p>` : ''}
    <div style="text-align:center;margin:25px 0;">
      <a href="${fullUrl}" style="display:inline-block;background:#3b9fd8;color:#fff;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:bold;">Lire la suite</a>
    </div>
  </div>
  <div style="background:#f8f8f8;padding:15px;text-align:center;">
    <p style="color:#999;font-size:11px;margin:0;">TLSTT - Toulon La Seyne Tennis de Table</p>
  </div>
</div>
</body></html>`

    // Send in batch (BCC for privacy)
    const batchSize = 50
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize)
      try {
        await transporter.sendMail({
          from: `"TLSTT" <${smtpConfig.from || smtpConfig.user}>`,
          bcc: batch.map(s => s.email).join(','),
          subject: `[TLSTT] ${typeLabel} : ${title}`,
          html,
        })
        sent += batch.length
      } catch {
        // Continue even if one batch fails
      }
    }

    return NextResponse.json({ sent, total: subscribers.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
