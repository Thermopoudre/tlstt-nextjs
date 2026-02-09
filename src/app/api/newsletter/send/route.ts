import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import nodemailer from 'nodemailer'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tlstt-nextjs.vercel.app'
const BATCH_SIZE = 50 // emails par lot
const DELAY_BETWEEN_BATCHES = 2000 // ms

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

function buildEmailHtml(newsletter: any, unsubscribeUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #0a0a0a, #1a1a2e); padding: 30px; text-align: center; }
    .header img { height: 60px; border-radius: 50%; }
    .header h1 { color: #3b9fd8; font-size: 24px; margin: 15px 0 5px; }
    .header p { color: #888; font-size: 14px; margin: 0; }
    .content { padding: 30px; }
    .content h2 { color: #1a1a2e; font-size: 22px; margin-bottom: 20px; }
    .content img { max-width: 100%; border-radius: 8px; margin: 15px 0; }
    .footer { background: #0a0a0a; padding: 20px 30px; text-align: center; }
    .footer p { color: #666; font-size: 12px; margin: 5px 0; }
    .footer a { color: #3b9fd8; text-decoration: none; }
    .btn { display: inline-block; background: #3b9fd8; color: #fff !important; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${SITE_URL}/logo.jpeg" alt="TLSTT" />
      <h1>TLSTT</h1>
      <p>Toulon La Seyne Tennis de Table</p>
    </div>
    <div class="content">
      ${newsletter.cover_image_url ? `<img src="${newsletter.cover_image_url}" alt="${newsletter.title}" />` : ''}
      <h2>${newsletter.title}</h2>
      ${newsletter.content}
      <div style="text-align: center; margin-top: 25px;">
        <a href="${SITE_URL}/newsletters/${newsletter.id}" class="btn">Lire sur le site</a>
      </div>
    </div>
    <div class="footer">
      <p>TLSTT - Toulon La Seyne Tennis de Table</p>
      <p>Gymnase Leo Lagrange, La Seyne-sur-Mer 83500</p>
      <p><a href="${unsubscribeUrl}">Se desabonner</a> | <a href="${SITE_URL}">Visiter le site</a></p>
    </div>
  </div>
</body>
</html>`
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('email', user.email)
      .single()

    if (!admin) {
      return NextResponse.json({ error: 'Acces admin requis' }, { status: 403 })
    }

    const body = await request.json()
    const { newsletterId } = body

    if (!newsletterId) {
      return NextResponse.json({ error: 'newsletterId requis' }, { status: 400 })
    }

    // Check SMTP config
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json({ 
        error: 'SMTP non configure. Ajoutez SMTP_HOST, SMTP_USER, SMTP_PASS dans les variables Vercel.',
        smtpMissing: true
      }, { status: 500 })
    }

    // Get newsletter
    const { data: newsletter, error: nlError } = await supabase
      .from('newsletters')
      .select('*')
      .eq('id', newsletterId)
      .single()

    if (nlError || !newsletter) {
      return NextResponse.json({ error: 'Newsletter introuvable' }, { status: 404 })
    }

    // Get subscribers
    const { data: subscribers, error: subError } = await supabase
      .from('newsletter_subscribers')
      .select('email, first_name')
      .eq('is_subscribed', true)

    if (subError) {
      return NextResponse.json({ error: 'Erreur chargement abonnes' }, { status: 500 })
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ error: 'Aucun abonne actif', sent: 0 }, { status: 200 })
    }

    // Send emails in batches
    const transporter = createTransporter()
    let sent = 0
    let failed = 0
    const errors: string[] = []

    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE)

      for (const sub of batch) {
        try {
          const unsubscribeUrl = `${SITE_URL}/newsletter?unsubscribe=${encodeURIComponent(sub.email)}`
          const html = buildEmailHtml(newsletter, unsubscribeUrl)

          await transporter.sendMail({
            from: `"TLSTT" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to: sub.email,
            subject: newsletter.title,
            html,
            headers: {
              'List-Unsubscribe': `<${unsubscribeUrl}>`,
            },
          })
          sent++
        } catch (err: any) {
          failed++
          errors.push(`${sub.email}: ${err.message}`)
        }
      }

      // Delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < subscribers.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
      }
    }

    // Update newsletter status
    await supabase
      .from('newsletters')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', newsletterId)

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: subscribers.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/newsletter/send',
    method: 'POST',
    body: { newsletterId: 'number' },
    description: 'Envoie une newsletter par email a tous les abonnes actifs',
    smtpConfigured: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
  })
}
