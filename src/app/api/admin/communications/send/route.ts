import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import nodemailer from 'nodemailer'
import { getSmtpConfig } from '@/lib/email'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tlstt-nextjs.vercel.app'

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
}

const TYPE_LABEL: Record<string, string> = {
  info: 'Information',
  important: 'Important',
  urgent: 'Urgent',
}
const TYPE_COLOR: Record<string, string> = {
  info: '#3b9fd8',
  important: '#f39c12',
  urgent: '#e74c3c',
}

function buildHtml(title: string, content: string, type: string): string {
  const color = TYPE_COLOR[type] || '#3b9fd8'
  const label = TYPE_LABEL[type] || 'Information'
  // content est du texte brut (cohérent avec l'affichage de l'espace membre) : on échappe + nl2br
  const safeContent = escapeHtml(content).replace(/\n/g, '<br>')
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:system-ui,-apple-system,sans-serif;">
<div style="max-width:600px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
  <div style="background:#0a0a0a;padding:24px;text-align:center;">
    <h2 style="color:#3b9fd8;margin:0;font-size:22px;">TLSTT</h2>
    <p style="color:#888;margin:6px 0 0;font-size:13px;">Communication du secrétariat</p>
  </div>
  <div style="padding:28px;">
    <span style="display:inline-block;background:${color};color:#fff;font-size:12px;font-weight:bold;padding:4px 12px;border-radius:20px;text-transform:uppercase;">${label}</span>
    <h1 style="color:#1a1a2e;font-size:22px;margin:16px 0;">${escapeHtml(title)}</h1>
    <div style="color:#333;font-size:15px;line-height:1.6;">${safeContent}</div>
    <div style="text-align:center;margin-top:26px;">
      <a href="${SITE_URL}/espace-membre" style="display:inline-block;background:#3b9fd8;color:#fff;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:bold;">Mon espace membre</a>
    </div>
  </div>
  <div style="background:#0a0a0a;padding:18px;text-align:center;">
    <p style="color:#666;font-size:12px;margin:0;">TLSTT - Toulon La Seyne Tennis de Table</p>
  </div>
</div>
</body></html>`
}

export async function POST(request: NextRequest) {
  try {
    // 1. Auth admin (par email)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    const { data: admin } = await supabase
      .from('admins').select('id').eq('email', user.email).eq('is_active', true).single()
    if (!admin) return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 })

    // 2. Payload
    const body = await request.json()
    const title = String(body.title || '').trim()
    const content = String(body.content || '').trim()
    const type = ['info', 'important', 'urgent'].includes(body.type) ? body.type : 'info'
    const targetAudience = ['all', 'active'].includes(body.target_audience) ? body.target_audience : 'all'
    if (!title || !content) {
      return NextResponse.json({ error: 'Titre et contenu requis' }, { status: 400 })
    }

    // 3. Enregistrer la communication (visible dans l'espace membre même si l'email échoue)
    const { data: comm, error: insertError } = await supabase
      .from('secretariat_communications')
      .insert({ title, content, type, target_audience: targetAudience, sent_at: new Date().toISOString() })
      .select()
      .single()
    if (insertError) {
      return NextResponse.json({ error: 'Enregistrement impossible : ' + insertError.message }, { status: 500 })
    }

    // 4. Destinataires : membres ayant opté pour les notifications secrétariat
    const adminClient = createAdminClient()
    let query = adminClient
      .from('member_profiles')
      .select('id, secretariat_notifications, membership_status')
      .eq('secretariat_notifications', true)
    if (targetAudience === 'active') {
      query = query.eq('membership_status', 'active')
    }
    const { data: members } = await query
    const memberIds = new Set((members || []).map(m => m.id))

    // 5. Emails via l'API admin auth (auth.users)
    const emails: string[] = []
    if (memberIds.size > 0) {
      let page = 1
      // pagination (clubs de petite taille, quelques pages max)
      for (;;) {
        const { data: list } = await adminClient.auth.admin.listUsers({ page, perPage: 200 })
        const users = list?.users || []
        for (const u of users) {
          if (u.email && memberIds.has(u.id)) emails.push(u.email)
        }
        if (users.length < 200) break
        page++
        if (page > 25) break
      }
    }

    // 6. Envoi email (best-effort ; la communication est déjà enregistrée)
    const smtp = await getSmtpConfig()
    let sent = 0
    let emailStatus: string = 'skipped'
    if (smtp.configured && emails.length > 0) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtp.host, port: smtp.port, secure: smtp.secure,
          auth: { user: smtp.user, pass: smtp.pass },
        })
        const html = buildHtml(title, content, type)
        const subject = `[TLSTT] ${TYPE_LABEL[type]} : ${title}`
        const batchSize = 50
        for (let i = 0; i < emails.length; i += batchSize) {
          const batch = emails.slice(i, i + batchSize)
          try {
            await transporter.sendMail({
              from: `"TLSTT - Secrétariat" <${smtp.from || smtp.user}>`,
              bcc: batch.join(','),
              subject,
              html,
            })
            sent += batch.length
          } catch { /* on continue les autres lots */ }
        }
        emailStatus = 'sent'
      } catch (e) {
        emailStatus = 'error: ' + (e instanceof Error ? e.message : 'inconnu')
      }
    } else if (!smtp.configured) {
      emailStatus = 'smtp_non_configuré'
    } else {
      emailStatus = 'aucun_destinataire'
    }

    return NextResponse.json({
      success: true,
      communicationId: comm.id,
      recipients: emails.length,
      sent,
      emailStatus,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
