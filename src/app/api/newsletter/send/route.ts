import { NextRequest, NextResponse } from 'next/server'
import { createClient, createReadOnlyClient } from '@/lib/supabase/server'
import nodemailer from 'nodemailer'
import { getSmtpConfig } from '@/lib/email'
import { parseAudience, audienceKey, resoudreAudience } from '@/lib/newsletter-audience'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tlstt.fr'
const BATCH_SIZE = 40 // destinataires par lot (copie cachée)
const DELAY_BETWEEN_BATCHES = 2000 // ms

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
}

function buildEmailHtml(newsletter: any, unsubscribeUrl: string | null): string {
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
      ${newsletter.cover_image_url ? `<img src="${encodeURI(String(newsletter.cover_image_url))}" alt="${escapeHtml(String(newsletter.title))}" />` : ''}
      <h2>${escapeHtml(String(newsletter.title))}</h2>
      ${newsletter.content}
      <div style="text-align: center; margin-top: 25px;">
        <a href="${SITE_URL}/newsletters/${newsletter.id}" class="btn">Lire sur le site</a>
      </div>
    </div>
    <div class="footer">
      <p>TLSTT - Toulon La Seyne Tennis de Table</p>
      <p>Complexe Léry, 42 bd de l'Europe, 83500 La Seyne-sur-Mer</p>
      ${unsubscribeUrl
        ? `<p><a href="${unsubscribeUrl}">Se désabonner</a> | <a href="${SITE_URL}">Visiter le site</a></p>`
        : `<p>Vous recevez cette newsletter en tant que membre du TLSTT. <a href="${SITE_URL}">Visiter le site</a></p>`}
    </div>
  </div>
</body>
</html>`
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createReadOnlyClient()

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

    // Check SMTP config from DB + env vars
    const smtpConfig = await getSmtpConfig()
    if (!smtpConfig.configured) {
      return NextResponse.json({ 
        error: 'SMTP non configure. Allez dans Administration > Config Email pour configurer le serveur SMTP.',
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

    // Destinataires selon l'audience choisie (tous / membres / abonnés / groupe)
    const audience = parseAudience(body.audience)
    const { emails, label, unsubscribable } = await resoudreAudience(audience)
    if (emails.length === 0) {
      return NextResponse.json({ error: `Aucun destinataire pour « ${label} »`, sent: 0 }, { status: 200 })
    }

    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: { user: smtpConfig.user, pass: smtpConfig.pass },
    })
    const from = `"TLSTT" <${smtpConfig.from || smtpConfig.user}>`
    let sent = 0
    let failed = 0
    const errors: string[] = []

    // 1) Les membres du site : en copie cachée par lots (adresses jamais exposées, pas de lien de désabonnement)
    const membres = emails.filter(e => !unsubscribable.has(e))
    const htmlMembres = buildEmailHtml(newsletter, null)
    for (let i = 0; i < membres.length; i += BATCH_SIZE) {
      const lot = membres.slice(i, i + BATCH_SIZE)
      try {
        await transporter.sendMail({ from, replyTo: smtpConfig.replyTo || undefined, to: from, bcc: lot.join(','), subject: newsletter.title, html: htmlMembres })
        sent += lot.length
      } catch (err: unknown) {
        failed += lot.length
        errors.push(`lot ${i / BATCH_SIZE + 1}: ${err instanceof Error ? err.message : 'Erreur inconnue'}`)
      }
      if (i + BATCH_SIZE < membres.length) await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES))
    }

    // 2) Les abonnés du formulaire public : un email chacun, avec leur lien de désabonnement personnel
    for (const email of emails.filter(e => unsubscribable.has(e))) {
      try {
        const unsubscribeUrl = `${SITE_URL}/newsletter?unsubscribe=${encodeURIComponent(email)}`
        await transporter.sendMail({
          from, replyTo: smtpConfig.replyTo || undefined, to: email, subject: newsletter.title,
          html: buildEmailHtml(newsletter, unsubscribeUrl),
          headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>` },
        })
        sent++
      } catch (err: unknown) {
        failed++
        errors.push(`${email}: ${err instanceof Error ? err.message : 'Erreur inconnue'}`)
      }
    }

    // Update newsletter status
    await supabase
      .from('newsletters')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        audience: audienceKey(audience),
        sent_count: sent,
      })
      .eq('id', newsletterId)

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: emails.length,
      audience: label,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/** Aperçu du nombre de destinataires d'une audience (admin) : GET ?audience=all|members|subscribers|group:N */
export async function GET(request: NextRequest) {
  const supabase = await createReadOnlyClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { data: admin } = await supabase.from('admins').select('id').eq('email', user.email).single()
  if (!admin) return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 })
  const audience = parseAudience(request.nextUrl.searchParams.get('audience'))
  const { emails, label } = await resoudreAudience(audience)
  return NextResponse.json({ audience: audienceKey(audience), label, count: emails.length })
}
